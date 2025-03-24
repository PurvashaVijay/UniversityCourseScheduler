// schedulerService.js
const { Course, Professor, TimeSlot, Schedule, ScheduledCourse, Conflict, ConflictCourse } = require('../../app/models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

class SchedulerService {
  /**
   * Generate a schedule for a semester
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

      // Get all courses
      const courses = await Course.findAll({
        order: [
          ['is_core', 'DESC'],
          ['course_name', 'ASC']
        ]
      });

      // Get all professors
      const professors = await Professor.findAll();

      // Get all time slots
      const timeSlots = await TimeSlot.findAll({
        order: [
          ['day_of_week', 'ASC'],
          ['start_time', 'ASC']
        ]
      });

      // Simple scheduling algorithm
      const scheduledCourses = [];
      const conflicts = [];

      // Try to schedule each course
      for (const course of courses) {
        let scheduled = false;

        // Try with all professors
        for (const professor of professors) {
          if (scheduled) break;

          // Try all time slots
          for (const timeSlot of timeSlots) {
            // Check if this slot is already used
            const existingScheduled = scheduledCourses.find(sc => 
              sc.timeslot_id === timeSlot.timeslot_id && 
              sc.day_of_week === timeSlot.day_of_week
            );

            // Check if this professor is already scheduled here
            const professorScheduled = scheduledCourses.find(sc => 
              sc.professor_id === professor.professor_id && 
              sc.timeslot_id === timeSlot.timeslot_id && 
              sc.day_of_week === timeSlot.day_of_week
            );

            if (!existingScheduled && !professorScheduled) {
              // Create scheduled course
              const scheduledCourseId = 'SC-' + uuidv4().substring(0, 8);
              
              const scheduledCourse = {
                scheduled_course_id: scheduledCourseId,
                schedule_id: scheduleId,
                course_id: course.course_id,
                professor_id: professor.professor_id,
                timeslot_id: timeSlot.timeslot_id,
                day_of_week: timeSlot.day_of_week,
                is_override: false
              };
              
              scheduledCourses.push(scheduledCourse);
              scheduled = true;
              break;
            }
          }
        }

        // Create conflict if couldn't schedule
        if (!scheduled) {
          const conflictId = 'CONF-' + uuidv4().substring(0, 8);
          
          conflicts.push({
            conflict_id: conflictId,
            schedule_id: scheduleId,
            conflict_type: 'UNSCHEDULABLE_COURSE',
            description: `Could not find a suitable time slot for course ${course.course_name}`,
            is_resolved: false
          });
        }
      }

      // Save scheduled courses to database
      if (scheduledCourses.length > 0) {
        await ScheduledCourse.bulkCreate(scheduledCourses);
      }

      // Save conflicts to database
      if (conflicts.length > 0) {
        await Conflict.bulkCreate(conflicts);
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

      return {
        schedule: completeSchedule,
        conflicts: conflicts
      };
    } catch (error) {
      console.error('Error generating schedule:', error);
      throw error;
    }
  }
}

module.exports = new SchedulerService();