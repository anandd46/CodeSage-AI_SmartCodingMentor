'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { analyticsAPI } from '@/lib/api';
import { Users } from 'lucide-react';

export default function AchievementsPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [data, setData]    = useState(null);
  const [loading, setLoad] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    analyticsAPI.dashboard().then(r => setData(r.data)).finally(() => setLoad(false));
  }, [isAuthenticated]);

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto animate-fade-in">
        <h1 className="text-2xl font-black flex items-center gap-2 mb-2">
          <Users size={24} className="text-purple-400" /> Achievements
        </h1>
        <p className="text-slate-500 text-sm mb-6">Earn badges by reaching milestones. {data?.earned_badges_count || 0}/10 earned.</p>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array(10).fill(0).map((_, i) => <div key={i} className="skeleton h-36 rounded-xl" />)}</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(data?.badges || []).map(badge => (
              <div key={badge.id} className={`glass-card p-5 text-center border transition-all duration-300 ${badge.earned ? 'border-brand-500/30 glow-sm' : 'border-surface-border opacity-50 grayscale'}`}>
                <div className="text-4xl mb-3">{badge.icon}</div>
                <div className="font-bold text-sm text-slate-200 mb-1">{badge.name}</div>
                <div className="text-xs text-slate-500 mb-2">{badge.description}</div>
                {badge.earned ? (
                  <span className="badge badge-green text-xs">✅ Earned</span>
                ) : (
                  <span className="badge badge-gray text-xs">🔒 Locked</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
