// programController.js
const { Program, Department, Course, CourseProgram } = require('../models');
const { v4: uuidv4 } = require('uuid');

// Get all programs
exports.getAllPrograms = async (req, res) => {
  try {
    const programs = await Program.findAll({
      include: [
        { model: Department, attributes: ['name'] }
      ]
    });
    return res.status(200).json(programs);
  } catch (error) {
    console.error('Error retrieving programs:', error);
    return res.status(500).json({ message: 'Failed to retrieve programs' });
  }
};

// Get program by ID
exports.getProgramById = async (req, res) => {
  try {
    const program = await Program.findByPk(req.params.id, {
      include: [
        { model: Department, attributes: ['name'] },
        { 
          model: Course, 
          through: { attributes: ['is_required'] },
          attributes: ['course_id', 'course_name', 'is_core', 'duration_minutes']
        }
      ]
    });
    
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    
    return res.status(200).json(program);
  } catch (error) {
    console.error('Error retrieving program:', error);
    return res.status(500).json({ message: 'Failed to retrieve program' });
  }
};

// Create new program
exports.createProgram = async (req, res) => {
  try {
    const { department_id, name, description, course_ids } = req.body;
    
    // Generate a unique program ID
    const programId = 'PROG-' + uuidv4().substring(0, 8);
    
    // Create the program
    const newProgram = await Program.create({
      program_id: programId,
      department_id,
      name,
      description
    });
    
    // Associate program with courses if provided
    if (course_ids && Array.isArray(course_ids) && course_ids.length > 0) {
      const courseAssociations = [];
      
      for (const courseId of course_ids) {
        // Get the course to check if it's a core course
        const course = await Course.findByPk(courseId);
        if (course) {
          courseAssociations.push({
            course_program_id: 'CP-' + uuidv4().substring(0, 8),
            course_id: courseId,
            program_id: programId,
            is_required: course.is_core
          });
        }
      }
      
      if (courseAssociations.length > 0) {
        await CourseProgram.bulkCreate(courseAssociations);
      }
    }
    
    // Return the created program with its relationships
    const createdProgram = await Program.findByPk(programId, {
      include: [
        { model: Department, attributes: ['name'] },
        { 
          model: Course, 
          through: { attributes: ['is_required'] },
          attributes: ['course_id', 'course_name', 'is_core', 'duration_minutes']
        }
      ]
    });
    
    return res.status(201).json(createdProgram);
  } catch (error) {
    console.error('Error creating program:', error);
    return res.status(500).json({ 
      message: 'Failed to create program',
      error: error.message 
    });
  }
};

// Update program
exports.updateProgram = async (req, res) => {
  try {
    const programId = req.params.id;
    const { department_id, name, description, course_ids } = req.body;
    
    // Check if program exists
    const program = await Program.findByPk(programId);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    
    // Update program basic info
    await Program.update(
      { department_id, name, description },
      { where: { program_id: programId } }
    );
    
    // Update course associations if provided
    if (course_ids && Array.isArray(course_ids)) {
      // Remove existing associations
      await CourseProgram.destroy({ where: { program_id: programId } });
      
      // Create new associations
      if (course_ids.length > 0) {
        const courseAssociations = [];
      
        for (const courseId of course_ids) {
          // Get the course to check if it's a core course
          const course = await Course.findByPk(courseId);
          if (course) {
            courseAssociations.push({
              course_program_id: 'CP-' + uuidv4().substring(0, 8),
              course_id: courseId,
              program_id: programId,
              is_required: course.is_core
            });
          }
        }
        
        if (courseAssociations.length > 0) {
          await CourseProgram.bulkCreate(courseAssociations);
        }
      }
    }
    
    // Return the updated program with its relationships
    const updatedProgram = await Program.findByPk(programId, {
      include: [
        { model: Department, attributes: ['name'] },
        { 
          model: Course, 
          through: { attributes: ['is_required'] },
          attributes: ['course_id', 'course_name', 'is_core', 'duration_minutes']
        }
      ]
    });
    
    return res.status(200).json(updatedProgram);
  } catch (error) {
    console.error('Error updating program:', error);
    return res.status(500).json({ message: 'Failed to update program' });
  }
};

// Delete program
exports.deleteProgram = async (req, res) => {
  try {
    const programId = req.params.id;
    
    // Check if program exists
    const program = await Program.findByPk(programId);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    
    // Delete related CourseProgram records
    await CourseProgram.destroy({ where: { program_id: programId } });
    
    // Delete the program
    await Program.destroy({ where: { program_id: programId } });
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting program:', error);
    return res.status(500).json({ message: 'Failed to delete program' });
  }
};

// Get programs by department
exports.getProgramsByDepartment = async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    
    // Check if department exists
    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    const programs = await Program.findAll({
      where: { department_id: departmentId },
      include: [
        { model: Department, attributes: ['name'] }
      ]
    });
    
    return res.status(200).json(programs);
  } catch (error) {
    console.error('Error retrieving department programs:', error);
    return res.status(500).json({ message: 'Failed to retrieve department programs' });
  }
};