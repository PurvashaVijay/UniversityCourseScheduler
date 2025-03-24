// src/services/conflictService.ts

// Define the base API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Types
export interface Conflict {
  conflict_id: string;
  schedule_id: string;
  timeslot_id?: string;
  day_of_week?: string;
  conflict_type: string; // e.g., "NO_AVAILABLE_SLOT", "TIME_SLOT_CONFLICT"
  description: string;
  is_resolved: boolean;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ConflictDetail extends Conflict {
  courses: any[]; // The courses involved in the conflict
  schedule?: any;
}

// Fetch all conflicts
export const getAllConflicts = async (): Promise<Conflict[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/conflicts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch conflicts');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in getAllConflicts:', error);
    return [];
  }
};

// Get conflicts for a specific schedule
export const getConflictsBySchedule = async (scheduleId: string): Promise<Conflict[]> => {
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

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error in getConflictsBySchedule for schedule ID ${scheduleId}:`, error);
    return [];
  }
};

// Get conflict details
export const getConflictById = async (id: string): Promise<ConflictDetail> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/conflicts/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch conflict details');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error in getConflictById for ID ${id}:`, error);
    throw error;
  }
};

// Resolve a conflict
export const resolveConflict = async (
  conflictId: string, 
  resolution: { 
    resolution_notes: string, 
    changes?: any 
  }
): Promise<Conflict> => {
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

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error in resolveConflict for ID ${conflictId}:`, error);
    throw error;
  }
};

// Get conflict resolution suggestions
export const getConflictSuggestions = async (conflictId: string): Promise<any[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/conflicts/${conflictId}/suggestions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch conflict resolution suggestions');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error in getConflictSuggestions for ID ${conflictId}:`, error);
    return [];
  }
};

const conflictService = {
  getAllConflicts,
  getConflictsBySchedule,
  getConflictById,
  resolveConflict,
  getConflictSuggestions
};

export default conflictService;