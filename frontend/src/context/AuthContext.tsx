// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth.service';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'professor';
  departmentId: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  loginAdmin: (credentials: LoginCredentials) => Promise<void>;
  loginProfessor: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const initializeAuth = async () => {
      const token = authService.getToken();
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
          authService.saveUser(userData);
        } catch (error) {
          console.error('Failed to fetch user:', error);
          authService.logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const loginAdmin = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const response = await authService.loginAdmin(credentials);
      authService.saveToken(response.token);
      setUser(response.user);
      authService.saveUser(response.user);
    } finally {
      setLoading(false);
    }
  };

  const loginProfessor = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const response = await authService.loginProfessor(credentials);
      authService.saveToken(response.token);
      setUser(response.user);
      authService.saveUser(response.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        loginAdmin,
        loginProfessor,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};