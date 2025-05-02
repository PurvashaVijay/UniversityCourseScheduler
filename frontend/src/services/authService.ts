// src/services/authService.ts

// API base URL - points to our backend server
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Type definitions
interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: any;
}

interface RegisterResponse {
  success: boolean;
  message?: string;
  user?: any;
}

const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      // Log the API URL for debugging
      console.log('Using API URL:', `${API_URL}/auth/admin/login`);
  
      const response = await fetch(`${API_URL}/auth/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      // Log response status
      console.log('Login response status:', response.status);
      
      // If response is not OK, get the error text
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Login error response:', errorText);
        return {
          success: false,
          message: 'Login failed: ' + (response.statusText || 'Unknown error')
        };
      }
      
      const data = await response.json();
      
      if (data.token) {
        // Store token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        return {
          success: true,
          message: 'Login successful',
          token: data.token,
          user: data.user
        };
      }
      
      return {
        success: false,
        message: data.message || 'Login failed'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection and try again.'
      };
    }
  },

  register: async (firstName: string, lastName: string, email: string, password: string): Promise<RegisterResponse> => {
    try {
      // Validate email domain on client side first
      if (!email.endsWith('@udel.edu')) {
        return {
          success: false,
          message: 'Only @udel.edu email addresses are allowed'
        };
      }
      
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          password
        }),
      });
      
      const data = await response.json();
      
      return {
        success: response.ok,
        message: data.message,
        user: data.user
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection and try again.'
      };
    }
  },
  
  tempLogin: async (email: string): Promise<LoginResponse> => {
    try {
      // Validate email domain on client side first
      if (!email.endsWith('@udel.edu')) {
        return {
          success: false,
          message: 'Only @udel.edu email addresses are allowed'
        };
      }
      
      const response = await fetch(`${API_URL}/auth/temp-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (data.token) {
        // Store token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        return {
          success: true,
          message: data.message || 'Temporary login successful',
          token: data.token,
          user: data.user
        };
      }
      
      return {
        success: false,
        message: data.message || 'Temporary login failed'
      };
    } catch (error) {
      console.error('Temp login error:', error);
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