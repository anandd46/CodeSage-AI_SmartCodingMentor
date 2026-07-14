'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import AppLayout from '@/components/layout/AppLayout';
import { aiAPI, practiceAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LanguageDropdown from '@/components/LanguageDropdown';
import {
  Zap, Play, Copy, CheckCheck, AlertCircle, CheckCircle,
  ChevronDown, Wand2, Code2, Lightbulb, RotateCcw, Download
} from 'lucide-react';

const LANGUAGES = [
  'python', 'javascript', 'typescript', 'java', 'cpp', 'c', 'go', 'rust',
  'csharp', 'ruby', 'swift', 'kotlin', 'php', 'r', 'bash'
];

const STARTER_CODE = {
  python:     '# Write your Python code here\ndef greet(name):\n    print(f"Hello, {name}!")\n\ngreet("World")',
  javascript: '// Write your JavaScript here\nfunction greet(name) {\n  console.log(`Hello, ${name}!`);\n}\n\ngreet("World");',
  java:       'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
  cpp:        '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}',
  go:         'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}',
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="btn-ghost p-1.5 text-xs flex items-center gap-1">
      {copied ? <><CheckCheck size={14} className="text-green-400" /> Copied</> : <><Copy size={14} /> Copy</>}
    </button>
  );
}

export default function DebugPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [code, setCode]           = useState(STARTER_CODE.python);
  const [language, setLanguage]   = useState('python');
  const [errorMsg, setErrorMsg]   = useState('');
  const [result, setResult]       = useState(null);
  const [execResult, setExecResult] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [executing, setExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState('debug'); // debug | optimize | output

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated]);

  const handleDebug = async () => {
    if (!code.trim()) { toast.error('Please enter some code to debug'); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await aiAPI.debug({ code, language, error_message: errorMsg || undefined });
      setResult(res.data.result);
      setActiveTab('debug');
      toast.success('Analysis complete!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Debug failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!code.trim()) return;
    setExecuting(true);
    setExecResult(null);
    try {
      const res = await practiceAPI.execute({ code, language });
      setExecResult(res.data);
      setActiveTab('output');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Execution failed');
    } finally {
      setExecuting(false);
    }
  };

  const handleOptimize = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await aiAPI.optimize({ code, language });
      setResult({ ...res.data, _type: 'optimize' });
      setActiveTab('debug');
      toast.success('Optimization complete!');
    } catch (err) {
      toast.error('Optimization failed');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = result?.status === 'error' ? 'text-red-400' : result?.status === 'warning' ? 'text-yellow-400' : 'text-green-400';
  const StatusIcon  = result?.status === 'error' ? AlertCircle : CheckCircle;

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
              <Zap size={24} className="text-yellow-400" /> AI Code Debugger
            </h1>
            <p className="text-slate-500 text-sm mt-1">Explainable AI analysis — understand why your code fails</p>
          </div>
          <LanguageDropdown
            languages={LANGUAGES}
            selected={language}
            onChange={(lang) => {
              setLanguage(lang);
              setCode(STARTER_CODE[lang] || '// Write code here');
            }}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Code Editor */}
          <div className="space-y-4">
            <div className="glass-card border border-slate-800 overflow-hidden shadow-lg">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-700" />
                  <span className="text-xs font-mono text-slate-400">main.{language === 'python' ? 'py' : language === 'javascript' ? 'js' : language === 'cpp' ? 'cpp' : language}</span>
                </div>
                <div className="flex gap-2">
                  <CopyButton text={code} />
                  <button onClick={() => setCode(STARTER_CODE[language] || '')} className="btn-ghost p-1.5 text-xs flex items-center gap-1 hover:text-slate-100 transition-colors">
                    <RotateCcw size={12} /> Reset
                  </button>
                </div>
              </div>
              <textarea
                id="code-editor"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-64 bg-transparent p-4 font-mono text-sm text-slate-200 outline-none resize-none"
                spellCheck={false}
                placeholder="Paste or write your code here..."
              />
            </div>

            {/* Error message input */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Error Message (optional)</label>
              <input
                type="text"
                className="input-base text-sm font-mono"
                placeholder="Paste the error you're seeing..."
                value={errorMsg}
                onChange={(e) => setErrorMsg(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                id="debug-btn"
                onClick={handleDebug}
                disabled={loading}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Wand2 size={16} />}
                {loading ? 'Analyzing...' : 'Debug with AI'}
              </button>
              <button
                id="execute-btn"
                onClick={handleExecute}
                disabled={executing}
                className="btn-secondary flex items-center justify-center gap-2 px-4 py-2.5"
              >
                {executing ? <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" /> : <Play size={16} />}
                Run
              </button>
              <button onClick={handleOptimize} disabled={loading} className="btn-secondary flex items-center gap-2 px-4 py-2.5">
                <Lightbulb size={16} /> Optimize
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="glass-card border border-surface-border overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-surface-border">
              {['debug', 'output'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-xs font-semibold capitalize transition-base ${activeTab === tab ? 'border-b-2 border-brand-500 text-brand-400' : 'text-slate-500 hover:text-slate-300'}`}>
                  {tab === 'debug' ? '🔍 Analysis' : '⚡ Output'}
                </button>
              ))}
            </div>

            <div className="p-4 h-[420px] overflow-y-auto scroll-container">
              {/* Debug Tab */}
              {activeTab === 'debug' && (
                <div>
                  {loading && (
                    <div className="space-y-3">
                      {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-16 rounded-lg" />)}
                    </div>
                  )}

                  {result && !result._type && (
                    <div className="space-y-4 animate-fade-in">
                      {/* Status */}
                      <div className={`flex items-center gap-2 p-3 rounded-lg border ${result.status === 'error' ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                        <StatusIcon size={18} className={statusColor} />
                        <span className={`font-bold text-sm ${statusColor}`}>{result.error_detected}</span>
                        {result.error_line && <span className="text-xs text-slate-500 ml-auto">Line {result.error_line}</span>}
                      </div>

                      {/* Cause */}
                      {result.cause && (
                        <div>
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Why This Happened</h3>
                          <p className="text-sm text-slate-300 leading-relaxed">{result.cause}</p>
                        </div>
                      )}

                      {/* Fixed Code */}
                      {result.fixed_code && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-bold text-green-400 uppercase tracking-wider">Fixed Code</h3>
                            <CopyButton text={result.fixed_code} />
                          </div>
                          <pre className="code-block text-xs text-slate-200">{result.fixed_code}</pre>
                        </div>
                      )}

                      {/* Analogy */}
                      {result.example && (
                        <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg p-3">
                          <h3 className="text-xs font-bold text-brand-400 mb-1">💡 Analogy</h3>
                          <p className="text-xs text-slate-300">{result.example}</p>
                        </div>
                      )}

                      {/* Prevention */}
                      {result.prevention_tip && (
                        <div>
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Prevention Tip</h3>
                          <p className="text-xs text-slate-500">{result.prevention_tip}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Optimize Result */}
                  {result?._type === 'optimize' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex gap-4 text-xs">
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 flex-1">
                          <div className="text-red-400 font-bold">Before</div>
                          <div>{result.time_complexity_before} time / {result.space_complexity_before} space</div>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 flex-1">
                          <div className="text-green-400 font-bold">After</div>
                          <div>{result.time_complexity_after} time / {result.space_complexity_after} space</div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <h3 className="text-xs font-bold text-green-400">Optimized Code</h3>
                          <CopyButton text={result.optimized_code} />
                        </div>
                        <pre className="code-block text-xs">{result.optimized_code}</pre>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-400 mb-2">Key Improvements</h3>
                        <ul className="space-y-1">
                          {(result.improvements || []).map((imp, i) => (
                            <li key={i} className="text-xs text-slate-400 flex gap-2"><span className="text-green-400">✓</span>{imp}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {!result && !loading && (
                    <div className="h-full flex flex-col items-center justify-center text-center gap-3 py-12">
                      <Code2 size={40} className="text-slate-700" />
                      <div className="text-slate-600 text-sm">
                        Paste code and click <strong className="text-slate-500">Debug with AI</strong><br />to get an explainable analysis
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Output Tab */}
              {activeTab === 'output' && (
                <div>
                  {executing && <div className="skeleton h-24 rounded-lg" />}
                  {execResult && (
                    <div className="space-y-3 animate-fade-in">
                      <div className={`badge ${execResult.status === 'success' ? 'badge-green' : execResult.status === 'no_api_key' ? 'badge-yellow' : 'badge-red'}`}>
                        {execResult.verdict || execResult.status}
                      </div>

                      {execResult.message && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs text-yellow-300">
                          {execResult.message}
                        </div>
                      )}

                      {execResult.stdout && (
                        <div>
                          <div className="text-xs text-green-400 font-bold mb-1">Output</div>
                          <pre className="code-block text-xs text-green-300">{execResult.stdout}</pre>
                        </div>
                      )}
                      {execResult.stderr && (
                        <div>
                          <div className="text-xs text-red-400 font-bold mb-1">Error</div>
                          <pre className="code-block text-xs text-red-300">{execResult.stderr}</pre>
                        </div>
                      )}
                      <div className="flex gap-4 text-xs text-slate-500">
                        <span>⏱ {execResult.execution_time}s</span>
                        <span>💾 {execResult.memory}KB</span>
                      </div>
                    </div>
                  )}
                  {!execResult && !executing && (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12">
                      <Play size={40} className="text-slate-700 mb-3" />
                      <div className="text-slate-600 text-sm">Click <strong className="text-slate-500">Run</strong> to execute your code</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
