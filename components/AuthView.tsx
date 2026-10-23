'use client';

import React from 'react';
import { User, Role } from '@/types';
import { ShieldCheck, UserCheck, Store, Lock, Mail, ArrowRight, AlertCircle, Info } from 'lucide-react';

interface AuthViewProps {
  onLoginSuccess: (user: User) => void;
}

export default function AuthView({ onLoginSuccess }: AuthViewProps) {
  const [email, setEmail] = React.useState<string>('admin@platform.com');
  const [password, setPassword] = React.useState<string>('admin123');
  const [loading, setLoading] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid credentials');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (targetRole: Role, demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'switch-role', targetRole })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Quick login failed');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl">
            S
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">SettleTrack</span>
        </div>
        <h1 className="text-center text-sm font-medium text-slate-400">
          Multi-Tier Settlement &amp; UTR Record Management
        </h1>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Account Email / ID
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@platform.com"
                  className="w-full text-xs font-mono rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-2.5 text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs font-mono rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-2.5 text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                />
              </div>
            </div>

            {/* Permanent Credentials Notice */}
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Important:</strong> There is no self-serve forgot password flow. Please remember your credentials. If lost, your Referrer / Sub-Admin or Platform Admin can reset it.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="pt-4 border-t border-slate-800">
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              1-Click Demo Login By Role
            </span>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin@platform.com', 'admin123')}
                className="w-full text-left p-2.5 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-purple-500/15 text-purple-400 flex items-center justify-center text-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-purple-400">
                      Platform Admin (Owner)
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">admin@platform.com · pass: admin123</div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-slate-400 group-hover:text-white">Login →</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('subadmin', 'subadmin.rahul@platform.com', 'subadmin123')}
                className="w-full text-left p-2.5 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-blue-500/15 text-blue-400 flex items-center justify-center text-xs">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-blue-400">
                      Sub-Admin / Agent (Rahul)
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">subadmin.rahul@platform.com · pass: subadmin123</div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-slate-400 group-hover:text-white">Login →</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('merchant', 'merchant.sharma@store.in', 'merchant123')}
                className="w-full text-left p-2.5 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-xs">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-emerald-400">
                      Merchant (Sunil Sharma)
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">merchant.sharma@store.in · pass: merchant123</div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-slate-400 group-hover:text-white">Login →</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
