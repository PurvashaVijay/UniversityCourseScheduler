// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin'; // Changed to only allow 'admin' role
  department_id: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>; // Removed role parameter
  logout: () => void;
  checkAuth: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  logout: () => {},
  checkAuth: async () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setLoading(false);
    };

    initAuth();
  }, []);

  const checkAuth = async (): Promise<boolean> => {
    try {
      if (!authService.isAuthenticated()) {
        return false;
      }

      const currentUser = await authService.getCurrentUser();
      
      if (currentUser) {
        // Transform the user object to match our User type
        // Always set role as 'admin' regardless of what comes from the API
        const userData: User = {
          id: currentUser.admin_id || currentUser.id,
          email: currentUser.email,
          first_name: currentUser.first_name,
          last_name: currentUser.last_name,
          role: 'admin', // Always admin
          department_id: currentUser.department_id,
        };
        
        setUser(userData);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Auth check failed:', error);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      // Always use 'admin' role
      const result = await authService.login(email, password);
      
      if (result.success && result.user) {
        // Transform the user object to match our User type
        const userData: User = {
          id: result.user.admin_id || result.user.id,
          email: result.user.email,
          first_name: result.user.first_name,
          last_name: result.user.last_name,
          role: 'admin', // Always admin
          department_id: result.user.department_id,
        };
        
        setUser(userData);
        return { success: true };
      }
      
      return { success: false, message: result.message };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: (error instanceof Error) ? error.message : 'An unexpected error occurred'
      };
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
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
