// scheduleController.js
const { Schedule, Semester, ScheduledCourse, Course, Professor, TimeSlot, Conflict, ConflictCourse, CourseProgram } = require('../../app/models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

// Get all schedules
exports.getAllSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.findAll({
      include: [{ model: Semester, attributes: ['name', 'start_date', 'end_date'] }],
      order: [['created_at', 'DESC']]
    });
    return res.status(200).json(schedules);
  } catch (error) {
    console.error('Error retrieving schedules:', error);
    return res.status(500).json({ message: 'Failed to retrieve schedules' });
  }
};

// Get schedule by ID
// Get schedule by ID
exports.getScheduleById = async (req, res) => {
  try {
    console.log(`Loading schedule by ID: ${req.params.id}`);
   
    // Get the program_id from query parameters
    const programId = req.query.program_id;
    console.log(`Program filter for schedule details: ${programId || 'none'}`);
   
    // First, get the schedule without eager loading to avoid potential issues
    const schedule = await Schedule.findByPk(req.params.id);
   
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
   
    // Prepare the query for scheduled courses
    let scheduledCoursesQuery = {
      where: { schedule_id: req.params.id },
      include: [
        { model: Course, attributes: ['course_id', 'course_name', 'is_core', 'department_id', 'duration_minutes'] },
        { model: Professor, attributes: ['professor_id', 'first_name', 'last_name'] },
        { model: TimeSlot, attributes: ['timeslot_id', 'name', 'start_time', 'end_time', 'day_of_week'] }
      ]
    };
   
    // If program filter is applied, filter the courses
    if (programId) {
      // Get all course IDs that belong to this program
      const { CourseProgram } = require('../../app/models');
      const courseProgramEntries = await CourseProgram.findAll({
        where: { program_id: programId },
        attributes: ['course_id']
      });
     
      const courseIds = courseProgramEntries.map(cp => cp.course_id);
      console.log(`Found ${courseIds.length} courses in program ${programId}: ${courseIds.join(', ')}`);
     
      // Only include scheduled courses for these course IDs
      if (courseIds.length > 0) {
        scheduledCoursesQuery.where = {
          ...scheduledCoursesQuery.where,
          course_id: { [Op.in]: courseIds }
        };
        console.log("Final query with program filter:", JSON.stringify(scheduledCoursesQuery.where));
      } else {
        console.log(`No courses found for program ${programId}, returning empty course list`);
        // Return schedule with empty courses if no courses in this program
        const semester = await Semester.findByPk(schedule.semester_id);
        return res.status(200).json({
          ...schedule.toJSON(),
          semester: semester ? semester.toJSON() : null,
          courses: []
        });
      }
    }
   
    // Then, manually fetch the scheduled courses with the constructed query
    const scheduledCourses = await ScheduledCourse.findAll(scheduledCoursesQuery);
   
    console.log(`Found ${scheduledCourses.length} scheduled courses after filtering by program`);
    console.log(`Filtered course count: ${scheduledCourses.length}`);
   
    // Transform them into the format the frontend expects
    const formattedCourses = scheduledCourses.map(sc => {
      const scJson = sc.toJSON();
     
      // Extract the time slot number from the timeslot_id (e.g., "TS1-MON" -> 1)
      let slotNumber = 1;
      if (scJson.timeslot_id) {
        const timeSlotMatch = scJson.timeslot_id.match(/TS(\d+)/);
        if (timeSlotMatch) {
          slotNumber = parseInt(timeSlotMatch[1]);
        }
      }
      // Normalize the day name
      let dayOfWeek = scJson.day_of_week || '';
      // Convert to proper case if needed
      const dayMap = {
        'MON': 'Monday',
        'TUE': 'Tuesday',
        'WED': 'Wednesday',
        'THU': 'Thursday',
        'FRI': 'Friday'
      };
     
      if (dayMap[dayOfWeek.toUpperCase()]) {
        dayOfWeek = dayMap[dayOfWeek.toUpperCase()];
      }
     
      // Create the formatted course object
      return {
        scheduled_course_id: scJson.scheduled_course_id,
        schedule_id: scJson.schedule_id,
        course_id: scJson.Course?.course_id,
        course_name: scJson.Course?.course_name,
        professor_id: scJson.Professor?.professor_id,
        professor_name: `${scJson.Professor?.first_name || ''} ${scJson.Professor?.last_name || ''}`.trim(),
        timeslot_id: scJson.timeslot_id,
        day_of_week: dayOfWeek,
        time_slot_id: scJson.timeslot_id,
        time_slot_number: slotNumber,
        is_core: scJson.Course?.is_core || false,
        is_override: scJson.is_override || false,
        class_instance: scJson.class_instance || 1,
        num_classes: scJson.num_classes || 1,
        department_id: scJson.Course?.department_id,
        duration_minutes: scJson.Course?.duration_minutes
      };
    });

    // Create a basic response with the schedule details
    const scheduleData = schedule.toJSON();
   
    // Also fetch semester details
    const semester = await Semester.findByPk(scheduleData.semester_id);
    // Add the formatted courses to the schedule
    const responseData = {
      ...scheduleData,
      semester: semester ? semester.toJSON() : null,
      courses: formattedCourses
    };

    console.log(`Returning schedule with ${formattedCourses.length} courses after program filtering`);
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Error retrieving schedule:', error);
    return res.status(500).json({ message: 'Failed to retrieve schedule', error: error.message });
  }
};

