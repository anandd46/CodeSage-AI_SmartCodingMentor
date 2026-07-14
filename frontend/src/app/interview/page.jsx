'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import AppLayout from '@/components/layout/AppLayout';
import { interviewAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { GraduationCap, Play, Clock, ChevronRight, Star, Target, BarChart3, RefreshCw } from 'lucide-react';

const CATEGORIES    = ['DSA', 'Behavioral', 'System Design', 'OOP', 'DBMS', 'OS', 'CN', 'HR'];
const DIFFICULTIES  = ['Easy', 'Medium', 'Hard'];
const ROLES         = ['Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Engineer', 'ML Engineer', 'DevOps Engineer'];

function Timer({ seconds, running }) {
  const elapsed = useRef(0);
  const [display, setDisplay] = useState('0:00');
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => { elapsed.current++; const m = Math.floor(elapsed.current/60); const s = elapsed.current%60; setDisplay(`${m}:${s.toString().padStart(2,'0')}`); }, 1000);
    return () => clearInterval(id);
  }, [running]);
  return <span className="font-mono text-cyan-400">{display}</span>;
}

export default function InterviewPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState('single'); // single | mock
  const [category, setCategory] = useState('DSA');
  const [difficulty, setDiff]   = useState('Medium');
  const [role, setRole]         = useState('Software Engineer');
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer]     = useState('');
  const [evaluation, setEval]   = useState(null);
  const [mockSession, setMock]  = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers]   = useState([]);
  const [sessionReport, setReport] = useState(null);
  const [loading, setLoading]   = useState({ q: false, eval: false, mock: false, report: false });
  const [timerRunning, setTimer] = useState(false);

  useEffect(() => { if (!isAuthenticated) router.push('/login'); }, [isAuthenticated]);

  const getQuestion = async () => {
    setLoading(l => ({ ...l, q: true })); setQuestion(null); setEval(null); setAnswer('');
    try {
      const res = await interviewAPI.getQuestion({ category, difficulty });
      setQuestion(res.data); setTimer(true);
    } catch { toast.error('Question generation failed'); }
    finally { setLoading(l => ({ ...l, q: false })); }
  };

  const evaluateAnswer = async () => {
    if (!answer.trim()) { toast.error('Write your answer first'); return; }
    setLoading(l => ({ ...l, eval: true })); setTimer(false);
    try {
      const res = await interviewAPI.evaluate({ question: question.question, answer, category, difficulty });
      setEval(res.data);
    } catch { toast.error('Evaluation failed'); }
    finally { setLoading(l => ({ ...l, eval: false })); }
  };

  const startMock = async () => {
    setLoading(l => ({ ...l, mock: true })); setMock(null); setCurrentQ(0); setAnswers([]); setReport(null);
    try {
      const res = await interviewAPI.mock({ role, difficulty, num_questions: 5 });
      setMock(res.data);
    } catch { toast.error('Mock interview generation failed'); }
    finally { setLoading(l => ({ ...l, mock: false })); }
  };

  const submitMockAnswer = () => {
    const q = mockSession.questions[currentQ];
    setAnswers(a => [...a, { question: q.question, answer, category: q.category, time_taken_seconds: 60 }]);
    setAnswer('');
    if (currentQ + 1 < mockSession.questions.length) { setCurrentQ(c => c + 1); }
    else { generateReport(); }
  };

  const generateReport = async () => {
    setLoading(l => ({ ...l, report: true }));
    try {
      const allAnswers = [...answers, { question: mockSession.questions[currentQ].question, answer, category: mockSession.questions[currentQ].category, time_taken_seconds: 60 }];
      const res = await interviewAPI.sessionReport(allAnswers);
      setReport(res.data);
      setMock(null);
    } catch { toast.error('Report generation failed'); }
    finally { setLoading(l => ({ ...l, report: false })); }
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <GraduationCap size={24} className="text-purple-400" /> Mock Interview
            </h1>
            <p className="text-slate-500 text-sm mt-1">AI-powered interview simulation with real-time feedback</p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2 mb-6 bg-surface-card rounded-xl p-1 w-fit">
          {[['single', '🎯 Single Question'], ['mock', '📋 Mock Session']].map(([m, label]) => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-base ${mode === m ? 'bg-brand-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Single Question Mode ── */}
        {mode === 'single' && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="glass-card p-4 border border-surface-border flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="input-base text-sm w-40">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Difficulty</label>
                <select value={difficulty} onChange={e => setDiff(e.target.value)} className="input-base text-sm w-28">
                  {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <button onClick={getQuestion} disabled={loading.q} className="btn-primary flex items-center gap-2 px-6">
                {loading.q ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play size={16} />}
                Get Question
              </button>
            </div>

            {loading.q && <div className="skeleton h-32 rounded-xl" />}

            {question && (
              <div className="space-y-4 animate-fade-in">
                {/* Question Card */}
                <div className="glass-card p-5 border border-brand-500/20">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex gap-2">
                      <span className="badge badge-brand">{question.category}</span>
                      <span className={`badge ${difficulty === 'Easy' ? 'badge-green' : difficulty === 'Medium' ? 'badge-yellow' : 'badge-red'}`}>{difficulty}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <Clock size={14} /> <Timer seconds={0} running={timerRunning} />
                    </div>
                  </div>
                  <p className="text-slate-200 font-medium leading-relaxed">{question.question}</p>

                  {question.hints?.length > 0 && (
                    <details className="mt-4">
                      <summary className="text-xs text-yellow-400 cursor-pointer font-semibold">💡 Show Hints</summary>
                      <ul className="mt-2 space-y-1">
                        {question.hints.map((h, i) => <li key={i} className="text-xs text-slate-500">{i+1}. {h}</li>)}
                      </ul>
                    </details>
                  )}
                </div>

                {/* Answer Area */}
                <div className="glass-card border border-surface-border overflow-hidden">
                  <div className="px-4 py-2 border-b border-surface-border bg-surface-card">
                    <span className="text-xs text-slate-500">Your Answer</span>
                  </div>
                  <textarea
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    className="w-full h-40 bg-transparent p-4 text-sm text-slate-200 outline-none resize-none"
                    placeholder="Type your answer here. Be structured: define, explain, give examples, mention complexity if applicable..."
                  />
                </div>

                <button onClick={evaluateAnswer} disabled={loading.eval} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                  {loading.eval ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Target size={16} />}
                  {loading.eval ? 'Evaluating...' : 'Evaluate My Answer'}
                </button>

                {/* Evaluation Result */}
                {loading.eval && <div className="skeleton h-48 rounded-xl" />}
                {evaluation && (
                  <div className="glass-card p-6 border border-surface-border animate-fade-in space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-3xl font-black gradient-text">{evaluation.score}/10</div>
                        <div className={`text-sm font-bold ${evaluation.rating === 'Excellent' ? 'text-green-400' : evaluation.rating === 'Good' ? 'text-cyan-400' : evaluation.rating === 'Fair' ? 'text-yellow-400' : 'text-red-400'}`}>
                          {evaluation.rating}
                        </div>
                      </div>
                      <span className={`badge text-sm px-3 py-1.5 ${evaluation.would_pass ? 'badge-green' : 'badge-red'}`}>
                        {evaluation.would_pass ? '✅ Would Pass' : '❌ Needs Work'}
                      </span>
                    </div>

                    <p className="text-sm text-slate-300">{evaluation.feedback}</p>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-bold text-green-400 mb-2">✅ Strengths</div>
                        <ul className="space-y-1">
                          {evaluation.strengths?.map((s, i) => <li key={i} className="text-xs text-slate-400">• {s}</li>)}
                        </ul>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-red-400 mb-2">⚠️ Improvements</div>
                        <ul className="space-y-1">
                          {evaluation.improvements?.map((s, i) => <li key={i} className="text-xs text-slate-400">• {s}</li>)}
                        </ul>
                      </div>
                    </div>

                    {evaluation.ideal_answer && (
                      <details>
                        <summary className="text-xs text-brand-400 cursor-pointer font-semibold">View Ideal Answer</summary>
                        <p className="mt-2 text-xs text-slate-400 bg-surface-hover p-3 rounded-lg">{evaluation.ideal_answer}</p>
                      </details>
                    )}

                    <button onClick={getQuestion} className="btn-secondary w-full flex items-center justify-center gap-2">
                      <RefreshCw size={14} /> Next Question
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Mock Interview Mode ── */}
        {mode === 'mock' && !mockSession && !sessionReport && (
          <div className="space-y-6">
            <div className="glass-card p-6 border border-surface-border">
              <h2 className="text-lg font-bold text-slate-100 mb-4">Configure Mock Interview</h2>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Target Role</label>
                  <select value={role} onChange={e => setRole(e.target.value)} className="input-base text-sm">
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Difficulty</label>
                  <select value={difficulty} onChange={e => setDiff(e.target.value)} className="input-base text-sm">
                    {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={startMock} disabled={loading.mock} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {loading.mock ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play size={18} />}
                {loading.mock ? 'Preparing Interview...' : 'Start Mock Interview'}
              </button>
            </div>
          </div>
        )}

        {mockSession && (
          <div className="space-y-5 animate-fade-in">
            {/* Progress */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Question {currentQ+1} of {mockSession.questions.length}</span>
                  <span>{mockSession.role}</span>
                </div>
                <div className="xp-bar">
                  <div className="xp-bar-fill" style={{ width: `${((currentQ+1)/mockSession.questions.length)*100}%` }} />
                </div>
              </div>
            </div>

            {/* Current Question */}
            <div className="glass-card p-5 border border-brand-500/20">
              <div className="flex gap-2 mb-3">
                <span className="badge badge-brand">{mockSession.questions[currentQ]?.category}</span>
                <span className={`badge ${mockSession.questions[currentQ]?.difficulty === 'Easy' ? 'badge-green' : mockSession.questions[currentQ]?.difficulty === 'Hard' ? 'badge-red' : 'badge-yellow'}`}>
                  {mockSession.questions[currentQ]?.difficulty}
                </span>
                <span className="text-xs text-slate-500 ml-auto flex items-center gap-1">
                  <Clock size={12} /> {Math.floor((mockSession.questions[currentQ]?.time_limit || 120) / 60)} min
                </span>
              </div>
              <p className="text-slate-200 font-medium">{mockSession.questions[currentQ]?.question}</p>
            </div>

            <div className="glass-card border border-surface-border overflow-hidden">
              <div className="px-4 py-2 border-b border-surface-border bg-surface-card">
                <span className="text-xs text-slate-500">Your Answer — Question {currentQ+1}</span>
              </div>
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                className="w-full h-40 bg-transparent p-4 text-sm text-slate-200 outline-none resize-none"
                placeholder="Type your answer..."
              />
            </div>

            <button onClick={submitMockAnswer} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {currentQ + 1 === mockSession.questions.length ? '📋 Submit & Get Report' : <>Next Question <ChevronRight size={16} /></>}
            </button>
          </div>
        )}

        {/* Session Report */}
        {loading.report && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500">Generating your performance report...</p>
          </div>
        )}

        {sessionReport && (
          <div className="space-y-5 animate-fade-in">
            <div className="glass-card p-6 border border-brand-500/20">
              <div className="text-center mb-6">
                <div className="text-5xl font-black gradient-text mb-2">{sessionReport.overall_score}/10</div>
                <p className="text-slate-400">{sessionReport.summary}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-bold text-green-400 mb-2">💪 Strengths</div>
                  <ul className="space-y-2">{sessionReport.strengths?.map((s, i) => <li key={i} className="text-sm text-slate-400 flex gap-2"><span className="text-green-400">✓</span>{s}</li>)}</ul>
                </div>
                <div>
                  <div className="text-xs font-bold text-yellow-400 mb-2">📈 Areas to Improve</div>
                  <ul className="space-y-2">{sessionReport.areas_to_improve?.map((s, i) => <li key={i} className="text-sm text-slate-400 flex gap-2"><span className="text-yellow-400">→</span>{s}</li>)}</ul>
                </div>
              </div>

              <div className="mt-5">
                <div className="text-xs font-bold text-brand-400 mb-2">🎯 Next Steps</div>
                <ul className="space-y-1">{sessionReport.next_steps?.map((s, i) => <li key={i} className="text-sm text-slate-400">{i+1}. {s}</li>)}</ul>
              </div>

              {sessionReport.encouragement && (
                <div className="mt-5 p-4 bg-brand-500/10 border border-brand-500/20 rounded-lg text-sm text-brand-300 italic text-center">
                  "{sessionReport.encouragement}"
                </div>
              )}

              <button onClick={() => { setMode('mock'); setReport(null); setMock(null); setAnswers([]); setCurrentQ(0); }} className="btn-primary w-full mt-5 flex items-center justify-center gap-2">
                <RefreshCw size={14} /> Start Another Session
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
