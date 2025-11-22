import React, { createContext, useContext, useState, useEffect } from 'react';
import APIService from '../services/apiService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data from localStorage on component mount
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedAccessToken = localStorage.getItem('accessToken');
        const storedRefreshToken = localStorage.getItem('refreshToken');

        if (storedUser && storedAccessToken) {
          setUser(JSON.parse(storedUser));
          setAccessToken(storedAccessToken);
          setRefreshToken(storedRefreshToken);
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
        // Clear corrupted data
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  // Save user data to localStorage whenever it changes
  useEffect(() => {
    if (user && accessToken) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
    }
  }, [user, accessToken, refreshToken]);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      console.log('AuthContext login called with:', { email, password });

      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      // Call backend API
      const result = await APIService.login(email, password);
      console.log('APIService login result:', result);

      if (result.success) {
        // Set user data from API response
        const { user, token } = result;
        
        setUser(user);
        setAccessToken(token);
        // For simplicity, we're using the same token for refresh token
        // In a real application, you would have separate refresh tokens
        setRefreshToken(token);

        // Return user data for navigation handling in components
        return { success: true, user };
      } else {
        throw new Error(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);

      // Validate required fields
      if (!userData.name || !userData.email || !userData.password || !userData.role) {
        throw new Error('All required fields must be filled');
      }

      if (!userData.email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      if (userData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      if (userData.password !== userData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (userData.role === 'student' && !userData.registrationNumber) {
        throw new Error('Registration number is required for students');
      }

      // Call backend API
      const result = await APIService.register({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        registrationNumber: userData.role === 'student' ? userData.registrationNumber : undefined,
        department: userData.role === 'faculty' ? 'Computer Science' : undefined
      });

      if (result.success) {
        // Set user data from API response
        // APIService.register returns { success: true, user, token, data } where data contains user info
        const { user, token } = result.data;
        
        setUser(user);
        setAccessToken(token);
        // For simplicity, we're using the same token for refresh token
        // In a real application, you would have separate refresh tokens
        setRefreshToken(token);

        // Return user data for navigation handling in components
        return { success: true, user };
      } else {
        throw new Error(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    // Call API service logout
    APIService.logout();
    // Navigation will be handled by the component calling logout
  };

  const refreshAccessToken = async () => {
    try {
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // In a real application, you would call the refresh token endpoint
      // For now, we'll just return the existing token
      return accessToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout user
      logout();
      throw error;
    }
  };

  const isAuthenticated = () => {
    return !!(user && accessToken);
  };

  const hasRole = (requiredRole) => {
    return user && user.role === requiredRole;
  };

  const hasAnyRole = (roles) => {
    return user && roles.includes(user.role);
  };

  const value = {
    user,
    accessToken,
    refreshToken,
    isLoading,
    login,
    register,
    logout,
    refreshAccessToken,
    isAuthenticated,
    hasRole,
    hasAnyRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;