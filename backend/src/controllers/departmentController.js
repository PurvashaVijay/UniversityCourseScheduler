//const { Department } = require('../models');
/*
const { Department } = require('../../app/models');

// Get all departments
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll();
    return res.status(200).json(departments);
  } catch (error) {
    console.error('Error retrieving departments:', error);
    return res.status(500).json({ message: 'Failed to retrieve departments' });
  }
};

// Get department by ID
exports.getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    return res.status(200).json(department);
  } catch (error) {
    console.error('Error retrieving department:', error);
    return res.status(500).json({ message: 'Failed to retrieve department' });
  }
};

// Create new department
exports.createDepartment = async (req, res) => {
  try {
    const newDepartment = await Department.create(req.body);
    return res.status(201).json(newDepartment);
  } catch (error) {
    console.error('Error creating department:', error);
    return res.status(500).json({ message: 'Failed to create department' });
  }
};

// Update department
exports.updateDepartment = async (req, res) => {
  try {
    const [updated] = await Department.update(req.body, {
      where: { department_id: req.params.id }
    });
    if (updated === 0) {
      return res.status(404).json({ message: 'Department not found' });
    }
    const updatedDepartment = await Department.findByPk(req.params.id);
    return res.status(200).json(updatedDepartment);
  } catch (error) {
    console.error('Error updating department:', error);
    return res.status(500).json({ message: 'Failed to update department' });
  }
};

// Delete department
exports.deleteDepartment = async (req, res) => {
  try {
    const deleted = await Department.destroy({
      where: { department_id: req.params.id }
    });
    if (deleted === 0) {
      return res.status(404).json({ message: 'Department not found' });
    }
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting department:', error);
    return res.status(500).json({ message: 'Failed to delete department' });
  }
};
*/

const Department = require('../../app/models/Department');
const { v4: uuidv4 } = require('uuid');

// Get all departments
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll();
    return res.status(200).json(departments);
  } catch (error) {
    console.error('Error retrieving departments:', error);
    return res.status(500).json({ message: 'Failed to retrieve departments' });
  }
};

// Get department by ID
exports.getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    return res.status(200).json(department);
  } catch (error) {
    console.error('Error retrieving department:', error);
    return res.status(500).json({ message: 'Failed to retrieve department' });
  }
};

// Create new department
exports.createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Department name is required' });
    }
    
    // Check for duplicate name
    const existingDepartment = await Department.findOne({ 
      where: { name }
    });
    
    if (existingDepartment) {
      return res.status(409).json({ 
        message: 'A department with this name already exists'
      });
    }
    
    // Generate ID if not provided
    let department_id = req.body.department_id;
    if (!department_id) {
      department_id = `DEPT-${uuidv4().substring(0, 8).toUpperCase()}`;
    }
    
    const newDepartment = await Department.create({
      department_id,
      name,
      description
    });
    
    return res.status(201).json(newDepartment);
  } catch (error) {
    console.error('Error creating department:', error);
    return res.status(500).json({ message: 'Failed to create department' });
  }
};

// Update department
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    // Find the department
    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    // Check for duplicate name
    if (name && name !== department.name) {
      const existingDepartment = await Department.findOne({ where: { name } });
      if (existingDepartment) {
        return res.status(409).json({ 
          message: 'A department with this name already exists'
        });
      }
    }
    
    // Update fields
    if (name) department.name = name;
    if (description !== undefined) department.description = description;
    
    await department.save();
    
    return res.status(200).json(department);
  } catch (error) {
    console.error('Error updating department:', error);
    return res.status(500).json({ message: 'Failed to update department' });
  }
};

// Delete department
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the department
    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    // TODO: Check if department has related records (programs, courses, etc.)
    // If so, you might want to prevent deletion to maintain data integrity
    
    await department.destroy();
    return res.status(200).json({ 
      message: 'Department deleted successfully',
      deleted: true 
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    return res.status(500).json({ message: 'Failed to delete department' });
  }
};