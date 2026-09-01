import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { api } from '../services/api';
import { socketService } from '../websocket/socketService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  allUsers: User[];
  isLoading: boolean;
  login: (usernameOrEmail: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: {
    fullName: string;
    username: string;
    email: string;
    phone?: string;
    password: string;
    profileImage?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchUser: (userId: string) => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('chatflow_token'));
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
      const usersList = await fetchUsers();

      // Check saved user ID or fallback to Raj Saroj
      const savedUserId = localStorage.getItem('chatflow_user_id') || 'user_raj';
      const currentUser = usersList.find((u) => u.id === savedUserId) || usersList[0] || null;

      if (currentUser) {
        setUser(currentUser);
        socketService.setUserId(currentUser.id);
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (usernameOrEmail: string, password?: string) => {
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
    } catch (e: any) {
      return { success: false, message: e.message || 'Network error during login' };
    }
  };

  const register = async (data: {
    fullName: string;
    username: string;
    email: string;
    phone?: string;
    password: string;
    profileImage?: string;
  }) => {
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
    } catch (e: any) {
      return { success: false, message: e.message || 'Network error during registration' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('chatflow_token');
    localStorage.removeItem('chatflow_user_id');
  };

  const switchUser = async (userId: string) => {
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

  const updateUser = async (updatedFields: Partial<User>) => {
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
