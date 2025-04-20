// courseController.js

const { Op } = require('sequelize');
const { Course, Department, Program, CourseProgram, CoursePrerequisite, CourseSemester, ProfessorCourse, Professor } = require('../../app/models');
const { sequelize } = require('../../src/config/database');
const { v4: uuidv4 } = require('uuid');

// Get all courses with semesters and num_classes
exports.getAllCourses = async (req, res) => {
  try {
    // Get all courses with their departments and programs
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
    
    // Process courses to include all needed data
    const processedCourses = await Promise.all(courses.map(async (course) => {
      const courseData = course.toJSON();
      // Extract the primary program_id if available
      if (courseData.Programs && courseData.Programs.length > 0) {
        courseData.program_id = courseData.Programs[0].program_id;
      }
      
      // Get semesters for this course
      const courseSemesters = await CourseSemester.findAll({
        where: { course_id: course.course_id }
      });
      
      // Add semesters to course data
      courseData.semesters = courseSemesters.map(sem => sem.semester);
      
      // Get the CourseProgram records for this course to get numClasses
      const coursePrograms = await CourseProgram.findAll({
        where: { course_id: course.course_id }
      });
      
      // Set the num_classes from the database, fallback to 1 if not found
      courseData.num_classes = coursePrograms.length > 0 ? 
        (coursePrograms[0].num_classes || 1) : 1;
      
      return courseData;
    }));
    
    return res.status(200).json(processedCourses);
  } catch (error) {
    console.error('Error retrieving courses:', error);
    return res.status(500).json({ message: 'Failed to retrieve courses' });
  }
};

