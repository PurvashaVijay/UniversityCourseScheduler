// src/services/semesterService.ts
import authService from './authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Type definitions
export interface Semester {
  semester_id: string;
  name: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

// Get all semesters
export const getAllSemesters = async (): Promise<Semester[]> => {
  try {
    const token = authService.getToken();
    
    const response = await fetch(`${API_URL}/semesters`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch semesters');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching semesters:', error);
    return [];
  }
};

// Get semester by ID
export const getSemesterById = async (semesterId: string): Promise<Semester | null> => {
  try {
    const token = authService.getToken();
    
    const response = await fetch(`${API_URL}/semesters/${semesterId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch semester');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching semester ${semesterId}:`, error);
    return null;
  }
};

// Get current semester
export const getCurrentSemester = async (): Promise<Semester | null> => {
  try {
    const token = authService.getToken();
    
    const response = await fetch(`${API_URL}/semesters/current`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch current semester');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching current semester:', error);
    return null;
  }
};

// Create a new semester
export const createSemester = async (semesterData: Partial<Semester>): Promise<Semester> => {
  try {
    const token = authService.getToken();
    
    const response = await fetch(`${API_URL}/semesters`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(semesterData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create semester');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating semester:', error);
    throw error;
  }
};

// Update a semester
export const updateSemester = async (semesterId: string, semesterData: Partial<Semester>): Promise<Semester> => {
  try {
    const token = authService.getToken();
    
    const response = await fetch(`${API_URL}/semesters/${semesterId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(semesterData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update semester');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating semester ${semesterId}:`, error);
    throw error;
  }
};

// Delete a semester
export const deleteSemester = async (semesterId: string): Promise<boolean> => {
  try {
    const token = authService.getToken();
    
    const response = await fetch(`${API_URL}/semesters/${semesterId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete semester');
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting semester ${semesterId}:`, error);
    throw error;
  }
};

const semesterService = {
  getAllSemesters,
  getSemesterById,
  getCurrentSemester,
  createSemester,
  updateSemester,
  deleteSemester
};

export default semesterService;