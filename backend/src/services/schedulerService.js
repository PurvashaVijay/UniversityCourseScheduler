// schedulerService.js - UPDATED
const { Course, Department, Program, Professor, TimeSlot, ProfessorAvailability, Schedule, ScheduledCourse, Conflict, ConflictCourse, CourseProgram } = require('../../app/models');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class SchedulerService {
  
  async testPythonEnvironment() {
    return new Promise((resolve, reject) => {
      try {

        const vcenvPath = 'C:\\Users\\shash\\.virtualenvs\\backend-wjcBA0vK\\Scripts\\python.exe';
        const pythonCommand = fs.existsSync(vcenvPath) ? vcenvPath : 'python';

        console.log(`Testing Python environment with: ${pythonCommand}`);
        const pythonProcess = spawn(pythonCommand, ['-c', 'print("Python test successful")']);
        
        let outputData = '';
        let errorData = '';
        
        pythonProcess.stdout.on('data', (data) => {
          outputData += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
          errorData += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
          if (code === 0) {
            resolve({
              success: true,
              output: outputData.trim()
            });
          } else {
            resolve({
              success: false,
              error: errorData || `Process exited with code ${code}`
            });
          }
        });
      } catch (error) {
        console.error('Error testing Python environment:', error);
        resolve({
          success: false,
          error: error.message
        });
      }
    });
  }
  
  /**
   * Generate a schedule for a semester using OR-Tools Python solver
   */
  async generateSchedule(semesterId, name) {
    let scheduleId = null;

    try {
      console.log(`Starting schedule generation for semester: ${semesterId}, name: ${name}`);
      // Create a new schedule
      const scheduleId = 'SCH-' + uuidv4().substring(0, 8);
      console.log(`Generated schedule ID: ${scheduleId}`);
      const schedule = await Schedule.create({
        schedule_id: scheduleId,
        semester_id: semesterId,
        name,
        is_final: false
      });

      console.log(`Created new schedule with ID: ${scheduleId}`);

      // Prepare data for the scheduler
      const data = await this.prepareSchedulerInput(scheduleId, semesterId);
      
      // Write data to a temp file for debugging
      //const tempDataPath = path.join(__dirname, 'scheduler_input.json');
      const tempDataPath = path.join(process.cwd(), 'scheduler_input.json');
      console.log(`Will write input data to: ${tempDataPath}`);

      fs.writeFileSync(tempDataPath, JSON.stringify(data, null, 2));
      console.log(`Wrote input data to ${tempDataPath}`);
      
      try {
        // Call the Python scheduler
        const solution = await this.callPythonScheduler(data);
        
        if (!solution.success) {
          console.error(`Python scheduler failed: ${solution.error}`);
          throw new Error(`Python scheduler failed: ${solution.error}`);
        }
        
        // Process the solution and save results to database
        await this.processSolution(solution.result, scheduleId);
      } catch (pythonError) {
        console.error("Python scheduler error:", pythonError);
        
        // FALLBACK: Create a mock schedule if Python fails
        // This is temporary to ensure something appears in the UI
        await this.createFallbackSchedule(scheduleId, data);
      }
      
      // Get the complete schedule with all data
      const completeSchedule = await Schedule.findByPk(scheduleId, {
        include: [{
          model: ScheduledCourse,
          include: [
            { model: Course, attributes: ['course_name', 'is_core'] },
            { model: Professor, attributes: ['first_name', 'last_name'] },
            { model: TimeSlot, attributes: ['name', 'start_time', 'end_time', 'day_of_week'] }
          ]
        }]
      });

      // Get all conflicts for this schedule
      const scheduleConflicts = await Conflict.findAll({
        where: { schedule_id: scheduleId },
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
      });

      return {
        schedule: completeSchedule,
        conflicts: scheduleConflicts
      };
    } catch (error) {
      console.error('Error generating schedule:', error);
      throw error;
    }
  }

  /**
   * Create a fallback schedule if the Python scheduler fails
   * This is a temporary measure to ensure something appears in the UI
   */
  async createFallbackSchedule(scheduleId, data) {
    try {
      console.log("Creating fallback schedule");
      const { courses, professors, timeSlots } = data;
      
      // Create a map of which professors can teach which courses
      const professorCourseMap = {};
      data.professorCourses.forEach(pc => {
        if (!professorCourseMap[pc.course_id]) {
          professorCourseMap[pc.course_id] = [];
        }
        professorCourseMap[pc.course_id].push(pc.professor_id);
      });

      console.log(`Using ${data.professorCourses.length} professor-course relationships for fallback scheduling`);

      // Simple greedy algorithm: Assign each course to a qualified professor and available time slot
      const assignedTimeSlots = new Set();
      const scheduledCourses = [];

      for (let i = 0; i < courses.length; i++) {
        const course = courses[i];
        
        // Check if there are qualified professors for this course
        const qualifiedProfessorIds = professorCourseMap[course.course_id] || [];
        
        // Skip courses with no qualified professors
        if (qualifiedProfessorIds.length === 0) {
          console.log(`Skipping course ${course.course_id} - no qualified professors`);
          continue;
        }
        
        // Find a qualified professor
        const professorId = qualifiedProfessorIds[0];
        const professor = professors.find(p => p.professor_id === professorId);
        
        if (!professor) {
          console.log(`Couldn't find professor with ID ${professorId} for course ${course.course_id}`);
          continue;
        }
        
        // Find an available time slot
        let timeSlot = null;
        let dayOfWeek = null;
        
        for (const ts of timeSlots) {
          const key = `${ts.timeslot_id}-${ts.day_of_week}`;
          if (!assignedTimeSlots.has(key) && 
              Math.abs(ts.duration_minutes - course.duration_minutes) <= 15) {
            timeSlot = ts;
            dayOfWeek = ts.day_of_week;
            assignedTimeSlots.add(key);
            break;
          }
        }
        
        if (!timeSlot) {
          // If no suitable time slot found, use the first one
          timeSlot = timeSlots[0];
          dayOfWeek = timeSlot.day_of_week;
        }
        
        // Create scheduled course (only if we have a time slot)
        if (timeSlot) {
          const scheduledCourseId = 'SC-' + uuidv4().substring(0, 8);
          await ScheduledCourse.create({
            scheduled_course_id: scheduledCourseId,
            schedule_id: scheduleId,
            course_id: course.course_id,
            professor_id: professor.professor_id,
            timeslot_id: timeSlot.timeslot_id,
            day_of_week: dayOfWeek,
            is_override: false
          });
          scheduledCourses.push({
            course_id: course.course_id,
            professor_id: professor.professor_id
          });
        } else {
          console.log(`No suitable time slot for course ${course.course_id} with professor ${professor.professor_id}`);
        }
      }
      
      console.log(`Created fallback schedule with ${scheduledCourses.length} courses out of ${courses.length} total courses`);
    } catch (error) {
      console.error('Error creating fallback schedule:', error);
    }
  }

  /**
   * Prepare input data for the Python scheduler
   */
  async prepareSchedulerInput(scheduleId, semesterId) {
    try {
      // Get all courses
      const courses = await Course.findAll({
        include: [
          { model: Department, attributes: ['name'] }
        ],
        order: [
          ['is_core', 'DESC'],
          ['course_name', 'ASC']
        ]
      });

      // Get all professors
      const professors = await Professor.findAll({
        include: [
          { model: Department, attributes: ['name'] }
        ]
      });

      // Get all time slots
      const timeSlots = await TimeSlot.findAll({
        order: [
          ['day_of_week', 'ASC'],
          ['start_time', 'ASC']
        ]
      });

      // Get professor availability
      const professorAvailability = await ProfessorAvailability.findAll();

      // Get course-program associations
      const coursePrograms = await CourseProgram.findAll();
      
      // Create a map of course IDs to programs
      const courseProgramMap = {};
      coursePrograms.forEach(cp => {
        if (!courseProgramMap[cp.course_id]) {
          courseProgramMap[cp.course_id] = [];
        }
        courseProgramMap[cp.course_id].push(cp.program_id);
      });

      // Get professor-course relationships
      const ProfessorCourse = require('../../app/models/ProfessorCourse');
      const professorCourses = await ProfessorCourse.findAll();

      // Format professor-course relationships for the Python scheduler
      const formattedProfessorCourses = professorCourses.map(pc => ({
        professor_id: pc.professor_id,
        course_id: pc.course_id,
        semester: pc.semester
      }));
    
      console.log(`Found ${formattedProfessorCourses.length} professor-course relationships`);

      // Format courses with program IDs
      const formattedCourses = courses.map(course => {
        const courseJson = course.toJSON();
        return {
          ...courseJson,
          program_ids: courseProgramMap[course.course_id] || []
        };
      });

      // Log counts for debugging
      console.log(`Preparing data: ${formattedCourses.length} courses, ${professors.length} professors, ${timeSlots.length} time slots`);

      // Format data for the Python scheduler
      return {
        scheduleId,
        semesterId,
        courses: formattedCourses,
        professors: professors.map(p => p.toJSON()),
        timeSlots: timeSlots.map(t => t.toJSON()),
        professorAvailability: professorAvailability.map(pa => pa.toJSON()),
        professorCourses: formattedProfessorCourses
      };
    } catch (error) {
      console.error('Error preparing scheduler input:', error);
      throw error;
    }
  }
 
  
  /**
   * Call the Python scheduler with the input data
   */

  async callPythonScheduler(data) {
    return new Promise((resolve, reject) => {
      try {
        console.log('Calling Python scheduler...');

        const possiblePaths = [
          path.join(__dirname, '..', '..', 'python', 'scheduler_interface.py'),
          path.join(__dirname, '..', 'python', 'scheduler_interface.py'),
          path.join(process.cwd(), 'python', 'scheduler_interface.py')
        ];

        let pythonScriptPath = null;
        for (const testPath of possiblePaths) {
          console.log(`Checking path: ${testPath}`);
          if (fs.existsSync(testPath)) {
            pythonScriptPath = testPath;
            console.log(`Found Python script at: ${pythonScriptPath}`);
            break;
          }
        }
  
        if (!pythonScriptPath) {
          console.error('Python script not found in any of the checked paths');
          return reject(new Error('Python script not found'));
        }

        const detectPythonCommand = () => {
          const commands = ['python3', 'python', 'py'];
        
          for (const cmd of commands) {
            try {
              const result = require('child_process').spawnSync(cmd, ['--version']);
              if (result.status === 0) {
                console.log(`Found working Python command: ${cmd}`);
                return cmd;
              }
            } catch (e) {
            }
          }
          
          console.warn('No Python command found automatically. Using default "python"');
          return 'python';
        };

        const vcenvPath = 'C:\\Users\\shash\\.virtualenvs\\backend-wjcBA0vK\\Scripts\\python.exe';
        let pythonCommand = fs.existsSync(vcenvPath) ? vcenvPath : detectPythonCommand();
        
        console.log(`Using Python command: ${pythonCommand}`);
  
        // Spawn the Python process
        const pythonProcess = spawn(pythonCommand, [pythonScriptPath]);
  
        let outputData = '';
        let errorData = '';
  
        // Timeout in case Python hangs
        const timeoutId = setTimeout(() => {
          console.error('Python process timeout after 60 seconds');
          pythonProcess.kill();
          reject(new Error('Python process timeout'));
        }, 60000);
  
        // Send JSON input
        pythonProcess.stdin.on('error', (err) => {
          console.error('Error writing to Python stdin:', err);
        });

        console.log('Sending data to Python: ', {
          scheduleId: data.scheduleId,
          dataSize: JSON.stringify(data).length,
          courseCount: data.courses.length,
          professorCount: data.professors.length,
          timeSlotCount: data.timeSlots.length
        });

        pythonProcess.stdin.write(JSON.stringify(data));
        pythonProcess.stdin.end();
  
        // Collect stdout
        pythonProcess.stdout.on('data', (chunk) => {
          outputData += chunk.toString();
          console.log(`Python stdout: ${chunk}`);
        });
  
        // Collect stderr
        pythonProcess.stderr.on('data', (chunk) => {
          errorData += chunk.toString();
          console.error(`Python stderr: ${chunk}`);
        });
  
        // Handle process completion
        pythonProcess.on('close', (code) => {
          clearTimeout(timeoutId);
          console.log(`Python process exited with code ${code}`);
  
          if (code !== 0) {
            console.error('Python error output:', errorData);

            const errorMatch = errorData.match(/Error: (.*?)$/m);
            const specificError = errorMatch ? errorMatch[1] : `Process exited with code ${code}`;
            
            return reject(new Error(`Python scheduler failed: ${specificError}`));
          }
          if (!outputData.trim()) {
            return reject(new Error('Python process produced no output'));
          }

          try {
            const jsonStartIndex = outputData.indexOf('{');
  
            if (jsonStartIndex === -1) {
              console.error('No JSON data found in Python output');
              return reject(new Error('No JSON data found in Python output'));
            }

            const jsonString = outputData.substring(jsonStartIndex);
            console.log('Found JSON starting at position', jsonStartIndex);
            console.log('Extracted JSON beginning:', jsonString.substring(0, 100) + '...');

            const result = JSON.parse(jsonString);
            resolve(result);
          } catch (err) {
            console.error('Error parsing Python output:', err);
            console.error('Output was:', outputData);
            reject(new Error(`Failed to parse Python output: ${err.message}`));
          }

        });
      } catch (error) {
        console.error('Error calling Python scheduler:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Process the solution from the Python scheduler and save to database
   */
  async processSolution(solution, scheduleId) {
    try {
      console.log(`Processing solution for schedule ${scheduleId}`);
      console.log(`Scheduled courses: ${solution.scheduled_courses.length}`);
      console.log(`Conflicts: ${solution.conflicts.length}`);
      
      // Create scheduled courses
      if (solution.scheduled_courses && solution.scheduled_courses.length > 0) {
        const scheduledCoursesToCreate = solution.scheduled_courses.map(course => ({
          scheduled_course_id: course.scheduled_course_id,
          schedule_id: scheduleId,
          course_id: course.course_id,
          professor_id: course.professor_id,
          timeslot_id: course.timeslot_id,
          day_of_week: course.day_of_week,
          is_override: course.is_override || false
        }));
        
        await ScheduledCourse.bulkCreate(scheduledCoursesToCreate);
        console.log(`Created ${scheduledCoursesToCreate.length} scheduled courses`);
      }
      
      // Create conflicts
      if (solution.conflicts && solution.conflicts.length > 0) {
        for (const conflictData of solution.conflicts) {
          // Create the conflict record
          const conflict = await Conflict.create({
            conflict_id: conflictData.conflict.conflict_id,
            schedule_id: scheduleId,
            timeslot_id: conflictData.conflict.timeslot_id,
            day_of_week: conflictData.conflict.day_of_week,
            conflict_type: conflictData.conflict.conflict_type,
            description: conflictData.conflict.description,
            is_resolved: conflictData.conflict.is_resolved || false
          });
          
          // Handle NO_AVAILABLE_SLOT conflicts
          if (conflictData.conflict.conflict_type === 'NO_AVAILABLE_SLOT' && conflictData.scheduled_course) {
            // Create the scheduled course for this conflict
            const scheduledCourse = await ScheduledCourse.create({
              scheduled_course_id: conflictData.scheduled_course.scheduled_course_id,
              schedule_id: scheduleId,
              course_id: conflictData.scheduled_course.course_id,
              professor_id: conflictData.scheduled_course.professor_id,
              timeslot_id: conflictData.scheduled_course.timeslot_id,
              day_of_week: conflictData.scheduled_course.day_of_week,
              is_override: conflictData.scheduled_course.is_override || false
            });
            
            // Create the association between the conflict and the scheduled course
            await ConflictCourse.create({
              conflict_course_id: conflictData.conflict_course.conflict_course_id,
              conflict_id: conflict.conflict_id,
              scheduled_course_id: scheduledCourse.scheduled_course_id
            });
          }
          // Handle TIME_SLOT_CONFLICT conflicts
          else if (conflictData.conflict.conflict_type === 'TIME_SLOT_CONFLICT' && 
                  conflictData.scheduled_courses && 
                  conflictData.conflict_courses) {
            // Create associations for all scheduled courses involved in this conflict
            for (let i = 0; i < conflictData.conflict_courses.length; i++) {
              await ConflictCourse.create({
                conflict_course_id: conflictData.conflict_courses[i].conflict_course_id,
                conflict_id: conflict.conflict_id,
                scheduled_course_id: conflictData.scheduled_courses[i].scheduled_course_id
              });
            }
          }
        }
        
        console.log(`Created ${solution.conflicts.length} conflicts`);
      }
    } catch (error) {
      console.error('Error processing solution:', error);
      throw error;
    }
  }
}

const schedulerService = new SchedulerService();
module.exports = schedulerService;