// Get scheduled courses for a schedule with program filtering
// Get scheduled courses for a schedule with program filtering
exports.getScheduledCourses = async (req, res) => {
  try {
    const scheduleId = req.params.scheduleId;
    const programId = req.query.program_id;
    
    console.log(`Loading scheduled courses for schedule: ${scheduleId}`);
    console.log(`Program filter: ${programId || 'none'}`);
    
    // Check if schedule exists
    const schedule = await Schedule.findByPk(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    // Base query for scheduled courses
    let queryOptions = {
      where: { schedule_id: scheduleId },
      include: [
        {
          model: Course,
          attributes: ['course_id', 'course_name', 'is_core', 'department_id', 'duration_minutes']
        },
        {
          model: Professor,
          attributes: ['professor_id', 'first_name', 'last_name']
        },
        {
          model: TimeSlot,
          attributes: ['timeslot_id', 'name', 'start_time', 'end_time', 'day_of_week', 'duration_minutes']
        }
      ]
    };
    
    // Apply program filter if provided
    if (programId) {
      console.log(`Filtering courses by program: ${programId}`);
      
      // Get all course IDs that belong to this program
      const courseProgramEntries = await CourseProgram.findAll({
        where: { program_id: programId },
        attributes: ['course_id']
      });
      
      const courseIds = courseProgramEntries.map(cp => cp.course_id);
      console.log(`Found ${courseIds.length} courses in program ${programId}: ${courseIds.join(', ')}`);
      
      // Only include scheduled courses for these course IDs
      if (courseIds.length > 0) {
        queryOptions.where = {
          ...queryOptions.where,
          course_id: { [Op.in]: courseIds }
        };
        console.log("Final query with program filter:", JSON.stringify(queryOptions.where));
      } else {
        console.log(`No courses found for program ${programId}, returning empty list`);
        return res.status(200).json([]);
      }
    }
    
    // Execute the query to get the filtered scheduled courses
    const scheduledCourses = await ScheduledCourse.findAll(queryOptions);
    
    console.log(`Found ${scheduledCourses.length} scheduled courses after filtering`);
    
    // Return the data directly - keeping all associations intact
    return res.status(200).json(scheduledCourses);
  } catch (error) {
    console.error('Error retrieving scheduled courses:', error);
    return res.status(500).json({ 
      message: 'Failed to retrieve scheduled courses',
      error: error.message
    });
  }
};
// Create new schedule
exports.createSchedule = async (req, res) => {
  try {
    const { semester_id, name } = req.body;
    
    // Check if semester exists
    const semester = await Semester.findByPk(semester_id);
    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }
    
    // Generate a unique ID for the schedule
    const scheduleId = 'SCH-' + uuidv4().substring(0, 8);
    
    const newSchedule = await Schedule.create({
      schedule_id: scheduleId,
      semester_id,
      name,
      is_final: false
    });
    
    // Return the created schedule
    const createdSchedule = await Schedule.findByPk(scheduleId, {
      include: [{ model: Semester, attributes: ['name', 'start_date', 'end_date'] }]
    });
    
    return res.status(201).json(createdSchedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    return res.status(500).json({ 
      message: 'Failed to create schedule',
      error: error.message 
    });
  }
};

// Update schedule
exports.updateSchedule = async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const { name, is_final } = req.body;
    
    // Check if schedule exists
    const schedule = await Schedule.findByPk(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (is_final !== undefined) {
      // If marking as final, check if there are unresolved conflicts
      if (is_final === true) {
        const unresolvedConflictsCount = await Conflict.count({ 
          where: { 
            schedule_id: scheduleId,
            is_resolved: false
          }
        });
        
        if (unresolvedConflictsCount > 0) {
          return res.status(400).json({ 
            message: 'Cannot finalize schedule with unresolved conflicts',
            unresolved_conflicts: unresolvedConflictsCount
          });
        }
      }
      
      updateData.is_final = is_final;
    }
    
    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No changes provided for update' });
    }
    
    // Update schedule
    await Schedule.update(updateData, { where: { schedule_id: scheduleId } });
    
    const updatedSchedule = await Schedule.findByPk(scheduleId, {
      include: [{ model: Semester, attributes: ['name', 'start_date', 'end_date'] }]
    });
    return res.status(200).json(updatedSchedule);
  } catch (error) {
    console.error('Error updating schedule:', error);
    return res.status(500).json({ message: 'Failed to update schedule' });
  }
};

