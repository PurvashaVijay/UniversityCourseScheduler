// schedulerController.js
const schedulerService = require('../services/schedulerService');
const { Semester } = require('../models');

// Generate a new schedule
exports.generateSchedule = async (req, res) => {
  try {
    const { semester_id, name } = req.body;
    
    // Validate required fields
    if (!semester_id || !name) {
      return res.status(400).json({ message: 'Semester ID and schedule name are required' });
    }
    
    // Check if semester exists
    const semester = await Semester.findByPk(semester_id);
    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }
    
    // Generate schedule
    const result = await schedulerService.generateSchedule(semester_id, name);
    
    // Return the generated schedule and conflicts
    return res.status(201).json({
      message: 'Schedule generated successfully',
      schedule: result.schedule,
      conflicts: result.conflicts.length,
      conflict_details: result.conflicts.length > 0 ? result.conflicts : undefined
    });
  } catch (error) {
    console.error('Error in schedule generation:', error);
    return res.status(500).json({ 
      message: 'Failed to generate schedule',
      error: error.message 
    });
  }
};