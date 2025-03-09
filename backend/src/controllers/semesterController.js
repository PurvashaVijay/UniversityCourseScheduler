// semesterController.js
const { Semester, Schedule } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

// Get all semesters
exports.getAllSemesters = async (req, res) => {
  try {
    const semesters = await Semester.findAll({
      order: [['start_date', 'DESC']]
    });
    return res.status(200).json(semesters);
  } catch (error) {
    console.error('Error retrieving semesters:', error);
    return res.status(500).json({ message: 'Failed to retrieve semesters' });
  }
};

// Get semester by ID
exports.getSemesterById = async (req, res) => {
  try {
    const semester = await Semester.findByPk(req.params.id, {
      include: [{ model: Schedule }]
    });
    
    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }
    
    return res.status(200).json(semester);
  } catch (error) {
    console.error('Error retrieving semester:', error);
    return res.status(500).json({ message: 'Failed to retrieve semester' });
  }
};

// Create new semester
exports.createSemester = async (req, res) => {
  try {
    const { name, start_date, end_date } = req.body;
    
    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD format.' });
    }
    
    if (startDate >= endDate) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }
    
    // Check for overlapping semesters
    const overlappingSemester = await Semester.findOne({
      where: {
        [Op.or]: [
          {
            start_date: {
              [Op.lte]: end_date
            },
            end_date: {
              [Op.gte]: start_date
            }
          }
        ]
      }
    });
    
    if (overlappingSemester) {
      return res.status(400).json({ 
        message: 'This semester overlaps with an existing semester',
        overlapping_semester: overlappingSemester.name
      });
    }
    
    // Generate a unique ID for the semester
    const semesterId = 'SEM-' + uuidv4().substring(0, 8);
    
    const newSemester = await Semester.create({
      semester_id: semesterId,
      name,
      start_date,
      end_date
    });
    
    return res.status(201).json(newSemester);
  } catch (error) {
    console.error('Error creating semester:', error);
    return res.status(500).json({ 
      message: 'Failed to create semester',
      error: error.message 
    });
  }
};

// Update semester
exports.updateSemester = async (req, res) => {
  try {
    const semesterId = req.params.id;
    const { name, start_date, end_date } = req.body;
    
    // Check if semester exists
    const semester = await Semester.findByPk(semesterId);
    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }
    
    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    
    // Validate and update dates if provided
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD format.' });
      }
      
      if (startDate >= endDate) {
        return res.status(400).json({ message: 'Start date must be before end date' });
      }
      
      // Check for overlapping semesters
      const overlappingSemester = await Semester.findOne({
        where: {
          semester_id: {
            [Op.ne]: semesterId
          },
          [Op.or]: [
            {
              start_date: {
                [Op.lte]: end_date
              },
              end_date: {
                [Op.gte]: start_date
              }
            }
          ]
        }
      });
      
      if (overlappingSemester) {
        return res.status(400).json({ 
          message: 'This semester would overlap with an existing semester',
          overlapping_semester: overlappingSemester.name
        });
      }
      
      updateData.start_date = start_date;
      updateData.end_date = end_date;
    } else if (start_date) {
      const startDate = new Date(start_date);
      const currentEndDate = new Date(semester.end_date);
      
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD format.' });
      }
      
      if (startDate >= currentEndDate) {
        return res.status(400).json({ message: 'Start date must be before end date' });
      }
      
      updateData.start_date = start_date;
    } else if (end_date) {
      const endDate = new Date(end_date);
      const currentStartDate = new Date(semester.start_date);
      
      if (isNaN(endDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD format.' });
      }
      
      if (currentStartDate >= endDate) {
        return res.status(400).json({ message: 'Start date must be before end date' });
      }
      
      updateData.end_date = end_date;
    }
    
    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No changes provided for update' });
    }
    
    // Update semester
    await Semester.update(updateData, { where: { semester_id: semesterId } });
    
    const updatedSemester = await Semester.findByPk(semesterId);
    return res.status(200).json(updatedSemester);
  } catch (error) {
    console.error('Error updating semester:', error);
    return res.status(500).json({ message: 'Failed to update semester' });
  }
};

// Delete semester
exports.deleteSemester = async (req, res) => {
  try {
    const semesterId = req.params.id;
    
    // Check if semester exists
    const semester = await Semester.findByPk(semesterId);
    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }
    
    // Check if there are schedules associated with this semester
    const scheduleCount = await Schedule.count({ where: { semester_id: semesterId } });
    
    if (scheduleCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete semester with associated schedules',
        schedule_count: scheduleCount
      });
    }
    
    // Delete the semester
    await Semester.destroy({ where: { semester_id: semesterId } });
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting semester:', error);
    return res.status(500).json({ message: 'Failed to delete semester' });
  }
};

// Get current semester
exports.getCurrentSemester = async (req, res) => {
  try {
    const currentDate = new Date();
    
    const currentSemester = await Semester.findOne({
      where: {
        start_date: {
          [Op.lte]: currentDate
        },
        end_date: {
          [Op.gte]: currentDate
        }
      }
    });
    
    if (!currentSemester) {
      // If no current semester, get the nearest upcoming one
      const upcomingSemester = await Semester.findOne({
        where: {
          start_date: {
            [Op.gt]: currentDate
          }
        },
        order: [['start_date', 'ASC']]
      });
      
      if (upcomingSemester) {
        return res.status(200).json({
          current_semester: null,
          upcoming_semester: upcomingSemester,
          message: 'No active semester. Returning the next upcoming semester.'
        });
      } else {
        return res.status(404).json({ message: 'No current or upcoming semesters found' });
      }
    }
    
    return res.status(200).json(currentSemester);
  } catch (error) {
    console.error('Error retrieving current semester:', error);
    return res.status(500).json({ message: 'Failed to retrieve current semester' });
  }
};