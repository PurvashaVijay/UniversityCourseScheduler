// src/services/scheduleService.ts
//import { v4 as uuidv4 } from 'uuid';

// Define the base API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Types
export interface ScheduledCourse {
  scheduled_course_id: string;
  schedule_id: string;
  course_id: string;
  course_name: string;
  professor_id: string;
  professor_name: string;
  timeslot_id: string;
  day_of_week: string;
  time_slot_id: string;
  room?: string;
  is_core: boolean;
  is_override: boolean;
  override_reason?: string;
  conflicts?: any[];
  created_at: string;
  updated_at: string;
  department_id?: string;
  program_ids?: string[];
}

export interface Schedule {
  schedule_id: string;
  semester_id: string;
  semester_name: string;
  name: string;
  is_final: boolean;
  courses: ScheduledCourse[];
  conflicts: any[];
  created_at: string;
  updated_at: string;
  ScheduledCourses?: any[];
}

export interface Conflict {
  conflict_id: string;
  schedule_id: string;
  timeslot_id: string;
  day_of_week: string;
  conflict_type: string;
  description: string;
  is_resolved: boolean;
  resolution_notes: string | null;
  time_slot?: {
    name: string;
    start_time: string;
    end_time: string;
  };
  courses: {
    scheduled_course_id: string;
    course_id: string;
    course_name: string;
    professor_id: string;
    professor_name: string;
  }[];
}

export interface ConflictResolution {
  action: 'ACCEPT' | 'OVERRIDE';
  notes: string;
}

export interface ScheduleOverride {
  conflictId: string;
  professorId: string;
  timeSlotId: string;
  dayOfWeek: string;
  reason: string;
}

// Get active schedule for a semester
export const getActiveSchedule = async (semesterId: string): Promise<Schedule> => {
  try {
    const token = localStorage.getItem('token');
    console.log(`Fetching active schedule for semester: ${semesterId}`);

    const response = await fetch(`${API_URL}/schedules/semester/${semesterId}/active`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      // If no active schedule exists, throw an error to be handled by caller
      if (response.status === 404) {
        console.error('No active schedule found for this semester');
        throw new Error('No active schedule found for this semester');
      }
      console.error(`Failed to fetch active schedule: ${response.status} ${response.statusText}`);
      throw new Error('Failed to fetch active schedule');
    }

    const schedule = await response.json();
    console.log(`Retrieved active schedule: ${schedule.schedule_id}`);
    console.log('Schedule data structure:', {
      hasScheduledCourses: !!schedule.ScheduledCourses,
      scheduledCoursesLength: schedule.ScheduledCourses?.length || 0,
      hasCourses: !!schedule.courses,
      coursesLength: schedule.courses?.length || 0
    });

    // Use the courses property if it exists, otherwise format the ScheduledCourses
    let formattedCourses = schedule.courses || [];

    // If we don't have courses but we have ScheduledCourses, format them
    if (!formattedCourses.length && schedule.ScheduledCourses?.length) {
      formattedCourses = schedule.ScheduledCourses.map((sc: any) => ({
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
      }));
    }

    return {
      ...schedule,
      schedule_id: schedule.schedule_id, // Ensure this is explicitly set
      semester_id: schedule.semester_id,
      semester_name: schedule.Semester?.name || 'Unknown',
      name: schedule.name,
      is_final: schedule.is_final,
      courses: formattedCourses, // This is crucial
      ScheduledCourses: schedule.ScheduledCourses, // Keep for compatibility
      conflicts: [], // Conflicts will be fetched separately
      created_at: schedule.created_at,
      updated_at: schedule.updated_at
    };
    
  } catch (error) {
    console.error(`Error in getActiveSchedule for semester ${semesterId}:`, error);
    throw error;
  }
};

// Get all schedules for a semester
export const getSchedulesBySemester = async (semesterId: string): Promise<Schedule[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/schedules/semester/${semesterId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch schedules by semester');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error in getSchedulesBySemester for semester ${semesterId}:`, error);
    throw error;
  }
};

