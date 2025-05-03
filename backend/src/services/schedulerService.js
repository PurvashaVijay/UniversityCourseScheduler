// schedulerService.js
const { spawn } = require('child_process');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { 
  Schedule, 
  Semester, 
  Course, 
  Professor, 
  TimeSlot, 
  ProfessorAvailability,
  ProfessorCourse,
  ScheduledCourse, 
  Conflict, 
  ConflictCourse,
  CourseProgram,
  CourseSemester,
  Department,
  Program
} = require('../../app/models');
const { sequelize } = require('../config/database');

/**
 * Main function to generate a course schedule
 * @param {string} semesterId - The ID of the semester to schedule
 * @param {string} name - The name of the schedule
 * @returns {Object} The generated schedule with conflicts
 */
async function generateSchedule(semesterId, name) {
  console.log(`Generating schedule for semester ${semesterId} with name "${name}"`);
  
  // Start a transaction to ensure data consistency
  const transaction = await sequelize.transaction();
  
  try {
    // Check if semester exists
    const semester = await Semester.findByPk(semesterId, { transaction });
    if (!semester) {
      throw new Error('Semester not found');
    }
    
    // Create a new schedule record
    const scheduleId = 'SCH-' + uuidv4().substring(0, 8);
    const schedule = await Schedule.create({
      schedule_id: scheduleId,
      semester_id: semesterId,
      name,
      is_final: false,
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction });
    
    console.log(`Created new schedule with ID: ${scheduleId}`);
    
    // Prepare input data for the Python scheduler
    const inputData = await prepareSchedulerInput(scheduleId, semesterId, transaction);
    
    // Call the Python scheduler
    console.log(`Calling Python scheduler with ${inputData.courses.length} courses, ${inputData.professors.length} professors, and ${inputData.timeSlots.length} time slots`);
    const result = await callPythonScheduler(inputData);
    
    if (!result.success) {
      if (result.debug_info) {
        console.log("Scheduler reported problem as infeasible:", result.error);
        console.log("Details:", JSON.stringify(result.debug_info, null, 2));
      }
      throw new Error(result.error || 'Failed to generate schedule');
    }
    
    // Process the solution and save to database
    const processedResult = await processSolution(result.result, scheduleId, transaction);
    
    // Commit the transaction
    await transaction.commit();
    
    // Return the complete schedule with associated data
    const completeSchedule = await Schedule.findByPk(scheduleId, {
      include: [
        { model: Semester },
        { 
          model: ScheduledCourse,
          include: [
            { model: Course },
            { model: Professor },
            { model: TimeSlot }
          ]
        }
      ]
    });
    
    return {
      schedule: completeSchedule,
      schedule_id: scheduleId,
      conflicts: processedResult.conflicts
    };
  } catch (error) {
    // Rollback transaction in case of error
    await transaction.rollback();
    console.error('Error generating schedule:', error);
    throw error;
  }
}

/**
 * Prepare all necessary data for the scheduler
 * @param {string} scheduleId - The schedule ID
 * @param {string} semesterId - The semester ID
 * @param {Transaction} transaction - The Sequelize transaction
 * @returns {Object} Data formatted for the Python scheduler
 */
