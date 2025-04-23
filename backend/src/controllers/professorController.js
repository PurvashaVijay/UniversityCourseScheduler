// professorController.js
const { Op } = require('sequelize');
const { Professor, Department, Course, CourseSemester, ProfessorCourse } = require('../../app/models');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
// Add this function to check if a course is already assigned to another professor for a specific semester
const isCourseSemesterAlreadyAssigned = async (courseId, semester, excludeProfessorId = null) => {
  try {
    const query = {
      where: {
        course_id: courseId,
        semester: semester
      }
    };
    
    // If we're updating a professor, exclude their own assignments from the check
    if (excludeProfessorId) {
      query.where.professor_id = {
        [Op.ne]: excludeProfessorId
      };
    }
    
    const existingAssignments = await ProfessorCourse.findAll(query);
    return existingAssignments.length > 0;
  } catch (error) {
    console.error('Error checking course assignment:', error);
    return false;
  }
};

// Get all professors
exports.getAllProfessors = async (req, res) => {
  try {
    // Get all professors with their departments and courses
    const professors = await Professor.findAll({
      include: [
        { model: Department, attributes: ['name'] },
        { model: Course }  // Include courses
      ],
      attributes: { exclude: ['password_hash'] }
    });

    // Process the data to include semester information
    const results = await Promise.all(professors.map(async (professor) => {
      const professorData = professor.toJSON();
      
      // Get all professor_course entries for this professor
      const professorCourses = await ProfessorCourse.findAll({
        where: { professor_id: professor.professor_id }
      });
      
      // Extract course IDs from all course associations
      const courses = professorData.courses || [];
      const courseIds = courses.map(course => course.course_id);
      
      // Get ALL unique semesters from ALL professor_course entries
      const allSemesters = new Set();
      
      // Add semesters from courses in the join
      courses.forEach(course => {
        if (course.professor_course?.semester) {
          allSemesters.add(course.professor_course.semester);
        }
      });
      
      // Also add semesters from direct professor_course query
      professorCourses.forEach(pc => {
        if (pc.semester) {
          allSemesters.add(pc.semester);
        }
      });
      
      const semesters = Array.from(allSemesters);
      
      console.log(`Professor ${professor.professor_id} semesters:`, semesters);
      
      return {
        ...professorData,
        course_ids: courseIds,
        semesters: semesters
      };
    }));

    console.log('Enhanced professor list data:', results.map(p => ({
      id: p.professor_id, 
      semesters: p.semesters
    })));

    return res.status(200).json(results);
  } catch (error) {
    console.error('Error retrieving professors:', error);
    return res.status(500).json({ message: 'Failed to retrieve professors' });
  }
};

// Get professors by department
exports.getProfessorsByDepartment = async (req, res) => {
  try {
    const professors = await Professor.findAll({
      where: { department_id: req.params.departmentId },
      include: [
        { model: Department, attributes: ['name'] },
        { model: Course }
      ],
      attributes: { exclude: ['password_hash'] }
    });
    
    // Process the data to include semester information
    const results = await Promise.all(professors.map(async (professor) => {
      const professorData = professor.toJSON();
      
      // Extract course IDs and semesters
      const courses = professorData.courses || [];
      const courseIds = courses.map(course => course.course_id);
      
      // Get unique semesters from professor_course associations
      const semesters = [...new Set(courses
        .map(course => course.professor_course?.semester)
        .filter(Boolean))];
      
      return {
        ...professorData,
        course_ids: courseIds,
        semesters: semesters
      };
    }));
    
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error retrieving professors by department:', error);
    return res.status(500).json({ message: 'Failed to retrieve professors by department' });
  }
};

// Add this function to get professors by course ID
exports.getProfessorsByCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    console.log(`Getting professors for course: ${courseId}`);
    
    // Find all professor_course records for this course
    const professorCourses = await ProfessorCourse.findAll({
      where: { course_id: courseId }
    });
    
    // Extract professor IDs
    const professorIds = professorCourses.map(pc => pc.professor_id);
    
    // Find all professors with these IDs
    const professors = await Professor.findAll({
      where: { professor_id: professorIds },
      include: [
        { model: Department, attributes: ['name'] },
        { model: Course }
      ],
      attributes: { exclude: ['password_hash'] }
    });
    
    // Process the data to include semester information
    const results = await Promise.all(professors.map(async (professor) => {
      const professorData = professor.toJSON();
      
      // Extract course IDs and semesters
      const courses = professorData.courses || [];
      const courseIds = courses.map(course => course.course_id);
      
      // Get unique semesters from professor_course associations
      const semesters = [...new Set(courses
        .map(course => course.professor_course?.semester)
        .filter(Boolean))];
      
      return {
        ...professorData,
        course_ids: courseIds,
        semesters: semesters
      };
    }));
    
    console.log(`Found ${results.length} professors for course ${courseId}`);
    return res.status(200).json(results);
  } catch (error) {
    console.error(`Error retrieving professors for course ${req.params.courseId}:`, error);
    return res.status(500).json({ message: 'Failed to retrieve professors by course' });
  }
};

