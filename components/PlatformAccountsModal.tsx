'use client';

import React from 'react';
import { PlatformCollectionAccount, User } from '@/types';
import { X, Building2, Smartphone, Plus, Trash2, Check, Copy, AlertCircle } from 'lucide-react';

interface PlatformAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

export default function PlatformAccountsModal({
  isOpen,
  onClose,
  currentUser
}: PlatformAccountsModalProps) {
  const [accounts, setAccounts] = React.useState<PlatformCollectionAccount[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [showAddForm, setShowAddForm] = React.useState<boolean>(false);

  // Form states
  const [type, setType] = React.useState<'upi' | 'bank'>('upi');
  const [title, setTitle] = React.useState<string>('');
  const [upiId, setUpiId] = React.useState<string>('');
  const [accountHolder, setAccountHolder] = React.useState<string>('Apex Settlement Platform');
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
    let isSubscribed = true;
    fetch('/api/platform-accounts')
      .then((res) => res.json())
      .then((data) => {
        if (isSubscribed && data.success) {
          setAccounts(data.accounts);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isSubscribed) {
          console.error(err);
          setLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Account title is required');
      return;
    }

    if (type === 'upi' && !upiId.trim()) {
      setErrorMsg('UPI ID is required');
      return;
    }

    if (type === 'bank' && (!accountNumber.trim() || !ifscCode.trim())) {
      setErrorMsg('Bank Account Number and IFSC are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/platform-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorId: currentUser.id,
          account: {
            type,
            title: title.trim(),
            upiId: upiId.trim() || undefined,
            accountHolder: accountHolder.trim(),
            accountNumber: accountNumber.trim() || undefined,
            ifscCode: ifscCode.trim().toUpperCase() || undefined,
            bankName: bankName.trim() || undefined,
            notes: notes.trim() || undefined,
            isActive: true
          }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save account');
      }

      setShowAddForm(false);
      setTitle('');
      setUpiId('');
      setAccountNumber('');
      setIfscCode('');
      setBankName('');
      setNotes('');
      refetch();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving platform collection account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this platform collection account?')) return;
    try {
      await fetch(`/api/platform-accounts?id=${id}&actorId=${currentUser.id}`, {
        method: 'DELETE'
      });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              <span>Platform Collection Bank Accounts &amp; UPI</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Official accounts where platform money is collected by Admin
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

        <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Admin action: Add New */}
          {isAdmin && !showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 transition-colors bg-slate-50/50 dark:bg-slate-850"
            >
              <Plus className="w-4 h-4 text-emerald-500" />
              <span>Add Platform Collection Account or UPI</span>
            </button>
          )}

          {/* Add form */}
          {showAddForm && (
            <form onSubmit={handleAddAccount} className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Add New Collection Account</span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('upi')}
                  className={`py-1.5 px-3 text-xs font-medium rounded-lg border ${
                    type === 'upi' ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  UPI ID
                </button>
                <button
                  type="button"
                  onClick={() => setType('bank')}
                  className={`py-1.5 px-3 text-xs font-medium rounded-lg border ${
                    type === 'bank' ? 'bg-blue-500 text-white font-bold border-blue-400' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Bank Account
                </button>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Account Label / Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Primary Customer Collection QR"
                  className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Account Holder / Entity *</label>
                <input
                  type="text"
                  required
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                />
              </div>

              {type === 'upi' ? (
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">UPI ID (VPA) *</label>
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="platform.pay@icici"
                    className="w-full text-xs font-mono rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="ICICI Bank"
                      className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">A/C Number *</label>
                    <input
                      type="text"
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="184905001290"
                      className="w-full text-xs font-mono rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">IFSC Code *</label>
                    <input
                      type="text"
                      required
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="ICIC0001849"
                      className="w-full text-xs font-mono uppercase rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Notes / Description</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Primary collecting account for all incoming UPI traffic"
                  className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg"
                >
                  {isSubmitting ? 'Saving...' : 'Save Account'}
                </button>
              </div>
            </form>
          )}

          {/* Accounts list */}
          <div className="space-y-2.5">
            {accounts.map((acc) => (
              <div 
                key={acc.id}
                className="p-3.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {acc.type === 'upi' ? (
                      <Smartphone className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Building2 className="w-4 h-4 text-blue-500" />
                    )}
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">
                      {acc.title}
                    </span>
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDelete(acc.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 rounded"
                      title="Delete account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 text-xs font-mono">
                  {acc.type === 'upi' ? (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-900 dark:text-emerald-400 font-bold truncate">{acc.upiId}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(acc.upiId || '', acc.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        title="Copy UPI"
                      >
                        {copiedId === acc.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Bank:</span>
                        <span className="text-slate-900 dark:text-white font-sans">{acc.bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">A/C:</span>
                        <span className="text-slate-900 dark:text-white font-bold">{acc.accountNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">IFSC:</span>
                        <span className="text-slate-900 dark:text-white">{acc.ifscCode}</span>
                      </div>
                    </div>
                  )}
                </div>

                {acc.notes && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {acc.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 flex justify-end border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
