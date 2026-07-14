'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import AppLayout from '@/components/layout/AppLayout';
import { learnAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BookOpen, Code2, Brain, Clock, Zap, Target, ChevronLeft,
  Copy, CheckCheck, Play, RotateCcw, CheckCircle, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
const LANGUAGES = ['python', 'java', 'cpp', 'javascript'];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} className="btn-ghost p-1 text-xs flex items-center gap-1">
      {copied ? <><CheckCheck size={12} className="text-green-400" /> Copied</> : <><Copy size={12} /> Copy</>}
    </button>
  );
}

function CodeBlock({ code, lang }) {
  return (
    <div className="relative">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 rounded-t-lg">
        <span className="text-xs text-slate-500 font-mono">{lang}</span>
        <CopyButton text={code} />
      </div>
      <pre className="code-block rounded-t-none text-xs overflow-x-auto">{code}</pre>
    </div>
  );
}

export default function TopicPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const topic  = decodeURIComponent(params.topic);

  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [difficulty, setDifficulty] = useState('Beginner');
  const [language, setLanguage]   = useState('python');
  const [activeTab, setActiveTab] = useState('learn');
  const [quiz, setQuiz]           = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted]     = useState(false);
  const [flashcards, setFlashcards]           = useState(null);
  const [cardIndex, setCardIndex]             = useState(0);
  const [showBack, setShowBack]               = useState(false);
  const [completed, setCompleted]             = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    loadContent();
  }, [topic, difficulty, language, isAuthenticated]);

  const loadContent = async () => {
    setLoading(true);
    setData(null);
    try {
      const res = await learnAPI.explain({ topic, difficulty, language });
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const loadQuiz = async () => {
    setActiveTab('quiz');
    if (quiz) return;
    try {
      const res = await learnAPI.quiz({ topic, difficulty, num_questions: 5 });
      setQuiz(res.data);
      setSelectedAnswers({});
      setQuizSubmitted(false);
    } catch { toast.error('Quiz generation failed'); }
  };

  const loadFlashcards = async () => {
    setActiveTab('flashcards');
    if (flashcards) return;
    try {
      const res = await learnAPI.flashcards({ topic, num_cards: 8 });
      setFlashcards(res.data);
      setCardIndex(0);
      setShowBack(false);
    } catch { toast.error('Flashcard generation failed'); }
  };

  const markDone = async () => {
    try {
      await learnAPI.markComplete({ topic, completed: !completed });
      setCompleted(!completed);
      toast.success(completed ? 'Marked incomplete' : '✅ Topic marked complete! +25 XP');
    } catch { toast.error('Could not update progress'); }
  };

  const submitQuiz = () => {
    const answered = Object.keys(selectedAnswers).length;
    if (answered < (quiz?.questions?.length || 0)) {
      toast.error('Answer all questions first');
      return;
    }
    setQuizSubmitted(true);
    const correct = quiz.questions.filter((q, i) => selectedAnswers[i] === q.correct).length;
    toast.success(`Quiz complete! ${correct}/${quiz.questions.length} correct 🎯`);
  };

  const c = data?.content;

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto animate-fade-in">
        {/* Back + Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/learn" className="btn-ghost p-2 rounded-lg">
              <ChevronLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-100">{topic}</h1>
              <p className="text-slate-500 text-sm">Deep Dive Learning — AI-Powered Tutorial</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="input-base text-xs w-32">
              {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
            </select>
            <select value={language} onChange={e => setLanguage(e.target.value)} className="input-base text-xs w-28">
              {LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>
            <button onClick={markDone} className={`btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs ${completed ? 'border-green-500/30 text-green-400' : ''}`}>
              <CheckCircle size={14} />
              {completed ? 'Completed' : 'Mark Done'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-surface-card rounded-xl p-1 w-fit">
          {['learn', 'quiz', 'flashcards', 'notes'].map(tab => (
            <button key={tab} onClick={() => tab === 'quiz' ? loadQuiz() : tab === 'flashcards' ? loadFlashcards() : setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-base
                ${activeTab === tab ? 'bg-brand-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              {tab === 'learn' ? '📖 Learn' : tab === 'quiz' ? '🧠 Quiz' : tab === 'flashcards' ? '🃏 Flashcards' : '📝 Notes'}
            </button>
          ))}
        </div>

        {/* ── LEARN TAB ── */}
        {activeTab === 'learn' && (
          <div>
            {loading && (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">{Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}</div>
                <div className="space-y-4">{Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}</div>
              </div>
            )}

            {c && !loading && (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Definition */}
                  {c.simple_definition && (
                    <div className="glass-card p-5 border border-brand-500/20">
                      <h2 className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-2">📌 Definition</h2>
                      <p className="text-slate-200">{c.simple_definition}</p>
                    </div>
                  )}

                  {/* Analogy */}
                  {c.analogy && (
                    <div className="glass-card p-5 border border-yellow-500/20 bg-yellow-500/5">
                      <h2 className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2">💡 Real-World Analogy</h2>
                      <p className="text-slate-300 italic">{c.analogy}</p>
                    </div>
                  )}

                  {/* Visualization */}
                  {c.visualization && (
                    <div className="glass-card p-5 border border-cyan-500/20">
                      <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">🎨 Visual Representation</h2>
                      <pre className="font-mono text-xs text-cyan-300 overflow-x-auto leading-relaxed">{c.visualization}</pre>
                    </div>
                  )}

                  {/* Step by Step */}
                  {c.step_by_step?.length > 0 && (
                    <div className="glass-card p-5 border border-surface-border">
                      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">🔢 Step-by-Step Breakdown</h2>
                      <div className="space-y-2">
                        {c.step_by_step.map((step, i) => (
                          <div key={i} className="flex gap-3">
                            <span className="w-5 h-5 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                            <p className="text-sm text-slate-300">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dry Run */}
                  {c.dry_run && (
                    <div className="glass-card p-5 border border-purple-500/20">
                      <h2 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">🧪 Dry Run Trace</h2>
                      <p className="font-mono text-xs text-purple-300 leading-relaxed">{c.dry_run}</p>
                    </div>
                  )}

                  {/* Code Examples */}
                  <div className="glass-card p-5 border border-surface-border">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">💻 Code Implementation</h2>
                    <div className="space-y-3">
                      {c.working_code && <CodeBlock code={c.working_code} lang={`${language} — Working Solution`} />}
                      {c.optimized_code && (
                        <details className="mt-3">
                          <summary className="text-xs text-brand-400 cursor-pointer font-semibold mb-2">⚡ Optimized Version</summary>
                          <CodeBlock code={c.optimized_code} lang={`${language} — Optimized`} />
                        </details>
                      )}
                      {c.brute_force_code && (
                        <details>
                          <summary className="text-xs text-slate-500 cursor-pointer font-semibold mb-2">🐢 Brute Force</summary>
                          <CodeBlock code={c.brute_force_code} lang={`${language} — Brute Force`} />
                        </details>
                      )}
                    </div>
                  </div>

                  {/* Multi-language */}
                  {(c.java_code || c.cpp_code || c.javascript_code) && (
                    <div className="glass-card p-5 border border-surface-border">
                      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">🌐 Other Languages</h2>
                      <div className="grid gap-3">
                        {c.java_code && <CodeBlock code={c.java_code} lang="Java" />}
                        {c.cpp_code && <CodeBlock code={c.cpp_code} lang="C++" />}
                        {c.javascript_code && <CodeBlock code={c.javascript_code} lang="JavaScript" />}
                      </div>
                    </div>
                  )}

                  {/* Practice Problems */}
                  {c.practice_problems?.length > 0 && (
                    <div className="glass-card p-5 border border-surface-border">
                      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">🎯 Practice Problems</h2>
                      <ul className="space-y-2">
                        {c.practice_problems.map((p, i) => (
                          <li key={i} className="text-sm text-slate-400 flex gap-2">
                            <span className="text-brand-400">{i+1}.</span> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-4">
                  {/* Complexity */}
                  <div className="glass-card p-4 border border-surface-border">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">⚡ Complexity</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Time:</span>
                        <span className="font-mono text-cyan-300 font-bold">{c.time_complexity?.split(' ')[0] || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Space:</span>
                        <span className="font-mono text-purple-300 font-bold">{c.space_complexity?.split(' ')[0] || 'N/A'}</span>
                      </div>
                    </div>
                    {c.time_complexity && <p className="text-xs text-slate-600 mt-2">{c.time_complexity}</p>}
                  </div>

                  {/* When to Use */}
                  {c.when_to_use && (
                    <div className="glass-card p-4 border border-green-500/20">
                      <h3 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">✅ When To Use</h3>
                      <p className="text-xs text-slate-400">{c.when_to_use}</p>
                    </div>
                  )}

                  {/* When NOT to Use */}
                  {c.when_not_to_use && (
                    <div className="glass-card p-4 border border-red-500/20">
                      <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">❌ When NOT To Use</h3>
                      <p className="text-xs text-slate-400">{c.when_not_to_use}</p>
                    </div>
                  )}

                  {/* Common Mistakes */}
                  {c.common_mistakes?.length > 0 && (
                    <div className="glass-card p-4 border border-orange-500/20">
                      <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">⚠️ Common Mistakes</h3>
                      <ul className="space-y-1.5">
                        {c.common_mistakes.map((m, i) => (
                          <li key={i} className="text-xs text-slate-400 flex gap-2"><span className="text-orange-400">•</span>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Edge Cases */}
                  {c.edge_cases?.length > 0 && (
                    <div className="glass-card p-4 border border-surface-border">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">🔍 Edge Cases</h3>
                      <ul className="space-y-1">
                        {c.edge_cases.map((e, i) => (
                          <li key={i} className="text-xs text-slate-500 flex gap-2"><span className="text-slate-600">→</span>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Interview Questions */}
                  {c.interview_questions?.length > 0 && (
                    <div className="glass-card p-4 border border-brand-500/20">
                      <h3 className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-2">🎯 Interview Questions</h3>
                      <ul className="space-y-2">
                        {c.interview_questions.map((q, i) => (
                          <li key={i} className="text-xs text-slate-400">{i+1}. {q}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Cheat Sheet */}
                  {c.cheat_sheet && (
                    <div className="glass-card p-4 border border-surface-border bg-surface-hover">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">📋 Cheat Sheet</h3>
                      <p className="text-xs text-slate-500">{c.cheat_sheet}</p>
                    </div>
                  )}

                  {/* Meta info */}
                  <div className="glass-card p-4 border border-surface-border">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-500">Difficulty:</span>
                      <span className={difficulty === 'Beginner' ? 'text-green-400' : difficulty === 'Intermediate' ? 'text-yellow-400' : 'text-red-400'}>{difficulty}</span>
                    </div>
                    {c.estimated_learning_time && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Est. Time:</span>
                        <span className="text-slate-300">{c.estimated_learning_time}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── QUIZ TAB ── */}
        {activeTab === 'quiz' && (
          <div className="max-w-2xl">
            {!quiz && <div className="space-y-4">{Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}</div>}
            {quiz && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-slate-200">{topic} Quiz</h2>
                  <button onClick={() => { setQuiz(null); loadQuiz(); }} className="btn-ghost text-xs flex items-center gap-1">
                    <RotateCcw size={12} /> New Quiz
                  </button>
                </div>
                {quiz.questions?.map((q, qi) => (
                  <div key={qi} className="glass-card p-5 border border-surface-border">
                    <p className="text-sm font-medium text-slate-200 mb-4">{qi+1}. {q.question}</p>
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => {
                        const selected = selectedAnswers[qi] === oi;
                        const correct  = quizSubmitted && oi === q.correct;
                        const wrong    = quizSubmitted && selected && oi !== q.correct;
                        return (
                          <button key={oi} disabled={quizSubmitted}
                            onClick={() => !quizSubmitted && setSelectedAnswers({...selectedAnswers, [qi]: oi})}
                            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm border transition-base
                              ${correct ? 'border-green-500/50 bg-green-500/10 text-green-300' :
                                wrong   ? 'border-red-500/50 bg-red-500/10 text-red-300' :
                                selected ? 'border-brand-500/50 bg-brand-500/10 text-brand-300' :
                                          'border-surface-border hover:border-slate-500 text-slate-400'}`}>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {quizSubmitted && q.explanation && (
                      <div className="mt-3 p-3 bg-brand-500/10 rounded-lg text-xs text-slate-400">{q.explanation}</div>
                    )}
                  </div>
                ))}
                {!quizSubmitted && (
                  <button onClick={submitQuiz} className="btn-primary w-full py-3">Submit Quiz</button>
                )}
                {quizSubmitted && (
                  <div className="glass-card p-4 border border-green-500/20 text-center">
                    <div className="text-xl font-black text-green-400">
                      {quiz.questions.filter((q, i) => selectedAnswers[i] === q.correct).length} / {quiz.questions.length}
                    </div>
                    <div className="text-sm text-slate-400">Questions Correct</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── FLASHCARDS TAB ── */}
        {activeTab === 'flashcards' && (
          <div className="max-w-lg mx-auto">
            {!flashcards && <div className="skeleton h-64 rounded-xl" />}
            {flashcards && (
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-4">
                  <span>Card {cardIndex+1} of {flashcards.cards?.length}</span>
                  <div className="xp-bar w-32">
                    <div className="xp-bar-fill" style={{ width: `${((cardIndex+1)/flashcards.cards?.length)*100}%` }} />
                  </div>
                </div>
                <div
                  onClick={() => setShowBack(!showBack)}
                  className="glass-card p-10 border border-brand-500/20 min-h-52 flex items-center justify-center cursor-pointer text-center group hover:border-brand-500/40 transition-all"
                >
                  <div>
                    {showBack ? (
                      <div>
                        <div className="text-xs text-slate-600 mb-4">Answer</div>
                        <p className="text-slate-200 text-base">{flashcards.cards[cardIndex]?.back}</p>
                      </div>
                    ) : (
                      <div>
                        <div className="text-xs text-slate-600 mb-4">Question — Click to reveal</div>
                        <p className="text-slate-100 text-lg font-semibold">{flashcards.cards[cardIndex]?.front}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between mt-4">
                  <button onClick={() => { if (cardIndex > 0) { setCardIndex(i => i-1); setShowBack(false); } }} disabled={cardIndex === 0} className="btn-secondary px-6">← Prev</button>
                  <button onClick={() => { if (cardIndex < flashcards.cards.length-1) { setCardIndex(i => i+1); setShowBack(false); } }} disabled={cardIndex === flashcards.cards.length-1} className="btn-primary px-6">Next →</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── NOTES TAB ── */}
        {activeTab === 'notes' && (
          <div className="max-w-3xl">
            <div className="flex gap-2 mb-4">
              {['Quick', 'Detailed', 'Comprehensive'].map(lvl => (
                <button key={lvl}
                  onClick={async () => {
                    try {
                      toast.loading('Generating notes...');
                      const res = await learnAPI.notes({ topic, detail_level: lvl });
                      toast.dismiss();
                      setData(d => ({ ...d, _notes: res.data.notes }));
                    } catch { toast.error('Notes generation failed'); }
                  }}
                  className="btn-secondary text-xs px-4">
                  {lvl}
                </button>
              ))}
            </div>
            {data?._notes ? (
              <div className="glass-card p-6 border border-surface-border markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{data._notes}</ReactMarkdown>
              </div>
            ) : (
              <div className="glass-card p-8 text-center text-slate-600 border border-surface-border">
                Select a detail level to generate AI study notes
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
