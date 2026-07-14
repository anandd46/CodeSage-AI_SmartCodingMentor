'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import AppLayout from '@/components/layout/AppLayout';
import { practiceAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Terminal, RefreshCw, Lightbulb, Play, CheckCircle, XCircle, ChevronDown } from 'lucide-react';

const TOPICS = ['Arrays', 'Strings', 'Linked Lists', 'Stacks', 'Queues', 'Binary Trees', 'BST', 'Heaps', 'Hash Tables', 'Graphs', 'Dynamic Programming', 'Recursion', 'Binary Search', 'Sorting', 'Two Pointers', 'Sliding Window', 'Greedy Algorithms'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const LANGUAGES    = ['python', 'javascript', 'java', 'cpp', 'go'];

function DiffBadge({ d }) {
  const cls = d === 'Easy' ? 'badge-green' : d === 'Medium' ? 'badge-yellow' : 'badge-red';
  return <span className={`badge ${cls}`}>{d}</span>;
}

export default function PracticePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [topic, setTopic]         = useState('Arrays');
  const [difficulty, setDiff]     = useState('Easy');
  const [language, setLang]       = useState('python');
  const [problem, setProblem]     = useState(null);
  const [solution, setSolution]   = useState('');
  const [hint, setHint]           = useState(null);
  const [hintLevel, setHintLevel] = useState(1);
  const [evaluation, setEval]     = useState(null);
  const [execResult, setExec]     = useState(null);
  const [loading, setLoading]     = useState({ gen: false, hint: false, eval: false, exec: false });

  useEffect(() => { if (!isAuthenticated) router.push('/login'); }, [isAuthenticated]);

  const genProblem = async () => {
    setLoading(l => ({ ...l, gen: true }));
    setProblem(null); setSolution(''); setHint(null); setEval(null); setExec(null);
    try {
      const res = await practiceAPI.generate({ topic, difficulty, language });
      setProblem(res.data);
      setSolution(res.data.starter_code || '');
    } catch { toast.error('Problem generation failed'); }
    finally { setLoading(l => ({ ...l, gen: false })); }
  };

  const getHint = async () => {
    if (!problem) return;
    setLoading(l => ({ ...l, hint: true }));
    try {
      const res = await practiceAPI.hint({ problem: problem.description, partial_solution: solution, hint_level: hintLevel });
      setHint(res.data);
      setHintLevel(h => Math.min(h + 1, 3));
    } catch { toast.error('Could not get hint'); }
    finally { setLoading(l => ({ ...l, hint: false })); }
  };

  const evaluate = async () => {
    if (!problem || !solution.trim()) { toast.error('Write a solution first'); return; }
    setLoading(l => ({ ...l, eval: true }));
    try {
      const res = await practiceAPI.evaluate({ problem: problem.description, solution, language });
      setEval(res.data);
    } catch { toast.error('Evaluation failed'); }
    finally { setLoading(l => ({ ...l, eval: false })); }
  };

  const runCode = async () => {
    if (!solution.trim()) return;
    setLoading(l => ({ ...l, exec: true }));
    try {
      const res = await practiceAPI.execute({ code: solution, language });
      setExec(res.data);
    } catch { toast.error('Execution failed'); }
    finally { setLoading(l => ({ ...l, exec: false })); }
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Terminal size={24} className="text-cyan-400" /> Practice Arena
            </h1>
            <p className="text-slate-500 text-sm mt-1">AI-generated coding challenges with instant evaluation</p>
          </div>
        </div>

        {/* Problem Generator Controls */}
        <div className="glass-card p-4 border border-surface-border mb-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Topic</label>
              <select value={topic} onChange={e => setTopic(e.target.value)} className="input-base text-sm w-40">
                {TOPICS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Difficulty</label>
              <select value={difficulty} onChange={e => setDiff(e.target.value)} className="input-base text-sm w-28">
                {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Language</label>
              <select value={language} onChange={e => setLang(e.target.value)} className="input-base text-sm w-28">
                {LANGUAGES.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <button onClick={genProblem} disabled={loading.gen} className="btn-primary flex items-center gap-2 px-6">
              {loading.gen ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RefreshCw size={16} />}
              {problem ? 'New Problem' : 'Generate Problem'}
            </button>
          </div>
        </div>

        {!problem && !loading.gen && (
          <div className="glass-card p-16 text-center border border-surface-border">
            <Terminal size={48} className="text-slate-700 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">Select a topic and click <strong className="text-slate-400">Generate Problem</strong> to start</p>
            <button onClick={genProblem} className="btn-primary">Generate My First Problem</button>
          </div>
        )}

        {loading.gen && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">{Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}</div>
            <div className="skeleton h-80 rounded-xl" />
          </div>
        )}

        {problem && !loading.gen && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Problem Statement */}
            <div className="space-y-4">
              <div className="glass-card p-5 border border-surface-border">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-slate-100">{problem.title}</h2>
                  <DiffBadge d={problem.difficulty} />
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{problem.description}</p>
              </div>

              {/* Examples */}
              {problem.examples?.length > 0 && (
                <div className="glass-card p-4 border border-surface-border">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Examples</h3>
                  {problem.examples.map((ex, i) => (
                    <div key={i} className="mb-3 bg-surface-hover rounded-lg p-3">
                      <div className="text-xs font-mono text-slate-400"><strong className="text-slate-300">Input:</strong> {ex.input}</div>
                      <div className="text-xs font-mono text-slate-400"><strong className="text-slate-300">Output:</strong> {ex.output}</div>
                      {ex.explanation && <div className="text-xs text-slate-500 mt-1">{ex.explanation}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Constraints */}
              {problem.constraints?.length > 0 && (
                <div className="glass-card p-4 border border-surface-border">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Constraints</h3>
                  <ul className="space-y-1">
                    {problem.constraints.map((c, i) => (
                      <li key={i} className="text-xs font-mono text-slate-500">{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hints */}
              <div>
                <button onClick={getHint} disabled={loading.hint} className="btn-secondary w-full flex items-center justify-center gap-2 py-2.5 text-sm">
                  {loading.hint ? <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" /> : <Lightbulb size={16} />}
                  Get Hint (Level {hintLevel})
                </button>
                {hint && (
                  <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="text-xs font-bold text-yellow-400 mb-1">💡 Hint Level {hint.hint_level}</div>
                    <p className="text-xs text-slate-300">{hint.hint}</p>
                    {hint.next_step && <p className="text-xs text-slate-500 mt-1">{hint.next_step}</p>}
                  </div>
                )}
              </div>

              {/* Approach */}
              {problem.solution_approach && (
                <details className="glass-card border border-surface-border">
                  <summary className="p-3 text-xs text-slate-500 cursor-pointer font-semibold flex items-center gap-2">
                    <ChevronDown size={12} /> View Approach
                  </summary>
                  <div className="px-4 pb-4 text-xs text-slate-400">{problem.solution_approach}</div>
                </details>
              )}
            </div>

            {/* Code Editor + Evaluation */}
            <div className="space-y-4">
              <div className="glass-card border border-surface-border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-surface-border bg-surface-card">
                  <span className="text-xs font-mono text-slate-500">solution.{language === 'python' ? 'py' : language === 'javascript' ? 'js' : language === 'java' ? 'java' : language === 'cpp' ? 'cpp' : language}</span>
                  <span className="badge badge-cyan text-xs">{language}</span>
                </div>
                <textarea
                  value={solution}
                  onChange={e => setSolution(e.target.value)}
                  className="w-full h-56 bg-transparent p-4 font-mono text-sm text-slate-200 outline-none resize-none"
                  placeholder="Write your solution here..."
                  spellCheck={false}
                />
              </div>

              <div className="flex gap-3">
                <button onClick={runCode} disabled={loading.exec} className="btn-secondary flex items-center gap-2 px-4 py-2.5 text-sm">
                  {loading.exec ? <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" /> : <Play size={14} />}
                  Run
                </button>
                <button onClick={evaluate} disabled={loading.eval} className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5 text-sm">
                  {loading.eval ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={14} />}
                  {loading.eval ? 'Evaluating...' : 'Submit & Evaluate'}
                </button>
              </div>

              {/* Execution Result */}
              {execResult && (
                <div className="glass-card p-4 border border-surface-border">
                  <div className={`badge mb-3 ${execResult.status === 'success' ? 'badge-green' : 'badge-red'}`}>{execResult.verdict}</div>
                  {execResult.stdout && <pre className="text-xs text-green-300 font-mono">{execResult.stdout}</pre>}
                  {execResult.stderr && <pre className="text-xs text-red-300 font-mono">{execResult.stderr}</pre>}
                  {execResult.message && <p className="text-xs text-yellow-300">{execResult.message}</p>}
                </div>
              )}

              {/* AI Evaluation */}
              {loading.eval && <div className="skeleton h-40 rounded-xl" />}
              {evaluation && (
                <div className="glass-card p-5 border border-surface-border space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-black ${evaluation.score >= 80 ? 'text-green-400' : evaluation.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {evaluation.score}/100
                    </span>
                    <span className={`badge ${evaluation.correct ? 'badge-green' : 'badge-red'}`}>
                      {evaluation.correct ? '✅ Accepted' : '❌ ' + (evaluation.verdict || 'Review')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">{evaluation.feedback}</p>
                  {evaluation.improvements?.length > 0 && (
                    <div>
                      <div className="text-xs font-bold text-slate-400 mb-1">Improvements</div>
                      <ul className="space-y-1">
                        {evaluation.improvements.map((imp, i) => (
                          <li key={i} className="text-xs text-slate-500 flex gap-2"><span className="text-brand-400">→</span>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span>Time: <span className="text-cyan-400">{evaluation.time_complexity}</span></span>
                    <span>Space: <span className="text-purple-400">{evaluation.space_complexity}</span></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