// Delete schedule
exports.deleteSchedule = async (req, res) => {
  try {
    const scheduleId = req.params.id;
    
    // Check if schedule exists
    const schedule = await Schedule.findByPk(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    // Delete related conflicts and their associations
    const conflicts = await Conflict.findAll({ where: { schedule_id: scheduleId } });
    for (const conflict of conflicts) {
      await ConflictCourse.destroy({ where: { conflict_id: conflict.conflict_id } });
    }
    await Conflict.destroy({ where: { schedule_id: scheduleId } });
    
    // Delete scheduled courses
    await ScheduledCourse.destroy({ where: { schedule_id: scheduleId } });
    
    // Delete the schedule
    await Schedule.destroy({ where: { schedule_id: scheduleId } });
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return res.status(500).json({ message: 'Failed to delete schedule' });
  }
};



// Get schedules by semester
exports.getSchedulesBySemester = async (req, res) => {
  try {
    const semesterId = req.params.semesterId;
    const programId = req.query.program_id;
    
    // Import necessary models
    const { Schedule, Semester, ScheduledCourse, Course, CourseProgram } = require('../../app/models');
    
    console.log(`Filtering schedules - semester:${semesterId}, program:${programId || 'all'}`);
    
    // Check if semester exists
    const semester = await Semester.findByPk(semesterId);
    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }
    
    // If no program filter, return all schedules for this semester
    if (!programId) {
      const schedules = await Schedule.findAll({
        where: { semester_id: semesterId },
        include: [{ model: Semester, attributes: ['name', 'start_date', 'end_date'] }],
        order: [['created_at', 'DESC']]
      });
      return res.status(200).json(schedules);
    }
    
    // Get all schedules for this semester
    const schedules = await Schedule.findAll({
      where: { semester_id: semesterId },
      include: [{ model: Semester, attributes: ['name', 'start_date', 'end_date'] }],
      order: [['created_at', 'DESC']]
    });
    
    // For program filtering, we'll collect schedules that have courses in this program
    const filteredScheduleIds = [];
    
    // Process each schedule
    for (const schedule of schedules) {
      // Get all scheduled courses for this schedule
      const scheduledCourses = await ScheduledCourse.findAll({
        where: { schedule_id: schedule.schedule_id }
      });
      
      // For each scheduled course, check if its course is in the program
      let hasMatchingCourse = false;
      
      for (const scheduledCourse of scheduledCourses) {
        // Skip if no course_id
        if (!scheduledCourse.course_id) continue;
        
        // Check if this course is in the requested program
        const courseProgram = await CourseProgram.findOne({
          where: {
            course_id: scheduledCourse.course_id,
            program_id: programId
          }
        });
        
        if (courseProgram) {
          hasMatchingCourse = true;
          break; // No need to check other courses
        }
      }
      
      if (hasMatchingCourse) {
        filteredScheduleIds.push(schedule.schedule_id);
      }
    }
    
    // Filter schedules to those with matching courses
    const filteredSchedules = schedules.filter(schedule => 
      filteredScheduleIds.includes(schedule.schedule_id)
    );
    
    console.log(`Found ${filteredSchedules.length} schedules with courses in program ${programId}`);
    return res.status(200).json(filteredSchedules);
    
  } catch (error) {
    console.error('Error retrieving semester schedules:', error);
    return res.status(500).json({
      message: 'Failed to retrieve semester schedules',
      error: error.message || 'Unknown error'
    });
  }
};



