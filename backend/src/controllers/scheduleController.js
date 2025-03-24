// scheduleController.js
//const { Schedule, Semester, ScheduledCourse, Course, Professor, TimeSlot, Conflict, ConflictCourse } = require('../models');
const { Schedule, Semester, ScheduledCourse, Course, Professor, TimeSlot, Conflict, ConflictCourse } = require('../../app/models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

// Get all schedules
exports.getAllSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.findAll({
      include: [{ model: Semester, attributes: ['name', 'start_date', 'end_date'] }],
      order: [['created_at', 'DESC']]
    });
    return res.status(200).json(schedules);
  } catch (error) {
    console.error('Error retrieving schedules:', error);
    return res.status(500).json({ message: 'Failed to retrieve schedules' });
  }
};

// Get schedule by ID
exports.getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id, {
      include: [
        { model: Semester, attributes: ['name', 'start_date', 'end_date'] },
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
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    return res.status(200).json(schedule);
  } catch (error) {
    console.error('Error retrieving schedule:', error);
    return res.status(500).json({ message: 'Failed to retrieve schedule' });
  }
};

// Create new schedule
exports.createSchedule = async (req, res) => {
  try {
    const { semester_id, name } = req.body;
    
    // Check if semester exists
    const semester = await Semester.findByPk(semester_id);
    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }
    
    // Generate a unique ID for the schedule
    const scheduleId = 'SCH-' + uuidv4().substring(0, 8);
    
    const newSchedule = await Schedule.create({
      schedule_id: scheduleId,
      semester_id,
      name,
      is_final: false
    });
    
    // Return the created schedule
    const createdSchedule = await Schedule.findByPk(scheduleId, {
      include: [{ model: Semester, attributes: ['name', 'start_date', 'end_date'] }]
    });
    
    return res.status(201).json(createdSchedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    return res.status(500).json({ 
      message: 'Failed to create schedule',
      error: error.message 
    });
  }
};

// Update schedule
exports.updateSchedule = async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const { name, is_final } = req.body;
    
    // Check if schedule exists
    const schedule = await Schedule.findByPk(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (is_final !== undefined) {
      // If marking as final, check if there are unresolved conflicts
      if (is_final === true) {
        const unresolvedConflictsCount = await Conflict.count({ 
          where: { 
            schedule_id: scheduleId,
            is_resolved: false
          }
        });
        
        if (unresolvedConflictsCount > 0) {
          return res.status(400).json({ 
            message: 'Cannot finalize schedule with unresolved conflicts',
            unresolved_conflicts: unresolvedConflictsCount
          });
        }
      }
      
      updateData.is_final = is_final;
    }
    
    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No changes provided for update' });
    }
    
    // Update schedule
    await Schedule.update(updateData, { where: { schedule_id: scheduleId } });
    
    const updatedSchedule = await Schedule.findByPk(scheduleId, {
      include: [{ model: Semester, attributes: ['name', 'start_date', 'end_date'] }]
    });
    return res.status(200).json(updatedSchedule);
  } catch (error) {
    console.error('Error updating schedule:', error);
    return res.status(500).json({ message: 'Failed to update schedule' });
  }
};

// Delete schedule
exports.deleteSchedule = async (req, res) => {
  try {
    const scheduleId = req.params.id;
    
    // Check if schedule exists
    const schedule = await Schedule.findByPk(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    // Delete related conflicts and their associations
    const conflicts = await Conflict.findAll({ where: { schedule_id: scheduleId } });
    for (const conflict of conflicts) {
      await ConflictCourse.destroy({ where: { conflict_id: conflict.conflict_id } });
    }
    await Conflict.destroy({ where: { schedule_id: scheduleId } });
    
    // Delete scheduled courses
    await ScheduledCourse.destroy({ where: { schedule_id: scheduleId } });
    
    // Delete the schedule
    await Schedule.destroy({ where: { schedule_id: scheduleId } });
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return res.status(500).json({ message: 'Failed to delete schedule' });
  }
};

// Get schedules by semester
exports.getSchedulesBySemester = async (req, res) => {
  try {
    const semesterId = req.params.semesterId;
    
    // Check if semester exists
    const semester = await Semester.findByPk(semesterId);
    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }
    
    const schedules = await Schedule.findAll({
      where: { semester_id: semesterId },
      include: [{ model: Semester, attributes: ['name', 'start_date', 'end_date'] }],
      order: [['created_at', 'DESC']]
    });
    
    return res.status(200).json(schedules);
  } catch (error) {
    console.error('Error retrieving semester schedules:', error);
    return res.status(500).json({ message: 'Failed to retrieve semester schedules' });
  }
};

// Get conflicts for a schedule
exports.getScheduleConflicts = async (req, res) => {
  try {
    const scheduleId = req.params.id;
    
    // Check if schedule exists
    const schedule = await Schedule.findByPk(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    const conflicts = await Conflict.findAll({
      where: { schedule_id: scheduleId },
      include: [
        { 
          model: ScheduledCourse, 
          through: ConflictCourse,
          include: [
            { model: Course, attributes: ['course_name', 'is_core'] },
            { model: Professor, attributes: ['first_name', 'last_name'] },
            { model: TimeSlot, attributes: ['name', 'start_time', 'end_time', 'day_of_week'] }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    return res.status(200).json(conflicts);
  } catch (error) {
    console.error('Error retrieving schedule conflicts:', error);
    return res.status(500).json({ message: 'Failed to retrieve schedule conflicts' });
  }
};

// Resolve a conflict
exports.resolveConflict = async (req, res) => {
  try {
    const conflictId = req.params.conflictId;
    const { resolution_notes } = req.body;
    
    // Check if conflict exists
    const conflict = await Conflict.findByPk(conflictId);
    if (!conflict) {
      return res.status(404).json({ message: 'Conflict not found' });
    }
    
    // Update conflict to mark as resolved
    await Conflict.update(
      { 
        is_resolved: true,
        resolution_notes: resolution_notes || 'Conflict manually resolved by administrator'
      },
      { where: { conflict_id: conflictId } }
    );
    
    const updatedConflict = await Conflict.findByPk(conflictId, {
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
    
    return res.status(200).json(updatedConflict);
  } catch (error) {
    console.error('Error resolving conflict:', error);
    return res.status(500).json({ message: 'Failed to resolve conflict' });
  }
};