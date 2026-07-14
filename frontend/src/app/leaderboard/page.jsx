'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { analyticsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Trophy } from 'lucide-react';

export default function LeaderboardPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [data, setData]   = useState([]);
  const [loading, setLoad] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    analyticsAPI.leaderboard(20).then(r => setData(r.data.leaderboard || [])).catch(() => toast.error('Could not load')).finally(() => setLoad(false));
  }, [isAuthenticated]);

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl mx-auto animate-fade-in">
        <h1 className="text-2xl font-black flex items-center gap-2 mb-6">
          <Trophy size={24} className="text-yellow-400" /> Global Leaderboard
        </h1>
        <div className="space-y-2">
          {loading ? Array(10).fill(0).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />) :
            data.map(entry => (
              <div key={entry.rank} className={`glass-card p-4 border flex items-center gap-4 transition-base ${entry.is_current_user ? 'border-brand-500/40 bg-brand-500/5' : 'border-surface-border'}`}>
                <span className="text-xl w-8 text-center font-black" style={{ color: entry.rank === 1 ? '#fbbf24' : entry.rank === 2 ? '#94a3b8' : entry.rank === 3 ? '#f97316' : '#64748b' }}>
                  {entry.rank <= 3 ? ['🥇','🥈','🥉'][entry.rank-1] : `#${entry.rank}`}
                </span>
                <span className="text-2xl">{entry.level_icon}</span>
                <div className="flex-1">
                  <div className="font-semibold text-slate-200">{entry.username} {entry.is_current_user && <span className="text-xs text-brand-400 ml-1">(You)</span>}</div>
                  <div className="text-xs text-slate-500">{entry.level} · 🔥 {entry.streak} day streak</div>
                </div>
                <div className="text-right">
                  <div className="font-black gradient-text">{entry.xp} XP</div>
                  <div className="text-xs text-slate-500">{entry.badges_count} badges</div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </AppLayout>
  );
}
