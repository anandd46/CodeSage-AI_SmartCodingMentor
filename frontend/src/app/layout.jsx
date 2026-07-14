import { Inter, JetBrains_Mono } from 'next/font/google';
import '../styles/globals.css';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata = {
  title: 'CodeSage AI — AI-Powered Programming Mentor',
  description: 'The most advanced AI-powered coding education platform. Debug code, master DSA, prepare for interviews, and build a career in tech.',
  keywords: ['AI coding', 'DSA', 'programming tutor', 'code debug', 'interview prep', 'learning platform'],
  authors: [{ name: 'Anand D' }],
  openGraph: {
    title: 'CodeSage AI',
    description: 'AI-Powered Programming Mentor Platform',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} ${jetbrains.variable} bg-surface text-slate-100 font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #334155',
                borderRadius: '0.75rem',
                padding: '12px 16px',
                fontSize: '0.875rem',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#0f172a' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#0f172a' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
