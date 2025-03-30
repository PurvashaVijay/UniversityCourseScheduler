// courseController.js - Updated with the new getCourseWithSemesters method

const { Op } = require('sequelize');

const { Course, Department, Program, CourseProgram, CoursePrerequisite, CourseSemester } = require('../../app/models');
const { sequelize } = require('../../src/config/database');

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

// Get course by ID - Enhanced to include more information
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Getting course details for ID: ${id}`);
    
    const course = await Course.findByPk(id, {
      include: [
        {
          model: Department,
          attributes: ['department_id', 'name']
        },
        {
          model: Program,
          as: 'programs',
          through: {
            attributes: ['is_required']
          },
          attributes: ['program_id', 'name']
        },
        {
          model: Course,
          as: 'prerequisites',
          through: {
            attributes: []
          },
          attributes: ['course_id', 'course_name']
        }
      ]
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get the course programs for this course
    const coursePrograms = await CourseProgram.findAll({
      where: { course_id: id }
    });

    // Extract program_id from the first course program
    const program_id = coursePrograms.length > 0 ? coursePrograms[0].program_id : null;

    // Get actual semesters from database
    const courseSemesters = await CourseSemester.findAll({
      where: { course_id: id }
    });

    // Format the response with all the data needed by the frontend
    const result = {
      course_id: course.course_id,
      course_name: course.course_name,
      department_id: course.department_id,
      duration_minutes: course.duration_minutes,
      is_core: course.is_core,
      program_id: program_id,
      programs: course.programs,
      prerequisites: course.prerequisites,
      department: course.Department,
      // Add actual semesters from the database
      semesters: courseSemesters.map(cs => cs.semester)
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error getting course details:', error);
    return res.status(500).json({ message: 'Failed to get course details' });
  }
};

// NEW METHOD: Get course with semesters
exports.getCourseWithSemesters = async (req, res) => {
  try {
    const courseId = req.params.id;
    
    // Find the course
    const course = await Course.findByPk(courseId, {
      include: [
        { model: Department },
        { 
          model: Program, 
          through: CourseProgram 
        },
        {
          model: Course,
          as: 'prerequisites',
          through: CoursePrerequisite
        }
      ]
    });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Find associated semesters
    const courseSemesters = await CourseSemester.findAll({
      where: { course_id: courseId }
    });
    
    // Extract semester values
    const semesters = courseSemesters.map(s => s.semester);
    
    // Add semesters to course data
    const courseData = course.toJSON();
    courseData.semesters = semesters;
    
    return res.status(200).json(courseData);
  } catch (error) {
    console.error('Error retrieving course with semesters:', error);
    return res.status(500).json({ message: 'Failed to retrieve course details' });
  }
};

// Create new course - Updated to respect user-provided ID
exports.createCourse = async (req, res) => {
  try {
    console.log('Create course request body:', req.body);
    
    let { 
      course_id, 
      department_id, 
      course_name, 
      name, // Accept both course_name and name
      duration_minutes, 
      is_core, 
      program_id,
      semesters
    } = req.body;
    
    // Use name as course_name if course_name is not provided
    if (!course_name && name) {
      course_name = name;
    }
    
    // Validate required fields
    if (!course_name) {
      return res.status(400).json({ message: 'Course name is required' });
    }
    
    if (!department_id) {
      return res.status(400).json({ message: 'Department ID is required' });
    }
    
    // Use user-provided course_id if present, otherwise generate a new one
    if (!course_id) {
      course_id = `COURSE-${uuidv4().substring(0, 8)}`;
    }
    
    // Check if the course ID already exists
    const existingCourse = await Course.findByPk(course_id);
    if (existingCourse) {
      return res.status(409).json({ message: 'Course with this ID already exists' });
    }
    
    // Create the course
    const newCourse = await Course.create({
      course_id,
      department_id,
      course_name,
      duration_minutes: duration_minutes || 55,
      is_core: is_core || false
    });
    
    // Associate with program if provided
    if (program_id) {
      await CourseProgram.create({
        course_program_id: `CP-${uuidv4().substring(0, 8)}`,
        course_id: newCourse.course_id,
        program_id,
        is_required: is_core || false
      });
    }
    
    // Handle semesters if provided
    if (semesters && Array.isArray(semesters)) {
      console.log('Creating semester associations:', semesters);
      for (const semester of semesters) {
        await CourseSemester.create({
          course_id: newCourse.course_id,
          semester
        });
      }
    }
    
    // Get the created course with associations
    const course = await Course.findByPk(newCourse.course_id, {
      include: [
        {
          model: Department
        },
        {
          model: Program,
          as: 'programs',
          through: {
            attributes: []
          }
        }
      ]
    });
    
    return res.status(201).json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    return res.status(500).json({
      message: 'Failed to create course',
      error: error.message
    });
  }
};

// Update course - Enhanced for better handling
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Updating course with ID: ${id}`);
    console.log('Update data:', req.body);
    
    // Find the course
    const course = await Course.findByPk(id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Update basic course fields
    const { 
      department_id, 
      course_name, 
      name, // Accept both course_name and name
      duration_minutes, 
      is_core, 
      program_id, 
      semesters 
    } = req.body;
    
    // Use name as course_name if course_name is not provided
    const finalCourseName = course_name || name;
    
    // Only update fields that are provided
    if (finalCourseName) course.course_name = finalCourseName;
    if (department_id) course.department_id = department_id;
    if (duration_minutes !== undefined) course.duration_minutes = duration_minutes;
    if (is_core !== undefined) course.is_core = is_core;
    
    // Save the updated course
    await course.save();
    
    // Update program association if program_id is provided
    if (program_id) {
      // First, check if the course-program association already exists
      const existingAssociation = await CourseProgram.findOne({
        where: { 
          course_id: id,
          program_id: program_id
        }
      });
      
      if (!existingAssociation) {
        // Create a new association
        await CourseProgram.create({
          course_program_id: `CP-${uuidv4().substring(0, 8)}`,
          course_id: id,
          program_id: program_id,
          is_required: is_core || false
        });
      }
    }
    
    // Update semester associations if provided
    if (semesters && Array.isArray(semesters)) {
      console.log('Updating semesters for course:', semesters);
      
      // First, remove all existing semester associations
      await CourseSemester.destroy({ where: { course_id: id } });
      
      // Then create new ones
      for (const semester of semesters) {
        await CourseSemester.create({
          course_id: id,
          semester
        });
      }
    }
    
    // Get the updated course with associations for the response
    const updatedCourse = await Course.findByPk(id, {
      include: [
        { model: Department },
        { 
          model: Program, 
          as: 'programs',
          through: { attributes: [] }
        }
      ]
    });
    
    return res.status(200).json({
      message: 'Course updated successfully',
      course: updatedCourse
    });
  } catch (error) {
    console.error('Error updating course:', error);
    return res.status(500).json({
      message: 'Failed to update course',
      error: error.message
    });
  }
};