// Get professor by ID
exports.getProfessorById = async (req, res) => {
  try {
    // Find professor with department and courses included
    const professor = await Professor.findByPk(req.params.id, {
      include: [
        { model: Department, attributes: ['name'] },
        { model: Course }
      ],
      attributes: { exclude: ['password_hash'] }
    });
    
    if (!professor) {
      return res.status(404).json({ message: 'Professor not found' });
    }
    
    // Get the raw professor data
    const professorData = professor.toJSON();
    console.log('Professor data before transformation:', professorData);
    
    // Fix: Use lowercase "courses" since that's what your data shows
    const courses = professorData.courses ? professorData.courses.map(course => {
      // Add semester from professor_course
      return {
        ...course,
        // Make sure to handle potential undefined values
        semester: course.professor_course?.semester || null
      };
    }) : [];
    
    // IMPORTANT: Get additional professor_course data to ensure we have ALL semesters
    // This direct query will ensure we get all semesters for each course
    const professorCourses = await ProfessorCourse.findAll({
      where: { professor_id: req.params.id }
    });
    
    console.log(`Found ${professorCourses.length} direct professor_course records`);
    
    // Extract course IDs and build course_semesters object
    const courseIds = courses.map(course => course.course_id);
    const courseSemesters = {};
    
    // Process professor_course records to get ALL semesters
    professorCourses.forEach(pc => {
      if (pc.course_id && pc.semester) {
        if (!courseSemesters[pc.course_id]) {
          courseSemesters[pc.course_id] = [];
        }
        
        // Add semester if not already in the array
        if (!courseSemesters[pc.course_id].includes(pc.semester)) {
          courseSemesters[pc.course_id].push(pc.semester);
        }
      }
    });
    
    // Get unique semesters (remove duplicates and null values)
    const semesters = [];
Object.values(courseSemesters).forEach(semesterArray => {
  semesterArray.forEach(semester => {
    if (semester && !semesters.includes(semester)) {
      semesters.push(semester);
    }
  });
});

// Also check for semesters in professor_course records directly
const professorCourseRecords = await ProfessorCourse.findAll({
  where: { professor_id: req.params.id }
});

professorCourseRecords.forEach(record => {
  if (record.semester && !semesters.includes(record.semester)) {
    semesters.push(record.semester);
  }
});
    
    // Create the final response object
    const response = {
      ...professorData,
      courses: courses,
      course_ids: courseIds,
      semesters: semesters,
      course_semesters: courseSemesters
    };
    
    // Add more detailed logging
    console.log('Final professor data sent to frontend:', { 
      professorId: response.professor_id, 
      courseCount: response.courses.length,
      course_ids: response.course_ids,
      semesters: response.semesters,
      course_semesters: response.course_semesters
    });
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error retrieving professor:', error);
    return res.status(500).json({ message: 'Failed to retrieve professor' });
  }
};

