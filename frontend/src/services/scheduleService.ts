// src/services/scheduleService.ts
import { v4 as uuidv4 } from 'uuid';

// Define the base API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

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
  courses: ScheduledCourse[];
  conflicts: any[];
  created_at: string;
  updated_at: string;
}

// Get active schedule for a semester
export const getActiveSchedule = async (semesterId: string): Promise<Schedule> => {
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
    
    // Return mock data for development - remove in production
    return {
      schedule_id: `SCH-${uuidv4().substring(0, 8)}`,
      semester_id: semesterId,
      semester_name: "Spring 2025",
      name: "Active Schedule",
      is_final: true,
      courses: [
        {
          scheduled_course_id: `SC-${uuidv4().substring(0, 8)}`,
          schedule_id: `SCH-${uuidv4().substring(0, 8)}`,
          course_id: "COURSE-001",
          course_name: "Introduction to Programming",
          professor_id: "PROF-001",
          professor_name: "John Smith",
          timeslot_id: "TS1-MON",
          day_of_week: "Monday",
          time_slot_id: "TS1-MON",
          room: "MEM 201",
          is_core: true,
          is_override: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          scheduled_course_id: `SC-${uuidv4().substring(0, 8)}`,
          schedule_id: `SCH-${uuidv4().substring(0, 8)}`,
          course_id: "COURSE-002",
          course_name: "Database Systems",
          professor_id: "PROF-002",
          professor_name: "Jane Doe",
          timeslot_id: "TS2-TUE",
          day_of_week: "Tuesday",
          time_slot_id: "TS2-TUE",
          room: "PRN 105",
          is_core: false,
          is_override: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      conflicts: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
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
    return data;
  } catch (error) {
    console.error(`Error in getScheduleById for ID ${id}:`, error);
    throw error;
  }
};

const scheduleService = {
  getActiveSchedule,
  getSchedulesBySemester,
  getScheduleById
};

export default scheduleService;