async function prepareSchedulerInput(scheduleId, semesterId, transaction) {
  console.log(`Preparing scheduler input data for schedule ${scheduleId} for semester ${semesterId}`);
  
  // 1. Get all courses
  let courses = await Course.findAll({
    include: [{ model: Department }],
    transaction
  });
  console.log(`Total courses found: ${courses.length}`);
  
  // 2. Get all programs
  const programs = await Program.findAll({ transaction });
  
  // 3. Get all course-program associations
  const coursePrograms = await CourseProgram.findAll({ transaction });
  
  // 4. Get all semester offerings for courses matching the selected semester
  console.log(`Looking for courses with semester: ${semesterId}`);
  const courseSemesters = await CourseSemester.findAll({
    where: { semester: semesterId },
    transaction
  });
  console.log(`Found ${courseSemesters.length} course-semester associations for semester ${semesterId}`);
  
  // Get list of course IDs that are offered in the selected semester
  const coursesInSemester = courseSemesters.map(cs => cs.course_id);
  console.log(`Course IDs in semester ${semesterId}:`, coursesInSemester);
  
  // 5. Get all professors
  const professors = await Professor.findAll({
    include: [{ model: Department }],
    transaction
  });
  
  // 6. Get all time slots
  const timeSlots = await TimeSlot.findAll({
    order: [['day_of_week', 'ASC'], ['start_time', 'ASC']],
    transaction
  });
  
  // 7. Get all professor availability settings
  const professorAvailabilities = await ProfessorAvailability.findAll({
    transaction
  });
  
  // 8. Get all professor-course assignments
  const professorCourses = await ProfessorCourse.findAll({
    transaction
  });
  
  // Process course data to include program associations and semester information
  const enhancedCourses = courses
    .filter(course => coursesInSemester.includes(course.course_id)) // Only include courses for this semester
    .map(course => {
      const courseJson = course.toJSON();
      
      // Find program associations for this course
      const programAssociations = coursePrograms.filter(cp => 
        cp.course_id === courseJson.course_id
      );
      
      // Extract program IDs
      const programIds = programAssociations.map(pa => pa.program_id);
      
      // Get the number of classes from course-program associations
      const numClasses = Math.max(
        ...programAssociations.map(pa => pa.num_classes || 1),
        1 // default to 1 if no associations or values are 0
      );
      
      return {
        ...courseJson,
        program_ids: programIds,
        semesters: [semesterId], // Always include the selected semester
        num_classes: numClasses,
        department_name: courseJson.Department ? courseJson.Department.name : null
      };
    });
  
  console.log(`Filtered and enhanced courses for semester ${semesterId}: ${enhancedCourses.length}`);
  
  // Process professor availability into a more usable format
  const professorAvailabilityMap = {};
  
  professorAvailabilities.forEach(availability => {
    const { professor_id, timeslot_id, day_of_week, is_available } = availability;
    
    if (!professorAvailabilityMap[professor_id]) {
      professorAvailabilityMap[professor_id] = {};
    }
    
    if (!professorAvailabilityMap[professor_id][day_of_week]) {
      professorAvailabilityMap[professor_id][day_of_week] = [];
    }
    
    if (is_available) {
      professorAvailabilityMap[professor_id][day_of_week].push(timeslot_id);
    }
  });
  
  // Format data for the Python scheduler
  const formattedData = {
    scheduleId,
    courses: enhancedCourses,
    professors: professors.map(p => p.toJSON()),
    timeSlots: timeSlots.map(ts => ts.toJSON()),
    professorAvailability: professorAvailabilityMap,
    professorCourses: professorCourses.map(pc => pc.toJSON()),
    constraints: {
      respectProfessorAvailability: true,
      preventProfessorConflicts: true,
      balanceDayDistribution: true,
      useExactDurationMatching: true,
      enforceDayPatterns: true
    }
  };
  
  console.log(`Prepared data with ${enhancedCourses.length} courses for scheduling`);
  if (enhancedCourses.length > 0) {
    console.log(`Sample course being scheduled: ${enhancedCourses[0].course_id}`);
  }
  
  return formattedData;
}

/**
 * Call the Python scheduler with the prepared data
 * @param {Object} data - Data formatted for the Python scheduler
 * @returns {Object} The scheduling result
 */
