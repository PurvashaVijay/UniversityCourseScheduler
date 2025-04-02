// professorAvailabilityController.js
// Place this in: /backend/src/controllers/professorAvailabilityController.js

const { ProfessorAvailability, Professor, TimeSlot } = require('../../app/models');
const { v4: uuidv4 } = require('uuid');

// Get all time slots with availability for a professor
exports.getProfessorAvailability = async (req, res) => {
  try {
    const professorId = req.params.id;
    
    // Check if the professor exists
    const professor = await Professor.findByPk(professorId);
    if (!professor) {
      return res.status(404).json({ message: 'Professor not found' });
    }
    
    // Get professor's availability settings
    const availabilitySettings = await ProfessorAvailability.findAll({
      where: { professor_id: professorId }
    });
    
    // Return flat array of availability records
    return res.status(200).json(availabilitySettings);
  } catch (error) {
    console.error('Error retrieving professor availability:', error);
    return res.status(500).json({ message: 'Failed to retrieve professor availability' });
  }
};

// Set bulk availability for a professor
exports.setBulkAvailability = async (req, res) => {
  try {
    const professorId = req.params.id;
    const { availability } = req.body;
    
    // Validate input
    if (!Array.isArray(availability)) {
      return res.status(400).json({ message: 'Availability must be an array' });
    }
    
    // Check if the professor exists
    const professor = await Professor.findByPk(professorId);
    if (!professor) {
      return res.status(404).json({ message: 'Professor not found' });
    }
    
    // Authorization check: Only the professor themselves or an admin can modify their availability
    if (req.user.role !== 'admin' && req.user.userId !== professorId) {
      return res.status(403).json({ message: 'You are not authorized to modify this professor\'s availability' });
    }
    
    // Process each availability update
    const results = [];
    for (const item of availability) {
      const { timeslot_id, day_of_week, is_available } = item;
      
      // Validate required fields
      if (!timeslot_id || !day_of_week) {
        continue; // Skip invalid entries
      }
      
      // Check if time slot exists
      const timeSlot = await TimeSlot.findOne({
        where: { 
          timeslot_id,
          day_of_week
        }
      });
      
      if (!timeSlot) {
        continue; // Skip invalid time slots
      }
      
      // Update or create availability record
      let availabilityRecord = await ProfessorAvailability.findOne({
        where: {
          professor_id: professorId,
          timeslot_id,
          day_of_week
        }
      });
      
      if (availabilityRecord) {
        // Update existing record
        availabilityRecord.is_available = is_available;
        await availabilityRecord.save();
      } else {
        // Create new record
        availabilityRecord = await ProfessorAvailability.create({
          availability_id: 'AVAIL-' + uuidv4().substring(0, 8),
          professor_id: professorId,
          timeslot_id,
          day_of_week,
          is_available
        });
      }
      
      results.push(availabilityRecord);
    }
    
    return res.status(200).json({
      message: 'Availability updated successfully',
      updated_count: results.length
    });
  } catch (error) {
    console.error('Error setting professor availability:', error);
    return res.status(500).json({ message: 'Failed to update professor availability' });
  }
};

// Get my availability (for currently logged in professor)
exports.getMyAvailability = async (req, res) => {
  try {
    const professorId = req.user.userId;
    
    // Ensure the user is a professor
    if (req.user.role !== 'professor') {
      return res.status(403).json({ message: 'Only professors can access their availability' });
    }
    
    // Reuse the getProfessorAvailability logic
    req.params.id = professorId;
    return exports.getProfessorAvailability(req, res);
  } catch (error) {
    console.error('Error retrieving professor availability:', error);
    return res.status(500).json({ message: 'Failed to retrieve professor availability' });
  }
};

// Set my availability (for currently logged in professor)
exports.setMyAvailability = async (req, res) => {
  try {
    const professorId = req.user.userId;
    
    // Ensure the user is a professor
    if (req.user.role !== 'professor') {
      return res.status(403).json({ message: 'Only professors can set their availability' });
    }
    
    // Reuse the setBulkAvailability logic
    req.params.id = professorId;
    return exports.setBulkAvailability(req, res);
  } catch (error) {
    console.error('Error setting professor availability:', error);
    return res.status(500).json({ message: 'Failed to update professor availability' });
  }
};