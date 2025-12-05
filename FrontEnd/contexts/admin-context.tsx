'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser, TaskRecord } from '@/types/admin';

interface AdminContextType {
  users: AdminUser[];
  tasks: TaskRecord[];
  loading: boolean;
  updateUserStatus: (userId: string, status: 'active' | 'inactive' | 'suspended') => void;
  getUserTasks: (userId: string) => TaskRecord[];
  deleteUser: (userId: string) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUsers = localStorage.getItem('adminUsers');
    const savedTasks = localStorage.getItem('adminTasks');
    
    if (savedUsers) setUsers(JSON.parse(savedUsers));
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    
    setLoading(false);
  }, []);

  const updateUserStatus = (userId: string, status: 'active' | 'inactive' | 'suspended') => {
    setUsers(users.map(u => u.id === userId ? { ...u, status } : u));
  };

  const getUserTasks = (userId: string) => {
    return tasks.filter(t => t.userId === userId);
  };

  const deleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
  };

  return (
    <AdminContext.Provider value={{ users, tasks, loading, updateUserStatus, getUserTasks, deleteUser }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within AdminProvider');
  return context;
}
