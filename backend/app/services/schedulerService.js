// schedulerService.js
const { Course, Professor, TimeSlot, ProfessorAvailability, 
  Schedule, ScheduledCourse, Conflict, ConflictCourse,
  Department, Program } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');
const path = require('path');
const { Op } = require('sequelize');
const fs = require('fs').promises;

class SchedulerService {
/**
 * Generate a new schedule for the given semester
 * @param {string} semesterId - The ID of the semester to generate a schedule for
 * @param {string} name - The name of the schedule
 * @returns {Object} The generated schedule with any conflicts
 */
async generateSchedule(semesterId, name) {
  try {
    // Create a new schedule
    const scheduleId = 'SCH-' + uuidv4().substring(0, 8);
    const schedule = await Schedule.create({
      schedule_id: scheduleId,
      semester_id: semesterId,
      name,
      is_final: false
    });
    
    // Prepare data for the Python scheduler
    const data = await this.prepareSchedulerInput(scheduleId);
    
    // Call the Python scheduler
    const solution = await this.callPythonScheduler(data);
    
    if (!solution.success) {
      console.error('Error in Python scheduler:', solution.error);
      throw new Error(`Python scheduler error: ${solution.error}`);
    }
    
    // Process the solution and save to database
    await this.processSolution(solution.result);
    
    // Retrieve the complete schedule with all information (similar to original code)
    const completeSchedule = await Schedule.findByPk(scheduleId, {
      include: [
        { 
          model: ScheduledCourse,
          include: [
            { model: Course, attributes: ['course_name', 'is_core', 'duration_minutes'] },
            { model: Professor, attributes: ['first_name', 'last_name'] },
            { model: TimeSlot, attributes: ['name', 'start_time', 'end_time', 'day_of_week'] }
          ]
        },
        {
          model: Conflict,
          include: [
            { 
              model: ScheduledCourse, 
              through: ConflictCourse,
              include: [
                { model: Course, attributes: ['course_name', 'is_core'] },
                { model: Professor, attributes: ['first_name', 'last_name'] }
              ]
            }
          ]
        }
      ]
    });
    
    return {
      schedule: completeSchedule,
      conflicts: solution.result.conflicts.length
    };
  } catch (error) {
    console.error('Error generating schedule:', error);
    throw error;
  }
}

/**
 * Prepare the input data for the Python scheduler
 * @param {string} scheduleId - The ID of the schedule being created
 * @returns {Object} Data object for the Python scheduler
 */
async prepareSchedulerInput(scheduleId) {
  // Get all courses that need to be scheduled
  const courses = await Course.findAll({
    include: [
      { model: Department },
      { 
        model: Program, 
        through: { attributes: [] }
      }
    ],
    order: [
      ['is_core', 'DESC'],  // Core courses first
      ['course_name', 'ASC']
    ]
  });
  
  // Get all professors with their availability
  const professors = await Professor.findAll({
    include: [
      { 
        model: ProfessorAvailability,
        include: [{ model: TimeSlot }]
      }
    ]
  });
  
  // Get all time slots
  const timeSlots = await TimeSlot.findAll({
    order: [
      ['day_of_week', 'ASC'],
      ['start_time', 'ASC']
    ]
  });
  
  // Collect professor availability records
  const professorAvailability = [];
  professors.forEach(professor => {
    professor.ProfessorAvailabilities.forEach(avail => {
      professorAvailability.push({
        professor_id: professor.professor_id,
        timeslot_id: avail.timeslot_id,
        day_of_week: avail.day_of_week,
        is_available: avail.is_available
      });
    });
  });
  
  // Format courses for the scheduler
  const formattedCourses = courses.map(course => {
    // Build an array of program IDs this course belongs to
    const programIds = course.Programs.map(program => program.program_id);
    
    return {
      course_id: course.course_id,
      course_name: course.course_name,
      department_id: course.department_id,
      duration_minutes: course.duration_minutes,
      is_core: course.is_core,
      department_name: course.Department ? course.Department.name : null,
      program_ids: programIds
    };
  });
  
  // Format professors for the scheduler
  const formattedProfessors = professors.map(professor => ({
    professor_id: professor.professor_id,
    department_id: professor.department_id,
    first_name: professor.first_name,
    last_name: professor.last_name,
    email: professor.email
  }));
  
  // Format time slots for the scheduler
  const formattedTimeSlots = timeSlots.map(slot => ({
    timeslot_id: slot.timeslot_id,
    name: slot.name,
    start_time: slot.start_time,
    end_time: slot.end_time,
    duration_minutes: slot.duration_minutes,
    day_of_week: slot.day_of_week
  }));
  
  // Return the formatted data
  return {
    scheduleId,
    courses: formattedCourses,
    professors: formattedProfessors,
    timeSlots: formattedTimeSlots,
    professorAvailability
  };
}

/**
 * Call the Python scheduler with the prepared data
 * @param {Object} data - The input data for the scheduler
 * @returns {Object} The solution from the Python scheduler
 */
async callPythonScheduler(data) {
  return new Promise((resolve, reject) => {
    // Determine the path to the Python script
    const scriptPath = path.join(__dirname, '..', 'python', 'scheduler_interface.py');
    
    // Spawn the Python process
    const pythonProcess = spawn('python3', [scriptPath]);
    
    let outputData = '';
    let errorData = '';
    
    // Collect data from stdout
    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });
    
    // Collect data from stderr
    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });
    
    // Handle process completion
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python process exited with code ${code}: ${errorData}`));
      } else {
        try {
          const result = JSON.parse(outputData);
          resolve(result);
        } catch (error) {
          reject(new Error(`Error parsing Python output: ${error.message}`));
        }
      }
    });
    
    // Write the input data to the Python process
    pythonProcess.stdin.write(JSON.stringify(data));
    pythonProcess.stdin.end();
  });
}

/**
 * Process the solution from the Python scheduler and save to database
 * @param {Object} solution - The solution from the Python scheduler
 */
async processSolution(solution) {
  // Save all scheduled courses
  for (const scheduledCourse of solution.scheduled_courses) {
    await ScheduledCourse.create({
      scheduled_course_id: scheduledCourse.scheduled_course_id,
      schedule_id: scheduledCourse.schedule_id,
      course_id: scheduledCourse.course_id,
      professor_id: scheduledCourse.professor_id,
      timeslot_id: scheduledCourse.timeslot_id,
      day_of_week: scheduledCourse.day_of_week,
      is_override: scheduledCourse.is_override
    });
  }
  
  // Process conflicts
  for (const conflictItem of solution.conflicts) {
    // Create the conflict record
    const conflict = await Conflict.create({
      conflict_id: conflictItem.conflict.conflict_id,
      schedule_id: conflictItem.conflict.schedule_id,
      timeslot_id: conflictItem.conflict.timeslot_id,
      day_of_week: conflictItem.conflict.day_of_week,
      conflict_type: conflictItem.conflict.conflict_type,
      description: conflictItem.conflict.description,
      is_resolved: conflictItem.conflict.is_resolved,
      resolution_notes: conflictItem.conflict.resolution_notes || null
    });
    
    // For unscheduled course conflicts
    if (conflictItem.scheduled_course) {
      // Create the scheduled course for this conflict
      const scheduledCourse = await ScheduledCourse.create({
        scheduled_course_id: conflictItem.scheduled_course.scheduled_course_id,
        schedule_id: conflictItem.scheduled_course.schedule_id,
        course_id: conflictItem.scheduled_course.course_id,
        professor_id: conflictItem.scheduled_course.professor_id,
        timeslot_id: conflictItem.scheduled_course.timeslot_id,
        day_of_week: conflictItem.scheduled_course.day_of_week,
        is_override: conflictItem.scheduled_course.is_override
      });
      
      // Create the association between conflict and scheduled course
      await ConflictCourse.create({
        conflict_course_id: conflictItem.conflict_course.conflict_course_id,
        conflict_id: conflictItem.conflict_course.conflict_id,
        scheduled_course_id: conflictItem.conflict_course.scheduled_course_id
      });
    }
    
    // For time slot conflicts (multiple courses in same slot)
    if (conflictItem.scheduled_courses && conflictItem.conflict_courses) {
      for (const cc of conflictItem.conflict_courses) {
        await ConflictCourse.create({
          conflict_course_id: cc.conflict_course_id,
          conflict_id: cc.conflict_id,
          scheduled_course_id: cc.scheduled_course_id
        });
      }
    }
  }
  
  // Log statistics for reference
  console.log('Scheduler statistics:', solution.statistics);
}
}

module.exports = new SchedulerService();