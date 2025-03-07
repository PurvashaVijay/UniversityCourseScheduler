const { Department } = require('../models');

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