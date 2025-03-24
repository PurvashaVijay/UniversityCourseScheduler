// src/services/authService.ts

// API base URL - points to our backend server
//const API_URL = 'http://localhost:8000/api';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Type definitions
interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: any;
}

const authService = {
  login: async (email: string, password: string, role: string): Promise<LoginResponse> => {
    try {
      // Endpoint depends on the role
      const endpoint = role === 'admin' ? 'auth/admin/login' : 'auth/professor/login';
      
      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      // If login was successful, store the token and user info
      /*if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }*/

      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return { success: true, message: data.message, token: data.token, user: data.user };
      }
      return { success: false, message: data.message || 'Login failed' };
      
      //return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection and try again.'
      };
    }
  },
  
  tempLogin: async (email: string): Promise<LoginResponse> => {
    try {
      const response = await fetch(`${API_URL}/auth/temp-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection and try again.'
      };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  /*
  getCurrentUser: async (): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },
  */
  getCurrentUser: async (): Promise<any> => {
    try {
      // First try to get user from localStorage to avoid API call failures
      const userString = localStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        return user;
      }
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Try API call
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const data = await response.json();
        return data.user;
      } catch (apiError) {
        console.error('API error in getCurrentUser:', apiError);
        // Fall back to localStorage user data if API call fails
        const userString = localStorage.getItem('user');
        if (userString) {
          return JSON.parse(userString);
        }
        throw apiError;
      }
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },
  
  getToken: () => {
    return localStorage.getItem('token');
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

export default authService;
