import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { socketService } from '../websocket/socketService.js';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('chatflow_token'));
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await api.getUsers();
      if (res.success) {
        setAllUsers(res.users);
        return res.users;
      }
    } catch (e) {
      console.error('Failed to load users:', e);
    }
    return [];
  };
useEffect(() => {
  const initAuth = async () => {
    setIsLoading(true);

    const savedToken = localStorage.getItem('chatflow_token');

    if (savedToken) {
      try {
        const res = await api.getMe(savedToken);

        if (res.success && res.user) {
          setUser(res.user);
          setToken(savedToken);
          socketService.setUserId(res.user.id);
          await fetchUsers();
        } else {
          localStorage.removeItem('chatflow_token');
          localStorage.removeItem('chatflow_user_id');
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        localStorage.removeItem('chatflow_token');
        localStorage.removeItem('chatflow_user_id');
        setToken(null);
      }
    }

    setIsLoading(false);
  };

  initAuth();
}, []);

  const login = async (usernameOrEmail, password) => {
    try {
      const res = await api.login(usernameOrEmail, password);
      if (res.success && res.user) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('chatflow_token', res.token);
        localStorage.setItem('chatflow_user_id', res.user.id);
        socketService.setUserId(res.user.id);
        await fetchUsers();
        return { success: true };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (e) {
      return { success: false, message: e?.message || 'Network error during login' };
    }
  };

  const register = async (data) => {
    try {
      const res = await api.register(data);
      if (res.success && res.user) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('chatflow_token', res.token);
        localStorage.setItem('chatflow_user_id', res.user.id);
        socketService.setUserId(res.user.id);
        await fetchUsers();
        return { success: true };
      }
      return { success: false, message: res.message || 'Registration failed' };
    } catch (e) {
      return { success: false, message: e?.message || 'Network error during registration' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('chatflow_token');
    localStorage.removeItem('chatflow_user_id');
  };

  const switchUser = async (userId) => {
    const targetUser = allUsers.find((u) => u.id === userId);
    if (targetUser) {
      setUser(targetUser);
      localStorage.setItem('chatflow_user_id', targetUser.id);
      socketService.setUserId(targetUser.id);
    } else {
      const refreshed = await fetchUsers();
      const userFound = refreshed.find((u) => u.id === userId);
      if (userFound) {
        setUser(userFound);
        localStorage.setItem('chatflow_user_id', userFound.id);
        socketService.setUserId(userFound.id);
      }
    }
  };

  const updateUser = async (updatedFields) => {
    if (!user) return;
    try {
      const res = await api.updateProfile({
        userId: user.id,
        ...updatedFields,
      });
      if (res.success && res.user) {
        setUser(res.user);
        await fetchUsers();
      }
    } catch (e) {
      console.error('Failed to update profile:', e);
    }
  };

  const refreshUsers = async () => {
    await fetchUsers();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        allUsers,
        isLoading,
        login,
        register,
        logout,
        switchUser,
        updateUser,
        refreshUsers,
      }}
    >
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
