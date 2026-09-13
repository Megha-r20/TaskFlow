'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Layers, ArrowRight, Lock, Mail, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemoUser = (userEmail) => {
    setEmail(userEmail);
    setPassword('password123');
    setTimeout(() => {
      handleLoginWithCredentials(userEmail, 'password123');
    }, 100);
  };

  const handleLoginWithCredentials = async (demoEmail, demoPassword) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Glow ambient backgrounds */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center">
        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>TaskFlow SaaS v2.0</span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Welcome back
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Sign in to your workspace to manage projects and collaborate with your team.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-[#111622] border border-slate-800 py-8 px-6 shadow-2xl rounded-xl sm:px-10">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@taskflow.dev"
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#0b0f17] border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#0b0f17] border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-50 shadow-lg shadow-indigo-600/20"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Preset Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              ⚡ Instant Quick Demo Login
            </span>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => loginAsDemoUser('alex@taskflow.dev')}
                className="w-full flex items-center justify-between px-3 py-2 bg-[#0b0f17] hover:bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 transition group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span>Alex Rivera (Owner)</span>
                </div>
                <span className="text-slate-500 group-hover:text-indigo-400 transition">alex@taskflow.dev &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => loginAsDemoUser('sarah@taskflow.dev')}
                className="w-full flex items-center justify-between px-3 py-2 bg-[#0b0f17] hover:bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 transition group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Sarah Chen (Admin)</span>
                </div>
                <span className="text-slate-500 group-hover:text-emerald-400 transition">sarah@taskflow.dev &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => loginAsDemoUser('marcus@taskflow.dev')}
                className="w-full flex items-center justify-between px-3 py-2 bg-[#0b0f17] hover:bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 transition group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Marcus Vance (Member)</span>
                </div>
                <span className="text-slate-500 group-hover:text-amber-400 transition">marcus@taskflow.dev &rarr;</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Don't have an account?{' '}
              <Link href="/register" className="font-semibold text-indigo-400 hover:text-indigo-300">
                Create a workspace
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
