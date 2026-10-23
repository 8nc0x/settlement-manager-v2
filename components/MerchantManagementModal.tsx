'use client';

import React from 'react';
import { User } from '@/types';
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
import { UserPlus, Copy, Check, AlertCircle } from 'lucide-react';

interface MerchantManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSuccess: () => void;
}

export default function MerchantManagementModal({
  isOpen,
  onClose,
  currentUser,
  onSuccess
}: MerchantManagementModalProps) {
  const [name, setName] = React.useState<string>('');
  const [businessName, setBusinessName] = React.useState<string>('');
  const [email, setEmail] = React.useState<string>('');
  const [phone, setPhone] = React.useState<string>('');
  const [password, setPassword] = React.useState<string>(() => `merch@${Math.floor(1000 + Math.random() * 9000)}`);
  const [defaultUpiId, setDefaultUpiId] = React.useState<string>('');

  const [accountHolder, setAccountHolder] = React.useState<string>('');
  const [accountNumber, setAccountNumber] = React.useState<string>('');
  const [ifscCode, setIfscCode] = React.useState<string>('');
  const [bankName, setBankName] = React.useState<string>('');

  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = React.useState<{ email: string; password: string; name: string } | null>(null);
  const [copiedCreds, setCopiedCreds] = React.useState<boolean>(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setCreatedCredentials(null);
    setErrorMsg(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Name, login email, and initial password are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          businessName: businessName.trim() || name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password: password.trim(),
          role: 'merchant',
          createdBy: currentUser.id,
          subAdminId: currentUser.role === 'subadmin' ? currentUser.id : undefined,
          defaultUpiId: defaultUpiId.trim() || undefined,
          bankDetails: accountNumber.trim() ? {
            accountHolder: accountHolder.trim() || name.trim(),
            accountNumber: accountNumber.trim(),
            ifscCode: ifscCode.trim().toUpperCase(),
            bankName: bankName.trim() || 'Bank Account'
          } : undefined
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create merchant');
      }

      setCreatedCredentials({
        email: email.trim().toLowerCase(),
        password: password.trim(),
        name: name.trim()
      });
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating merchant account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (createdCredentials) {
      const text = `SettleTrack Merchant Credentials:\nMerchant: ${createdCredentials.name}\nLogin ID / Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nNote: Keep this password safe. Contact your Agent for any reset.`;
      navigator.clipboard.writeText(text);
      setCopiedCreds(true);
      setTimeout(() => setCopiedCreds(false), 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-lg p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            <DialogTitle className="text-lg font-bold">Create Merchant Account</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Add a merchant under your agency and issue login credentials.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {createdCredentials ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2.5">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                Merchant Account Created Successfully!
              </span>
              <p className="text-xs text-muted-foreground">
                Give these credentials directly to the merchant. There is no forget-password link; you can reset their password anytime from your dashboard.
              </p>

              <div className="bg-card p-3 rounded-lg border border-border space-y-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Login Email:</span>
                  <span className="font-bold text-foreground">{createdCredentials.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Password:</span>
                  <span className="font-bold text-emerald-700">{createdCredentials.password}</span>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleCopyCredentials}
                className="w-full h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-xs"
              >
                {copiedCreds ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCreds ? 'Copied to Clipboard!' : 'Copy Credentials for Merchant'}</span>
              </Button>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={handleClose}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="merchantName" className="text-xs font-semibold">
                  Merchant Full Name *
                </Label>
                <Input
                  id="merchantName"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="businessNameInput" className="text-xs font-semibold">
                  Business / Store Name
                </Label>
                <Input
                  id="businessNameInput"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Patel Hardware"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="merchantEmailInput" className="text-xs font-semibold">
                  Login Email / ID *
                </Label>
                <Input
                  id="merchantEmailInput"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="merchant.patel@store.com"
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="phoneInput" className="text-xs font-semibold">
                  Phone Number
                </Label>
                <Input
                  id="phoneInput"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="passInput" className="text-xs font-semibold">
                  Initial Password *
                </Label>
                <button
                  type="button"
                  onClick={() => setPassword(`merch@${Math.floor(1000 + Math.random() * 9000)}`)}
                  className="text-[11px] text-emerald-600 hover:underline"
                >
                  Regenerate
                </button>
              </div>
              <Input
                id="passInput"
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="font-mono font-bold text-xs"
              />
              <span className="text-[10px] text-muted-foreground block">
                No password reset email is sent. You can reset this password anytime from your dashboard.
              </span>
            </div>

            <div className="space-y-1">
              <Label htmlFor="defaultUpi" className="text-xs font-semibold">
                Default Payout UPI ID (Optional)
              </Label>
              <Input
                id="defaultUpi"
                type="text"
                value={defaultUpiId}
                onChange={(e) => setDefaultUpiId(e.target.value)}
                placeholder="patel.store@upi"
                className="font-mono text-xs"
              />
            </div>

            {/* Bank details */}
            <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-2">
              <Label className="text-xs font-semibold block">Bank Account Details (Optional)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="A/C Holder Name"
                  className="text-xs bg-background"
                />
                <Input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Bank Name (e.g. SBI)"
                  className="text-xs bg-background"
                />
                <Input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Account Number"
                  className="font-mono text-xs bg-background"
                />
                <Input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="IFSC Code"
                  className="font-mono uppercase text-xs bg-background"
                />
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {isSubmitting ? 'Creating...' : 'Create Merchant Account'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