// Get active semester schedule
exports.getActiveSemesterSchedule = async (req, res) => {
  try {
    const semesterId = req.params.semesterId;
    
    // Check if semester exists
    const semester = await Semester.findByPk(semesterId);
    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }
    
    // Find schedules for this semester, ordered by creation date (newest first)
    const schedules = await Schedule.findAll({
      where: { semester_id: semesterId },
      include: [{ model: Semester, attributes: ['name', 'start_date', 'end_date'] }],
      order: [['created_at', 'DESC']]
    });
    
    if (schedules.length === 0) {
      return res.status(404).json({ message: 'No schedules found for this semester' });
    }

    // NEW CODE: Find the first schedule that has courses
    let scheduleWithCourses = null;
    for (const schedule of schedules) {
      // Check if this schedule has any courses
      const courseCount = await ScheduledCourse.count({ 
        where: { schedule_id: schedule.schedule_id } 
      });
      
      console.log(`Schedule ${schedule.schedule_id} has ${courseCount} courses`);
      
      if (courseCount > 0) {
        // Use this schedule since it has courses
        scheduleWithCourses = schedule;
        break;
      }
    }
    
    // Select schedule with courses, or fall back to final or first schedule
    const activeSchedule = scheduleWithCourses || (schedules.find(s => s.is_final) || schedules[0]);
    console.log(`Selected active schedule: ${activeSchedule.schedule_id}`);
    
    // Get detailed schedule with all relationships
    const detailedSchedule = await Schedule.findByPk(activeSchedule.schedule_id, {
      include: [
        { model: Semester, attributes: ['name', 'start_date', 'end_date'] },
        { 
          model: ScheduledCourse,
          include: [
            { model: Course, attributes: ['course_id', 'course_name', 'is_core', 'department_id', 'duration_minutes'] },
            { model: Professor, attributes: ['professor_id', 'first_name', 'last_name'] },
            { model: TimeSlot, attributes: ['timeslot_id', 'name', 'start_time', 'end_time', 'day_of_week'] }
          ]
        }
      ]
    });
    
    // Before sending the response, transform the data to match frontend expectations
    const formattedCourses = detailedSchedule.ScheduledCourses?.map(sc => {
      // Extract the time slot number from the timeslot_id (e.g., "TS1-MON" -> 1)
      let slotNumber = 1;
      const timeSlotMatch = sc.timeslot_id?.match(/TS(\d+)/);
      if (timeSlotMatch) {
        slotNumber = parseInt(timeSlotMatch[1]);
      }
    
      // Make sure day_of_week is properly formatted
      let dayOfWeek = sc.day_of_week || '';
      
      // Normalize the day name if needed
      const dayMap = {
        'MON': 'Monday',
        'TUE': 'Tuesday', 
        'WED': 'Wednesday',
        'THU': 'Thursday',
        'FRI': 'Friday'
      };
      // If it's a short code, convert it
      if (dayMap[dayOfWeek]) {
        dayOfWeek = dayMap[dayOfWeek];
      }
      
      return {
        scheduled_course_id: sc.scheduled_course_id,
        schedule_id: sc.schedule_id,
        course_id: sc.Course?.course_id,
        course_name: sc.Course?.course_name,
        professor_id: sc.Professor?.professor_id,
        professor_name: `${sc.Professor?.first_name || ''} ${sc.Professor?.last_name || ''}`.trim(),
        timeslot_id: sc.timeslot_id,
        day_of_week: dayOfWeek,
        time_slot_id: sc.timeslot_id,
        time_slot_number: slotNumber,
        is_core: sc.Course?.is_core || false,
        is_override: sc.is_override || false,
        created_at: sc.created_at,
        updated_at: sc.updated_at,
        department_id: sc.Course?.department_id,
        duration_minutes: sc.Course?.duration_minutes
      };
    }) || [];

    const transformedResult = {
      ...detailedSchedule.toJSON(),
      courses: formattedCourses,
      ScheduledCourses: detailedSchedule.ScheduledCourses // Keep original for backward compatibility
    };
    
    /*
    // Create a transformed result that includes both formats for compatibility
    const transformedResult = {
      message: 'Schedule generated successfully',
      schedule: {
        ...result.schedule.toJSON(),
        courses: formattedCourses.map(course => {
          // Extract time slot number from the timeslot_id
          let slotNumber = 0;
          const match = course.timeslot_id.match(/TS(\d+)/i);
          if (match && match[1]) {
            slotNumber = parseInt(match[1]);
          }
          
          return {
            ...course,
            time_slot_number: slotNumber,
            // Ensure day_of_week is properly formatted
            day_of_week: normalizeDayName(course.day_of_week)
          };
        }),
        ScheduledCourses: result.schedule.ScheduledCourses
      },
      schedule_id: result.schedule.schedule_id,
      conflicts: result.conflicts
    };
    */

    //return res.status(200).json(detailedSchedule);
    return res.status(200).json(transformedResult);
  } catch (error) {
    console.error('Error retrieving active semester schedule:', error);
    return res.status(500).json({ message: 'Failed to retrieve active semester schedule' });
  }
};

