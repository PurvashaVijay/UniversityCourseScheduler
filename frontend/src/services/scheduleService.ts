// src/services/scheduleService.ts
import { v4 as uuidv4 } from 'uuid';

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
          updated_at: new Date().toISOString(),
          department_id: "DEPT-001",
          program_ids: ["PROG-001", "PROG-002"]
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
          updated_at: new Date().toISOString(),
          department_id: "DEPT-001",
          program_ids: ["PROG-001"]
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
    
    // Return mock data for development - can be removed in production
    return {
      schedule_id: "SCH-001",
      semester_id: "SEM-001",
      semester_name: "Fall 2023",
      name: "Fall 2023 Schedule",
      is_final: false,
      courses: [
        {
          scheduled_course_id: "SC-001",
          schedule_id: "SCH-001",
          course_id: "COURSE-001",
          course_name: "Introduction to Programming",
          professor_id: "PROF-001",
          professor_name: "John Doe",
          timeslot_id: "TS1-MON",
          day_of_week: "Monday",
          time_slot_id: "TS1-MON",
          is_core: true,
          is_override: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          department_id: "DEPT-001",
          program_ids: ["PROG-001", "PROG-002"]
        },
        {
          scheduled_course_id: "SC-002",
          schedule_id: "SCH-001",
          course_id: "COURSE-002",
          course_name: "Data Structures",
          professor_id: "PROF-002",
          professor_name: "Jane Smith",
          timeslot_id: "TS2-MON",
          day_of_week: "Monday",
          time_slot_id: "TS2-MON",
          is_core: true,
          is_override: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          department_id: "DEPT-001",
          program_ids: ["PROG-001"]
        },
        {
          scheduled_course_id: "SC-003",
          schedule_id: "SCH-001",
          course_id: "COURSE-003",
          course_name: "Algorithms",
          professor_id: "PROF-001",
          professor_name: "John Doe",
          timeslot_id: "TS3-TUE",
          day_of_week: "Tuesday",
          time_slot_id: "TS3-TUE",
          is_core: true,
          is_override: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          department_id: "DEPT-001",
          program_ids: ["PROG-001"]
        }
      ],
      conflicts: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
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

    return await response.json();
  } catch (error) {
    console.error(`Error fetching conflicts for schedule ${scheduleId}:`, error);
    
    // Return mock data for development - can be removed in production
    return [
      {
        conflict_id: "CONF-001",
        schedule_id: "SCH-001",
        timeslot_id: "TS3-MON",
        day_of_week: "Monday",
        conflict_type: "TIME_SLOT_CONFLICT",
        description: "Multiple core courses scheduled in the same time slot",
        is_resolved: false,
        resolution_notes: null,
        time_slot: {
          name: "Time Slot 3",
          start_time: "11:30",
          end_time: "12:25"
        },
        courses: [
          {
            scheduled_course_id: "SC-001",
            course_id: "COURSE-001",
            course_name: "Introduction to Programming",
            professor_id: "PROF-001",
            professor_name: "John Doe"
          },
          {
            scheduled_course_id: "SC-007",
            course_id: "COURSE-007",
            course_name: "Software Engineering",
            professor_id: "PROF-004",
            professor_name: "Emily Davis"
          }
        ]
      },
      {
        conflict_id: "CONF-002",
        schedule_id: "SCH-001",
        timeslot_id: "TS1-FRI",
        day_of_week: "Friday",
        conflict_type: "PROFESSOR_AVAILABILITY",
        description: "Professor is not available at this time slot",
        is_resolved: true,
        resolution_notes: "Conflict manually overridden by administrator",
        time_slot: {
          name: "Time Slot 1",
          start_time: "09:10",
          end_time: "10:05"
        },
        courses: [
          {
            scheduled_course_id: "SC-006",
            course_id: "COURSE-006",
            course_name: "Operating Systems",
            professor_id: "PROF-003",
            professor_name: "Robert Johnson"
          }
        ]
      }
    ];
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
    
    // For development, return a mock success response
    return {
      success: true,
      message: 'Conflict resolved successfully'
    };
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
    
    // For development, return a mock success response
    return {
      success: true,
      message: 'Course successfully overridden'
    };
  }
};

// Generate a new schedule
export const generateSchedule = async (semesterId: string, name: string): Promise<Schedule> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/schedules/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ semesterId, name })
    });

    if (!response.ok) {
      throw new Error('Failed to generate schedule');
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating schedule:', error);
    throw error;
  }
};

const scheduleService = {
  getActiveSchedule,
  getSchedulesBySemester,
  getScheduleById,
  getScheduleConflicts,
  resolveConflict,
  overrideScheduledCourse,
  generateSchedule
};

export default scheduleService;