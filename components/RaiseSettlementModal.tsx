'use client';

import React from 'react';
import { User, SettlementPayoutDetails } from '@/types';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Smartphone, Building, IndianRupee, AlertCircle, X, ArrowUpRight, Building2, UserCheck } from 'lucide-react';

interface RaiseSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSuccess: () => void;
}

export default function RaiseSettlementModal({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
}: RaiseSettlementModalProps) {
  const [amount, setAmount] = React.useState<string>('50000');
  const [startDate, setStartDate] = React.useState<string>(() => {
    return new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  });
  const [startTime, setStartTime] = React.useState<string>('00:00');
  const [endDate, setEndDate] = React.useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [endTime, setEndTime] = React.useState<string>('23:59');

  const [payoutMethod, setPayoutMethod] = React.useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = React.useState<string>(currentUser.defaultUpiId || '');
  const [accountHolder, setAccountHolder] = React.useState<string>(
    currentUser.bankDetails?.accountHolder || currentUser.name || ''
  );
  const [accountNumber, setAccountNumber] = React.useState<string>(currentUser.bankDetails?.accountNumber || '');
  const [ifscCode, setIfscCode] = React.useState<string>(currentUser.bankDetails?.ifscCode || '');
  const [bankName, setBankName] = React.useState<string>(currentUser.bankDetails?.bankName || '');
  const [merchantNotes, setMerchantNotes] = React.useState<string>('');
  const [clearingDestination, setClearingDestination] = React.useState<'subadmin' | 'admin'>('subadmin');

  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (currentUser.defaultUpiId && !upiId) {
        setUpiId(currentUser.defaultUpiId);
      }
      if (currentUser.bankDetails) {
        setAccountHolder(currentUser.bankDetails.accountHolder || currentUser.name);
        setAccountNumber(currentUser.bankDetails.accountNumber || '');
        setIfscCode(currentUser.bankDetails.ifscCode || '');
        setBankName(currentUser.bankDetails.bankName || '');
      }
      setClearingDestination(currentUser.subAdminId ? 'subadmin' : 'admin');
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const isSubAdmin = currentUser.role === 'subadmin';

  const applyPreset = (daysAgo: number) => {
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setStartDate(start);
    setEndDate(end);
    setStartTime('00:00');
    setEndTime('23:59');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please specify a valid numerical amount greater than ₹0');
      return;
    }

    if (!startDate || !endDate) {
      setErrorMsg('Please provide both start and end dates for the settlement range');
      return;
    }

    const payoutDetails: SettlementPayoutDetails = {
      method: payoutMethod,
    };

    if (payoutMethod === 'upi') {
      if (!upiId.trim()) {
        setErrorMsg('Please enter your destination UPI ID');
        return;
      }
      payoutDetails.upiId = upiId.trim();
    } else {
      if (!accountNumber.trim() || !ifscCode.trim()) {
        setErrorMsg('Bank Account Number and IFSC code are required');
        return;
      }
      payoutDetails.accountHolder = accountHolder.trim();
      payoutDetails.accountNumber = accountNumber.trim();
      payoutDetails.ifscCode = ifscCode.trim().toUpperCase();
      payoutDetails.bankName = bankName.trim() || 'Scheduled Bank';
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: currentUser.id,
          amount: numAmount,
          dateRange: {
            startDate,
            startTime,
            endDate,
            endTime,
          },
          payoutDetails,
          merchantNotes: merchantNotes.trim(),
          recipientType: isSubAdmin ? 'admin' : clearingDestination,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to raise settlement');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-xl bg-[#ffffff] border border-[#e6e5e0] rounded-[12px] p-6 text-[#26251e] shadow-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex items-center justify-between pb-3 border-b border-[#efeee8]">
          <div>
            <div className="font-display text-[20px] font-medium tracking-tight text-[#26251e]">
              {isSubAdmin
                ? 'Raise Sub-Admin Settlement to Platform'
                : clearingDestination === 'admin'
                ? 'Raise Direct Settlement to Platform Admin'
                : 'Raise Settlement to Assigned Agent'}
            </div>
            <div className="text-[12px] text-[#807d72]">
              {isSubAdmin
                ? 'Request aggregated clearing from Platform Admin'
                : clearingDestination === 'admin'
                ? 'Direct payout clearance requested from Platform Treasury HQ'
                : `Submit turnover timeframe & amount to ${currentUser.subAdminName || 'Agent'}`}
            </div>
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

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Amount input */}
          <div className="space-y-1.5">
            <Label htmlFor="amountInput" className="text-[12px] font-semibold text-[#26251e] block">
              Settlement Amount (INR) *
            </Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#807d72] font-mono text-[14px]">
                ₹
              </span>
              <Input
                id="amountInput"
                type="number"
                min="100"
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50000"
                className="pl-7 font-mono text-[16px] font-medium h-10 rounded-[8px] border-[#e6e5e0] bg-[#ffffff] focus-visible:ring-1 focus-visible:ring-[#f54e00]"
              />
            </div>
          </div>

          {/* Date range picker with presets */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <Label className="text-[12px] font-semibold text-[#26251e] block">
                Turnover Collection Date Range *
              </Label>
              <div className="flex items-center gap-1">
                {[
                  { label: 'Today', days: 0 },
                  { label: 'Yesterday', days: 1 },
                  { label: '3 Days', days: 3 },
                  { label: '7 Days', days: 7 },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p.days)}
                    className="px-2 py-0.5 rounded-[4px] border border-[#e6e5e0] bg-[#fafaf7] hover:border-[#cfcdc4] text-[10px] font-mono text-[#5a5852] hover:text-[#26251e] transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-[#807d72]">From Date & Time</span>
                <div className="flex gap-1.5">
                  <Input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-[12px] h-9 rounded-[8px] border-[#e6e5e0] bg-[#ffffff]"
                  />
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="text-[12px] w-24 h-9 rounded-[8px] border-[#e6e5e0] bg-[#ffffff]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-mono text-[#807d72]">To Date & Time</span>
                <div className="flex gap-1.5">
                  <Input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-[12px] h-9 rounded-[8px] border-[#e6e5e0] bg-[#ffffff]"
                  />
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="text-[12px] w-24 h-9 rounded-[8px] border-[#e6e5e0] bg-[#ffffff]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Clearing Authority Selector (Direct Admin vs Assigned Agent) */}
          {!isSubAdmin && (
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-[#26251e] block">
                Clearing Authority / Payer *
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Direct Platform Admin */}
                <button
                  type="button"
                  onClick={() => setClearingDestination('admin')}
                  className={`p-3 rounded-[8px] border text-left transition-all ${
                    clearingDestination === 'admin'
                      ? 'border-[#f54e00] bg-[#fafaf7] text-[#26251e]'
                      : 'border-[#e6e5e0] bg-[#ffffff] text-[#5a5852] hover:border-[#cfcdc4]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#26251e]">
                    <Building2 className="size-4 text-[#f54e00]" />
                    <span>Platform Admin HQ</span>
                  </div>
                  <div className="text-[11px] text-[#807d72] mt-0.5">
                    Direct clearance by Platform Admin
                  </div>
                  <div className="mt-1 text-[10px] font-mono text-[#1f8a65]">
                    ✓ Direct Platform Payout
                  </div>
                </button>

                {/* Assigned Sub-Admin Agent */}
                <button
                  type="button"
                  disabled={!currentUser.subAdminId}
                  onClick={() => setClearingDestination('subadmin')}
                  className={`p-3 rounded-[8px] border text-left transition-all ${
                    !currentUser.subAdminId
                      ? 'opacity-50 cursor-not-allowed border-[#e6e5e0] bg-[#f7f7f4]'
                      : clearingDestination === 'subadmin'
                      ? 'border-[#f54e00] bg-[#fafaf7] text-[#26251e]'
                      : 'border-[#e6e5e0] bg-[#ffffff] text-[#5a5852] hover:border-[#cfcdc4]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#26251e]">
                    <UserCheck className="size-4 text-[#807d72]" />
                    <span>Assigned Regional Agent</span>
                  </div>
                  <div className="text-[11px] text-[#807d72] mt-0.5 truncate">
                    {currentUser.subAdminName || 'No agent assigned'}
                  </div>
                  <div className="mt-1 text-[10px] font-mono text-[#807d72]">
                    {currentUser.subAdminId ? 'Regional Desk Settlement' : 'Unassigned'}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Payout method toggle */}
          <div className="space-y-2">
            <Label className="text-[12px] font-semibold text-[#26251e] block">
              Destination Payout Method *
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPayoutMethod('upi')}
                className={`p-2.5 rounded-[8px] border text-left transition-colors flex items-center gap-2 ${
                  payoutMethod === 'upi'
                    ? 'border-[#f54e00] bg-[#fafaf7] text-[#26251e]'
                    : 'border-[#e6e5e0] bg-[#ffffff] text-[#5a5852] hover:border-[#cfcdc4]'
                }`}
              >
                <Smartphone className={`size-4 ${payoutMethod === 'upi' ? 'text-[#f54e00]' : 'text-[#807d72]'}`} />
                <div>
                  <div className="text-[12px] font-medium">UPI VPA</div>
                  <div className="text-[10px] text-[#807d72]">Instant IMPS settlement</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPayoutMethod('bank')}
                className={`p-2.5 rounded-[8px] border text-left transition-colors flex items-center gap-2 ${
                  payoutMethod === 'bank'
                    ? 'border-[#f54e00] bg-[#fafaf7] text-[#26251e]'
                    : 'border-[#e6e5e0] bg-[#ffffff] text-[#5a5852] hover:border-[#cfcdc4]'
                }`}
              >
                <Building className={`size-4 ${payoutMethod === 'bank' ? 'text-[#f54e00]' : 'text-[#807d72]'}`} />
                <div>
                  <div className="text-[12px] font-medium">Bank Account</div>
                  <div className="text-[10px] text-[#807d72]">NEFT / RTGS transfer</div>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Method Inputs */}
          {payoutMethod === 'upi' ? (
            <div className="space-y-1.5">
              <Label htmlFor="upiInput" className="text-[12px] font-semibold text-[#26251e] block">
                Destination UPI ID (VPA) *
              </Label>
              <Input
                id="upiInput"
                type="text"
                required
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="storename@okaxis or mobile@upi"
                className="font-mono text-[13px] h-10 rounded-[8px] border-[#e6e5e0] bg-[#ffffff]"
              />
            </div>
          ) : (
            <div className="space-y-2 p-3.5 rounded-[8px] border border-[#e6e5e0] bg-[#fafaf7]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[11px] text-[#807d72]">Account Holder Name *</span>
                  <Input
                    type="text"
                    required
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="text-[12px] h-9 rounded-[8px] border-[#e6e5e0] bg-[#ffffff]"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-[#807d72]">Bank Name</span>
                  <Input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank, SBI"
                    className="text-[12px] h-9 rounded-[8px] border-[#e6e5e0] bg-[#ffffff]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[11px] text-[#807d72]">Account Number *</span>
                  <Input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="font-mono text-[12px] h-9 rounded-[8px] border-[#e6e5e0] bg-[#ffffff]"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-[#807d72]">IFSC Code *</span>
                  <Input
                    type="text"
                    required
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="HDFC0001234"
                    className="font-mono uppercase text-[12px] h-9 rounded-[8px] border-[#e6e5e0] bg-[#ffffff]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="merchantNotesInput" className="text-[12px] font-semibold text-[#26251e] block">
              Notes / Transaction Breakdown (Optional)
            </Label>
            <Textarea
              id="merchantNotesInput"
              rows={2}
              value={merchantNotes}
              onChange={(e) => setMerchantNotes(e.target.value)}
              placeholder="e.g. UPI QR collection summary for weekend sale..."
              className="text-[12px] rounded-[8px] border-[#e6e5e0] bg-[#ffffff]"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-[#efeee8] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-cursor-secondary text-[13px] h-9 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-cursor-primary text-[13px] h-9 px-5"
            >
              <span>{isSubmitting ? 'Submitting...' : 'Raise Settlement'}</span>
              <ArrowUpRight className="size-3.5" />
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}