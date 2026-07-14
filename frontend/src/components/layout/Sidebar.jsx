'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  Code2, LayoutDashboard, BookOpen, Terminal, Users,
  Trophy, History, Map, FileText, Mic, LogOut,
  ChevronLeft, ChevronRight, Cpu, Zap, GraduationCap,
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { label: 'Dashboard',    href: '/dashboard',    icon: LayoutDashboard },
  { label: 'AI Debugger',  href: '/debug',        icon: Zap },
  { label: 'DSA Learning', href: '/learn',        icon: BookOpen },
  { label: 'Practice',     href: '/practice',     icon: Terminal },
  { label: 'Interview',    href: '/interview',    icon: GraduationCap },
  { label: 'Roadmap',      href: '/roadmap',      icon: Map },
  { label: 'Notes',        href: '/notes',        icon: FileText },
  { label: 'Voice AI',     href: '/voice',        icon: Mic },
  { label: 'Leaderboard',  href: '/leaderboard',  icon: Trophy },
  { label: 'Achievements', href: '/achievements', icon: Users },
  { label: 'History',      href: '/history',      icon: History },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`h-screen sticky top-0 flex flex-col transition-all duration-300 border-r border-surface-border bg-surface-card z-40 ${collapsed ? 'w-16' : 'w-64'}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-surface-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center flex-shrink-0">
          <Cpu size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="font-bold text-sm gradient-text">CodeSage AI</span>
            <div className="text-xs text-slate-500">v4.0</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-surface-hover transition-base"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* User Info */}
      {user && (
        <div className={`p-4 border-b border-surface-border ${collapsed ? 'px-2' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
              {user.username?.[0]?.toUpperCase() || 'U'}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-200 truncate">{user.username}</div>
                <div className="text-xs text-slate-500 truncate">{user.skill_level || 'Beginner'}</div>
              </div>
            )}
          </div>
          {!collapsed && user.xp !== undefined && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>{user.xp || 0} XP</span>
              </div>
              <div className="xp-bar">
                <div
                  className="xp-bar-fill"
                  style={{ width: `${Math.min(((user.xp || 0) % 1000) / 10, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 scroll-container">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-surface-border">
        <button
          onClick={logout}
          className={`sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 ${collapsed ? 'justify-center px-0' : ''}`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
