import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface Student {
  id: string;
  name: string;
  username: string;
  houseId?: string;
}

interface StudentAuthData {
  student: Student | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  refreshAuth: () => void;
  logout: () => void;
}

export function useStudentAuth(): StudentAuthData {
  const [token, setToken] = useState<string | null>(null);

  // Initialize token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('studentToken');
    setToken(storedToken);
  }, []);

  // Query to verify student authentication
  const { data: student, isLoading, refetch } = useQuery({
    queryKey: ['/api/student/profile'],
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const refreshAuth = () => {
    const storedToken = localStorage.getItem('studentToken');
    setToken(storedToken);
    refetch();
  };

  const logout = () => {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentData');
    setToken(null);
    window.location.href = '/student-login';
  };

  // Auto-refresh token if it's close to expiring
  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000;
        const currentTime = Date.now();
        const timeUntilExpiry = expirationTime - currentTime;
        
        // If token expires in less than 1 day, try to refresh
        if (timeUntilExpiry < 24 * 60 * 60 * 1000 && timeUntilExpiry > 0) {
          console.log('Student token expiring soon, will auto-refresh on next login');
        } else if (timeUntilExpiry <= 0) {
          console.log('Student token expired, logging out');
          logout();
        }
      } catch (error) {
        console.error('Error parsing student token:', error);
      }
    }
  }, [token]);

  return {
    student: (student as Student) || null,
    isLoading,
    isAuthenticated: !!student && !!token,
    token,
    refreshAuth,
    logout,
  };
}