async function callPythonScheduler(data) {
  return new Promise((resolve, reject) => {
    // Path to the Python script
    //const scriptPath = path.join(__dirname, '..', 'python', 'scheduler_interface.py');
    const scriptPath = path.join(__dirname, '../..', 'python', 'scheduler_interface.py');
    
    // Spawn Python process
    //const pythonProcess = spawn('python3', [scriptPath]);

    //const pythonProcess = spawn('C:\\Python310\\python.exe', [scriptPath]);
    //const pythonProcess = spawn('C:\\Program Files\\Python310\\python.exe', [scriptPath]);

    const pythonProcess = spawn('python', [scriptPath]);
    
    let outputData = '';
    let errorData = '';
    
    // Send data to Python via stdin
    pythonProcess.stdin.write(JSON.stringify(data));
    pythonProcess.stdin.end();
    
    // Collect output from Python
    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });
    
    // Collect errors from Python
    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
      console.error(`Python stderr: ${data}`);
    });
    
    // Handle process completion
    pythonProcess.on('close', (code) => {
      console.log(`Python process exited with code ${code}`);
      
      if (code !== 0) {
        return reject(new Error(`Python process exited with code ${code}: ${errorData}`));
      }

      try {
        // Find the beginning of the JSON (starts with '{')
        const jsonStartIndex = outputData.indexOf('{');
        if (jsonStartIndex === -1) {
          throw new Error('No JSON data found in Python output');
        }
        
        // Extract only the JSON part
        const jsonData = outputData.substring(jsonStartIndex);
        
        // Parse JSON output from Python
        const result = JSON.parse(jsonData);

        if (!result.success) {
          console.log("Scheduler reported problem as infeasible:", result.error);
          console.log("Details:", result.details ? JSON.stringify(result.details, null, 2) : "No details provided");
        }

        resolve(result);
      } catch (error) {
        console.error('Error parsing Python output:', error);
        console.error('Raw output:', outputData);
        reject(new Error('Failed to parse Python output'));
      }
    });
    
    // Handle process errors
    pythonProcess.on('error', (error) => {
      console.error('Failed to start Python process:', error);
      reject(error);
    });
  });
}

/**
 * Process the solution from the Python scheduler and save to database
 * @param {Object} solution - The solution from the Python scheduler
 * @param {string} scheduleId - The schedule ID
 * @param {Transaction} transaction - The Sequelize transaction
 * @returns {Object} The processed solution with conflicts
 */
