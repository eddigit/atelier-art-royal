import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  const checkAppState = useCallback(async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        return;
      }

      const currentUser = await base44.auth.me();
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      localStorage.removeItem('auth_token');
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    checkAppState();
  }, [checkAppState]);

  const login = async (email, password) => {
    const loggedInUser = await base44.auth.login(email, password);
    setUser(loggedInUser);
    setIsAuthenticated(true);
    setAuthError(null);
    return loggedInUser;
  };

  const register = async (email, password, fullName) => {
    const newUser = await base44.auth.register(email, password, fullName);
    setUser(newUser);
    setIsAuthenticated(true);
    setAuthError(null);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
    window.location.href = '/';
  };

  const navigateToLogin = (returnUrl) => {
    const url = returnUrl || window.location.href;
    window.location.href = `/Login?returnUrl=${encodeURIComponent(url)}`;
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      login,
      register,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
