// src/services/auth.service.ts
import apiService from './api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'professor';
    departmentId: string;
  };
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'professor';
  departmentId: string;
}

const authService = {
  loginAdmin: (credentials: LoginCredentials): Promise<AuthResponse> => {
    return apiService.post<AuthResponse>('/auth/admin/login', credentials);
  },

  loginProfessor: (credentials: LoginCredentials): Promise<AuthResponse> => {
    return apiService.post<AuthResponse>('/auth/professor/login', credentials);
  },

  getCurrentUser: (): Promise<User> => {
    return apiService.get<User>('/auth/me');
  },

  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  getUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },

  saveToken: (token: string): void => {
    localStorage.setItem('token', token);
  },

  saveUser: (user: User): void => {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

export default authService;