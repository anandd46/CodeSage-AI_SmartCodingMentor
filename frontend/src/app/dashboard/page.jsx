'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import AppLayout from '@/components/layout/AppLayout';
import { analyticsAPI } from '@/lib/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import { Trophy, Zap, Flame, BookOpen, Target, Star, ChevronRight, TrendingUp, Award, Activity } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="glass-card p-5 border border-surface-border">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      <div className="text-2xl font-black text-slate-100">{value}</div>
      <div className="text-sm text-slate-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-slate-600 mt-1">{sub}</div>}
    </div>
  );
}

function SkeletonCard() {
  return <div className="skeleton h-28 rounded-xl" />;
}

export default function DashboardPage() {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchDashboard();

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const wsBase = apiBase.replace(/^http/, 'ws');
    const userId = user?.id || user?.user_id;
    let socket;

    if (userId) {
      const wsUrl = `${wsBase}/api/analytics/ws/${userId}`;
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'dashboard_update' || payload.type === 'initial_state') {
            setData(payload.data);
            refreshUser();
          }
        } catch (err) {
          console.error("Websocket parse error", err);
        }
      };

      socket.onclose = () => {
        console.log("Dashboard WebSocket disconnected");
      };
    }

    return () => {
      if (socket) socket.close();
    };
  }, [isAuthenticated, user]);

  const fetchDashboard = async () => {
    try {
      const res = await analyticsAPI.dashboard();
      setData(res.data);
    } catch (err) {
      toast.error('Could not load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Activity chart data from recent_activity
  const chartData = data?.recent_activity?.slice(0, 10).reverse().map((a, i) => ({
    name: a.date?.slice(5) || `Day ${i+1}`,
    xp: a.xp || 0,
  })) || [];

  // Radar chart for skills
  const radarData = data?.weak_areas?.map(w => ({
    topic: w.topic?.length > 10 ? w.topic.slice(0,10)+'…' : w.topic,
    score: 100 - (w.score || 50),
  })) || [];

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-100">
              Welcome back, <span className="gradient-text">{data?.username || user?.username}</span> 👋
            </h1>
            <p className="text-slate-500 mt-1">Here's your learning progress</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{data?.level_icon || '🌱'}</span>
            <div>
              <div className="text-sm font-bold text-slate-200">{data?.level || 'Novice'}</div>
              <div className="text-xs text-slate-500">{data?.xp || 0} XP total</div>
            </div>
          </div>
        </div>

        {/* XP Progress */}
        {data && (
          <div className="glass-card p-5 mb-6 border border-brand-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-300">{data.level} → {data.next_level}</span>
              <span className="text-sm text-brand-400 font-bold">{data.xp_to_next_level} XP to next level</span>
            </div>
            <div className="xp-bar">
              <div
                className="xp-bar-fill"
                style={{ width: `${Math.min(100 - (data.xp_to_next_level / 1000) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {loading ? (
            Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard icon={Zap}     label="Total XP"      value={data?.xp || 0}              color="bg-brand-500"   sub="Keep going!" />
              <StatCard icon={Flame}   label="Day Streak"    value={data?.streak || 0}            color="bg-orange-500"  sub="Days in a row" />
              <StatCard icon={BookOpen} label="Sessions"     value={data?.total_sessions || 0}    color="bg-cyan-500"    sub="Total learning sessions" />
              <StatCard icon={Award}   label="Achievements"  value={`${data?.earned_badges_count || 0}/10`} color="bg-purple-500" sub="Badges earned" />
            </>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* XP Activity Chart */}
          <div className="lg:col-span-2 glass-card p-5 border border-surface-border">
            <h2 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-brand-400" /> XP Earned (Recent Activity)
            </h2>
            {loading ? (
              <div className="skeleton h-40 rounded-lg" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', color: '#f1f5f9' }} />
                  <Area type="monotone" dataKey="xp" stroke="#6366f1" fill="url(#xpGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-600 text-sm">
                No activity yet. Start learning to see your progress!
              </div>
            )}
          </div>

          {/* Weak Areas */}
          <div className="glass-card p-5 border border-surface-border">
            <h2 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
              <Target size={16} className="text-red-400" /> AI-Detected Weak Areas
            </h2>
            {loading ? (
              <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-12 rounded" />)}</div>
            ) : (
              <div className="space-y-3">
                {(data?.weak_areas || []).map(area => (
                  <div key={area.topic} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300 font-medium">{area.topic}</span>
                        <span className="text-slate-500">{area.score}%</span>
                      </div>
                      <div className="h-1.5 bg-surface-border rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500" style={{ width: `${area.score}%` }} />
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">{area.predicted_issue}</div>
                    </div>
                    <Link href="/learn" className="text-xs text-brand-400 hover:text-brand-300 transition-base whitespace-nowrap">
                      Learn →
                    </Link>
                  </div>
                ))}
                {(!data?.weak_areas || data.weak_areas.length === 0) && (
                  <div className="text-slate-600 text-sm text-center py-4">Start practicing to detect weak areas</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Leaderboard */}
          <div className="glass-card p-5 border border-surface-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <Trophy size={16} className="text-yellow-400" /> Top Learners
              </h2>
              <Link href="/leaderboard" className="text-xs text-brand-400 hover:text-brand-300">View all →</Link>
            </div>
            {loading ? (
              <div className="space-y-2">{Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-10 rounded" />)}</div>
            ) : (
              <div className="space-y-2">
                {(data?.leaderboard || []).slice(0, 5).map(entry => (
                  <div key={entry.rank} className={`flex items-center gap-3 p-2 rounded-lg transition-base ${entry.is_current_user ? 'bg-brand-500/10 border border-brand-500/20' : 'hover:bg-surface-hover'}`}>
                    <span className="text-sm font-bold w-5 text-center"
                      style={{ color: entry.rank === 1 ? '#fbbf24' : entry.rank === 2 ? '#94a3b8' : entry.rank === 3 ? '#f97316' : '#64748b' }}>
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                    </span>
                    <span className="text-lg">{entry.level_icon}</span>
                    <span className="flex-1 text-sm font-medium text-slate-300">{entry.username}</span>
                    <span className="text-xs text-brand-400 font-bold">{entry.xp} XP</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Achievements */}
          <div className="glass-card p-5 border border-surface-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <Star size={16} className="text-purple-400" /> Achievements
              </h2>
              <Link href="/achievements" className="text-xs text-brand-400 hover:text-brand-300">View all →</Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-5 gap-2">{Array(10).fill(0).map((_, i) => <div key={i} className="skeleton h-12 rounded-lg" />)}</div>
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {(data?.badges || []).map(badge => (
                  <div
                    key={badge.id}
                    title={`${badge.name}: ${badge.description}`}
                    className={`h-12 rounded-lg flex items-center justify-center text-xl cursor-default transition-base
                      ${badge.earned ? 'bg-surface-hover border border-brand-500/30 glow-sm' : 'bg-surface-card border border-surface-border opacity-40 grayscale'}`}
                  >
                    {badge.icon}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/debug',     label: 'Debug Code',   icon: '🐛', color: 'border-yellow-500/20 bg-yellow-500/5' },
            { href: '/learn',     label: 'Learn DSA',    icon: '📚', color: 'border-indigo-500/20 bg-indigo-500/5' },
            { href: '/practice',  label: 'Practice',     icon: '💡', color: 'border-cyan-500/20 bg-cyan-500/5' },
            { href: '/interview', label: 'Mock Interview',icon: '🎯', color: 'border-purple-500/20 bg-purple-500/5' },
          ].map(({ href, label, icon, color }) => (
            <Link key={href} href={href} className={`glass-card p-4 text-center border ${color} hover:scale-[1.02] transition-all duration-200`}>
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-xs font-semibold text-slate-300">{label}</div>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