// Delete course
exports.deleteCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    console.log(`Deleting course with ID: ${courseId}`);
    
    // Check if course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Delete related CourseProgram records
    await CourseProgram.destroy({ where: { course_id: courseId } });
    
    // Delete related CourseSemester records
    await CourseSemester.destroy({ where: { course_id: courseId } });
    
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
    console.log(`Successfully deleted course: ${courseId}`);
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting course:', error);
    return res.status(500).json({ message: 'Failed to delete course' });
  }
};

// Delete multiple courses
exports.deleteCourses = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No course IDs provided' });
    }
    
    console.log('Deleting multiple courses:', ids);
    
    // Delete each course
    for (const id of ids) {
      const course = await Course.findByPk(id);
      if (course) {
        // Delete associated records in junction tables first
        await CourseProgram.destroy({ where: { course_id: id } });
        await CourseSemester.destroy({ where: { course_id: id } });
        await CoursePrerequisite.destroy({ 
          where: { 
            [Op.or]: [
              { course_id: id },
              { prerequisite_course_id: id }
            ]
          }
        });
        
        // Then delete the course
        await course.destroy();
      }
    }
    
    return res.status(200).json({ 
      message: `Successfully deleted ${ids.length} course(s)` 
    });
  } catch (error) {
    console.error('Error deleting courses:', error);
    return res.status(500).json({ 
      message: 'Failed to delete courses',
      error: error.message
    });
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

// Modified getCoursesByProgram function to include semesters
exports.getCoursesByProgram = async (req, res) => {
  try {
    const programId = req.params.programId;
    
    // Find all CourseProgram records for this program
    const coursePrograms = await CourseProgram.findAll({
      where: { program_id: programId }
    });
    
    // Extract course IDs
    const courseIds = coursePrograms.map(cp => cp.course_id);
    console.log(`Found ${courseIds.length} course IDs:`, courseIds.join(', '));
    
    if (courseIds.length === 0) {
      return res.status(200).json([]);
    }
    
    // Get course details
    const courses = await Course.findAll({
      where: {
        course_id: courseIds
      },
      include: [{ model: Department }]
    });
    console.log(`Retrieved ${courses.length} course details`);
    
    // Get semester data for each course
    const results = await Promise.all(courses.map(async (course) => {
      const courseJson = course.toJSON();
      
      // Query for semesters
      const semesters = await CourseSemester.findAll({
        where: { course_id: course.course_id }
      });
      
      // Add semesters to course data
      courseJson.semesters = semesters.map(sem => sem.semester);
      
      return courseJson;
    }));
    
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error retrieving program courses:', error);
    return res.status(500).json({ message: 'Failed to retrieve program courses' });
  }
};

// Debug endpoint for program courses
exports.debugCourses = async (req, res) => {
  try {
    const programId = req.params.programId;
    
    // Find all CourseProgram records
    const coursePrograms = await CourseProgram.findAll({
      where: { program_id: programId }
    });
    
    // Get all course IDs
    const courseIds = coursePrograms.map(cp => cp.course_id);
    
    // Get all courses by these IDs
    const courses = await Course.findAll({
      where: {
        course_id: courseIds
      }
    });
    
    // Return detailed debugging info
    return res.status(200).json({
      program_id: programId,
      course_program_count: coursePrograms.length,
      course_program_details: coursePrograms,
      course_ids: courseIds,
      courses_found: courses.length,
      courses: courses
    });
  } catch (error) {
    console.error('Debug error:', error);
    return res.status(500).json({
      message: 'Debug error',
      error: error.message,
      stack: error.stack
    });
  }
};