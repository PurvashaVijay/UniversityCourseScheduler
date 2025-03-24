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
}

export interface Schedule {
  schedule_id: string;
  semester_id: string;
  semester_name: string;
  name: string;
  is_final: boolean;
  is_active?: boolean;
  courses: ScheduledCourse[];
  conflicts: any[];
  created_at: string;
  updated_at: string;
}

// Get all schedules
export const getAllSchedules = async (): Promise<Schedule[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/schedules`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch all schedules');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in getAllSchedules:', error);
    return [];
  }
};

// Get active schedule for a semester
export const getActiveSchedule = async (semesterId: string): Promise<Schedule | null> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/schedules/semester/${semesterId}/active`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch active schedule');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error in getActiveSchedule for semester ${semesterId}:`, error);
    return null;
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
    return [];
  }
};

// Get schedule by ID with courses
export const getScheduleById = async (id: string): Promise<Schedule | null> => {
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
    return data;
  } catch (error) {
    console.error(`Error in getScheduleById for ID ${id}:`, error);
    return null;
  }
};

const scheduleService = {
  getAllSchedules,
  getActiveSchedule,
  getSchedulesBySemester,
  getScheduleById
};

export default scheduleService;