// Create new professor
exports.createProfessor = async (req, res) => {
  try {
    console.log('Create professor request body:', req.body);
    
    // Extract fields from request
    const { 
      professor_id, 
      department_id, 
      first_name, 
      last_name, 
      email, 
      course_ids, 
      course_semesters // New field for course-specific semesters
    } = req.body;
    
    // Generate a unique ID for the professor if not provided
    const professorId = professor_id || 'PROF-' + uuidv4().substring(0, 8);
    
    // Generate hash for password (using a default password)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('defaultPassword123', salt);
    
    // Create new professor
    const newProfessor = await Professor.create({
      professor_id: professorId,
      department_id,
      first_name,
      last_name,
      email,
      password_hash: hashedPassword
    });
    
    // Handle course assignments with specific semesters
    if (course_ids && course_ids.length > 0 && course_semesters) {
      console.log(`Assigning courses to professor ${professorId} with specific semesters:`, course_semesters);
      
      for (let i = 0; i < course_ids.length; i++) {
        const courseId = course_ids[i];
        const semestersForCourse = course_semesters[courseId] || [];
        
        for (const semester of semestersForCourse) {
          // Check if this course-semester is already assigned to another professor
          const isAlreadyAssigned = await isCourseSemesterAlreadyAssigned(courseId, semester);
          
          if (isAlreadyAssigned) {
            console.log(`Course ${courseId} for semester ${semester} is already assigned to another professor. Skipping.`);
            continue;
          }
          
          await ProfessorCourse.create({
            professor_course_id: `PC-${uuidv4().substring(0, 8)}`,
            professor_id: professorId,
            course_id: courseId,
            semester: semester,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }
    }
    
    // Remove password_hash from response
    const response = newProfessor.toJSON();
    delete response.password_hash;
    
    // Add the course_ids and course_semesters to the response
    response.course_ids = course_ids || [];
    response.course_semesters = course_semesters || {};
    
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
    const professorId = req.params.id;
    const { department_id, first_name, last_name, email, course_ids, course_semesters } = req.body;
    
    console.log('Update professor request body:', req.body);
    
    // Find existing professor
    const professor = await Professor.findByPk(professorId);
    
    if (!professor) {
      return res.status(404).json({ message: 'Professor not found' });
    }
    
    // Update professor details
    await professor.update({
      department_id: department_id || professor.department_id,
      first_name: first_name || professor.first_name,
      last_name: last_name || professor.last_name,
      email: email || professor.email,
      updated_at: new Date()
    });
    
    // Handle course assignments if provided
    if (course_ids && Array.isArray(course_ids) && course_semesters) {
      console.log('Updating course assignments for professor:', professorId);
      console.log('Course IDs:', course_ids);
      console.log('Course semesters data:', JSON.stringify(course_semesters));
      
      try {
        // First delete all existing course assignments
        console.log('Deleting existing course assignments for professor:', professorId);
        const deleted = await ProfessorCourse.destroy({
          where: { professor_id: professorId }
        });
        console.log(`Deleted ${deleted} existing course assignments`);
      } catch (deleteError) {
        console.error('Error deleting professor course assignments:', deleteError);
        // Continue processing - don't throw the error
      }
      
      // Create new course assignments with specific semesters
      let assignmentCount = 0;
      for (let i = 0; i < course_ids.length; i++) {
        const courseId = course_ids[i];
        const semestersForCourse = course_semesters[courseId] || [];
        
        console.log(`Processing course ${courseId} with semesters:`, semestersForCourse);
        
        // Ensure semestersForCourse is treated as an array
        const semesterArray = Array.isArray(semestersForCourse) ? semestersForCourse : [semestersForCourse];
        
        for (const semester of semesterArray) {
          console.log(`Creating assignment for professor ${professorId}, course ${courseId}, semester ${semester}`);
          
          try {
            await ProfessorCourse.create({
              professor_course_id: `PC-${Math.random().toString(36).substring(2, 10)}`,
              professor_id: professorId,
              course_id: courseId,
              semester: semester,
              created_at: new Date(),
              updated_at: new Date()
            });
            assignmentCount++;
          } catch (createError) {
            console.error(`Error creating assignment for course ${courseId}, semester ${semester}:`, createError);
          }
        }
      }
      
      console.log(`Created ${assignmentCount} new course assignments`);
    }
    
    // Return updated professor
    const updatedProfessor = await Professor.findByPk(professorId, {
      attributes: { exclude: ['password_hash'] }
    });
    
    // Add course_ids and course_semesters to response
    const response = updatedProfessor.toJSON();
    response.course_ids = course_ids || [];
    response.course_semesters = course_semesters || {};
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error updating professor:', error);
    return res.status(500).json({ message: 'Failed to update professor' });
  }
};

// Delete professor - UPDATED to handle foreign key constraints
exports.deleteProfessor = async (req, res) => {
  try {
    const professorId = req.params.id;
    console.log(`Deleting professor with ID: ${professorId}`);
    
    // First, delete all related professor_course records
    await ProfessorCourse.destroy({
      where: { professor_id: professorId }
    });
    
    // Then delete the professor
    const deleted = await Professor.destroy({
      where: { professor_id: professorId }
    });
    
    if (deleted === 0) {
      return res.status(404).json({ message: 'Professor not found' });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Professor deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting professor:', error);
    return res.status(500).json({ message: 'Failed to delete professor' });
  }
};

// Delete multiple professors - UPDATED to handle foreign key constraints
exports.deleteProfessors = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No professor IDs provided' });
    }
    
    console.log(`Batch deleting professors: ${ids.join(', ')}`);
    
    // First delete all related professor_course records for these professors
    await ProfessorCourse.destroy({
      where: { professor_id: ids }
    });
    
    // Then delete the professors
    const deleted = await Professor.destroy({
      where: { professor_id: ids }
    });
    
    return res.status(200).json({
      success: true,
      message: `${deleted} professors deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting professors:', error);
    return res.status(500).json({ message: 'Failed to delete professors' });
  }
};