// Get schedule by ID with courses
export const getScheduleById = async (id: string): Promise<Schedule> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/schedules/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch schedule');
    }

    const data = await response.json();
    
    // Format the data to match the expected structure
    const formattedCourses = data.ScheduledCourses?.map((sc: any) => ({
      scheduled_course_id: sc.scheduled_course_id,
      schedule_id: sc.schedule_id,
      course_id: sc.Course?.course_id,
      course_name: sc.Course?.course_name,
      professor_id: sc.Professor?.professor_id,
      professor_name: `${sc.Professor?.first_name} ${sc.Professor?.last_name}`,
      timeslot_id: sc.timeslot_id,
      day_of_week: sc.day_of_week,
      time_slot_id: sc.timeslot_id,
      room: sc.room || "TBA",
      is_core: sc.Course?.is_core || false,
      is_override: sc.is_override,
      override_reason: sc.override_reason,
      created_at: sc.created_at,
      updated_at: sc.updated_at,
      department_id: sc.Course?.department_id
    })) || [];
    
    return {
      ...data,
      semester_name: data.Semester?.name || "Unknown Semester",
      courses: formattedCourses
    };
  } catch (error) {
    console.error(`Error in getScheduleById for ID ${id}:`, error);
    throw error;
  }
};

// Get conflicts for a schedule
export const getScheduleConflicts = async (scheduleId: string): Promise<Conflict[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/schedules/${scheduleId}/conflicts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch schedule conflicts');
    }

    const conflicts = await response.json();
    
    // Format conflicts to match the expected structure
    return conflicts.map((conflict: any) => {
      const courses = conflict.ScheduledCourses?.map((sc: any) => ({
        scheduled_course_id: sc.scheduled_course_id,
        course_id: sc.Course?.course_id,
        course_name: sc.Course?.course_name,
        professor_id: sc.Professor?.professor_id,
        professor_name: `${sc.Professor?.first_name} ${sc.Professor?.last_name}`
      })) || [];
      
      const timeSlot = {
        name: conflict.TimeSlot?.name || '',
        start_time: conflict.TimeSlot?.start_time || '',
        end_time: conflict.TimeSlot?.end_time || ''
      };
      
      return {
        conflict_id: conflict.conflict_id,
        schedule_id: conflict.schedule_id,
        timeslot_id: conflict.timeslot_id,
        day_of_week: conflict.day_of_week,
        conflict_type: conflict.conflict_type,
        description: conflict.description,
        is_resolved: conflict.is_resolved,
        resolution_notes: conflict.resolution_notes,
        time_slot: timeSlot,
        courses: courses
      };
    });
  } catch (error) {
    console.error(`Error fetching conflicts for schedule ${scheduleId}:`, error);
    throw error;
  }
};

// Resolve a conflict
export const resolveConflict = async (conflictId: string, resolution: ConflictResolution): Promise<any> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/conflicts/${conflictId}/resolve`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(resolution)
    });

    if (!response.ok) {
      throw new Error('Failed to resolve conflict');
    }

    return await response.json();
  } catch (error) {
    console.error(`Error resolving conflict ${conflictId}:`, error);
    throw error;
  }
};

// Override a scheduled course
export const overrideScheduledCourse = async (
  scheduleId: string, 
  overrideData: ScheduleOverride
): Promise<any> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/schedules/${scheduleId}/override`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(overrideData)
    });

    if (!response.ok) {
      throw new Error('Failed to override scheduled course');
    }

    return await response.json();
  } catch (error) {
    console.error(`Error overriding course in schedule ${scheduleId}:`, error);
    throw error;
  }
};


// In scheduleService.ts - update the generateSchedule function
export const generateSchedule = async (semesterId: string, name: string): Promise<Schedule> => {
  try {
    console.log(`Generating schedule for semester ${semesterId} with name: ${name}`);
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication token is missing');
    }
    
    const response = await fetch(`${API_URL}/scheduler/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ semester_id: semesterId, name })
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from server:', errorData);
      throw new Error(errorData.message || 'Failed to generate schedule');
    }

    const data = await response.json();
    console.log('Successfully generated schedule:', data);
    return data.schedule;
  } catch (error) {
    console.error('Error generating schedule:', error);
    throw error;
  }
};

export const forceScheduleRefresh = async (scheduleId: string): Promise<boolean> => {
  try {
    const token = localStorage.getItem('token');
    console.log(`Force refreshing schedule: ${scheduleId}`);
    
    // Make a direct call to get this specific schedule
    const response = await fetch(`${API_URL}/schedules/${scheduleId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`Failed to refresh schedule ${scheduleId}: ${response.status}`);
      return false;
    }

    console.log(`Successfully refreshed schedule: ${scheduleId}`);
    return true;
  } catch (error) {
    console.error(`Error refreshing schedule ${scheduleId}:`, error);
    return false;
  }
};

const scheduleService = {
  getActiveSchedule,
  getSchedulesBySemester,
  getScheduleById,
  getScheduleConflicts,
  resolveConflict,
  overrideScheduledCourse,
  generateSchedule,
  forceScheduleRefresh  // Add this line
};

export default scheduleService;