// Get course by ID with semesters and num_classes
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Getting course details for ID: ${id}`);
    
    // First, get the course with department and prerequisites
    const course = await Course.findByPk(id, {
      include: [
        {
          model: Department,
          attributes: ['department_id', 'name']
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

    // Get CourseProgram records for this course to get num_classes
    const coursePrograms = await CourseProgram.findAll({
      where: { course_id: id }
    });

    // Get program details for these programs
    const programIds = coursePrograms.map(cp => cp.program_id);
    const programs = await Program.findAll({
      where: {
        program_id: programIds
      },
      include: [
        {
          model: Department,
          attributes: ['name']
        }
      ]
    });

    // Create a map for quick program lookup
    const programMap = {};
    programs.forEach(program => {
      programMap[program.program_id] = program;
    });

    // Get num_classes from the first CourseProgram record
    const numClasses = coursePrograms.length > 0 ? 
      (coursePrograms[0].num_classes || 1) : 1;

    // Merge program data with course program data
    const programsWithDetails = coursePrograms.map(cp => {
      const program = programMap[cp.program_id] || {};
      return {
        program_id: cp.program_id,
        name: program.name || '',
        department_id: program.department_id || '',
        is_core: Boolean(cp.is_required),
        num_classes: cp.num_classes || 1
      };
    });

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
      program_id: coursePrograms.length > 0 ? coursePrograms[0].program_id : null,
      num_classes: numClasses, // Include numClasses in the response
      programs: programsWithDetails,
      prerequisites: course.prerequisites,
      department: course.Department,
      // Add actual semesters from the database
      semesters: courseSemesters.map(cs => cs.semester)
    };

    console.log('Course response:', result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error getting course details:', error);
    return res.status(500).json({ message: 'Failed to get course details' });
  }
};

// Get course with semesters
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

// Get course-professor assignments
exports.getCourseProfessorAssignments = async (req, res) => {
  try {
    const courseId = req.params.id;
    
    // Get the course with its semesters
    const course = await Course.findByPk(courseId);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Get course semesters
    const courseSemesters = await CourseSemester.findAll({
      where: { course_id: courseId }
    });
    
    // Get professor assignments for this course
    const professorAssignments = await ProfessorCourse.findAll({
      where: { course_id: courseId },
      include: [
        { model: Professor, attributes: ['professor_id', 'first_name', 'last_name'] }
      ]
    });
    
    // Format the response
    const response = {
      course_id: courseId,
      available_semesters: courseSemesters.map(sem => sem.semester),
      assigned_professors: professorAssignments.map(assignment => ({
        professor_id: assignment.professor_id,
        professor_name: `${assignment.Professor.first_name} ${assignment.Professor.last_name}`,
        semester: assignment.semester
      }))
    };
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error getting course-professor assignments:', error);
    return res.status(500).json({ message: 'Failed to get course-professor assignments' });
  }
};
// Get courses by program - enhanced for num_classes and semesters
exports.getCoursesByProgram = async (req, res) => {
  try {
    const programId = req.params.programId;
    
    // Find all CourseProgram records for this program
    const coursePrograms = await CourseProgram.findAll({
      where: { program_id: programId }
    });
    
    // Extract course IDs and create Maps to store is_required and num_classes values
    const courseIds = [];
    const courseRequiredMap = new Map();
    const courseNumClassesMap = new Map();
    
    coursePrograms.forEach(cp => {
      courseIds.push(cp.course_id);
      courseRequiredMap.set(cp.course_id, cp.is_required === true);
      courseNumClassesMap.set(cp.course_id, cp.num_classes || 1);
    });
    
    console.log(`Found ${courseIds.length} course IDs for program ${programId}`);
    
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
    
    // Get semester data for each course and add other data from maps
    const results = await Promise.all(courses.map(async (course) => {
      const courseJson = course.toJSON();
      
      // Query for semesters
      const semesters = await CourseSemester.findAll({
        where: { course_id: course.course_id }
      });
      
      // Add semesters to course data
      courseJson.semesters = semesters.map(sem => sem.semester);
      
      // Add is_required (is_core) status specifically for this program
      courseJson.is_core = courseRequiredMap.get(course.course_id) === true;
      
      // Add num_classes from the map
      courseJson.num_classes = courseNumClassesMap.get(course.course_id) || 1;
      
      return courseJson;
    }));
    
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error retrieving program courses:', error);
    return res.status(500).json({ message: 'Failed to retrieve program courses' });
  }
};

// Create new course - updated to respect user-provided ID
exports.createCourse = async (req, res) => {
  // Use a transaction to ensure data consistency
  const t = await sequelize.transaction();
  
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
      program_associations, // Array of program associations
      semesters,
      numClasses  // Get the global numClasses value
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
    
    // Generate ID if not provided
    if (!course_id) {
      course_id = `COURSE-${uuidv4().substring(0, 8)}`;
    }
    
    // Check if the course ID already exists
    const existingCourse = await Course.findByPk(course_id, { transaction: t });
    if (existingCourse) {
      await t.rollback();
      return res.status(409).json({ message: 'Course with this ID already exists' });
    }
    
    // Create the course
    const newCourse = await Course.create({
      course_id,
      department_id,
      course_name,
      duration_minutes: duration_minutes || 55,
      is_core: Boolean(is_core) // Proper boolean conversion
    }, { transaction: t });
    console.log('Course created successfully:', newCourse.course_id);
    
    // Handle program associations
    if (program_associations && Array.isArray(program_associations) && program_associations.length > 0) {
      console.log('Creating program associations:', program_associations);
      
      try {
        // Create each program association
        for (const association of program_associations) {
          console.log('Creating CourseProgram with is_required:', association.is_core === true);
          await CourseProgram.create({
            course_program_id: `CP-${uuidv4().substring(0, 8)}`,
            course_id: newCourse.course_id,
            program_id: association.program_id,
            is_required: association.is_core === true,
            num_classes: numClasses || association.num_classes || 1  // Use global numClasses, then fall back
          }, { transaction: t });
        }
      } catch (associationError) {
        console.error('Error creating program associations:', associationError);
        throw associationError; // Re-throw to trigger transaction rollback
      }
    } else if (program_id) {
      // Backward compatibility with old format
      try {
        await CourseProgram.create({
          course_program_id: `CP-${uuidv4().substring(0, 8)}`,
          course_id: newCourse.course_id,
          program_id,
          is_required: is_core === true,
          num_classes: numClasses || 1 // Use global numClasses, default to 1
        }, { transaction: t });
      } catch (associationError) {
        console.error('Error creating program association:', associationError);
        throw associationError; // Re-throw to trigger transaction rollback
      }
    }

    // Handle semesters if provided
    if (semesters && Array.isArray(semesters)) {
      console.log('Creating semester associations:', semesters);
      try {
        for (const semester of semesters) {
          await CourseSemester.create({
            course_id: newCourse.course_id,
            semester
          }, { transaction: t });
        }
      } catch (semesterError) {
        console.error('Error creating semester associations:', semesterError);
        throw semesterError; // Re-throw to trigger transaction rollback
      }
    }
    
    // Commit the transaction
    await t.commit();
    
    // Get the created course with associations for the response
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
    // Rollback the transaction if not already committed
    if (t && !t.finished) {
      await t.rollback();
    }
    
    console.error('Error creating course:', error);
    return res.status(500).json({
      message: 'Failed to create course',
      error: error.message
    });
  }
};

// Update course - Enhanced for better handling
exports.updateCourse = async (req, res) => {
  // Use a transaction to ensure data consistency
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    console.log(`Updating course with ID: ${id}`);
    console.log('Update data:', JSON.stringify(req.body, null, 2));
    
    // Find the course
    const course = await Course.findByPk(id, { transaction: t });
    
    if (!course) {
      await t.rollback();
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Add additional debugging for program associations
    console.log('Received program associations:', req.body.program_associations);
    
    // Update basic course fields
    const { 
      department_id, 
      course_name, 
      name, 
      duration_minutes, 
      is_core, 
      program_associations,
      numClasses, // Get the global numClasses value 
      semesters 
    } = req.body;
    
    // Use name as course_name if course_name is not provided
    const finalCourseName = course_name || name;
    
    // Only update fields that are provided
    if (finalCourseName) course.course_name = finalCourseName;
    if (department_id) course.department_id = department_id;
    if (duration_minutes !== undefined) course.duration_minutes = duration_minutes;
    if (is_core !== undefined) course.is_core = Boolean(is_core);
    
    // Save the updated course
    await course.save({ transaction: t });
    
    // Handle program associations - this is the critical part
    if (program_associations && Array.isArray(program_associations)) {
      console.log('Processing program associations:', program_associations);
      
      try {
        // First, remove all existing program associations for this course
        const deletedCount = await CourseProgram.destroy({ 
          where: { course_id: id },
          transaction: t 
        });
        console.log(`Deleted ${deletedCount} existing program associations`);
        
        // Check if any associations remain after deletion
        const remainingCount = await CourseProgram.count({ 
          where: { course_id: id },
          transaction: t
        });
        console.log(`After deletion, remaining associations: ${remainingCount}`);
        
        // Then create new ones for ALL program associations received
        for (const association of program_associations) {
          console.log('Creating program association:', association);
          
          // Generate a unique ID for the association
          const courseProgId = `CP-${uuidv4().substring(0, 8)}`;
          
          // Explicitly create a new association record for each program
          const newAssociation = await CourseProgram.create({
            course_program_id: courseProgId,
            course_id: id,
            program_id: association.program_id,
            is_required: association.is_core === true, // Ensure boolean conversion
            num_classes: numClasses || association.num_classes || 1 // Use global numClasses value
          }, { transaction: t });
          
          console.log(`Created association with ID: ${courseProgId}`);
        }
        
        // Check created associations count
        const newCount = await CourseProgram.count({ 
          where: { course_id: id },
          transaction: t
        });
        console.log(`After creation, new association count: ${newCount}`);
      } catch (associationError) {
        console.error('Error updating program associations:', associationError);
        throw associationError; // Re-throw to trigger rollback
      }
    }

    // Update semester associations if provided
    if (semesters && Array.isArray(semesters)) {
      try {
        // First, remove all existing semester associations
        await CourseSemester.destroy({ 
          where: { course_id: id },
          transaction: t 
        });
        
        // Then create new ones
        for (const semester of semesters) {
          await CourseSemester.create({
            course_id: id,
            semester
          }, { transaction: t });
        }
      } catch (semesterError) {
        console.error('Error updating semester associations:', semesterError);
        throw semesterError; // Re-throw to trigger rollback
      }
    }
    
    // Commit the transaction
    await t.commit();
    
    // Fetch the updated course with associations to return
    const updatedCourse = await Course.findByPk(id, {
      include: [
        { model: Department },
        { 
          model: Program, 
          through: { attributes: [] }
        }
      ]
    });
    
    return res.status(200).json({
      message: 'Course updated successfully',
      course: updatedCourse
    });
  } catch (error) {
    // Rollback if transaction is still active
    if (t && !t.finished) {
      await t.rollback();
    }
    
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