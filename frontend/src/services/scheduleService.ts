// src/services/scheduleService.ts

import authService from './authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Type definitions

export interface Schedule {
  schedule_id: string;
  semester_id: string;
  name: string;
  is_final: boolean;
  created_at: string;
  updated_at: string;
  semester?: {
    name: string;
  };
}

export interface ScheduledCourse {
  scheduled_course_id: string;
  schedule_id: string;
  course_id: string;
  professor_id: string;
  timeslot_id: string;
  day_of_week: string;
  is_override: boolean;
  override_reason?: string;
  created_at: string;
  updated_at: string;
  course?: {
    course_id: string;
    course_name: string;
    department_id: string;
    duration_minutes: number;
    is_core: boolean;
  };
  professor?: {
    first_name: string;
    last_name: string;
  };
  timeslot?: {
    name: string;
    start_time: string;
    end_time: string;
  };
}

export interface TimeSlot {
  timeslot_id: string;
  name: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  day_of_week: string;
  created_at: string;
  updated_at: string;
}

export interface Conflict {
  conflict_id: string;
  schedule_id: string;
  timeslot_id: string;
  day_of_week: string;
  conflict_type: string;
  description: string;
  is_resolved: boolean;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  timeslot?: {
    timeslot_id: string;
    name: string;
    start_time: string;
    end_time: string;
    day_of_week: string;
    duration_minutes?: number;
  };
  time_slot?: {
    timeslot_id: string;
    name: string;
    start_time: string;
    end_time: string;
    day_of_week: string;
  };
  
  timeslot_info?: any;
  scheduled_courses?: {
    scheduled_course_id: string;
    course_id: string;
    course_name?: string;
    professor_id?: string;
    professor_name?: string;
    day_of_week?: string;
    timeslot?: {
      timeslot_id: string;
      name: string;
      start_time: string;
      end_time: string;
      day_of_week: string;
    };
  }[];
}


export interface OverrideRequest {
  schedule_id: string;
  course_id: string;
  professor_id: string;
  timeslot_id: string;
  day_of_week: string;
  override_reason?: string;
}

// Get all schedules
export const getAllSchedules = async (): Promise<Schedule[]> => {
  try {
    const token = authService.getToken();
    
    const response = await fetch(`${API_URL}/schedules`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch schedules');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return [];
  }
};

// Get schedule by ID
export const getScheduleById = async (scheduleId: string): Promise<Schedule | null> => {
  try {
    const token = authService.getToken();
    
    const response = await fetch(`${API_URL}/schedules/${scheduleId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch schedule');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching schedule ${scheduleId}:`, error);
    return null;
  }
};

// Get schedules by semester
export const getSchedulesBySemester = async (semesterId: string): Promise<Schedule[]> => {
  try {
    const token = authService.getToken();
    
    const response = await fetch(`${API_URL}/schedules/semester/${semesterId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch schedules for semester');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching schedules for semester ${semesterId}:`, error);
    return [];
  }
};

// Get scheduled courses for a schedule
export const getScheduledCourses = async (scheduleId: string): Promise<ScheduledCourse[]> => {
  try {
    const token = authService.getToken();
    
    const response = await fetch(`${API_URL}/schedules/${scheduleId}/courses`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch scheduled courses');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching scheduled courses for schedule ${scheduleId}:`, error);
    return [];
  }
};

// Generate a new schedule
export const generateSchedule = async (semesterId: string, name: string): Promise<{schedule: Schedule, conflicts: Conflict[]} | null> => {
  try {
    const token = authService.getToken();
    
    const response = await fetch(`${API_URL}/scheduler/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        semester_id: semesterId,
        name
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate schedule');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error generating schedule:', error);
    throw error;
  }
};

// Delete a schedule
export const deleteSchedule = async (scheduleId: string): Promise<{
  success: boolean; message: string
}> => {
  try {
    const token = authService.getToken();
    
    // Add the console log here, before the fetch call
    console.log(`Sending DELETE request to ${API_URL}/schedules/${scheduleId}`);
    
    const response = await fetch(`${API_URL}/schedules/${scheduleId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete schedule');
    }
    
    // Handle 204 No Content or empty responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {
        success: true,
        message: 'Schedule deleted successfully'
      };
    }
    
    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Schedule deleted successfully'
    };
  } catch (error) {
    console.error(`Error deleting schedule ${scheduleId}:`, error);
    throw error;
  }
};

// Get conflicts for a schedule
export const getScheduleConflicts = async (scheduleId: string): Promise<Conflict[]> => {
  try {
    const token = authService.getToken();
    
    const response = await fetch(`${API_URL}/schedules/${scheduleId}/conflicts`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch schedule conflicts');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching conflicts for schedule ${scheduleId}:`, error);
    return [];
  }
};

// Resolve a conflict
export const resolveConflict = async (
  conflictId: string,
  resolutionData: {
    is_resolved: boolean;
    resolution_notes: string;
    action: 'ACCEPT' | 'OVERRIDE';
    scheduled_course_id?: string;
    new_timeslot_id?: string;
  }
): Promise<Conflict> => {
  try {
    const token = authService.getToken();
    
    const response = await fetch(`${API_URL}/schedules/conflicts/${conflictId}/resolve`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(resolutionData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to resolve conflict');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error resolving conflict ${conflictId}:`, error);
    throw error;
  }
};

// Get all timeslots
export const getAllTimeSlots = async (): Promise<TimeSlot[]> => {
  try {
    const token = authService.getToken();
    
    const response = await fetch(`${API_URL}/timeslots`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch time slots');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching time slots:', error);
    return [];
  }
};

// Get time slots by day
export const getTimeSlotsByDay = async (day: string): Promise<TimeSlot[]> => {
  try {
    const token = authService.getToken();
    
    const response = await fetch(`${API_URL}/timeslots/day/${day}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch time slots for ${day}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching time slots for ${day}:`, error);
    return [];
  }
};

// Create an override for a scheduled course
export const createOverride = async (overrideData: OverrideRequest): Promise<any> => {
  try {
    const token = authService.getToken();
    
    console.log('Creating course override with data:', overrideData);
    
    const response = await fetch(`${API_URL}/scheduled-courses/override`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(overrideData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create course override');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating course override:', error);
    throw error;
  }
};

// Revert a conflict resolution
export const revertConflictResolution = async (
  conflictId: string,
  revertData: {
    is_resolved: boolean;
    resolution_notes: string;
  }
): Promise<Conflict> => {
  try {
    const token = authService.getToken();
    
    const response = await fetch(`${API_URL}/schedules/conflicts/${conflictId}/revert`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(revertData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to revert conflict resolution');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error reverting conflict resolution ${conflictId}:`, error);
    throw error;
  }
};

const scheduleService = {
  getAllSchedules,
  getScheduleById,
  getSchedulesBySemester,
  getScheduledCourses,
  generateSchedule,
  deleteSchedule,
  getScheduleConflicts,
  resolveConflict,
  revertConflictResolution,
  getAllTimeSlots,
  getTimeSlotsByDay,
  createOverride
};

export default scheduleService;