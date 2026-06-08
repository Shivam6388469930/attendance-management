import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { authApi } from '../api';
import { useNavigate, useLocation } from 'react-router-dom';

// Constants
const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'auth_user',
  REFRESH_TOKEN: 'refresh_token',
  TOKEN_EXPIRY: 'token_expiry'
};

// Initial state
const initialState = {
  user: null,
  loading: true,
  isAuthenticated: false,
  error: null
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState(initialState);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Helper functions
  const setAuthState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const clearAuthStorage = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }, []);

  const setAuthStorage = useCallback((token, user, refreshToken = null, expiresIn = null) => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    
    if (refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
    
    if (expiresIn) {
      const expiryTime = Date.now() + (expiresIn * 1000);
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
    }
  }, []);

  const isTokenExpired = useCallback(() => {
    const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    if (!expiry) return false;
    return Date.now() > parseInt(expiry);
  }, []);

  // Check if user is logged in on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
        
        if (!token || !storedUser) {
          setAuthState({ loading: false, isAuthenticated: false });
          return;
        }

        // Check if token is expired
        if (isTokenExpired()) {
          console.warn('Token expired, attempting to refresh...');
          const refreshed = await refreshToken();
          if (!refreshed) {
            clearAuthStorage();
            setAuthState({ loading: false, isAuthenticated: false, user: null });
            return;
          }
        }

        // Verify token with backend
        const response = await authApi.getMe();
        const userData = response.data;
        
        // Update stored user if changed
        if (storedUser !== JSON.stringify(userData)) {
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
        }
        
        setAuthState({
          user: userData,
          loading: false,
          isAuthenticated: true,
          error: null
        });
      } catch (error) {
        console.error('Auth check failed:', error);
        clearAuthStorage();
        setAuthState({
          user: null,
          loading: false,
          isAuthenticated: false,
          error: error.response?.data?.message || 'Authentication failed'
        });
      }
    };

    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearAuthStorage, isTokenExpired, setAuthState]);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    try {
      const refreshTokenValue = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshTokenValue) return false;
      
      const response = await authApi.refreshToken({ refreshToken: refreshTokenValue });
      const { token, expiresIn } = response.data;
      
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      if (expiresIn) {
        const expiryTime = Date.now() + (expiresIn * 1000);
        localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
      }
      
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      setAuthState({ loading: true, error: null });
      
      const response = await authApi.login({ email, password });
      const { token, user, refreshToken, expiresIn } = response.data;
      
      if (!token || !user) {
        throw new Error('Invalid response from server');
      }
      
      setAuthStorage(token, user, refreshToken, expiresIn);
      setAuthState({
        user,
        loading: false,
        isAuthenticated: true,
        error: null
      });
      
      // Redirect to intended location or dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
      
      return { success: true, user };
    } catch (error) {
      console.error('Login failed:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false,
        error: errorMessage
      });
      
      return { success: false, error: errorMessage };
    }
  }, [navigate, location, setAuthState, setAuthStorage]);

  // Logout function
  const logout = useCallback(async (redirectToLogin = true) => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      
      // Attempt to notify backend (don't await to avoid blocking)
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token) {
        authApi.logout().catch(err => console.error('Logout API error:', err));
      }
      
      // Clear all auth data
      clearAuthStorage();
      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false,
        error: null
      });
      
      // Redirect to login
      if (redirectToLogin) {
        navigate('/login', { replace: true });
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local storage even if API fails
      clearAuthStorage();
      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false,
        error: null
      });
      
      if (redirectToLogin) {
        navigate('/login', { replace: true });
      }
    } finally {
      setIsLoggingOut(false);
    }
  }, [clearAuthStorage, navigate, isLoggingOut]);

  // Update user profile
  const updateUser = useCallback(async (userData) => {
    try {
      const response = await authApi.updateProfile(userData);
      const updatedUser = response.data;
      
      // Update state and storage
      setAuthState({ user: updatedUser });
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('User update failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update profile' 
      };
    }
  }, [setAuthState]);

  // Change password
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      return { success: true };
    } catch (error) {
      console.error('Password change failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to change password' 
      };
    }
  }, []);

  // Auto logout on token expiry (check every minute)
  useEffect(() => {
    if (!state.isAuthenticated) return;
    
    const checkTokenExpiry = setInterval(() => {
      if (isTokenExpired()) {
        console.warn('Token expired, logging out...');
        logout(true);
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(checkTokenExpiry);
  }, [state.isAuthenticated, isTokenExpired, logout]);

  // Memoized context value
  const contextValue = useMemo(() => ({
    // State
    user: state.user,
    loading: state.loading,
    isAuthenticated: state.isAuthenticated,
    error: state.error,
    
    // Actions
    login,
    logout,
    updateUser,
    changePassword,
    refreshToken,
    
    // Helpers
    hasRole: (role) => {
      if (!state.user) return false;
      if (Array.isArray(role)) {
        return role.some(r => state.user.role === r);
      }
      return state.user.role === role;
    },
    
    hasPermission: (permission) => {
      if (!state.user?.permissions) return false;
      return state.user.permissions.includes(permission);
    }
  }), [state, login, logout, updateUser, changePassword, refreshToken]);

  // Loading screen
  if (state.loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook with error checking
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Optional: HOC to protect routes
export const withAuth = (WrappedComponent, requiredRoles = null) => {
  return function WithAuthComponent(props) {
    const { isAuthenticated, user, loading } = useAuth();
    const navigate = useNavigate();
    
    useEffect(() => {
      if (!loading) {
        if (!isAuthenticated) {
          navigate('/login', { state: { from: window.location.pathname } });
        } else if (requiredRoles && !requiredRoles.includes(user?.role)) {
          navigate('/unauthorized');
        }
      }
    }, [isAuthenticated, loading, navigate, user]);
    
    if (loading) return <div>Loading...</div>;
    if (!isAuthenticated) return null;
    if (requiredRoles && !requiredRoles.includes(user?.role)) return null;
    
    return <WrappedComponent {...props} />;
  };
};