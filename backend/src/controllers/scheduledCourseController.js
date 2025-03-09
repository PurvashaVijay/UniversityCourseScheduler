// scheduledCourseController.js
// Place this in: /backend/src/controllers/scheduledCourseController.js

const { ScheduledCourse, Course, Professor, TimeSlot, Schedule, Conflict, ConflictCourse } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

// Get all scheduled courses for a schedule
exports.getScheduledCourses = async (req, res) => {
  try {
    const scheduleId = req.params.scheduleId;
    
    const scheduledCourses = await ScheduledCourse.findAll({
      where: { schedule_id: scheduleId },
      include: [
        { model: Course, attributes: ['course_name', 'is_core', 'duration_minutes'] },
        { model: Professor, attributes: ['first_name', 'last_name'] },
        { model: TimeSlot, attributes: ['name', 'start_time', 'end_time', 'day_of_week'] }
      ],
      order: [
        ['day_of_week', 'ASC'],
        [TimeSlot, 'start_time', 'ASC']
      ]
    });
    
    return res.status(200).json(scheduledCourses);
  } catch (error) {
    console.error('Error retrieving scheduled courses:', error);
    return res.status(500).json({ message: 'Failed to retrieve scheduled courses' });
  }
};

// Get scheduled course by ID
exports.getScheduledCourseById = async (req, res) => {
  try {
    const scheduledCourseId = req.params.id;
    
    const scheduledCourse = await ScheduledCourse.findByPk(scheduledCourseId, {
      include: [
        { model: Course, attributes: ['course_name', 'is_core', 'duration_minutes'] },
        { model: Professor, attributes: ['first_name', 'last_name'] },
        { model: TimeSlot, attributes: ['name', 'start_time', 'end_time', 'day_of_week'] },
        { model: Schedule }
      ]
    });
    
    if (!scheduledCourse) {
      return res.status(404).json({ message: 'Scheduled course not found' });
    }
    
    return res.status(200).json(scheduledCourse);
  } catch (error) {
    console.error('Error retrieving scheduled course:', error);
    return res.status(500).json({ message: 'Failed to retrieve scheduled course' });
  }
};

// Create a manual override for a scheduled course
exports.createOverride = async (req, res) => {
  try {
    const {
      schedule_id,
      course_id,
      professor_id,
      timeslot_id,
      day_of_week,
      override_reason
    } = req.body;
    
    // Validate required fields
    if (!schedule_id || !course_id || !professor_id || !timeslot_id || !day_of_week) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if schedule exists and is not finalized
    const schedule = await Schedule.findByPk(schedule_id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    if (schedule.is_final) {
      return res.status(400).json({ message: 'Cannot override courses in a finalized schedule' });
    }
    
    // Check if course exists
    const course = await Course.findByPk(course_id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if professor exists
    const professor = await Professor.findByPk(professor_id);
    if (!professor) {
      return res.status(404).json({ message: 'Professor not found' });
    }
    
    // Check if time slot exists
    const timeSlot = await TimeSlot.findOne({
      where: {
        timeslot_id,
        day_of_week
      }
    });
    
    if (!timeSlot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }
    
    // Check if there's an existing scheduled course for this course in this schedule
    const existingScheduledCourse = await ScheduledCourse.findOne({
      where: {
        schedule_id,
        course_id
      }
    });
    
    let scheduledCourseId;
    
    if (existingScheduledCourse) {
      // Update existing scheduled course as an override
      scheduledCourseId = existingScheduledCourse.scheduled_course_id;
      
      await ScheduledCourse.update(
        {
          professor_id,
          timeslot_id,
          day_of_week,
          is_override: true,
          override_reason: override_reason || 'Manual override by administrator'
        },
        {
          where: { scheduled_course_id: scheduledCourseId }
        }
      );
    } else {
      // Create new scheduled course as an override
      scheduledCourseId = 'SC-' + uuidv4().substring(0, 8);
      
      await ScheduledCourse.create({
        scheduled_course_id: scheduledCourseId,
        schedule_id,
        course_id,
        professor_id,
        timeslot_id,
        day_of_week,
        is_override: true,
        override_reason: override_reason || 'Manual override by administrator'
      });
    }
    
    // Check for new conflicts after override
    const conflictsToCheck = await ScheduledCourse.findAll({
      where: {
        schedule_id,
        timeslot_id,
        day_of_week,
        scheduled_course_id: {
          [Op.ne]: scheduledCourseId
        }
      },
      include: [
        { model: Course },
        { model: Professor }
      ]
    });
    
    // If conflicts exist, create a conflict record
    if (conflictsToCheck.length > 0) {
      const conflictId = 'CONF-' + uuidv4().substring(0, 8);
      
      // Create conflict record
      const conflict = await Conflict.create({
        conflict_id: conflictId,
        schedule_id,
        timeslot_id,
        day_of_week,
        conflict_type: 'MANUAL_OVERRIDE_CONFLICT',
        description: 'Manual override created conflicts with existing scheduled courses',
        is_resolved: false
      });
      
      // Associate the new/updated scheduled course with the conflict
      await ConflictCourse.create({
        conflict_course_id: 'CC-' + uuidv4().substring(0, 8),
        conflict_id: conflictId,
        scheduled_course_id: scheduledCourseId
      });
      
      // Associate conflicting courses with the conflict
      for (const conflictingCourse of conflictsToCheck) {
        await ConflictCourse.create({
          conflict_course_id: 'CC-' + uuidv4().substring(0, 8),
          conflict_id: conflictId,
          scheduled_course_id: conflictingCourse.scheduled_course_id
        });
      }
    }
    
    // Return the updated/created scheduled course
    const result = await ScheduledCourse.findByPk(scheduledCourseId, {
      include: [
        { model: Course, attributes: ['course_name', 'is_core', 'duration_minutes'] },
        { model: Professor, attributes: ['first_name', 'last_name'] },
        { model: TimeSlot, attributes: ['name', 'start_time', 'end_time', 'day_of_week'] }
      ]
    });
    
    return res.status(200).json({
      message: existingScheduledCourse ? 'Override created by updating existing course' : 'New override created',
      scheduledCourse: result,
      conflicts: conflictsToCheck.length > 0
    });
  } catch (error) {
    console.error('Error creating override:', error);
    return res.status(500).json({ message: 'Failed to create override' });
  }
};

// Delete a scheduled course
exports.deleteScheduledCourse = async (req, res) => {
  try {
    const scheduledCourseId = req.params.id;
    
    // Check if scheduled course exists
    const scheduledCourse = await ScheduledCourse.findByPk(scheduledCourseId);
    if (!scheduledCourse) {
      return res.status(404).json({ message: 'Scheduled course not found' });
    }
    
    // Check if schedule is finalized
    const schedule = await Schedule.findByPk(scheduledCourse.schedule_id);
    if (schedule.is_final) {
      return res.status(400).json({ message: 'Cannot delete courses from a finalized schedule' });
    }
    
    // Remove from any conflicts
    await ConflictCourse.destroy({
      where: { scheduled_course_id: scheduledCourseId }
    });
    
    // Delete the scheduled course
    await ScheduledCourse.destroy({
      where: { scheduled_course_id: scheduledCourseId }
    });
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting scheduled course:', error);
    return res.status(500).json({ message: 'Failed to delete scheduled course' });
  }
};