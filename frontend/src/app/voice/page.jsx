'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { aiAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function VoicePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated]);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser. Try Chrome.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      toast.error('Speech recognition error. Try again.');
    };
    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setLoading(true);
      try {
        const res = await aiAPI.voice({ transcript: text, context: 'general' });
        setResponse(res.data.response || res.data.answer || 'No response');
      } catch (err) {
        toast.error('AI response failed. Check your connection.');
      } finally {
        setLoading(false);
      }
    };
    recognition.start();
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl mx-auto animate-fade-in">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-100 flex items-center justify-center gap-3">
            <Mic className="text-brand-400" size={32} />
            Voice AI Assistant
          </h1>
          <p className="text-slate-500 mt-2">Ask any programming question using your voice</p>
        </div>

        {/* Mic Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={startListening}
            disabled={isListening || loading}
            className={`w-32 h-32 rounded-full flex items-center justify-center text-white text-4xl transition-all duration-300 shadow-2xl
              ${isListening ? 'bg-red-500 scale-110 animate-pulse' : 'bg-gradient-brand hover:scale-105 glow-brand'}`}
          >
            {isListening ? <MicOff size={48} /> : <Mic size={48} />}
          </button>
        </div>

        <p className="text-center text-slate-500 text-sm mb-8">
          {isListening ? '🔴 Listening...' : 'Click the mic to ask a question'}
        </p>

        {/* Transcript */}
        {transcript && (
          <div className="glass-card p-5 mb-4 border border-surface-border">
            <p className="text-xs font-bold text-slate-500 uppercase mb-2">You said:</p>
            <p className="text-slate-200 italic">"{transcript}"</p>
          </div>
        )}

        {/* AI Response */}
        {loading && (
          <div className="glass-card p-5 border border-brand-500/20 animate-pulse">
            <p className="text-slate-400">🤖 Thinking...</p>
          </div>
        )}
        {response && !loading && (
          <div className="glass-card p-5 border border-brand-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Volume2 size={16} className="text-brand-400" />
              <p className="text-xs font-bold text-slate-400 uppercase">CodeSage AI Response:</p>
            </div>
            <p className="text-slate-200 leading-relaxed">{response}</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
