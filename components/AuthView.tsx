'use client';

import React from 'react';
import { User } from '@/types';
import { signIn } from 'next-auth/react';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

interface AuthViewProps {
  onLoginSuccess: (user: User) => void;
}

export default function AuthView({ onLoginSuccess }: AuthViewProps) {
  const [email, setEmail] = React.useState<string>('');
  const [password, setPassword] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email and password.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (!result || result.error) {
        throw new Error(result?.error || 'Invalid email or password');
      }

      // Fetch verified session user
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      if (sessionData?.user) {
        onLoginSuccess(sessionData.user);
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-dvh max-h-dvh w-full overflow-hidden bg-[#f7f7f4] flex flex-col items-center justify-center px-4 py-2 select-none">
      {/* Brand mark */}
      <div className="mb-4 sm:mb-6 text-center">
        <div className="inline-flex items-center gap-2 mb-1">
          <div className="w-3.5 h-3.5 bg-[#f54e00] rounded-[2px]" />
          <span className="font-display text-[22px] sm:text-[24px] font-normal tracking-tight text-[#26251e]">
            SettleTrack
          </span>
        </div>
        <p className="text-[12px] sm:text-[13px] text-[#807d72]">
          Settlement Clearing &amp; Permanent UTR Ledger
        </p>
      </div>

      {/* Main Login Card - compact and non-scrollable */}
      <div className="w-full max-w-sm sm:max-w-md bg-[#ffffff] border border-[#e6e5e0] rounded-[12px] p-5 sm:p-7 shadow-xs">
        <div className="mb-4 sm:mb-5">
          <h1 className="font-display text-[20px] sm:text-[22px] font-normal tracking-tight text-[#26251e] leading-snug">
            Sign in
          </h1>
          <p className="text-[12px] sm:text-[13px] text-[#5a5852] mt-0.5">
            Enter your credentials to access the settlement ledger.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-3.5 p-2.5 rounded-[8px] border border-[#cf2d56]/20 bg-[#fae8ed] text-[12px] text-[#cf2d56] flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span className="leading-tight">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[12px] font-medium text-[#26251e] block">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#807d72] pointer-events-none">
                <Mail className="size-4" />
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full h-10 pl-9 pr-3 rounded-[8px] border border-[#e6e5e0] bg-[#ffffff] text-[13px] font-mono text-[#26251e] placeholder:text-[#a09c92] focus:outline-none focus:border-[#f54e00] focus:ring-1 focus:ring-[#f54e00]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-medium text-[#26251e] block">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#807d72] pointer-events-none">
                <Lock className="size-4" />
              </span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 pl-9 pr-3 rounded-[8px] border border-[#e6e5e0] bg-[#ffffff] text-[13px] font-mono text-[#26251e] placeholder:text-[#a09c92] focus:outline-none focus:border-[#f54e00] focus:ring-1 focus:ring-[#f54e00]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-cursor-primary text-[14px] h-10 mt-2 font-medium"
          >
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