async function processSolution(solution, scheduleId, transaction) {
  console.log(`Processing solution for schedule ${scheduleId}`);
  
  const { scheduled_courses, conflicts, statistics } = solution;
  
  console.log(`Solution contains ${scheduled_courses.length} scheduled courses and ${conflicts.length} conflicts`);
  console.log('Solution statistics:', statistics);
  
  // Add counter for conflict placeholder records
  let conflictPlaceholderCount = 0;
  
  // Create a mapping from Python-generated IDs to our new UUIDs
  const scheduledCourseIdMap = new Map();
  const savedScheduledCourses = [];

  // Track which course instances have been processed
  const processedInstances = new Set();
  
  // Save scheduled courses to database with new unique IDs
  for (const course of scheduled_courses) {
    try {
      // Check if this is a valid scheduled course with all required fields
      if (!course.course_id || !course.professor_id || !course.timeslot_id || !course.day_of_week) {
        console.warn(`Skipping incomplete course data: ${JSON.stringify(course)}`);
        continue;
      }
      
      // Create a unique identifier for logging
      const instanceKey = `${course.course_id}_${course.class_instance || 1}`;
      
      // Skip if we've already processed this instance
      if (processedInstances.has(instanceKey)) {
        console.warn(`Skipping duplicate course instance: ${instanceKey}`);
        continue;
      }
      
      processedInstances.add(instanceKey);
      
      // Generate a new unique ID
      const uniqueId = 'SC-' + uuidv4().substring(0, 8);
      
      // Store the mapping from Python-generated ID to our new ID
      scheduledCourseIdMap.set(course.scheduled_course_id, uniqueId);
      
      // Debug logging
      console.log(`Processing course ${course.course_id} instance ${course.class_instance || 1} on ${course.day_of_week} at ${course.timeslot_id}`);
      
      const scheduledCourse = await ScheduledCourse.create({
        scheduled_course_id: uniqueId,
        schedule_id: scheduleId,
        course_id: course.course_id,
        professor_id: course.professor_id,
        timeslot_id: course.timeslot_id,
        day_of_week: course.day_of_week,
        is_override: course.is_override || false,
        override_reason: course.override_reason,
        class_instance: course.class_instance || 1,
        num_classes: course.num_classes || 1,
        status: 'scheduled',  // Add status field
        created_at: new Date(),
        updated_at: new Date()
      }, { transaction });
      
      savedScheduledCourses.push(scheduledCourse);
    } catch (error) {
      console.error(`Error creating scheduled course for ${course.course_id}:`, error);
      throw error;
    }
  }

  // Update console logging to show counts clearly
  console.log(`Successfully saved ${savedScheduledCourses.length} scheduled courses to database`);
  
  // Save conflicts to database with new unique IDs
  const savedConflicts = [];
  
  for (const conflict of conflicts) {
    try {
      // Generate a new unique conflict ID
      const uniqueConflictId = 'CONF-' + uuidv4().substring(0, 8);
      
      // Create the conflict record
      const savedConflict = await Conflict.create({
        conflict_id: uniqueConflictId, // Use our new unique ID instead of conflict.conflict.conflict_id
        schedule_id: scheduleId,
        timeslot_id: conflict.conflict.timeslot_id,
        day_of_week: conflict.conflict.day_of_week,
        conflict_type: conflict.conflict.conflict_type,
        description: conflict.conflict.description,
        is_resolved: conflict.conflict.is_resolved || false,
        resolution_notes: conflict.conflict.resolution_notes,
        created_at: new Date(),
        updated_at: new Date()
      }, { transaction });
      
      // Handle conflict courses based on the type of conflict
      if (conflict.scheduled_courses && conflict.conflict_courses) {
        // Multiple courses involved in conflict (TIME_SLOT_CONFLICT)
        for (let i = 0; i < conflict.scheduled_courses.length; i++) {
          const conflictCourse = conflict.conflict_courses[i];
          
          // Generate a new unique conflict_course_id
          const uniqueConflictCourseId = 'CC-' + uuidv4().substring(0, 8);
          
          // Get the new scheduled_course_id from our mapping
          const newScheduledCourseId = scheduledCourseIdMap.get(conflictCourse.scheduled_course_id);
          
          if (newScheduledCourseId) {
            await ConflictCourse.create({
              conflict_course_id: uniqueConflictCourseId,
              conflict_id: uniqueConflictId,
              scheduled_course_id: newScheduledCourseId
            }, { transaction });
          } else {
            console.warn(`Could not find mapping for scheduled_course_id: ${conflictCourse.scheduled_course_id}`);
          }
        }
      } else if (conflict.scheduled_course && conflict.conflict_course) {
        // Single course conflict (NO_AVAILABLE_SLOT)
        // Create a placeholder scheduled course for the unscheduled course
        
        const course = conflict.scheduled_course;
        
        // Generate new unique IDs
        const uniqueScheduledCourseId = 'SC-' + uuidv4().substring(0, 8);
        const uniqueConflictCourseId = 'CC-' + uuidv4().substring(0, 8);
        
        // Create the placeholder scheduled course
        const placeholderCourse = await ScheduledCourse.create({
          scheduled_course_id: uniqueScheduledCourseId,
          schedule_id: scheduleId,
          course_id: course.course_id,
          professor_id: course.professor_id || null,
          timeslot_id: course.timeslot_id || null,
          day_of_week: course.day_of_week || null,
          is_override: false,
          class_instance: course.class_instance || 1,
          num_classes: course.num_classes || 1,
          status: 'conflict',  // Add status field
          created_at: new Date(),
          updated_at: new Date()
        }, { transaction });
        
        // Increment conflict placeholder counter
        conflictPlaceholderCount++;
        
        // Create the conflict course association
        await ConflictCourse.create({
          conflict_course_id: uniqueConflictCourseId,
          conflict_id: uniqueConflictId,
          scheduled_course_id: uniqueScheduledCourseId
        }, { transaction });
      }
      
      savedConflicts.push(savedConflict);
    } catch (error) {
      console.error(`Error creating conflict:`, error);
      throw error;
    }
  }
  
  // Add improved console logging with clear counts
  console.log(`Created ${conflictPlaceholderCount} placeholder records for unscheduled courses`);
  console.log(`Total records in scheduled_course table: ${savedScheduledCourses.length + conflictPlaceholderCount}`);
  
  return {
    scheduled_courses: savedScheduledCourses,
    conflicts: savedConflicts,
    statistics
  };
}

module.exports = {
  generateSchedule
};