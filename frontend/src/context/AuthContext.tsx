import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export type Role = 'EMPLOYEE' | 'MANAGER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  leaveBalance: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUserBalance: (newBalance: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Refresh profile data in background to ensure up-to-date balance/role
          const response = await api.get('/employees/profile');
          const updatedUser = response.data.data;
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (error) {
          console.error('Persistent authentication session recovery failed:', error);
          // Token interceptors will automatically redirect if token refresh fails.
        }
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password: pass });
      const { accessToken, refreshToken, employee } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(employee));

      setUser(employee);
      return employee;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch (error) {
      console.error('Remote logout reporting encountered a network failure:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const updateUserBalance = (newBalance: number) => {
    if (user) {
      const updated = { ...user, leaveBalance: newBalance };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUserBalance }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
