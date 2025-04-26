// src/services/dashboardService.ts

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

interface DashboardData {
  departments: number;
  programs: number;
  courses: number;
  professors: number;
  activeSchedules: number;
  pendingConflicts: number;
}

const dashboardService = {
  getDashboardStats: async (): Promise<DashboardData> => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${API_URL}/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return default values if API call fails
      return {
        departments: 0,
        programs: 0,
        courses: 0,
        professors: 0,
        activeSchedules: 0,
        pendingConflicts: 0
      };
    }
  }
};

export default dashboardService;