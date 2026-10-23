'use client';

import React from 'react';
import { User } from '@/types';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Copy, Check, AlertCircle, RefreshCw, X, Shield } from 'lucide-react';

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
  onSuccess,
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

  React.useEffect(() => {
    if (isOpen) {
      setName('');
      setBusinessName('');
      setEmail('');
      setPhone('');
      setPassword(`merch@${Math.floor(1000 + Math.random() * 9000)}`);
      setDefaultUpiId('');
      setAccountHolder('');
      setAccountNumber('');
      setIfscCode('');
      setBankName('');
      setErrorMsg(null);
      setCreatedCredentials(null);
      setCopiedCreds(false);
    }
  }, [isOpen]);

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
      setErrorMsg('Name, login email and initial password are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          businessName: businessName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password: password.trim(),
          role: 'merchant',
          createdBy: currentUser.id,
          subAdminId: currentUser.role === 'subadmin' ? currentUser.id : undefined,
          defaultUpiId: defaultUpiId.trim() || undefined,
          bankDetails: accountNumber.trim()
            ? {
                accountHolder: accountHolder.trim() || name.trim(),
                accountNumber: accountNumber.trim(),
                ifscCode: ifscCode.trim().toUpperCase(),
                bankName: bankName.trim(),
              }
            : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create merchant');
      }

      setCreatedCredentials({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
      });

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating merchant account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCredsToClipboard = () => {
    if (!createdCredentials) return;
    const text = `SettleTrack Merchant Login Credentials\nMerchant: ${createdCredentials.name}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nLogin URL: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-xl bg-[#ffffff] border border-[#e6e5e0] rounded-[12px] p-6 text-[#26251e] shadow-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex items-center justify-between pb-3 border-b border-[#efeee8]">
          <div>
            <div className="font-display text-[20px] font-medium tracking-tight text-[#26251e]">
              Create Merchant Account
            </div>
            <div className="text-[12px] text-[#807d72]">
              Onboard a store merchant and issue immediate login credentials
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

        {createdCredentials ? (
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-[8px] border border-[#1f8a65]/30 bg-[#e2f4eb] text-[#1f8a65] flex items-center gap-3">
              <Check className="size-5 shrink-0" />
              <div>
                <div className="font-semibold text-[13px]">Merchant Account Created Successfully!</div>
                <div className="text-[11px] text-[#26251e] mt-0.5">
                  Share these credentials directly with {createdCredentials.name}. There is no email self-service flow.
                </div>
              </div>
            </div>

            <div className="p-4 rounded-[8px] border border-[#e6e5e0] bg-[#fafaf7] font-mono text-[12px] space-y-2">
              <div className="flex justify-between">
                <span className="text-[#807d72]">Login Email:</span>
                <span className="font-semibold text-[#26251e]">{createdCredentials.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#807d72]">Initial Password:</span>
                <span className="font-bold text-[#f54e00]">{createdCredentials.password}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={copyCredsToClipboard}
                className="btn-cursor-secondary text-[13px] h-9 px-4"
              >
                {copiedCreds ? <Check className="size-3.5 text-[#1f8a65]" /> : <Copy className="size-3.5" />}
                <span>{copiedCreds ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="btn-cursor-primary text-[13px] h-9 px-5"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="mName" className="text-[12px] font-semibold text-[#26251e] block">
                  Merchant Full Name *
                </Label>
                <Input
                  id="mName"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sunil Sharma"
                  className="text-[12px] h-9 rounded-[8px] border-[#e6e5e0] bg-[#ffffff]"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="mBusiness" className="text-[12px] font-semibold text-[#26251e] block">
                  Business / Store Name
                </Label>
                <Input
                  id="mBusiness"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Sharma Electronics Retail"
                  className="text-[12px] h-9 rounded-[8px] border-[#e6e5e0] bg-[#ffffff]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="mEmail" className="text-[12px] font-semibold text-[#26251e] block">
                  Login Email *
                </Label>
                <Input
                  id="mEmail"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="merchant.store@domain.com"
                  className="text-[12px] font-mono h-9 rounded-[8px] border-[#e6e5e0] bg-[#ffffff]"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="mPhone" className="text-[12px] font-semibold text-[#26251e] block">
                  Contact Mobile Number
                </Label>
                <Input
                  id="mPhone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98200 12345"
                  className="text-[12px] font-mono h-9 rounded-[8px] border-[#e6e5e0] bg-[#ffffff]"
                />
              </div>
            </div>

            {/* Generated Password */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="mPassword" className="text-[12px] font-semibold text-[#26251e] block">
                  Initial Login Password *
                </Label>
                <button
                  type="button"
                  onClick={() => setPassword(`merch@${Math.floor(1000 + Math.random() * 9000)}`)}
                  className="text-[11px] text-[#f54e00] hover:underline flex items-center gap-1 font-mono"
                >
                  <RefreshCw className="size-3" />
                  <span>Regenerate</span>
                </button>
              </div>
              <Input
                id="mPassword"
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="font-mono text-[13px] font-bold text-[#f54e00] h-9 rounded-[8px] border-[#e6e5e0] bg-[#fafaf7]"
              />
              <span className="text-[11px] text-[#807d72] block">
                Instruct the merchant to save this password. You can reset it anytime from your dashboard.
              </span>
            </div>

            {/* Default Payout UPI */}
            <div className="space-y-1">
              <Label htmlFor="defaultUpi" className="text-[12px] font-semibold text-[#26251e] block">
                Default Payout UPI VPA (Optional)
              </Label>
              <Input
                id="defaultUpi"
                type="text"
                value={defaultUpiId}
                onChange={(e) => setDefaultUpiId(e.target.value)}
                placeholder="storename@upi"
                className="font-mono text-[12px] h-9 rounded-[8px] border-[#e6e5e0] bg-[#ffffff]"
              />
            </div>

            {/* Bank details accordion / panel */}
            <div className="p-3 rounded-[8px] border border-[#e6e5e0] bg-[#fafaf7] space-y-2">
              <div className="text-[11px] font-mono uppercase text-[#807d72]">
                Optional Bank Account for Settlements
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  type="text"
                  placeholder="Bank Name (e.g. HDFC)"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="text-[12px] h-8 rounded-[6px] border-[#e6e5e0] bg-[#ffffff]"
                />
                <Input
                  type="text"
                  placeholder="Account Number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="text-[12px] font-mono h-8 rounded-[6px] border-[#e6e5e0] bg-[#ffffff]"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-3 border-t border-[#efeee8] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleClose}
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
                {isSubmitting ? 'Creating...' : 'Create Merchant & Issue Credentials'}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}