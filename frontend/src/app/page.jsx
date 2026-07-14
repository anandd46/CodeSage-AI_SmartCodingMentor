'use client';

import Link from 'next/link';
import { TypeAnimation } from 'react-type-animation';
import {
  Zap, BookOpen, Terminal, GraduationCap, Trophy, Mic,
  ArrowRight, Star, Users, Code2, CheckCircle, Cpu,
  BarChart3, Brain, Target, Globe, Shield, Sparkles,
} from 'lucide-react';

const FEATURES = [
  { icon: Zap,          color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', title: 'AI Debugger',       desc: 'XAI-powered code analysis with explainable bug detection, root cause analysis, and auto-fix suggestions.' },
  { icon: BookOpen,     color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', title: 'DSA Learning Hub',   desc: '30+ topics with step-by-step visualizations, dry runs, complexity analysis, and interactive quizzes.' },
  { icon: Terminal,     color: 'text-cyan-400',   bg: 'bg-cyan-500/10 border-cyan-500/20',     title: 'Code Execution',     desc: 'Run code in 15+ languages directly in the browser via Judge0 with real-time output and performance metrics.' },
  { icon: GraduationCap,color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', title: 'Mock Interviews',    desc: 'Realistic interview questions from DSA to System Design. AI evaluates your answers and gives detailed feedback.' },
  { icon: Brain,        color: 'text-pink-400',   bg: 'bg-pink-500/10 border-pink-500/20',     title: 'AI Tutor Chat',      desc: 'Multi-turn conversation with memory. Ask any programming question and get mentored like a 1-on-1 session.' },
  { icon: Trophy,       color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', title: 'Gamification',       desc: 'XP system, 10 achievements, daily streaks, and global leaderboard to keep you motivated every day.' },
  { icon: Target,       color: 'text-emerald-400',bg: 'bg-emerald-500/10 border-emerald-500/20',title: 'Personalized Roadmap','desc': 'AI generates your custom learning path based on career goals, current level, and weak areas.' },
  { icon: Mic,          color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',     title: 'Voice Assistant',    desc: 'Speak your questions, get spoken answers. Hands-free AI tutoring for a truly immersive experience.' },
];

const STATS = [
  { value: '30+', label: 'DSA Topics', icon: BookOpen },
  { value: '15+', label: 'Languages',  icon: Code2 },
  { value: '40',  label: 'Learning Points', icon: BarChart3 },
  { value: '10',  label: 'Achievements', icon: Trophy },
];

const DSA_TOPICS = ['Arrays', 'Linked Lists', 'Trees', 'Graphs', 'Dynamic Programming', 'Binary Search', 'Recursion', 'Sorting'];

export default function LandingPage() {
  return (
    <div className="page-container bg-gradient-hero">

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 glass-dark border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Cpu size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg gradient-text">CodeSage AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login"    className="btn-ghost text-sm">Sign In</Link>
            <Link href="/register" className="btn-primary text-sm">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 badge badge-brand mb-6 text-xs px-3 py-1.5">
          <Sparkles size={12} />
          Powered by Google Gemini 2.0 Flash
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight">
          Your AI{' '}
          <span className="gradient-text">Programming</span>
          <br />Mentor Is Here
        </h1>

        {/* Typewriter */}
        <div className="text-xl md:text-2xl text-slate-400 mb-8 h-8">
          <TypeAnimation
            sequence={[
              'Debug code with Explainable AI', 2000,
              'Master Data Structures & Algorithms', 2000,
              'Practice Mock Interviews', 2000,
              'Generate Personalized Roadmaps', 2000,
              'Learn with Voice Assistant', 2000,
            ]}
            repeat={Infinity}
            className="text-brand-400"
          />
        </div>

        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10">
          The most advanced AI-powered coding education platform. Debug, learn, practice, and ace interviews — all in one place.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-4 justify-center mb-16">
          <Link href="/register" className="btn-primary flex items-center gap-2 px-8 py-3 text-base rounded-xl">
            Start Learning Free <ArrowRight size={18} />
          </Link>
          <Link href="/learn" className="btn-secondary flex items-center gap-2 px-8 py-3 text-base rounded-xl">
            <BookOpen size={18} /> Explore DSA Topics
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {STATS.map(({ value, label, icon: Icon }) => (
            <div key={label} className="glass-card p-4 text-center">
              <Icon size={20} className="text-brand-400 mx-auto mb-1" />
              <div className="text-2xl font-black gradient-text">{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Topic Pills ─────────────────────────────────────────── */}
      <section className="py-8 overflow-hidden">
        <div className="flex gap-3 animate-marquee whitespace-nowrap" style={{animation: 'none'}}>
          <div className="flex gap-3 flex-wrap justify-center px-6 max-w-7xl mx-auto">
            {DSA_TOPICS.map(topic => (
              <Link key={topic} href="/learn" className="badge badge-brand px-4 py-1.5 text-sm hover:glow-brand transition-base cursor-pointer">
                {topic}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black mb-4">Everything You Need to <span className="gradient-text">Succeed</span></h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">From debugging your first bug to acing FAANG interviews — CodeSage AI has you covered.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className={`glass-card p-5 border ${bg} group hover:scale-[1.02] transition-all duration-300`}>
              <div className={`w-10 h-10 rounded-lg ${bg} border flex items-center justify-center mb-4`}>
                <Icon size={20} className={color} />
              </div>
              <h3 className="font-bold text-sm mb-2 text-slate-200">{title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black mb-4">How It <span className="gradient-text">Works</span></h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Create Account', desc: 'Sign up free and set your skill level and career goal.' },
            { step: '02', title: 'Learn & Practice', desc: 'Dive into DSA topics, debug code, and solve practice problems with AI guidance.' },
            { step: '03', title: 'Level Up', desc: 'Earn XP, unlock achievements, and track your progress on the leaderboard.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="glass-card p-6 text-center">
              <div className="text-5xl font-black gradient-text mb-4">{step}</div>
              <h3 className="font-bold text-lg mb-2">{title}</h3>
              <p className="text-slate-500 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="glass-card p-12 border border-brand-500/20 bg-gradient-to-br from-brand-900/30 to-accent-900/20">
          <h2 className="text-4xl font-black mb-4">
            Ready to Become a <span className="gradient-text">Better Developer</span>?
          </h2>
          <p className="text-slate-400 mb-8">Join thousands of developers learning smarter with AI-powered guidance.</p>
          <Link href="/register" className="btn-primary inline-flex items-center gap-2 px-10 py-3.5 text-base rounded-xl glow-brand">
            Start Your Journey <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-surface-border py-8 text-center text-slate-600 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Cpu size={16} className="text-brand-400" />
          <span className="gradient-text font-bold">CodeSage AI</span>
        </div>
        <p>Built with ❤️ by <span className="text-brand-400 font-semibold">Anand D</span> · Powered by Google Gemini</p>
      </footer>
    </div>
  );
}
