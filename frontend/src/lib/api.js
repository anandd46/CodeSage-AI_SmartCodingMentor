'use client';

import axios from 'axios';

const API_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Auth token injection ──────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('codesage_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Auth error handling ───────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('codesage_token');
      localStorage.removeItem('codesage_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ───────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:      (data) => api.post('/api/auth/register', data),
  login:         (data) => api.post('/api/auth/login', data),
  me:            ()     => api.get('/api/auth/me'),
  updateProfile: (data) => api.patch('/api/auth/profile', data),
};

// ── AI ─────────────────────────────────────────────────────────────────────────
export const aiAPI = {
  debug:    (data) => api.post('/api/ai/debug', data),
  explain:  (data) => api.post('/api/ai/explain', data),
  optimize: (data) => api.post('/api/ai/optimize', data),
  chat:     (data) => api.post('/api/ai/chat', data),
  voice:    (data) => api.post('/api/ai/voice', data),
};

// ── Learning ───────────────────────────────────────────────────────────────────
export const learnAPI = {
  getTopics:      ()     => api.get('/api/learn/topics'),
  explain:        (data) => api.post('/api/learn/explain', data),
  quiz:           (data) => api.post('/api/learn/quiz', data),
  flashcards:     (data) => api.post('/api/learn/flashcards', data),
  notes:          (data) => api.post('/api/learn/notes', data),
  cheatsheet:     (data) => api.post('/api/learn/cheatsheet', data),
  roadmap:        (data) => api.post('/api/learn/roadmap', data),
  markComplete:   (data) => api.post('/api/learn/mark-complete', data),
};

// ── Practice ──────────────────────────────────────────────────────────────────
export const practiceAPI = {
  generate: (data) => api.post('/api/practice/generate', data),
  hint:     (data) => api.post('/api/practice/hint', data),
  evaluate: (data) => api.post('/api/practice/evaluate', data),
  execute:  (data) => api.post('/api/practice/execute', data),
};

// ── Interview ─────────────────────────────────────────────────────────────────
export const interviewAPI = {
  getQuestion:    (data)    => api.post('/api/interview/question', data),
  evaluate:       (data)    => api.post('/api/interview/evaluate', data),
  mock:           (data)    => api.post('/api/interview/mock', data),
  sessionReport:  (answers) => api.post('/api/interview/session-report', answers),
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  track:       (data)          => api.post('/api/analytics/track', data),
  dashboard:   ()              => api.get('/api/analytics/dashboard'),
  leaderboard: (limit = 10)    => api.get(`/api/analytics/leaderboard?limit=${limit}`),
  heatmap:     ()              => api.get('/api/analytics/heatmap'),
};

// ── History ───────────────────────────────────────────────────────────────────
export const historyAPI = {
  coding:   (params) => api.get('/api/history/coding', { params }),
  activity: (params) => api.get('/api/history/activity', { params }),
  chat:     (params) => api.get('/api/history/chat', { params }),
  clear:    ()       => api.delete('/api/history/coding'),
};

export default api;
