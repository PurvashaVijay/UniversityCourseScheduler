// backend/src/controllers/dashboardController.js

const { Department, Program, Course, Professor, Schedule, Conflict } = require('../../app/models');

exports.getDashboardStats = async (req, res) => {
  try {
    // Get counts from database
    const departmentCount = await Department.count();
    const programCount = await Program.count();
    const courseCount = await Course.count();
    const professorCount = await Professor.count();
    
    // Get active schedules (where is_final is true)
    const activeSchedulesCount = await Schedule.count({
      where: { is_final: true }
    });
    
    // Get pending conflicts (where is_resolved is false)
    const pendingConflictsCount = await Conflict.count({
      where: { is_resolved: false }
    });
    
    // Return all stats in one object
    return res.status(200).json({
      departments: departmentCount,
      programs: programCount,
      courses: courseCount,
      professors: professorCount,
      activeSchedules: activeSchedulesCount,
      pendingConflicts: pendingConflictsCount
    });
  } catch (error) {
    console.error('Error retrieving dashboard stats:', error);
    return res.status(500).json({ message: 'Failed to retrieve dashboard statistics' });
  }
};