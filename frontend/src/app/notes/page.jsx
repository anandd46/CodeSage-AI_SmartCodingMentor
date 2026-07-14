'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { FileText, Plus } from 'lucide-react';

export default function NotesPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated]);

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-100 flex items-center gap-3">
              <FileText className="text-brand-400" size={32} />
              My Notes
            </h1>
            <p className="text-slate-500 mt-1">Keep track of your learning notes and insights</p>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Plus size={18} /> New Note
          </button>
        </div>
        <div className="glass-card p-12 text-center border border-surface-border">
          <FileText size={48} className="text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-400 mb-2">No notes yet</h2>
          <p className="text-slate-500 text-sm">Start taking notes as you learn DSA topics and debug code.</p>
        </div>
      </div>
    </AppLayout>
  );
}
