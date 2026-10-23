'use client';

import React from 'react';
import { User } from '@/types';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, Copy, Check, AlertCircle, RefreshCw, X } from 'lucide-react';

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
  onSuccess,
}: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = React.useState<string>(() => `reset@${Math.floor(1000 + Math.random() * 9000)}`);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successInfo, setSuccessInfo] = React.useState<{ password: string } | null>(null);
  const [copied, setCopied] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (isOpen) {
      setNewPassword(`pwd@${Math.floor(1000 + Math.random() * 9000)}`);
      setErrorMsg(null);
      setSuccessInfo(null);
      setCopied(false);
    }
  }, [isOpen, targetUser]);

  if (!isOpen || !targetUser) return null;

  const handleClose = () => {
    setSuccessInfo(null);
    setErrorMsg(null);
    onClose();
  };

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
          requesterId: currentUser.id,
        }),
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
    if (!successInfo) return;
    const text = `SettleTrack Password Reset\nAccount: ${targetUser.name} (${targetUser.email})\nNew Password: ${successInfo.password}\nLogin URL: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-md bg-[#ffffff] border border-[#e6e5e0] rounded-[12px] p-6 text-[#26251e] shadow-sm">
        <DialogHeader className="flex items-center justify-between pb-3 border-b border-[#efeee8]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[6px] bg-[#fafaf7] border border-[#e6e5e0] flex items-center justify-center text-[#f54e00]">
              <KeyRound className="size-4" />
            </div>
            <div>
              <div className="font-display text-[18px] font-medium tracking-tight text-[#26251e]">
                Reset Merchant Password
              </div>
              <div className="text-[11px] font-mono text-[#807d72] truncate max-w-[240px]">
                {targetUser.email}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-7 h-7 rounded-[6px] border border-[#e6e5e0] flex items-center justify-center text-[#807d72] hover:text-[#26251e] hover:bg-[#fafaf7]"
          >
            <X className="size-4" />
          </button>
        </DialogHeader>

        {errorMsg && (
          <div className="my-3 p-3 rounded-[8px] border border-[#cf2d56]/20 bg-[#fae8ed] text-[12px] text-[#cf2d56] flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successInfo ? (
          <div className="py-3 space-y-3">
            <div className="p-3 rounded-[8px] border border-[#1f8a65]/30 bg-[#e2f4eb] text-[#1f8a65] text-[12px] flex items-center gap-2 font-medium">
              <Check className="size-4 shrink-0" />
              <span>Password successfully updated in database!</span>
            </div>

            <div className="p-3.5 rounded-[8px] border border-[#e6e5e0] bg-[#fafaf7] font-mono text-[12px] space-y-1.5">
              <div className="text-[#807d72] text-[11px]">New Password:</div>
              <div className="text-[18px] font-bold text-[#f54e00]">{successInfo.password}</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCopy}
                className="btn-cursor-secondary text-[12px] h-8 px-3"
              >
                {copied ? <Check className="size-3 text-[#1f8a65]" /> : <Copy className="size-3" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="btn-cursor-primary text-[12px] h-8 px-4"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4 pt-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="resetPasswordInput" className="text-[12px] font-semibold text-[#26251e] block">
                  New Password *
                </Label>
                <button
                  type="button"
                  onClick={() => setNewPassword(`pwd@${Math.floor(1000 + Math.random() * 9000)}`)}
                  className="text-[11px] text-[#f54e00] hover:underline flex items-center gap-1 font-mono"
                >
                  <RefreshCw className="size-3" />
                  <span>Regenerate</span>
                </button>
              </div>
              <Input
                id="resetPasswordInput"
                type="text"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="font-mono text-[14px] font-bold text-[#f54e00] h-9 rounded-[8px] border-[#e6e5e0] bg-[#fafaf7]"
              />
              <span className="text-[11px] text-[#807d72] block">
                Since there is no self-serve forgot password flow, remember to communicate this password to the merchant.
              </span>
            </div>

            <div className="pt-2 border-t border-[#efeee8] flex justify-end gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                className="btn-cursor-secondary text-[13px] h-9 px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-cursor-primary text-[13px] h-9 px-5"
              >
                {isSubmitting ? 'Updating...' : 'Set Password'}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}