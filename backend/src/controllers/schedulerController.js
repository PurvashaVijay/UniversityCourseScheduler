// schedulerController.js
const schedulerService = require('../services/schedulerService');
const { Semester } = require('../models');

// Then update the generateSchedule function:
exports.generateSchedule = async (req, res) => {
  try {
    console.log('schedulerController.generateSchedule called with:', req.body);
    const { semester_id, name } = req.body;
    
    // Validate required fields
    if (!semester_id || !name) {
      return res.status(400).json({ message: 'Semester ID and schedule name are required' });
    }
    
    // Generate schedule using the service
    const result = await schedulerService.generateSchedule(semester_id, name);
    
    // Transform the scheduled courses into the format expected by the frontend
    const formattedCourses = result.schedule.ScheduledCourses?.map(sc => {
      // Extract the time slot number from the timeslot_id (e.g., "TS1-MON" -> 1)
      let slotNumber = 1;
      const timeSlotMatch = sc.timeslot_id.match(/TS(\d+)/);
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
        time_slot_number: slotNumber,  // Add this field
        is_core: sc.Course?.is_core || false,
        is_override: sc.is_override || false,
        created_at: sc.created_at,
        updated_at: sc.updated_at,
        department_id: sc.Course?.department_id,
        duration_minutes: sc.Course?.duration_minutes
      };
    }) || [];
    
    // Create a transformed result that includes both formats for compatibility
    const transformedResult = {
      message: 'Schedule generated successfully',
      schedule: {
        ...result.schedule,
        courses: result.schedule.ScheduledCourses?.map(sc => ({
          scheduled_course_id: sc.scheduled_course_id,
          schedule_id: sc.schedule_id,
          course_id: sc.Course?.course_id,
          course_name: sc.Course?.course_name,
          professor_id: sc.Professor?.professor_id,
          professor_name: `${sc.Professor?.first_name || ''} ${sc.Professor?.last_name || ''}`.trim(),
          timeslot_id: sc.timeslot_id,
          day_of_week: sc.day_of_week,
          time_slot_id: sc.timeslot_id,
          is_core: sc.Course?.is_core || false,
          is_override: sc.is_override || false,
          created_at: sc.created_at,
          updated_at: sc.updated_at,
          department_id: sc.Course?.department_id
        })) || [],
        ScheduledCourses: result.schedule.ScheduledCourses
      },
      schedule_id: result.schedule.schedule_id,
      conflicts: result.conflicts
    };
    
    // Function to remove circular references
    const cleanCircularReferences = (obj) => {
      const seen = new WeakSet();
      return JSON.parse(JSON.stringify(obj, (key, value) => {
        // Skip 'parent' properties to break circular references
        if (key === 'parent') return undefined;
        
        // Handle other circular references
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return undefined; // Skip this value to avoid circular reference
          }
          seen.add(value);
        }
        return value;
      }));
    };
    
    // Apply the cleaner to our result
    const cleanResult = cleanCircularReferences(transformedResult);
    
    return res.status(201).json(cleanResult);
  } catch (error) {
    console.error('Error in schedule generation:', error);
    return res.status(500).json({
      message: 'Failed to generate schedule',
      error: error.message
    });
  }
};