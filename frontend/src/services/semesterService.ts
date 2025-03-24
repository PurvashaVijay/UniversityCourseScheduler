// src/services/semesterService.ts
//import { v4 as uuidv4 } from 'uuid';

// Define the base API URL
//const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
// Types
export interface Semester {
  semester_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current?: boolean;
  created_at: string;
  updated_at: string;
}

// Get all semesters
export const getAllSemesters = async (): Promise<Semester[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/semesters`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch semesters');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in getAllSemesters:', error);
    
    // Return mock data for development
    return [
      {
        semester_id: "SEM-001",
        name: "Spring 2025",
        start_date: "2025-01-15",
        end_date: "2025-05-15",
        is_current: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        semester_id: "SEM-002",
        name: "Fall 2025",
        start_date: "2025-08-15",
        end_date: "2025-12-15",
        is_current: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }
};

// Get current semester
export const getCurrentSemester = async (): Promise<Semester> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/semesters/current`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch current semester');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in getCurrentSemester:', error);
    
    // Return mock data for development
    return {
      semester_id: "SEM-001",
      name: "Spring 2025",
      start_date: "2025-01-15",
      end_date: "2025-05-15",
      is_current: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
};

const semesterService = {
  getAllSemesters,
  getCurrentSemester
};

export default semesterService;