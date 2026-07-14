'use client';

import { useAuth } from '@/lib/auth';
import Sidebar from '@/components/layout/Sidebar';

export default function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content min-h-screen bg-surface">
        {children}
      </main>
    </div>
  );
}
