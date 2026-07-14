'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { learnAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Map, Target, Download, Clock } from 'lucide-react';

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const CAREER_GOALS = ['Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'Data Scientist', 'ML Engineer', 'DevOps Engineer', 'Competitive Programmer', 'FAANG Engineer', 'Mobile Developer'];
const TOPICS_LIST  = ['Arrays', 'Linked Lists', 'Trees', 'Graphs', 'Dynamic Programming', 'Recursion', 'Binary Search', 'Sorting', 'Hash Tables', 'System Design'];

export default function RoadmapPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    skill_level: 'Beginner',
    career_goal: 'Full Stack Developer',
    weak_topics: [],
    completed_topics: [],
    available_hours_per_week: 10,
  });
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated]);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await learnAPI.roadmap(form);
      setRoadmap(res.data);
    } catch { toast.error('Roadmap generation failed'); }
    finally { setLoading(false); }
  };

  const toggleTopic = (topic, field) => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(topic) ? f[field].filter(t => t !== topic) : [...f[field], topic],
    }));
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto animate-fade-in">
        <h1 className="text-2xl font-black flex items-center gap-2 mb-2">
          <Map size={24} className="text-emerald-400" /> AI Learning Roadmap
        </h1>
        <p className="text-slate-500 text-sm mb-6">Get a personalized, week-by-week DSA and development roadmap</p>

        {!roadmap ? (
          <div className="glass-card p-6 border border-surface-border space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 mb-2 block">Skill Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {SKILL_LEVELS.map(l => (
                    <button key={l} onClick={() => setForm(f => ({ ...f, skill_level: l }))}
                      className={`py-2 rounded-lg text-sm font-medium border transition-base ${form.skill_level === l ? 'border-brand-500 bg-brand-500/20 text-brand-300' : 'border-surface-border text-slate-500 hover:border-slate-500'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-2 block">Career Goal</label>
                <select value={form.career_goal} onChange={e => setForm(f => ({ ...f, career_goal: e.target.value }))} className="input-base text-sm">
                  {CAREER_GOALS.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-2 block">Weak Topics (select all that apply)</label>
              <div className="flex flex-wrap gap-2">
                {TOPICS_LIST.map(t => (
                  <button key={t} onClick={() => toggleTopic(t, 'weak_topics')}
                    className={`badge transition-base cursor-pointer ${form.weak_topics.includes(t) ? 'badge-red' : 'badge-gray'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-2 block">Hours Available Per Week</label>
              <div className="flex items-center gap-3">
                <input type="range" min={2} max={40} value={form.available_hours_per_week}
                  onChange={e => setForm(f => ({ ...f, available_hours_per_week: +e.target.value }))}
                  className="flex-1" />
                <span className="text-brand-400 font-bold w-16">{form.available_hours_per_week} hrs</span>
              </div>
            </div>

            <button onClick={generate} disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</> : <><Target size={16} /> Generate My Roadmap</>}
            </button>
          </div>
        ) : (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-400 text-sm">{roadmap.career_goal} · {roadmap.total_weeks} weeks</div>
                <div className="text-xs text-slate-600 mt-0.5">{roadmap.estimated_completion}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setRoadmap(null)} className="btn-secondary text-sm px-4">← Reconfigure</button>
              </div>
            </div>

            {/* Daily Schedule */}
            {roadmap.daily_schedule && (
              <div className="glass-card p-4 border border-cyan-500/20 bg-cyan-500/5">
                <div className="flex items-center gap-2 text-sm text-cyan-300">
                  <Clock size={14} /> <strong>Daily Schedule:</strong> {roadmap.daily_schedule}
                </div>
              </div>
            )}

            {/* Phases */}
            <div className="space-y-4">
              {(roadmap.phases || []).map((phase, i) => (
                <div key={i} className="glass-card p-5 border border-surface-border hover:border-brand-500/20 transition-base">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-xs text-brand-400 font-bold">{phase.phase}</span>
                        <h3 className="font-bold text-slate-100">{phase.title}</h3>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 ml-8">{phase.weeks} weeks · ~{Math.round(phase.estimated_hours / phase.weeks)} hrs/week</div>
                    </div>
                    <span className="text-xs text-slate-600">{phase.estimated_hours} total hrs</span>
                  </div>

                  <div className="ml-8 space-y-3">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Topics</div>
                      <div className="flex flex-wrap gap-1.5">
                        {(phase.topics || []).map(t => <span key={t} className="badge badge-brand text-xs">{t}</span>)}
                      </div>
                    </div>

                    {phase.resources?.length > 0 && (
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Resources</div>
                        <ul className="space-y-0.5">
                          {phase.resources.map((r, ri) => <li key={ri} className="text-xs text-slate-400">• {r}</li>)}
                        </ul>
                      </div>
                    )}

                    {phase.milestone && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-xs text-green-300">
                        🏁 Milestone: {phase.milestone}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {roadmap.next_topic && (
              <div className="glass-card p-4 border border-brand-500/20 bg-brand-500/5">
                <div className="text-sm font-bold text-brand-300">🚀 Start with: {roadmap.next_topic}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
