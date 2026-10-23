'use client';

import React from 'react';
import { User } from '@/types';
import { X, KeyRound, Copy, Check, AlertCircle } from 'lucide-react';

interface ResetPasswordModalProps {
  isOpen: boolean;
  targetUser: User | null;
  onClose: () => void;
  currentUser: User;
  onSuccess: () => void;
}

export default function ResetPasswordModal({
  isOpen,
  targetUser,
  onClose,
  currentUser,
  onSuccess
}: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = React.useState<string>(() => `reset@${Math.floor(1000 + Math.random() * 9000)}`);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successInfo, setSuccessInfo] = React.useState<{ password: string } | null>(null);
  const [copied, setCopied] = React.useState<boolean>(false);

  const handleClose = () => {
    setSuccessInfo(null);
    setErrorMsg(null);
    onClose();
  };

  if (!isOpen || !targetUser) return null;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!newPassword.trim() || newPassword.trim().length < 4) {
      setErrorMsg('Password must be at least 4 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset-password',
          targetUserId: targetUser.id,
          newPassword: newPassword.trim(),
          requesterId: currentUser.id
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccessInfo({ password: newPassword.trim() });
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (successInfo) {
      const text = `Updated Credentials for ${targetUser.name} (${targetUser.email}):\nNew Password: ${successInfo.password}\nNote: Please remember this password as there is no forgot password link.`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              <span>Reset Password</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Reset login credentials for <span className="font-semibold text-slate-800 dark:text-slate-200">{targetUser.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successInfo ? (
          <div className="mt-4 space-y-3">
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl space-y-2">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" />
                Password Reset Successfully!
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Share this new password directly with {targetUser.name}:
              </p>
              <div className="p-2.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono text-sm font-bold text-center text-slate-900 dark:text-white tracking-wider">
                {successInfo.password}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="w-full py-2 px-3 text-xs font-semibold bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Info for User'}</span>
            </button>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReset} className="mt-4 space-y-4">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Account Role:</span>
                <span className="font-semibold uppercase text-slate-800 dark:text-slate-200">{targetUser.role}</span>
              </div>
              <div className="flex justify-between text-slate-500 mt-1">
                <span>Login Email:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{targetUser.email}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  New Password *
                </label>
                <button
                  type="button"
                  onClick={() => setNewPassword(`pwd@${Math.floor(1000 + Math.random() * 9000)}`)}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Generate New
                </button>
              </div>
              <input
                type="text"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Since there is no self-serve forgot password flow, instruct the user to remember this password.
              </span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
              >
                {isSubmitting ? 'Resetting...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
