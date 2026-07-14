'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import toast from 'react-hot-toast';
import { Cpu, Eye, EyeOff, LogIn, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm]       = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.username, form.password);
      toast.success('Welcome back! 🎉');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      {/* Card */}
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center glow-brand">
              <Cpu size={20} className="text-white" />
            </div>
            <span className="text-xl font-black gradient-text">CodeSage AI</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-100">Welcome back</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to continue your learning journey</p>
        </div>

        <div className="glass-card p-8 border border-surface-border">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
              <input
                id="username"
                type="text"
                className="input-base"
                placeholder="Enter your username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  className="input-base pr-10"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-base"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><LogIn size={18} /> Sign In</>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link href="/register" className="text-brand-400 hover:text-brand-300 font-semibold transition-base">
              Create one free <ArrowRight size={12} className="inline" />
            </Link>
          </div>
        </div>

        {/* Demo hint */}
        <div className="mt-4 text-center text-xs text-slate-600">
          New here? <Link href="/register" className="text-brand-500 underline">Register</Link> with any credentials — no email verification needed.
        </div>
      </div>
    </div>
  );
}
