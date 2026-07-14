'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import AppLayout from '@/components/layout/AppLayout';
import { learnAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { BookOpen, Search, Filter, CheckCircle, Lock, ChevronRight } from 'lucide-react';

const CATEGORY_COLORS = {
  'Data Structures': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  'Trees':           'text-green-400 bg-green-500/10 border-green-500/20',
  'Graphs':          'text-purple-400 bg-purple-500/10 border-purple-500/20',
  'Algorithms':      'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  'Patterns':        'text-pink-400 bg-pink-500/10 border-pink-500/20',
  'Advanced DS':     'text-orange-400 bg-orange-500/10 border-orange-500/20',
  'Mathematics':     'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'Concepts':        'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
};

const DIFFICULTY_COLORS = {
  'Beginner':     'badge-green',
  'Intermediate': 'badge-yellow',
  'Advanced':     'badge-red',
};

export default function LearnPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [topics, setTopics]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filterDiff, setFilterDiff] = useState('All');
  const [filterCat, setFilterCat]   = useState('All');

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchTopics();
  }, [isAuthenticated]);

  const fetchTopics = async () => {
    try {
      const res = await learnAPI.getTopics();
      setTopics(res.data.topics || []);
    } catch (err) {
      toast.error('Could not load topics');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...new Set(topics.map(t => t.category))];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const filtered = topics.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                        t.description.toLowerCase().includes(search.toLowerCase());
    const matchDiff = filterDiff === 'All' || t.difficulty === filterDiff;
    const matchCat  = filterCat === 'All' || t.category === filterCat;
    return matchSearch && matchDiff && matchCat;
  });

  const completed = topics.filter(t => t.completed).length;

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
              <BookOpen size={24} className="text-indigo-400" /> DSA Learning Hub
            </h1>
            <p className="text-slate-500 text-sm mt-1">Master Data Structures & Algorithms with AI-powered explanations</p>
          </div>
          <div className="glass-card px-4 py-2 border border-surface-border text-center">
            <div className="text-xl font-black gradient-text">{completed}/{topics.length}</div>
            <div className="text-xs text-slate-500">Topics Completed</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="xp-bar">
            <div className="xp-bar-fill" style={{ width: topics.length ? `${(completed/topics.length)*100}%` : '0%' }} />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search topics..."
              className="input-base pl-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select value={filterDiff} onChange={e => setFilterDiff(e.target.value)} className="input-base w-36 text-sm">
            {difficulties.map(d => <option key={d}>{d}</option>)}
          </select>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="input-base w-44 text-sm">
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Topics Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array(12).fill(0).map((_, i) => <div key={i} className="skeleton h-36 rounded-xl" />)}
          </div>
        ) : (
          <>
            <div className="text-xs text-slate-500 mb-3">{filtered.length} topics</div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(topic => (
                <Link
                  key={topic.name}
                  href={`/learn/${encodeURIComponent(topic.name)}`}
                  className={`glass-card p-4 border border-surface-border hover:border-brand-500/30 hover:scale-[1.02] transition-all duration-200 group relative ${topic.completed ? 'border-green-500/20' : ''}`}
                >
                  {topic.completed && (
                    <CheckCircle size={16} className="absolute top-3 right-3 text-green-400" />
                  )}
                  <div className="text-2xl mb-2">{topic.icon}</div>
                  <h3 className="font-bold text-sm text-slate-200 mb-1 group-hover:text-brand-300 transition-base">{topic.name}</h3>
                  <p className="text-xs text-slate-600 mb-3 leading-relaxed">{topic.description}</p>
                  <div className="flex items-center justify-between">
                    <span className={`badge ${DIFFICULTY_COLORS[topic.difficulty] || 'badge-gray'} text-xs`}>
                      {topic.difficulty}
                    </span>
                    <span className={`badge text-xs ${CATEGORY_COLORS[topic.category] || 'badge-gray'}`}>
                      {topic.category}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-brand-400 font-semibold group-hover:gap-2 transition-all">
                    Start Learning <ChevronRight size={12} />
                  </div>
                </Link>
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-16 text-slate-600">
                <BookOpen size={40} className="mx-auto mb-3 opacity-50" />
                <p>No topics found for "{search}"</p>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
