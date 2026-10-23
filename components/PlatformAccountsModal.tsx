'use client';

import React from 'react';
import { PlatformCollectionAccount, User } from '@/types';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Building2, Smartphone, Plus, Trash2, Check, Copy, AlertCircle } from 'lucide-react';

interface PlatformAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSuccess?: () => void;
}

export default function PlatformAccountsModal({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
}: PlatformAccountsModalProps) {
  const [accounts, setAccounts] = React.useState<PlatformCollectionAccount[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [showAddForm, setShowAddForm] = React.useState<boolean>(false);

  const [type, setType] = React.useState<'upi' | 'bank'>('upi');
  const [title, setTitle] = React.useState<string>('');
  const [upiId, setUpiId] = React.useState<string>('');
  const [accountHolder, setAccountHolder] = React.useState<string>('Apex Settlement Technologies Pvt Ltd');
  const [accountNumber, setAccountNumber] = React.useState<string>('');
  const [ifscCode, setIfscCode] = React.useState<string>('');
  const [bankName, setBankName] = React.useState<string>('');
  const [notes, setNotes] = React.useState<string>('');

  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const refetch = async () => {
    try {
      const res = await fetch('/api/platform-accounts');
      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!isOpen) return;
    refetch();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const newAccount: Omit<PlatformCollectionAccount, 'id' | 'updatedAt'> & { id?: string } = {
      type,
      title: title.trim(),
      upiId: upiId?.trim(),
      accountHolder: accountHolder.trim(),
      accountNumber: accountNumber?.trim(),
      ifscCode: ifscCode?.trim().toUpperCase(),
      bankName: bankName?.trim(),
      notes: notes?.trim(),
      isActive: true,
    };

    try {
      const res = await fetch('/api/platform-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorId: currentUser.id,
          account: newAccount,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add collection account');
      }

      setShowAddForm(false);
      setTitle('');
      setUpiId('');
      setAccountNumber('');
      setIfscCode('');
      setBankName('');
      setNotes('');
      refetch();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error adding account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const res = await fetch(
        `/api/platform-accounts?id=${encodeURIComponent(id)}&actorId=${encodeURIComponent(currentUser.id)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (data.success) {
        refetch();
      } else {
        setErrorMsg(data.error || 'Failed to remove account');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error removing account');
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleActive = async (id: string) => {
    try {
      const targetAcc = accounts.find((a) => a.id === id);
      if (!targetAcc) return;
      const res = await fetch('/api/platform-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorId: currentUser.id,
          account: {
            ...targetAcc,
            isActive: !targetAcc.isActive,
          },
        }),
      });
      const data = await res.json();
      if (data.success) refetch();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl bg-[#ffffff] border border-[#e6e5e0] rounded-[12px] p-6 text-[#26251e] shadow-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex items-center justify-between pb-3 border-b border-[#efeee8]">
          <div className="flex items-center justify-between w-full pr-6">
            <div>
              <div className="font-display text-[20px] font-medium tracking-tight text-[#26251e]">
                Platform Collection Accounts
              </div>
              <div className="text-[12px] text-[#807d72]">
                Official UPI QR VPAs and Bank Accounts for platform deposits
              </div>
            </div>

            {currentUser.role === 'admin' && !showAddForm && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="btn-cursor-primary text-[12px] h-8 px-3"
              >
                <Plus className="size-3.5" />
                <span>Add Account</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
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

        {/* Add Account Inline Form */}
        {showAddForm && (
          <form onSubmit={handleAddAccount} className="p-4 rounded-[8px] border border-[#e6e5e0] bg-[#fafaf7] my-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#efeee8]">
              <span className="text-[12px] font-semibold text-[#26251e]">Add New Collection Account</span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-[11px] text-[#807d72] hover:text-[#26251e]"
              >
                Cancel
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('upi')}
                className={`py-1 px-3 text-[12px] rounded-[6px] border transition-colors ${
                  type === 'upi'
                    ? 'border-[#f54e00] bg-[#ffffff] font-semibold text-[#f54e00]'
                    : 'border-[#e6e5e0] bg-[#ffffff] text-[#5a5852]'
                }`}
              >
                UPI ID (VPA)
              </button>
              <button
                type="button"
                onClick={() => setType('bank')}
                className={`py-1 px-3 text-[12px] rounded-[6px] border transition-colors ${
                  type === 'bank'
                    ? 'border-[#f54e00] bg-[#ffffff] font-semibold text-[#f54e00]'
                    : 'border-[#e6e5e0] bg-[#ffffff] text-[#5a5852]'
                }`}
              >
                Bank Account
              </button>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] text-[#807d72]">Account Label / Title *</Label>
              <Input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Primary Collection UPI QR"
                className="text-[12px] h-8 rounded-[6px] border-[#e6e5e0] bg-[#ffffff]"
              />
            </div>

            {type === 'upi' ? (
              <div className="space-y-1">
                <Label className="text-[11px] text-[#807d72]">UPI VPA *</Label>
                <Input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="apexplatform.collect@icici"
                  className="font-mono text-[12px] h-8 rounded-[6px] border-[#e6e5e0] bg-[#ffffff]"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-[#807d72]">Account Number *</Label>
                  <Input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="font-mono text-[12px] h-8 rounded-[6px] border-[#e6e5e0] bg-[#ffffff]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-[#807d72]">IFSC Code *</Label>
                  <Input
                    type="text"
                    required
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="ICIC0001849"
                    className="font-mono uppercase text-[12px] h-8 rounded-[6px] border-[#e6e5e0] bg-[#ffffff]"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-cursor-secondary text-[12px] h-8 px-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-cursor-primary text-[12px] h-8 px-4"
              >
                {isSubmitting ? 'Adding...' : 'Save Account'}
              </button>
            </div>
          </form>
        )}

        {/* Account List */}
        <div className="space-y-2.5 my-2">
          {loading && (
            <div className="p-6 text-center text-[12px] text-[#807d72]">Loading accounts...</div>
          )}

          {!loading && accounts.length === 0 && (
            <div className="p-8 text-center text-[12px] text-[#807d72] rounded-[8px] border border-[#e6e5e0] bg-[#fafaf7]">
              No collection accounts configured.
            </div>
          )}

          {!loading &&
            accounts.map((acc) => {
              const isUpi = acc.type === 'upi';
              return (
                <div
                  key={acc.id}
                  className={`p-3.5 rounded-[8px] border transition-colors ${
                    acc.isActive ? 'border-[#e6e5e0] bg-[#ffffff]' : 'border-[#e6e5e0]/60 bg-[#fafaf7] opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#efeee8]">
                    <div className="flex items-center gap-2">
                      {isUpi ? (
                        <Smartphone className="size-4 text-[#f54e00]" />
                      ) : (
                        <Building2 className="size-4 text-[#807d72]" />
                      )}
                      <span className="font-semibold text-[13px] text-[#26251e]">{acc.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#e6e5e0] text-[#5a5852]">
                        {acc.type}
                      </span>
                      {acc.isActive ? (
                        <span className="text-[10px] font-mono text-[#1f8a65] font-semibold">ACTIVE</span>
                      ) : (
                        <span className="text-[10px] font-mono text-[#807d72]">INACTIVE</span>
                      )}
                    </div>
                  </div>

                  <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-[12px]">
                    <div>
                      <div className="text-[11px] font-sans text-[#807d72]">{acc.accountHolder}</div>
                      {isUpi ? (
                        <div className="text-[14px] font-bold text-[#f54e00]">{acc.upiId}</div>
                      ) : (
                        <div className="text-[#26251e]">
                          {acc.bankName} · A/C {acc.accountNumber} · IFSC: {acc.ifscCode}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleCopy(acc.id, isUpi ? acc.upiId || '' : acc.accountNumber || '')}
                        className="btn-cursor-secondary text-[11px] h-7 px-2.5"
                      >
                        {copiedId === acc.id ? <Check className="size-3 text-[#1f8a65]" /> : <Copy className="size-3" />}
                        <span>{copiedId === acc.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      {currentUser.role === 'admin' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(acc.id)}
                            className="btn-cursor-secondary text-[11px] h-7 px-2"
                          >
                            {acc.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemove(acc.id)}
                            className="btn-cursor-secondary text-[11px] h-7 px-2 text-[#cf2d56] hover:border-[#cf2d56]"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
}