// scheduleController.js
const { Schedule, Semester, ScheduledCourse, Course, Professor, TimeSlot, Conflict, ConflictCourse } = require('../../app/models');
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
exports.getSchedulesBySemester = async (req, res) => {
  try {
    const semesterId = req.params.semesterId;
    
    // Check if semester exists
    const semester = await Semester.findByPk(semesterId);
    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }
    
    const schedules = await Schedule.findAll({
      where: { semester_id: semesterId },
      include: [{ model: Semester, attributes: ['name', 'start_date', 'end_date'] }],
      order: [['created_at', 'DESC']]
    });
    
    return res.status(200).json(schedules);
  } catch (error) {
    console.error('Error retrieving semester schedules:', error);
    return res.status(500).json({ message: 'Failed to retrieve semester schedules' });
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
        { model: TimeSlot, attributes: ['name', 'start_time', 'end_time'] },
        { 
          model: ScheduledCourse, 
          through: ConflictCourse,
          include: [
            { model: Course, attributes: ['course_id', 'course_name', 'is_core'] },
            { model: Professor, attributes: ['professor_id', 'first_name', 'last_name'] }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    return res.status(200).json(conflicts);
  } catch (error) {
    console.error('Error retrieving schedule conflicts:', error);
    return res.status(500).json({ message: 'Failed to retrieve schedule conflicts' });
  }
};

// Resolve a conflict
exports.resolveConflict = async (req, res) => {
  try {
    const conflictId = req.params.conflictId;
    const { resolution_notes, action } = req.body;
    
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

exports.revertConflictResolution = async (req, res) => {
  try {
    const conflictId = req.params.conflictId;
    const { resolution_notes } = req.body;
    
    // Check if conflict exists
    const conflict = await Conflict.findByPk(conflictId);
    if (!conflict) {
      return res.status(404).json({ message: 'Conflict not found' });
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