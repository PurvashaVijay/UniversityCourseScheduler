// src/services/professorService.ts

import { v4 as uuidv4 } from 'uuid';

// Define the base API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Types

export interface Professor {
  professor_id: string;
  department_id: string;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  semesters?: string[];    // Add this field for semester availability
  course_ids?: string[];   // Add this field for assigned courses
  created_at: string;
  updated_at: string;
}

export interface ProfessorAvailability {
  availability_id: string;
  professor_id: string;
  timeslot_id: string;
  day_of_week: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfessorDetail extends Professor {
  department?: any;
  courses?: any[];
  availabilities?: ProfessorAvailability[];
}

// Fetch all professors
export const getAllProfessors = async (): Promise<Professor[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/professors`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch professors');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in getAllProfessors:', error);
    throw error;
  }
};

// Fetch professors by department
export const getProfessorsByDepartment = async (departmentId: string): Promise<Professor[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/professors/department/${departmentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch professors by department');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error in getProfessorsByDepartment for departmentId ${departmentId}:`, error);
    throw error;
  }
};

// Fetch professors by course
export const getProfessorsByCourse = async (courseId: string): Promise<Professor[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/professors/course/${courseId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch professors by course');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error in getProfessorsByCourse for courseId ${courseId}:`, error);
    
    // Fallback approach if endpoint doesn't exist yet:
    // 1. Get all professors
    // 2. Filter for those with the course ID in their course_ids array
    try {
      const allProfessors = await getAllProfessors();
      return allProfessors.filter(
        professor => professor.course_ids?.includes(courseId)
      );
    } catch (fallbackError) {
      console.error('Fallback approach also failed:', fallbackError);
      throw error;
    }
  }
};

// Fetch a single professor by ID
export const getProfessorById = async (id: string): Promise<ProfessorDetail> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/professors/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch professor');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error in getProfessorById for ID ${id}:`, error);
    throw error;
  }
};

// Get professor availability
export const getProfessorAvailability = async (professorId: string): Promise<ProfessorAvailability[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/professors/${professorId}/availability`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch professor availability');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error in getProfessorAvailability for professor ID ${professorId}:`, error);
    throw error;
  }
};

// Set professor availability
export const setProfessorAvailability = async (
  professorId: string,
  availabilities: ProfessorAvailability[]
): Promise<ProfessorAvailability[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/professors/${professorId}/availability`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(availabilities)
    });
    if (!response.ok) {
      throw new Error('Failed to set professor availability');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error in setProfessorAvailability for professor ID ${professorId}:`, error);
    throw error;
  }
};

// Create a new professor
export const createProfessor = async (professor: Partial<Professor>): Promise<Professor> => {
  try {
    const token = localStorage.getItem('token');
    
    // If no ID is provided, generate one
    if (!professor.professor_id) {
      professor.professor_id = `PROF-${uuidv4().substring(0, 8)}`;
    }
    
    const response = await fetch(`${API_URL}/professors`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(professor)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create professor');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in createProfessor:', error);
    throw error;
  }
};

// Update an existing professor
export const updateProfessor = async (id: string, professor: Partial<Professor>): Promise<Professor> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/professors/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(professor)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update professor');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error in updateProfessor for ID ${id}:`, error);
    throw error;
  }
};

// Delete a professor
export const deleteProfessor = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/professors/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete professor');
    }
    const data = await response.json();
    return { success: true, message: data.message || 'Professor deleted successfully' };
  } catch (error) {
    console.error(`Error in deleteProfessor for ID ${id}:`, error);
    throw error;
  }
};

// Delete multiple professors
export const deleteProfessors = async (ids: string[]): Promise<{ success: boolean; message: string }> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/professors/batch-delete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete professors');
    }
    const data = await response.json();
    return { success: true, message: data.message || 'Professors deleted successfully' };
  } catch (error) {
    console.error(`Error in deleteProfessors:`, error);
    throw error;
  }
};

const professorService = {
  getAllProfessors,
  getProfessorsByDepartment,
  getProfessorsByCourse,
  getProfessorById,
  getProfessorAvailability,
  setProfessorAvailability,
  createProfessor,
  updateProfessor,
  deleteProfessor,
  deleteProfessors
};

export default professorService;
