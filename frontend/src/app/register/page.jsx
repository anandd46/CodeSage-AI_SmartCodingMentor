'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import toast from 'react-hot-toast';
import { Cpu, Eye, EyeOff, UserPlus } from 'lucide-react';

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm]       = useState({ username: '', email: '', password: '', skill_level: 'Beginner' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form.username, form.email, form.password, form.skill_level);
      toast.success('Account created! Welcome to CodeSage AI 🚀');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed. Try a different username.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center glow-brand">
              <Cpu size={20} className="text-white" />
            </div>
            <span className="text-xl font-black gradient-text">CodeSage AI</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-100">Create your account</h1>
          <p className="text-slate-500 text-sm mt-1">Start your AI-powered learning journey today</p>
        </div>

        <div className="glass-card p-8 border border-surface-border">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
              <input
                id="reg-username"
                type="text"
                className="input-base"
                placeholder="Choose a username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required minLength={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                id="reg-email"
                type="email"
                className="input-base"
                placeholder="your@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPw ? 'text' : 'password'}
                  className="input-base pr-10"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required minLength={6}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-base">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Current Skill Level</label>
              <div className="grid grid-cols-3 gap-2">
                {SKILL_LEVELS.map(level => (
                  <button
                    key={level} type="button"
                    onClick={() => setForm({ ...form, skill_level: level })}
                    className={`py-2 rounded-lg text-sm font-medium transition-base border ${
                      form.skill_level === level
                        ? 'border-brand-500 bg-brand-500/20 text-brand-300'
                        : 'border-surface-border text-slate-500 hover:border-slate-500'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <button
              id="register-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><UserPlus size={18} /> Create Account</>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-400 hover:text-brand-300 font-semibold transition-base">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
