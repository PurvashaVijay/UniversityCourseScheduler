// src/services/programService.ts

import { v4 as uuidv4 } from 'uuid';

// Define the base API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Types
export interface Program {
  program_id: string;
  department_id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProgramDetail extends Program {
  department?: any;
  courses?: any[];
}

// Fetch all programs
export const getAllPrograms = async (): Promise<Program[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/programs`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch programs');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in getAllPrograms:', error);
    return [];
  }
};

// Fetch programs by department
export const getProgramsByDepartment = async (departmentId: string): Promise<Program[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/programs/department/${departmentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch programs by department');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error in getProgramsByDepartment for departmentId ${departmentId}:`, error);
    return [];
  }
};

// Fetch a single program by ID
export const getProgramById = async (id: string): Promise<ProgramDetail | null> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/programs/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch program');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error in getProgramById for ID ${id}:`, error);
    return null;
  }
};

// Create a new program
export const createProgram = async (program: Partial<Program>): Promise<Program> => {
  try {
    const token = localStorage.getItem('token');
    
    // If no ID is provided, generate one
    if (!program.program_id) {
      program.program_id = `PROG-${uuidv4().substring(0, 8)}`;
    }
    
    const response = await fetch(`${API_URL}/programs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(program)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create program');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in createProgram:', error);
    throw error;
  }
};

// Update an existing program
export const updateProgram = async (id: string, program: Partial<Program>): Promise<Program> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/programs/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(program)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update program');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error in updateProgram for ID ${id}:`, error);
    throw error;
  }
};

// Delete a program
export const deleteProgram = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/programs/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete program');
    }

    const data = await response.json();
    return { success: true, message: data.message || 'Program deleted successfully' };
  } catch (error) {
    console.error(`Error in deleteProgram for ID ${id}:`, error);
    throw error;
  }
};

// Delete multiple programs
export const deletePrograms = async (ids: string[]): Promise<{ success: boolean; message: string }> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/programs/batch-delete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete programs');
    }

    const data = await response.json();
    return { success: true, message: data.message || 'Programs deleted successfully' };
  } catch (error) {
    console.error(`Error in deletePrograms:`, error);
    throw error;
  }
};

const programService = {
  getAllPrograms,
  getProgramsByDepartment,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  deletePrograms
};

export default programService;