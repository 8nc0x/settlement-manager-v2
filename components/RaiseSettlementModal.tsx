'use client';

import React from 'react';
import { User, SettlementPayoutDetails } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Smartphone, Building, IndianRupee, AlertCircle } from 'lucide-react';

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
  onSuccess
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
  const [hasTimeConstraint, setHasTimeConstraint] = React.useState<boolean>(true);

  const [payoutMethod, setPayoutMethod] = React.useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = React.useState<string>(currentUser.defaultUpiId || '');
  
  const [accountHolder, setAccountHolder] = React.useState<string>(currentUser.bankDetails?.accountHolder || currentUser.name || '');
  const [accountNumber, setAccountNumber] = React.useState<string>(currentUser.bankDetails?.accountNumber || '');
  const [ifscCode, setIfscCode] = React.useState<string>(currentUser.bankDetails?.ifscCode || '');
  const [bankName, setBankName] = React.useState<string>(currentUser.bankDetails?.bankName || '');
  const [merchantNotes, setMerchantNotes] = React.useState<string>('');

  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  if (!isOpen) return null;

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

    if (payoutMethod === 'upi' && !upiId.trim()) {
      setErrorMsg('Please enter the custom destination UPI ID');
      return;
    }

    if (payoutMethod === 'bank' && (!accountNumber.trim() || !ifscCode.trim())) {
      setErrorMsg('Please provide the Bank Account Number and IFSC code');
      return;
    }

    const payoutDetails: SettlementPayoutDetails = {
      method: payoutMethod,
      ...(payoutMethod === 'upi' ? { upiId: upiId.trim() } : {
        accountHolder: accountHolder.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        bankName: bankName.trim()
      })
    };

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
            startTime: hasTimeConstraint ? startTime : undefined,
            endDate,
            endTime: hasTimeConstraint ? endTime : undefined
          },
          payoutDetails,
          merchantNotes
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit settlement request');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubAdmin = currentUser.role === 'subadmin';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {isSubAdmin ? 'Request Platform Settlement' : 'Raise Settlement Request'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isSubAdmin 
              ? 'Request aggregated payout clearance from Platform Admin' 
              : 'Submit collected turnover date range & amount to your Agent / Sub-Admin'}
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount input */}
          <div className="space-y-1.5">
            <Label htmlFor="amountInput" className="text-xs font-semibold">
              Settlement Amount (INR numerical value) *
            </Label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                id="amountInput"
                type="number"
                step="any"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50000"
                className="pl-9 text-base sm:text-lg font-mono font-bold"
              />
            </div>
            {Number(amount) > 0 && (
              <span className="text-[11px] text-muted-foreground block font-mono">
                Formatted: ₹{Number(amount).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Date range constraint */}
          <div className="p-3.5 bg-muted/40 rounded-xl border border-border/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Settlement Date Range *
              </span>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasTimeConstraint}
                  onChange={(e) => setHasTimeConstraint(e.target.checked)}
                  className="rounded border-border text-emerald-600 focus:ring-emerald-500"
                />
                <span>Include Time Constraint</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1 block">From Date</Label>
                <Input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs h-8 bg-background"
                />
                {hasTimeConstraint && (
                  <div className="mt-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="text-[11px] h-7 bg-background"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label className="text-[11px] text-muted-foreground mb-1 block">To Date</Label>
                <Input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs h-8 bg-background"
                />
                {hasTimeConstraint && (
                  <div className="mt-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="text-[11px] h-7 bg-background"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payout Destination Selector: Custom UPI ID or Bank Account */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold block">
              Payout Destination (Where funds will be transferred) *
            </Label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
              <Button
                type="button"
                variant={payoutMethod === 'upi' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPayoutMethod('upi')}
                className={`text-xs h-8 gap-1.5 ${payoutMethod === 'upi' ? 'bg-white text-foreground shadow-xs font-semibold hover:bg-white' : 'text-muted-foreground'}`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Custom UPI ID</span>
              </Button>
              <Button
                type="button"
                variant={payoutMethod === 'bank' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPayoutMethod('bank')}
                className={`text-xs h-8 gap-1.5 ${payoutMethod === 'bank' ? 'bg-white text-foreground shadow-xs font-semibold hover:bg-white' : 'text-muted-foreground'}`}
              >
                <Building className="w-3.5 h-3.5 text-blue-600" />
                <span>Bank Account</span>
              </Button>
            </div>

            {payoutMethod === 'upi' ? (
              <div className="space-y-1">
                <Label htmlFor="payoutUpi" className="text-[11px] text-muted-foreground">
                  Requested UPI ID (VPA) *
                </Label>
                <Input
                  id="payoutUpi"
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="merchant.store@upi"
                  className="font-mono text-xs"
                />
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Account Holder Name *</Label>
                    <Input
                      type="text"
                      required
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      placeholder="Beneficiary Name"
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Bank Name</Label>
                    <Input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank, SBI"
                      className="text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Account Number *</Label>
                    <Input
                      type="text"
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Account Number"
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">IFSC Code *</Label>
                    <Input
                      type="text"
                      required
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="HDFC0001234"
                      className="font-mono uppercase text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Remarks */}
          <div className="space-y-1">
            <Label htmlFor="merchantNotesInput" className="text-xs font-semibold">
              Notes / Remarks (Optional)
            </Label>
            <Input
              id="merchantNotesInput"
              type="text"
              value={merchantNotes}
              onChange={(e) => setMerchantNotes(e.target.value)}
              placeholder="e.g. Weekend counter collections, QR settlement"
              className="text-xs"
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {isSubmitting ? 'Submitting...' : 'Raise Settlement'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
