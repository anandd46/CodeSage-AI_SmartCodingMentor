'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { historyAPI } from '@/lib/api';
import { History, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HistoryPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [items, setItems]   = useState([]);
  const [loading, setLoad]  = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    historyAPI.coding({ limit: 30 }).then(r => setItems(r.data.items || [])).finally(() => setLoad(false));
  }, [isAuthenticated]);

  const clearHistory = async () => {
    if (!confirm('Clear all coding history?')) return;
    await historyAPI.clear();
    setItems([]);
    toast.success('History cleared');
  };

  const typeColors = { debug: 'badge-yellow', optimize: 'badge-green', default: 'badge-gray' };

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black flex items-center gap-2">
            <History size={24} className="text-slate-400" /> Coding History
          </h1>
          {items.length > 0 && (
            <button onClick={clearHistory} className="btn-danger flex items-center gap-2 text-sm">
              <Trash2 size={14} /> Clear All
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
        ) : items.length === 0 ? (
          <div className="glass-card p-16 text-center border border-surface-border">
            <History size={48} className="text-slate-700 mx-auto mb-4" />
            <p className="text-slate-600">No coding history yet. Start debugging or practicing!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="glass-card p-4 border border-surface-border hover:border-brand-500/20 transition-base">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex gap-2 mb-2">
                      <span className={`badge ${typeColors[item.type] || typeColors.default}`}>{item.type}</span>
                      <span className="badge badge-cyan">{item.language}</span>
                    </div>
                    <pre className="text-xs text-slate-500 font-mono truncate">{item.code?.slice(0, 100)}...</pre>
                  </div>
                  <div className="text-xs text-slate-600 whitespace-nowrap">
                    {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
