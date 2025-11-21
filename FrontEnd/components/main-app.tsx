'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/sidebar';
import Dashboard from '@/components/pages/dashboard';
import CountdownPage from '@/components/pages/countdown-page';
import StatsPage from '@/components/pages/stats-page';
import TotalTimePage from '@/components/pages/total-time-page';
import { AdminProvider } from '@/contexts/admin-context';
import AdminPage from '@/components/admin/admin-page';

interface MainAppProps {
  user: any;
  setUser: (user: any) => void;
}

type PageType = 'dashboard' | 'countdown' | 'stats' | 'total' | 'admin';

export default function MainApp({ user, setUser }: MainAppProps) {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');

  const handleLogout = () => {
    localStorage.removeItem('studyUser');
    setUser(null);
  };

  return (
    <AdminProvider>
      <div className="flex h-screen bg-background">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} user={user} onLogout={handleLogout} />
        <main className="flex-1 overflow-auto">
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'countdown' && <CountdownPage />}
          {currentPage === 'stats' && <StatsPage />}
          {currentPage === 'total' && <TotalTimePage />}
          {currentPage === 'admin' && <AdminPage />}
        </main>
      </div>
    </AdminProvider>
  );
}
