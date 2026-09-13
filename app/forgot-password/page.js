'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Layers, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center">
        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>TaskFlow Security</span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Reset password
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Enter your account email address and we'll send you a password reset token link.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-[#111622] border border-slate-800 py-8 px-6 shadow-2xl rounded-xl sm:px-10">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Check your inbox</h3>
              <p className="text-sm text-slate-400 mb-6">
                Password reset instructions have been dispatched to <strong className="text-white">{email}</strong>.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300"
              >
                <ArrowLeft className="w-4 h-4" /> Return to login
              </Link>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
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

              <button
                type="submit"
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition shadow-lg shadow-indigo-600/20"
              >
                Send Reset Link
              </button>

              <div className="mt-4 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
