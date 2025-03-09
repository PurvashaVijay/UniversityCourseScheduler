// timeSlotController.js
const { TimeSlot } = require('../models');
const { v4: uuidv4 } = require('uuid');

// Get all time slots
exports.getAllTimeSlots = async (req, res) => {
  try {
    const timeSlots = await TimeSlot.findAll({
      order: [
        ['day_of_week', 'ASC'],
        ['start_time', 'ASC']
      ]
    });
    return res.status(200).json(timeSlots);
  } catch (error) {
    console.error('Error retrieving time slots:', error);
    return res.status(500).json({ message: 'Failed to retrieve time slots' });
  }
};

// Get time slot by ID
exports.getTimeSlotById = async (req, res) => {
  try {
    const timeSlot = await TimeSlot.findByPk(req.params.id);
    
    if (!timeSlot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }
    
    return res.status(200).json(timeSlot);
  } catch (error) {
    console.error('Error retrieving time slot:', error);
    return res.status(500).json({ message: 'Failed to retrieve time slot' });
  }
};

// Create new time slot
exports.createTimeSlot = async (req, res) => {
  try {
    const { name, start_time, end_time, duration_minutes, day_of_week } = req.body;
    
    // Validate time format
    if (!isValidTimeFormat(start_time) || !isValidTimeFormat(end_time)) {
      return res.status(400).json({ message: 'Invalid time format. Use HH:MM:SS format.' });
    }
    
    // Validate that start time is before end time
    if (start_time >= end_time) {
      return res.status(400).json({ message: 'Start time must be before end time' });
    }
    
    // Validate day of week
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (!validDays.includes(day_of_week)) {
      return res.status(400).json({ message: 'Invalid day of week' });
    }
    
    // Generate a unique ID for the time slot
    const timeSlotId = 'TS-' + uuidv4().substring(0, 8);
    
    const newTimeSlot = await TimeSlot.create({
      timeslot_id: timeSlotId,
      name,
      start_time,
      end_time,
      duration_minutes,
      day_of_week
    });
    
    return res.status(201).json(newTimeSlot);
  } catch (error) {
    console.error('Error creating time slot:', error);
    return res.status(500).json({ 
      message: 'Failed to create time slot',
      error: error.message 
    });
  }
};

// Update time slot
exports.updateTimeSlot = async (req, res) => {
  try {
    const timeSlotId = req.params.id;
    const { name, start_time, end_time, duration_minutes, day_of_week } = req.body;
    
    // Check if time slot exists
    const timeSlot = await TimeSlot.findByPk(timeSlotId);
    if (!timeSlot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }
    
    // Validation for provided fields
    if (start_time && end_time) {
      // Validate time format
      if (!isValidTimeFormat(start_time) || !isValidTimeFormat(end_time)) {
        return res.status(400).json({ message: 'Invalid time format. Use HH:MM:SS format.' });
      }
      
      // Validate that start time is before end time
      if (start_time >= end_time) {
        return res.status(400).json({ message: 'Start time must be before end time' });
      }
    } else if (start_time && !end_time) {
      // Validate time format
      if (!isValidTimeFormat(start_time)) {
        return res.status(400).json({ message: 'Invalid time format. Use HH:MM:SS format.' });
      }
      
      // Validate that start time is before current end time
      if (start_time >= timeSlot.end_time) {
        return res.status(400).json({ message: 'Start time must be before end time' });
      }
    } else if (!start_time && end_time) {
      // Validate time format
      if (!isValidTimeFormat(end_time)) {
        return res.status(400).json({ message: 'Invalid time format. Use HH:MM:SS format.' });
      }
      
      // Validate that current start time is before end time
      if (timeSlot.start_time >= end_time) {
        return res.status(400).json({ message: 'Start time must be before end time' });
      }
    }
    
    // Validate day of week if provided
    if (day_of_week) {
      const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      if (!validDays.includes(day_of_week)) {
        return res.status(400).json({ message: 'Invalid day of week' });
      }
    }
    
    // Update time slot
    await TimeSlot.update(
      { name, start_time, end_time, duration_minutes, day_of_week },
      { where: { timeslot_id: timeSlotId } }
    );
    
    const updatedTimeSlot = await TimeSlot.findByPk(timeSlotId);
    return res.status(200).json(updatedTimeSlot);
  } catch (error) {
    console.error('Error updating time slot:', error);
    return res.status(500).json({ message: 'Failed to update time slot' });
  }
};

// Delete time slot
exports.deleteTimeSlot = async (req, res) => {
  try {
    const timeSlotId = req.params.id;
    
    // Check if time slot exists
    const timeSlot = await TimeSlot.findByPk(timeSlotId);
    if (!timeSlot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }
    
    // Check if time slot is used in any professor availability or scheduled courses
    // This would require adding the ProfessorAvailability and ScheduledCourse models
    // For simplicity, I'll just delete the time slot here
    
    await TimeSlot.destroy({ where: { timeslot_id: timeSlotId } });
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting time slot:', error);
    return res.status(500).json({ message: 'Failed to delete time slot' });
  }
};

// Get time slots by day
exports.getTimeSlotsByDay = async (req, res) => {
  try {
    const day = req.params.day;
    
    // Validate day of week
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (!validDays.includes(day)) {
      return res.status(400).json({ message: 'Invalid day of week' });
    }
    
    const timeSlots = await TimeSlot.findAll({
      where: { day_of_week: day },
      order: [['start_time', 'ASC']]
    });
    
    return res.status(200).json(timeSlots);
  } catch (error) {
    console.error('Error retrieving time slots by day:', error);
    return res.status(500).json({ message: 'Failed to retrieve time slots' });
  }
};

// Helper function to validate time format
function isValidTimeFormat(time) {
  const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/;
  return timeRegex.test(time);
}