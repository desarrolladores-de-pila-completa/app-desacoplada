import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verificar autenticación al inicializar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('token');
        if (storedUser && token) {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Función de login
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password }, { withCredentials: true });
      const data = response.data;
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  };

  // Función de registro
  const register = async (email, password) => {
    try {
      const response = await api.post('/auth/register', { email, password }, { withCredentials: true });
      const data = response.data;
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Error en registro:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  };

  // Función de logout
  const logout = async () => {
    try {
      await api.post('/auth/logout', {}, { withCredentials: true });
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  // Función para actualizar usuario
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};