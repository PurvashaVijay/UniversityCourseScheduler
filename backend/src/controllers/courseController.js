// courseController.js

const { Op } = require('sequelize');

const { Course, Department, Program, CourseProgram, CoursePrerequisite } = require('../models');
const { v4: uuidv4 } = require('uuid');

// Get all courses
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.findAll({
      include: [
        { model: Department, attributes: ['name'] },
        { 
          model: Program, 
          through: { attributes: [] }, // Exclude junction table attributes
          attributes: ['program_id', 'name']
        },
        {
          model: Course,
          as: 'prerequisites',
          through: { attributes: [] },
          attributes: ['course_id', 'course_name']
        }
      ]
    });
    return res.status(200).json(courses);
  } catch (error) {
    console.error('Error retrieving courses:', error);
    return res.status(500).json({ message: 'Failed to retrieve courses' });
  }
};

// Get course by ID
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        { model: Department, attributes: ['name'] },
        { 
          model: Program, 
          through: { attributes: [] },
          attributes: ['program_id', 'name']
        },
        {
          model: Course,
          as: 'prerequisites',
          through: { attributes: [] },
          attributes: ['course_id', 'course_name']
        }
      ]
    });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    return res.status(200).json(course);
  } catch (error) {
    console.error('Error retrieving course:', error);
    return res.status(500).json({ message: 'Failed to retrieve course' });
  }
};

// Create new course
exports.createCourse = async (req, res) => {
  try {
    const {
      department_id,
      course_name,
      duration_minutes,
      is_core,
      program_ids,
      prerequisite_ids
    } = req.body;
    
    // Generate a unique course ID
    const courseId = 'COURSE-' + uuidv4().substring(0, 8);
    
    // Create the course
    const newCourse = await Course.create({
      course_id: courseId,
      department_id,
      course_name,
      duration_minutes,
      is_core: is_core || false
    });
    
    // Associate course with programs if provided
    if (program_ids && Array.isArray(program_ids) && program_ids.length > 0) {
      const programAssociations = program_ids.map(program_id => ({
        course_program_id: 'CP-' + uuidv4().substring(0, 8),
        course_id: courseId,
        program_id,
        is_required: is_core || false
      }));
      
      await CourseProgram.bulkCreate(programAssociations);
    }
    
    // Add prerequisites if provided
    if (prerequisite_ids && Array.isArray(prerequisite_ids) && prerequisite_ids.length > 0) {
      const prerequisiteAssociations = prerequisite_ids.map(prerequisite_id => ({
        prerequisite_id: 'PREREQ-' + uuidv4().substring(0, 8),
        course_id: courseId,
        prerequisite_course_id: prerequisite_id
      }));
      
      await CoursePrerequisite.bulkCreate(prerequisiteAssociations);
    }
    
    // Return the created course with its relationships
    const createdCourse = await Course.findByPk(courseId, {
      include: [
        { model: Department, attributes: ['name'] },
        { 
          model: Program, 
          through: { attributes: [] },
          attributes: ['program_id', 'name']
        },
        {
          model: Course,
          as: 'prerequisites',
          through: { attributes: [] },
          attributes: ['course_id', 'course_name']
        }
      ]
    });
    
    return res.status(201).json(createdCourse);
  } catch (error) {
    console.error('Error creating course:', error);
    return res.status(500).json({ 
      message: 'Failed to create course',
      error: error.message 
    });
  }
};

// Update course
exports.updateCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const {
      department_id,
      course_name,
      duration_minutes,
      is_core,
      program_ids,
      prerequisite_ids
    } = req.body;
    
    // Check if course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Update course basic info
    await Course.update(
      { department_id, course_name, duration_minutes, is_core },
      { where: { course_id: courseId } }
    );
    
    // Update program associations if provided
    if (program_ids && Array.isArray(program_ids)) {
      // Remove existing associations
      await CourseProgram.destroy({ where: { course_id: courseId } });
      
      // Create new associations
      if (program_ids.length > 0) {
        const programAssociations = program_ids.map(program_id => ({
          course_program_id: 'CP-' + uuidv4().substring(0, 8),
          course_id: courseId,
          program_id,
          is_required: is_core || false
        }));
        
        await CourseProgram.bulkCreate(programAssociations);
      }
    }
    
    // Update prerequisite associations if provided
    if (prerequisite_ids && Array.isArray(prerequisite_ids)) {
      // Remove existing prerequisites
      await CoursePrerequisite.destroy({ where: { course_id: courseId } });
      
      // Create new prerequisites
      if (prerequisite_ids.length > 0) {
        const prerequisiteAssociations = prerequisite_ids.map(prerequisite_id => ({
          prerequisite_id: 'PREREQ-' + uuidv4().substring(0, 8),
          course_id: courseId,
          prerequisite_course_id: prerequisite_id
        }));
        
        await CoursePrerequisite.bulkCreate(prerequisiteAssociations);
      }
    }
    
    // Return the updated course with its relationships
    const updatedCourse = await Course.findByPk(courseId, {
      include: [
        { model: Department, attributes: ['name'] },
        { 
          model: Program, 
          through: { attributes: [] },
          attributes: ['program_id', 'name']
        },
        {
          model: Course,
          as: 'prerequisites',
          through: { attributes: [] },
          attributes: ['course_id', 'course_name']
        }
      ]
    });
    
    return res.status(200).json(updatedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    return res.status(500).json({ message: 'Failed to update course' });
  }
};

// Delete course
exports.deleteCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    
    // Check if course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Delete related CourseProgram records
    await CourseProgram.destroy({ where: { course_id: courseId } });
    
    // Delete related CoursePrerequisite records
    await CoursePrerequisite.destroy({ 
      where: { 
        [Op.or]: [
          { course_id: courseId },
          { prerequisite_course_id: courseId }
        ]
      } 
    });
    
    // Delete the course
    await Course.destroy({ where: { course_id: courseId } });
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting course:', error);
    return res.status(500).json({ message: 'Failed to delete course' });
  }
};

// Get courses by department
exports.getCoursesByDepartment = async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    
    const courses = await Course.findAll({
      where: { department_id: departmentId },
      include: [
        { model: Department, attributes: ['name'] },
        { 
          model: Program, 
          through: { attributes: [] },
          attributes: ['program_id', 'name']
        }
      ]
    });
    
    return res.status(200).json(courses);
  } catch (error) {
    console.error('Error retrieving department courses:', error);
    return res.status(500).json({ message: 'Failed to retrieve department courses' });
  }
};

// Get courses by program
exports.getCoursesByProgram = async (req, res) => {
  try {
    const programId = req.params.programId;
    
    const program = await Program.findByPk(programId, {
      include: [
        {
          model: Course,
          through: { attributes: ['is_required'] },
          include: [{ model: Department, attributes: ['name'] }]
        }
      ]
    });
    
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    
    return res.status(200).json(program.Courses);
  } catch (error) {
    console.error('Error retrieving program courses:', error);
    return res.status(500).json({ message: 'Failed to retrieve program courses' });
  }
};