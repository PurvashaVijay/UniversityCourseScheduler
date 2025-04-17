// scheduleController.js
const { Schedule, Semester, ScheduledCourse, Course, CourseProgram,Professor, TimeSlot, Conflict, ConflictCourse } = require('../../app/models');
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
exports.getScheduleById = async (req, res) => {
  try {
    console.log(`Loading schedule by ID: ${req.params.id}`);
    
    // First, get the schedule without eager loading to avoid potential issues
    const schedule = await Schedule.findByPk(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    // Then, manually fetch the scheduled courses with their relationships
    const scheduledCourses = await ScheduledCourse.findAll({
      where: { schedule_id: req.params.id },
      include: [
        { model: Course, attributes: ['course_id', 'course_name', 'is_core', 'department_id', 'duration_minutes'] },
        { model: Professor, attributes: ['professor_id', 'first_name', 'last_name'] },
        { model: TimeSlot, attributes: ['timeslot_id', 'name', 'start_time', 'end_time', 'day_of_week'] }
      ]
    });
    
    console.log(`Found schedule ${req.params.id} with ${scheduledCourses.length} scheduled courses`);
    
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
        department_id: scJson.Course?.department_id,
        duration_minutes: scJson.Course?.duration_minutes
      };
    });

    console.log(`Processed ${formattedCourses.length} courses for schedule ${req.params.id}`);
    
    // Log the first course as a sample to verify structure
    if (formattedCourses.length > 0) {
      console.log('Sample course structure:', JSON.stringify(formattedCourses[0]));
    }

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

    console.log(`Returning schedule with ${formattedCourses.length} courses`);
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Error retrieving schedule:', error);
    return res.status(500).json({ message: 'Failed to retrieve schedule', error: error.message });
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
// Get schedules by semester
exports.getSchedulesBySemester = async (req, res) => {
  try {
    const semesterId = req.params.semesterId;
    const departmentId = req.query.department_id;
    const programId = req.query.program_id;
    
    console.log(`Filtering schedules - semester:${semesterId}, department:${departmentId || 'all'}, program:${programId || 'all'}`);
    
    // Check if semester exists
    const semester = await Semester.findByPk(semesterId);
    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }
    
    // Get all schedules for this semester
    const schedules = await Schedule.findAll({
      where: { semester_id: semesterId },
      include: [{ model: Semester, attributes: ['name', 'start_date', 'end_date'] }],
      order: [['created_at', 'DESC']]
    });
    
    // If no department/program filter, return all schedules
    if (!departmentId && !programId) {
      return res.status(200).json(schedules);
    }
    
    // Manual filtering approach to debug the issue
    const filteredScheduleIds = new Set();
    
    for (const schedule of schedules) {
      // First, get the scheduled courses for this schedule
      const scheduledCourses = await ScheduledCourse.findAll({
        where: { schedule_id: schedule.schedule_id }
      });
      
      console.log(`Schedule ${schedule.schedule_id} has ${scheduledCourses.length} scheduled courses`);
      
      // Then, for each scheduled course, look up the course directly 
      let hasMatchingCourse = false;
      
      for (const scheduledCourse of scheduledCourses) {
        if (!scheduledCourse.course_id) {
          console.log(`Warning: Scheduled course ${scheduledCourse.scheduled_course_id} has no course_id`);
          continue;
        }
        
        // Explicitly get the course to check if it exists and matches department
        const course = await Course.findByPk(scheduledCourse.course_id);
        
        if (!course) {
          console.log(`Warning: Course ${scheduledCourse.course_id} not found for scheduled course ${scheduledCourse.scheduled_course_id}`);
          continue;
        }
        
        // Log the course details to see what we're working with
        console.log(`Found course: ${course.course_id}, department: ${course.department_id}`);
        
        // Check department filter
        const matchesDepartment = !departmentId || course.department_id === departmentId;
        
        // Check program filter if needed
        let matchesProgram = !programId;
        
        if (programId && matchesDepartment) {
          // Directly query for the course-program relationship
          const courseProgram = await CourseProgram.findOne({
            where: {
              course_id: course.course_id,
              program_id: programId
            }
          });
          
          matchesProgram = !!courseProgram;
        }
        
        if (matchesDepartment && matchesProgram) {
          hasMatchingCourse = true;
          break;
        }
      }
      
      if (hasMatchingCourse) {
        filteredScheduleIds.add(schedule.schedule_id);
      }
    }
    
    // Return only the schedules that matched our filters
    const filteredSchedules = schedules.filter(schedule => 
      filteredScheduleIds.has(schedule.schedule_id)
    );
    
    console.log(`Found ${filteredSchedules.length} schedules after filtering`);
    return res.status(200).json(filteredSchedules);
  } catch (error) {
    console.error('Error retrieving semester schedules:', error);
    return res.status(500).json({ 
      message: 'Failed to retrieve semester schedules',
      error: error.message
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
// In the resolveConflict function in scheduleController.js
// Add this when overriding a course:

// If this is an OVERRIDE action with a course move
// If this is an OVERRIDE action with a course move
// In scheduleController.js - resolveConflict function (the OVERRIDE action part)
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

// Add this as a DEBUG function at the end of your controller
exports.debugCourseData = async (req, res) => {
  try {
    // Get sample scheduled courses
    const scheduledCourses = await ScheduledCourse.findAll({
      limit: 10,
      include: [{ model: Course }]
    });
    
    // Map them to a cleaner format for inspection
    const mappedData = scheduledCourses.map(sc => ({
      scheduled_course_id: sc.scheduled_course_id,
      schedule_id: sc.schedule_id,
      has_course: !!sc.Course,
      course_id: sc.Course?.course_id,
      department_id: sc.Course?.department_id,
    }));
    
    // Return the debug info
    res.status(200).json({
      message: 'Debug course data',
      sample_scheduled_courses: mappedData,
      counts: {
        scheduledCourses: await ScheduledCourse.count(),
        courses: await Course.count(),
        coursePrograms: await CourseProgram.count()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
