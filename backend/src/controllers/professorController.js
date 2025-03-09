// professorController.js
const { Professor, Department } = require('../models');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Get all professors
exports.getAllProfessors = async (req, res) => {
  try {
    const professors = await Professor.findAll({
      include: [{ model: Department, attributes: ['name'] }],
      attributes: { exclude: ['password_hash'] }
    });
    return res.status(200).json(professors);
  } catch (error) {
    console.error('Error retrieving professors:', error);
    return res.status(500).json({ message: 'Failed to retrieve professors' });
  }
};

// Get professor by ID
exports.getProfessorById = async (req, res) => {
  try {
    const professor = await Professor.findByPk(req.params.id, {
      include: [{ model: Department, attributes: ['name'] }],
      attributes: { exclude: ['password_hash'] }
    });
    
    if (!professor) {
      return res.status(404).json({ message: 'Professor not found' });
    }
    
    return res.status(200).json(professor);
  } catch (error) {
    console.error('Error retrieving professor:', error);
    return res.status(500).json({ message: 'Failed to retrieve professor' });
  }
};

// Create new professor
exports.createProfessor = async (req, res) => {
  try {
    // Generate hash for password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    
    // Generate a unique ID for the professor
    const professorId = 'PROF-' + uuidv4().substring(0, 8);
    
    const newProfessor = await Professor.create({
      professor_id: professorId,
      department_id: req.body.department_id,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      password_hash: hashedPassword
    });
    
    // Remove password_hash from response
    const response = newProfessor.toJSON();
    delete response.password_hash;
    
    return res.status(201).json(response);
  } catch (error) {
    console.error('Error creating professor:', error);
    return res.status(500).json({ 
      message: 'Failed to create professor',
      error: error.message 
    });
  }
};

// Update professor
exports.updateProfessor = async (req, res) => {
  try {
    const professorData = { ...req.body };
    
    // If password is provided, hash it
    if (professorData.password) {
      const salt = await bcrypt.genSalt(10);
      professorData.password_hash = await bcrypt.hash(professorData.password, salt);
      delete professorData.password;
    }
    
    const [updated] = await Professor.update(professorData, {
      where: { professor_id: req.params.id }
    });
    
    if (updated === 0) {
      return res.status(404).json({ message: 'Professor not found' });
    }
    
    const updatedProfessor = await Professor.findByPk(req.params.id, {
      attributes: { exclude: ['password_hash'] }
    });
    
    return res.status(200).json(updatedProfessor);
  } catch (error) {
    console.error('Error updating professor:', error);
    return res.status(500).json({ message: 'Failed to update professor' });
  }
};

// Delete professor
exports.deleteProfessor = async (req, res) => {
  try {
    const deleted = await Professor.destroy({
      where: { professor_id: req.params.id }
    });
    
    if (deleted === 0) {
      return res.status(404).json({ message: 'Professor not found' });
    }
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting professor:', error);
    return res.status(500).json({ message: 'Failed to delete professor' });
  }
};