// src/services/departmentService.ts

import { v4 as uuidv4 } from 'uuid';

// Define the base API URL
//const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Types
export interface Department {
  department_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface DepartmentDetail extends Department {
  programs?: any[];
  courses?: any[];
  professors?: any[];
}

// Fetch all departments
export const getAllDepartments = async (): Promise<Department[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/departments`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch departments');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in getAllDepartments:', error);
    throw error;
  }
};

// Fetch a single department by ID
export const getDepartmentById = async (id: string): Promise<DepartmentDetail> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/departments/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch department');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error in getDepartmentById for ID ${id}:`, error);
    throw error;
  }
};

// Create a new department
export const createDepartment = async (department: Partial<Department>): Promise<Department> => {
  try {
    const token = localStorage.getItem('token');
    
    // If no ID is provided, generate one
    if (!department.department_id) {
      department.department_id = `DEPT-${uuidv4().substring(0, 8)}`;
    }
    
    const response = await fetch(`${API_URL}/departments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(department)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create department');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in createDepartment:', error);
    throw error;
  }
};

// Update an existing department
export const updateDepartment = async (id: string, department: Partial<Department>): Promise<Department> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/departments/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(department)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update department');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error in updateDepartment for ID ${id}:`, error);
    throw error;
  }
};

// Delete a department
export const deleteDepartment = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/departments/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete department');
    }

    const data = await response.json();
    return { success: true, message: data.message || 'Department deleted successfully' };
  } catch (error) {
    console.error(`Error in deleteDepartment for ID ${id}:`, error);
    throw error;
  }
};

// Delete multiple departments
export const deleteDepartments = async (ids: string[]): Promise<{ success: boolean; message: string }> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/departments/batch-delete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete departments');
    }

    const data = await response.json();
    return { success: true, message: data.message || 'Departments deleted successfully' };
  } catch (error) {
    console.error(`Error in deleteDepartments:`, error);
    throw error;
  }
};
const departmentService = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  deleteDepartments
};
export default departmentService;
