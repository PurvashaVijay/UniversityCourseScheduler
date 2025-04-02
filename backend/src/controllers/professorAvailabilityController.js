// professorAvailabilityController.js
// Place this in: /backend/src/controllers/professorAvailabilityController.js

const { ProfessorAvailability, Professor, TimeSlot } = require('../../app/models');
const { v4: uuidv4 } = require('uuid');

// Get all time slots with availability for a professor
exports.getProfessorAvailability = async (req, res) => {
  try {
    const professorId = req.params.id;
    console.log(`Getting availability for professor: ${professorId}`);
    
    // Check if the professor exists
    const professor = await Professor.findByPk(professorId);
    if (!professor) {
      return res.status(404).json({ message: 'Professor not found' });
    }
    
    // Get professor's availability settings
    const availabilitySettings = await ProfessorAvailability.findAll({
      where: { professor_id: professorId }
    });
    
    console.log(`Found ${availabilitySettings.length} availability records for professor ${professorId}`);
    
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
    console.log(`Setting availability for professor: ${professorId}`);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { availability } = req.body;
    
    // Validate input
    if (!Array.isArray(availability)) {
      console.log(`Invalid availability format, expected array but got: ${typeof availability}`);
      return res.status(400).json({ message: 'Availability must be an array' });
    }
    
    console.log(`Processing ${availability.length} availability records`);
    
    // Check if the professor exists
    const professor = await Professor.findByPk(professorId);
    if (!professor) {
      return res.status(404).json({ message: 'Professor not found' });
    }
    
    // Skip authorization check since we're using a temp login
    
    // First, clear existing availability records to avoid duplicates
    const deleted = await ProfessorAvailability.destroy({
      where: { professor_id: professorId }
    });
    console.log(`Deleted ${deleted} existing availability records for professor ${professorId}`);
    
    // Process each availability update
    const results = [];
    for (const item of availability) {
      const { timeslot_id, day_of_week, is_available } = item;
      
      // Validate required fields
      if (!timeslot_id || !day_of_week) {
        console.log(`Skipping item due to missing fields:`, item);
        continue; // Skip invalid entries
      }
      
      // Create new record
      console.log(`Creating availability record for ${timeslot_id} on ${day_of_week} (available: ${is_available})`);
      try {
        const availabilityRecord = await ProfessorAvailability.create({
          availability_id: 'AVAIL-' + uuidv4().substring(0, 8),
          professor_id: professorId,
          timeslot_id,
          day_of_week,
          is_available,
          created_at: new Date(),
          updated_at: new Date()
        });
        
        results.push(availabilityRecord);
      } catch (error) {
        console.error(`Error creating availability record:`, error);
      }
    }
    
    console.log(`Successfully created ${results.length} availability records`);
    
    // Get the updated availability records
    const updatedRecords = await ProfessorAvailability.findAll({
      where: { professor_id: professorId }
    });
    
    return res.status(200).json({
      message: 'Availability updated successfully',
      updated_count: results.length,
      records: updatedRecords
    });
  } catch (error) {
    console.error('Error setting professor availability:', error);
    return res.status(500).json({ 
      message: 'Failed to update professor availability',
      error: error.message
    });
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