import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../services/api';

// 🚀 CREATE THE MASTER AUTH INLINE CONTEXT OBJECT
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Safe session initialization layer
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      localStorage.clear();
      setCurrentYearId('');
      return null;
    }
  });
  const [currentYearId, setCurrentYearId] = useState(() => {
    return localStorage.getItem('selectedAcademicYearId') || user?.academicYearId || '';
  });
  // Re-wired API Login pipeline to support thin controllers
  const login = async (email, password) => {
    // eslint-disable-next-line no-useless-catch
    try {
      const response = await API.post('/auth/login', { email, password });
      const { token, user: authenticatedUser } = response.data;

      if (!token || !authenticatedUser) {
        throw new Error('Malformed token collection payload package.');
      }

      // Commit parameters to persistent storage cells
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(authenticatedUser));

      // Inject global bearer authorization headers instantly
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(authenticatedUser);
      return authenticatedUser;
    } catch (error) {
      throw error; // Passes errors to the form to be rendered by SweetAlert
    }
  };

  const logout = () => {
    localStorage.clear();
    delete API.defaults.headers.common['Authorization'];
    setUser(null);
    setCurrentYearId('');
  };

  // Bind active token string onto manual hard-refreshes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, currentYearId, setCurrentYearId }}>
      {children}
    </AuthContext.Provider>
  );
};

// ⚡ EXPORT CONSTRAINT COMPLIANCE FIX: Removed the standalone 'useAuth' custom hook
// declaration from this file to stop Vite's Fast Refresh module invalidation loops!
