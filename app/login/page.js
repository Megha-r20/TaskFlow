'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Lock, Mail, ShieldAlert } from 'lucide-react';

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
    <div className="min-h-screen bg-[#191919] text-[#e3e3e3] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-[#333] bg-[#222] text-xs font-mono font-medium text-stone-300 mb-2">
          <span>📋</span>
          <span>TaskFlow Notion Workspace</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#e3e3e3]">
          Welcome back
        </h2>
        <p className="text-xs text-stone-400">
          Sign in to your workspace to manage projects and collaborate with your team.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-[#202020] border border-[#333] py-8 px-6 shadow-2xl rounded-lg sm:px-8">
          {error && (
            <div className="mb-5 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-[11px] font-mono font-medium text-stone-400 uppercase tracking-wider mb-1.5">
                Email address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                  <Mail className="h-3.5 w-3.5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@taskflow.dev"
                  className="block w-full pl-9 pr-3 py-2 bg-[#191919] border border-[#333] rounded-md text-xs text-[#e3e3e3] placeholder-stone-600 focus:outline-none focus:border-stone-400 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-mono font-medium text-stone-400 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-amber-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 bg-[#191919] border border-[#333] rounded-md text-xs text-[#e3e3e3] placeholder-stone-600 focus:outline-none focus:border-stone-400 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-white/10 rounded-md text-xs font-semibold text-white bg-[#2c2c2c] hover:bg-[#333] transition disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Preset Buttons - Notion Tag Pills */}
          <div className="mt-7 pt-5 border-t border-[#333]">
            <span className="block text-[11px] font-mono font-medium text-stone-400 uppercase tracking-wider text-center mb-3">
              ⚡ Quick Demo Sign-in
            </span>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => loginAsDemoUser('alex@taskflow.dev')}
                className="w-full flex items-center justify-between px-3 py-1.5 bg-[#1c1c1c] hover:bg-[#282828] border border-[#333] rounded-md text-xs transition group"
              >
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono notion-tag-blue">Owner</span>
                  <span className="text-[#e3e3e3] font-medium">Alex Rivera</span>
                </div>
                <span className="text-[11px] font-mono text-stone-500 group-hover:text-amber-300">alex@taskflow.dev &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => loginAsDemoUser('sarah@taskflow.dev')}
                className="w-full flex items-center justify-between px-3 py-1.5 bg-[#1c1c1c] hover:bg-[#282828] border border-[#333] rounded-md text-xs transition group"
              >
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono notion-tag-green">Admin</span>
                  <span className="text-[#e3e3e3] font-medium">Sarah Chen</span>
                </div>
                <span className="text-[11px] font-mono text-stone-500 group-hover:text-amber-300">sarah@taskflow.dev &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => loginAsDemoUser('marcus@taskflow.dev')}
                className="w-full flex items-center justify-between px-3 py-1.5 bg-[#1c1c1c] hover:bg-[#282828] border border-[#333] rounded-md text-xs transition group"
              >
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono notion-tag-yellow">Member</span>
                  <span className="text-[#e3e3e3] font-medium">Marcus Vance</span>
                </div>
                <span className="text-[11px] font-mono text-stone-500 group-hover:text-amber-300">marcus@taskflow.dev &rarr;</span>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center">
            <p className="text-xs text-stone-400">
              Don't have an account?{' '}
              <Link href="/register" className="font-semibold text-amber-400 hover:underline">
                Create a workspace
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