// Get conflicts for a schedule
exports.getScheduleConflicts = async (req, res) => {
  try {
    const scheduleId = req.params.id;
    
    // Check if schedule exists
    const schedule = await Schedule.findByPk(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    const conflicts = await Conflict.findAll({
      where: { schedule_id: scheduleId },
      include: [
        { 
          model: TimeSlot, 
          attributes: ['timeslot_id', 'name', 'start_time', 'end_time', 'day_of_week', 'duration_minutes'] 
        },
        { 
          model: ScheduledCourse, 
          through: ConflictCourse,
          include: [
            { model: Course, attributes: ['course_id', 'course_name', 'is_core'] },
            { model: Professor, attributes: ['professor_id', 'first_name', 'last_name'] },
            { 
              model: TimeSlot, 
              attributes: ['timeslot_id', 'name', 'start_time', 'end_time', 'day_of_week'] 
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    // Process the conflicts to ensure we have time slot information
    const processedConflicts = conflicts.map(conflict => {
      const conflictJson = conflict.toJSON();
      
      // Extract time slot information from either conflict's time slot or first scheduled course
      let timeSlotInfo = conflictJson.timeslot || null;
      
      if (!timeSlotInfo && conflictJson.ScheduledCourses && conflictJson.ScheduledCourses.length > 0) {
        timeSlotInfo = conflictJson.ScheduledCourses[0].timeslot || null;
      }
      
      // Return the processed conflict data
      return {
        ...conflictJson,
        timeslot_info: timeSlotInfo // Add a dedicated field for time slot info
      };
    });
    
    return res.status(200).json(processedConflicts);
  } catch (error) {
    console.error('Error retrieving schedule conflicts:', error);
    return res.status(500).json({ message: 'Failed to retrieve schedule conflicts' });
  }
};

// Resolve a conflict
// Resolve a conflict
exports.resolveConflict = async (req, res) => {
  try {
    const conflictId = req.params.conflictId;
    const { resolution_notes, action, scheduled_course_id, new_timeslot_id } = req.body;
    
    // Check if conflict exists
    const conflict = await Conflict.findByPk(conflictId);
    if (!conflict) {
      return res.status(404).json({ message: 'Conflict not found' });
    }
    
    // Update conflict to mark as resolved
    await Conflict.update(
      { 
        is_resolved: true,
        resolution_notes: resolution_notes || `Conflict ${action === 'ACCEPT' ? 'accepted' : 'overridden'} by administrator`
      },
      { where: { conflict_id: conflictId } }
    );

    // If this is an OVERRIDE action with a course move
    if (action === 'OVERRIDE' && scheduled_course_id && new_timeslot_id) {
      console.log(`Moving course ${scheduled_course_id} to time slot ${new_timeslot_id}`);
      
      // First, get the target time slot to extract day_of_week
      const timeSlot = await TimeSlot.findByPk(new_timeslot_id);
      if (!timeSlot) {
        return res.status(404).json({ message: 'Time slot not found' });
      }
      
      // Get the scheduled course to save its original time slot before updating
      const scheduledCourse = await ScheduledCourse.findByPk(scheduled_course_id);
      if (!scheduledCourse) {
        return res.status(404).json({ message: 'Scheduled course not found' });
      }
      
      // Store original time slot information in the override reason
      const originalTimeSlotId = scheduledCourse.timeslot_id;
      const originalDayOfWeek = scheduledCourse.day_of_week;
      
      // Create override reason with embedded original info
      const reasonWithInfo = `${resolution_notes || 'Conflict resolution override'} (original_timeslot_id: ${originalTimeSlotId}, original_day_of_week: ${originalDayOfWeek})`;
      
      // Update the scheduled course with new time slot and day
      await ScheduledCourse.update(
        {
          timeslot_id: new_timeslot_id,
          day_of_week: timeSlot.day_of_week,
          is_override: true,
          override_reason: reasonWithInfo
        },
        { where: { scheduled_course_id: scheduled_course_id } }
      );
      
      console.log(`Course ${scheduled_course_id} moved to time slot ${new_timeslot_id} on ${timeSlot.day_of_week}`);
    }
    
    const updatedConflict = await Conflict.findByPk(conflictId, {
      include: [
        { model: TimeSlot, attributes: ['name', 'start_time', 'end_time'] },
        { 
          model: ScheduledCourse, 
          through: ConflictCourse,
          include: [
            { model: Course, attributes: ['course_id', 'course_name', 'is_core'] },
            { model: Professor, attributes: ['professor_id', 'first_name', 'last_name'] }
          ]
        }
      ]
    });
    
    return res.status(200).json(updatedConflict);
  } catch (error) {
    console.error('Error resolving conflict:', error);
    return res.status(500).json({ message: 'Failed to resolve conflict' });
  }
};

// Modify the revertConflictResolution function in scheduleController.js
// In scheduleController.js - revertConflictResolution function
exports.revertConflictResolution = async (req, res) => {
  try {
    const conflictId = req.params.conflictId;
    const { resolution_notes } = req.body;
    
    // Check if conflict exists
    const conflict = await Conflict.findByPk(conflictId);
    if (!conflict) {
      return res.status(404).json({ message: 'Conflict not found' });
    }
    
    // Find the conflict courses to identify which scheduled courses were involved
    const conflictCourses = await ConflictCourse.findAll({
      where: { conflict_id: conflictId }
    });
    
    const scheduledCourseIds = conflictCourses.map(cc => cc.scheduled_course_id);
    
    // Find all the scheduled courses related to this conflict - not just overridden ones
    const relatedCourses = await ScheduledCourse.findAll({
      where: { 
        scheduled_course_id: scheduledCourseIds
      }
    });
    
    console.log(`Found ${relatedCourses.length} courses related to this conflict to revert`);
    
    // For each course involved in the conflict
    for (const course of relatedCourses) {
      try {
        console.log(`Processing course ${course.scheduled_course_id}`);
        
        if (course.is_override) {
          // This course was overridden, so we need to restore original time slot
          console.log(`Reverting overridden course ${course.scheduled_course_id}`);
          
          // Try to extract original time slot info from override_reason
          let originalTimeSlotId = null;
          let originalDayOfWeek = null;
          
          if (course.override_reason) {
            const matches = course.override_reason.match(/original_timeslot_id:\s*([^,\)]+)/);
            if (matches && matches[1]) {
              originalTimeSlotId = matches[1].trim();
              console.log(`Found original time slot ID: ${originalTimeSlotId}`);
              
              // Also try to find original day of week
              const dayMatches = course.override_reason.match(/original_day_of_week:\s*([^,\)]+)/);
              if (dayMatches && dayMatches[1]) {
                originalDayOfWeek = dayMatches[1].trim();
                console.log(`Found original day of week: ${originalDayOfWeek}`);
              }
            }
          }
          
          // If we couldn't find original info in override_reason, look at the conflict details
          if (!originalTimeSlotId && conflict.timeslot_id) {
            originalTimeSlotId = conflict.timeslot_id;
            originalDayOfWeek = conflict.day_of_week;
            console.log(`Using conflict time slot as original: ${originalTimeSlotId}`);
          }
          
          // If we still don't have time slot info, check other courses in this conflict
          if (!originalTimeSlotId) {
            for (const otherCourse of relatedCourses) {
              if (otherCourse.scheduled_course_id !== course.scheduled_course_id && 
                  !otherCourse.is_override) {
                originalTimeSlotId = otherCourse.timeslot_id;
                originalDayOfWeek = otherCourse.day_of_week;
                console.log(`Using other conflicting course time slot: ${originalTimeSlotId}`);
                break;
              }
            }
          }
          
          // Update the course with original values
          if (originalTimeSlotId) {
            await ScheduledCourse.update({
              timeslot_id: originalTimeSlotId,
              day_of_week: originalDayOfWeek,
              is_override: false,
              override_reason: null
            }, {
              where: { scheduled_course_id: course.scheduled_course_id }
            });
            
            console.log(`Reverted course ${course.scheduled_course_id} to time slot ${originalTimeSlotId}`);
          } else {
            // If we couldn't determine the original time slot, just reset the override flag
            await ScheduledCourse.update({
              is_override: false,
              override_reason: null
            }, {
              where: { scheduled_course_id: course.scheduled_course_id }
            });
            console.log(`Could not restore original time slot for ${course.scheduled_course_id}`);
          }
        } else {
          // This course was not overridden, it was already in the conflicting time slot
          console.log(`Course ${course.scheduled_course_id} was not overridden, no changes needed`);
        }
      } catch (courseError) {
        console.error(`Error reverting course ${course.scheduled_course_id}:`, courseError);
      }
    }
    
    // Update conflict to mark as unresolved
    await Conflict.update(
      {
        is_resolved: false,
        resolution_notes: resolution_notes || 'Resolution reverted by administrator'
      },
      { where: { conflict_id: conflictId } }
    );
    
    const updatedConflict = await Conflict.findByPk(conflictId, {
      include: [
        { model: TimeSlot, attributes: ['name', 'start_time', 'end_time'] },
        {
          model: ScheduledCourse,
          through: ConflictCourse,
          include: [
            { model: Course, attributes: ['course_id', 'course_name', 'is_core'] },
            { model: Professor, attributes: ['professor_id', 'first_name', 'last_name'] }
          ]
        }
      ]
    });
    
    return res.status(200).json(updatedConflict);
  } catch (error) {
    console.error('Error reverting conflict resolution:', error);
    return res.status(500).json({ message: 'Failed to revert conflict resolution' });
  }
};