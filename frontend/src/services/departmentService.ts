// src/services/departmentService.ts
import authService from './authService';

// Define TypeScript interfaces
export interface DepartmentDetail {
  department_id: string;
  name: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Add this interface for components that import Department
export interface Department {
  department_id: string;
  name: string;
  description?: string;
}

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Helper function for authentication headers
const getAuthHeaders = () => {
  const token = authService.getToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Service functions
const getDepartmentById = async (id: string): Promise<DepartmentDetail> => {
  try {
    console.log(`Fetching department with ID: ${id}`);
    const response = await fetch(`${API_URL}/departments/${id}`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
      console.error(`Error response from server when fetching department ${id}:`, {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      });
      throw new Error(errorData.message || `Failed to fetch department (Status: ${response.status})`);
    }

    const data = await response.json();
    console.log(`Successfully fetched department:`, data);
    return data;
  } catch (error) {
    console.error(`Error in getDepartmentById for ID ${id}:`, error);
    throw error;
  }
};

// Create new department
const createDepartment = async (department: DepartmentDetail): Promise<DepartmentDetail> => {
  try {
    console.log('Creating new department with data:', department);
    const response = await fetch(`${API_URL}/departments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(department)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
      console.error('Server responded with error for create:', {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      });
      throw new Error(errorData.message || `Failed to create department (Status: ${response.status})`);
    }

    const data = await response.json();
    console.log('Department created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating department:', error);
    throw error;
  }
};

// Update department
const updateDepartment = async (id: string, department: Partial<DepartmentDetail>): Promise<DepartmentDetail> => {
  try {
    console.log(`Updating department with ID: ${id}`, department);
    
    // Remove created_at and updated_at if they exist to avoid validation issues
    const { created_at, updated_at, ...updateData } = department;
    
    const response = await fetch(`${API_URL}/departments/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData)
    });
    
    console.log(`Update request sent with body:`, JSON.stringify(updateData));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
      console.error(`Server responded with error when updating department ${id}:`, {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      });
      throw new Error(errorData.message || `Failed to update department (Status: ${response.status})`);
    }

    const data = await response.json();
    console.log('Department updated successfully:', data);
    return data;
  } catch (error) {
    console.error(`Error updating department ${id}:`, error);
    throw error;
  }
};
/*
// Delete department
const deleteDepartment = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`Deleting department with ID: ${id}`);
    const response = await fetch(`${API_URL}/departments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    console.log(`Delete request sent for department ID: ${id}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
      console.error(`Server responded with error when deleting department ${id}:`, {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      });
      throw new Error(errorData.message || `Failed to delete department (Status: ${response.status})`);
    }

    const data = await response.json();
    console.log('Department deleted successfully:', data);
    return { success: true, message: data.message || 'Department deleted successfully' };
  } catch (error) {
    console.error(`Error deleting department ${id}:`, error);
    throw error;
  }
};
*/

const deleteDepartment = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Add validation
    if (!id || id === 'undefined') {
      console.error('Invalid department ID provided for deletion:', id);
      throw new Error('Invalid department ID');
    }
    
    console.log(`Deleting department with ID: ${id}`);
    const response = await fetch(`${API_URL}/departments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    console.log(`Delete request sent for department ID: ${id}, Status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
      console.error(`Server responded with error when deleting department ${id}:`, {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      });
      throw new Error(errorData.message || `Failed to delete department (Status: ${response.status})`);
    }

    const data = await response.json();
    console.log('Department deleted successfully:', data);
    return { success: true, message: data.message || 'Department deleted successfully' };
  } catch (error) {
    console.error(`Error deleting department ${id}:`, error);
    throw error;
  }
};

// Delete multiple departments
const deleteDepartments = async (ids: string[]): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('Deleting multiple departments:', ids);
    const response = await fetch(`${API_URL}/departments/batch-delete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ids })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
      console.error('Server responded with error for batch delete:', {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      });
      throw new Error(errorData.message || `Failed to delete departments (Status: ${response.status})`);
    }

    const data = await response.json();
    console.log('Departments deleted successfully:', data);
    return { success: true, message: data.message || 'Departments deleted successfully' };
  } catch (error) {
    console.error('Error in deleteDepartments:', error);
    throw error;
  }
};

// Get all departments
const getAllDepartments = async (): Promise<DepartmentDetail[]> => {
  try {
    console.log('Fetching all departments');
    const response = await fetch(`${API_URL}/departments`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
      console.error('Server responded with error when fetching all departments:', {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      });
      throw new Error(errorData.message || `Failed to fetch departments (Status: ${response.status})`);
    }

    const data = await response.json();
    console.log('Successfully fetched all departments:', data);
    return data;
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }
};

// Export all functions
const departmentService = {
  createDepartment,
  updateDepartment,
  deleteDepartment,
  deleteDepartments,
  getDepartmentById,
  getAllDepartments
};

export default departmentService;