'use client';

import React from 'react';
import { Settlement, User, ProofType } from '@/types';
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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  FileText, 
  Link as LinkIcon, 
  Sparkles, 
  Check, 
  Copy, 
  Smartphone, 
  Building, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';

function createVoucherDataUri(utr: string, s: Settlement, senderName: string, senderRole: string): string {
  const destination = s.payoutDetails.method === 'upi' 
    ? s.payoutDetails.upiId || 'merchant@upi'
    : `${s.payoutDetails.bankName || 'Bank'} A/C: ${s.payoutDetails.accountNumber}`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="none">
    <rect width="600" height="750" rx="16" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="2"/>
    <circle cx="300" cy="85" r="36" fill="#ECFDF5"/>
    <circle cx="300" cy="85" r="28" fill="#10B981"/>
    <path d="M292 85L298 91L310 79" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    
    <text x="300" y="145" fill="#0F172A" font-family="system-ui, sans-serif" font-size="20" font-weight="700" text-anchor="middle">Transfer Completed</text>
    <text x="300" y="168" fill="#64748B" font-family="system-ui, sans-serif" font-size="13" text-anchor="middle">Official Banking Settlement Voucher</text>
    
    <text x="300" y="225" fill="#0F172A" font-family="system-ui, sans-serif" font-size="34" font-weight="800" text-anchor="middle">₹${s.amount.toLocaleString('en-IN')}.00</text>
    
    <!-- Voucher Container -->
    <rect x="40" y="265" width="520" height="400" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
    
    <text x="70" y="308" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="11" font-weight="600">BENEFICIARY</text>
    <text x="70" y="330" fill="#0F172A" font-family="system-ui, sans-serif" font-size="16" font-weight="700">${s.requesterName}</text>
    <text x="70" y="352" fill="#0284C7" font-family="system-ui, sans-serif" font-size="13">${destination}</text>
    
    <line x1="70" y1="375" x2="530" y2="375" stroke="#F1F5F9" stroke-width="1.5" stroke-dasharray="4 4"/>
    
    <text x="70" y="405" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="11" font-weight="600">UTR / TRANSACTION REFERENCE NUMBER</text>
    <text x="70" y="430" fill="#0F172A" font-family="monospace" font-size="18" font-weight="700" letter-spacing="1">${utr}</text>
    
    <line x1="70" y1="455" x2="530" y2="455" stroke="#F1F5F9" stroke-width="1.5" stroke-dasharray="4 4"/>
    
    <text x="70" y="488" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="11" font-weight="600">SETTLED BY AGENT</text>
    <text x="70" y="510" fill="#0F172A" font-family="system-ui, sans-serif" font-size="14" font-weight="600">${senderName} (${senderRole.toUpperCase()})</text>
    
    <text x="70" y="552" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="11" font-weight="600">SETTLEMENT TIMEFRAME</text>
    <text x="70" y="574" fill="#0F172A" font-family="system-ui, sans-serif" font-size="13">${s.dateRange.startDate} to ${s.dateRange.endDate}</text>
    
    <rect x="70" y="605" width="460" height="28" rx="6" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="1"/>
    <text x="300" y="623" fill="#047857" font-family="system-ui, sans-serif" font-size="11" font-weight="700" text-anchor="middle">✓ BANK DEBIT VERIFIED &amp; PERMANENTLY LOGGED</text>
    
    <text x="300" y="705" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="12" text-anchor="middle">Audit Ledger Electronic Proof</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

interface ClearSettlementModalProps {
  isOpen: boolean;
  settlement: Settlement | null;
  onClose: () => void;
  currentUser: User;
  onSuccess: () => void;
}

export default function ClearSettlementModal({
  isOpen,
  settlement,
  onClose,
  currentUser,
  onSuccess
}: ClearSettlementModalProps) {
  const [utrNumber, setUtrNumber] = React.useState<string>(() => {
    return settlement?.clearing?.utrNumber || `42${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  });

  const [activeProofTab, setActiveProofTab] = React.useState<ProofType>('image');
  const [proofUrl, setProofUrl] = React.useState<string>(() => {
    if (!settlement) return '';
    if (settlement.clearing?.proofUrl) return settlement.clearing.proofUrl;
    const initialUtr = settlement.clearing?.utrNumber || `42${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    return createVoucherDataUri(initialUtr, settlement, currentUser.name, currentUser.role);
  });

  const [proofFileName, setProofFileName] = React.useState<string>('');
  const [proofFileSize, setProofFileSize] = React.useState<string>('');
  const [proofMimeType, setProofMimeType] = React.useState<string>('');
  const [proofLink, setProofLink] = React.useState<string>('');
  const [remarks, setRemarks] = React.useState<string>('Transferred via NetBanking IMPS. Proof attached.');
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  if (!isOpen || !settlement) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload an image file (PNG, JPG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProofUrl(reader.result as string);
      setProofFileName(file.name);
      setProofFileSize(`${(file.size / 1024).toFixed(1)} KB`);
      setProofMimeType(file.type);
      setActiveProofTab('image');
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileNameLower = file.name.toLowerCase();
    const isSpreadsheet = fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls') || fileNameLower.endsWith('.csv');
    const isPdf = fileNameLower.endsWith('.pdf');

    const reader = new FileReader();
    reader.onload = () => {
      setProofUrl(reader.result as string);
      setProofFileName(file.name);
      setProofFileSize(`${(file.size / 1024).toFixed(1)} KB`);
      setProofMimeType(file.type || (isSpreadsheet ? 'application/vnd.ms-excel' : 'application/pdf'));
      setActiveProofTab(isSpreadsheet ? 'file_excel_csv' : isPdf ? 'file_pdf' : 'file_excel_csv');
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateVoucher = () => {
    const uri = createVoucherDataUri(utrNumber, settlement, currentUser.name, currentUser.role);
    setProofUrl(uri);
    setProofFileName(`Voucher_${settlement.id}_${utrNumber.slice(-4)}.svg`);
    setProofFileSize('12 KB');
    setProofMimeType('image/svg+xml');
    setActiveProofTab('voucher');
  };

  const handleClear = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!utrNumber || utrNumber.trim().length < 6) {
      setErrorMsg('Please provide a valid UTR / Bank Reference number (minimum 6 digits/characters)');
      return;
    }

    if (activeProofTab === 'web_link' && !proofLink.trim()) {
      setErrorMsg('Please enter a valid verification or portal link');
      return;
    }

    if (activeProofTab !== 'web_link' && !proofUrl) {
      setErrorMsg('Please attach or generate a payment proof (Photo, Excel/CSV, PDF, or Voucher)');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/settlements/${settlement.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clear',
          actorId: currentUser.id,
          utrNumber: utrNumber.trim(),
          proofType: activeProofTab,
          proofUrl: activeProofTab === 'web_link' ? proofLink.trim() : proofUrl,
          proofFileName: proofFileName || undefined,
          proofFileSize: proofFileSize || undefined,
          proofMimeType: proofMimeType || undefined,
          proofLink: activeProofTab === 'web_link' ? proofLink.trim() : undefined,
          remarks
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to clear settlement');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error clearing settlement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-lg font-bold">Clear Settlement #{settlement.id}</DialogTitle>
            <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200">
              ₹{settlement.amount.toLocaleString('en-IN')}
            </Badge>
          </div>
          <DialogDescription className="text-xs">
            Submit payment proof (Photo, XLSX/CSV document, or Link) &amp; UTR to mark cleared.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Payout Destination Details Box */}
        <div className="p-3 bg-muted/50 rounded-xl border border-border/80 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Payee Destination:</span>
            <span className="font-semibold">{settlement.requesterName}</span>
          </div>

          {settlement.payoutDetails.method === 'upi' ? (
            <div className="flex items-center justify-between bg-card p-2 rounded-lg border border-border/60">
              <div className="flex items-center gap-2 font-mono font-medium truncate">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{settlement.payoutDetails.upiId}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[11px] gap-1 px-2"
                onClick={() => handleCopy(settlement.payoutDetails.upiId || '', 'upi')}
              >
                {copiedField === 'upi' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedField === 'upi' ? 'Copied' : 'Copy UPI'}</span>
              </Button>
            </div>
          ) : (
            <div className="bg-card p-2.5 rounded-lg border border-border/60 space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank:</span>
                <span className="font-semibold">{settlement.payoutDetails.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account:</span>
                <span className="font-mono font-bold">{settlement.payoutDetails.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IFSC:</span>
                <span className="font-mono">{settlement.payoutDetails.ifscCode}</span>
              </div>
              <div className="pt-1 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[11px] gap-1 px-2"
                  onClick={() => handleCopy(`${settlement.payoutDetails.accountNumber} IFSC: ${settlement.payoutDetails.ifscCode}`, 'bank')}
                >
                  {copiedField === 'bank' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'bank' ? 'Copied' : 'Copy Bank Details'}</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleClear} className="space-y-4">
          {/* UTR Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="utrInput" className="text-xs font-semibold">
                Bank UTR / Transaction Reference Number *
              </Label>
              <button
                type="button"
                onClick={() => {
                  const newUtr = `42${Math.floor(1000000000 + Math.random() * 9000000000)}`;
                  setUtrNumber(newUtr);
                }}
                className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1 font-medium"
              >
                <Sparkles className="w-3 h-3" />
                Randomize UTR
              </button>
            </div>
            <Input
              id="utrInput"
              required
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              placeholder="e.g. 429188402914 or CMS91823091"
              className="font-mono font-bold tracking-wider text-xs"
            />
          </div>

          {/* Proof Uploads: Tabs for Photo, File (XLSX/CSV/PDF), Link, and Auto Voucher */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold block">
              Payment Proof Attachment (Photo, XLSX/CSV, or Link) *
            </Label>

            <Tabs value={activeProofTab} onValueChange={(val) => setActiveProofTab(val as ProofType)} className="w-full">
              <TabsList className="grid grid-cols-4 w-full h-8 p-0.5 bg-muted">
                <TabsTrigger value="image" className="text-[11px] px-1 gap-1">
                  <ImageIcon className="w-3 h-3" />
                  <span>Photo</span>
                </TabsTrigger>
                <TabsTrigger value="file_excel_csv" className="text-[11px] px-1 gap-1">
                  <FileSpreadsheet className="w-3 h-3" />
                  <span>XLSX/CSV</span>
                </TabsTrigger>
                <TabsTrigger value="web_link" className="text-[11px] px-1 gap-1">
                  <LinkIcon className="w-3 h-3" />
                  <span>Link</span>
                </TabsTrigger>
                <TabsTrigger value="voucher" className="text-[11px] px-1 gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Voucher</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Photo Upload */}
              <TabsContent value="image" className="mt-2.5 space-y-2">
                <label className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 bg-muted/20 transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                  <span className="text-xs font-medium">Click to select Screenshot Photo</span>
                  <span className="text-[10px] text-muted-foreground">PNG, JPG, or WEBP up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </TabsContent>

              {/* Tab 2: XLSX / CSV / PDF Document Upload */}
              <TabsContent value="file_excel_csv" className="mt-2.5 space-y-2">
                <label className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 bg-muted/20 transition-colors">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-600 mb-1" />
                  <span className="text-xs font-medium">Upload Bank Sheet or Statement (.xlsx, .csv, .pdf)</span>
                  <span className="text-[10px] text-muted-foreground">Excel workbook, CSV transaction log, or PDF advice</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv,.pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,application/pdf"
                    onChange={handleDocumentUpload}
                    className="hidden"
                  />
                </label>
              </TabsContent>

              {/* Tab 3: Web or Cloud Link */}
              <TabsContent value="web_link" className="mt-2.5 space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="proofLinkInput" className="text-[11px] text-muted-foreground">
                    Bank Portal Reference URL or Cloud Receipt Link
                  </Label>
                  <Input
                    id="proofLinkInput"
                    type="url"
                    value={proofLink}
                    onChange={(e) => setProofLink(e.target.value)}
                    placeholder="https://banking.portal.com/receipt/TXN-894102 or Drive Link"
                    className="text-xs font-mono"
                  />
                </div>
              </TabsContent>

              {/* Tab 4: Auto Generated Bank Voucher */}
              <TabsContent value="voucher" className="mt-2.5 space-y-2">
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-emerald-900 block">Instant Banking Voucher</span>
                    <span className="text-[11px] text-emerald-700">Auto-generated receipt with UTR #{utrNumber}</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateVoucher}
                    className="text-xs bg-white text-emerald-800 border-emerald-300"
                  >
                    Regenerate
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* Proof Attachment Badge / Preview */}
            {(proofUrl || proofLink) && (
              <div className="p-2.5 rounded-lg border border-border bg-muted/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  {activeProofTab === 'file_excel_csv' ? (
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : activeProofTab === 'web_link' ? (
                    <LinkIcon className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : activeProofTab === 'file_pdf' ? (
                    <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-slate-600 shrink-0" />
                  )}
                  <div className="truncate">
                    <span className="font-semibold block truncate">
                      {proofFileName || (activeProofTab === 'web_link' ? proofLink : 'Attached Payment Voucher')}
                    </span>
                    {proofFileSize && <span className="text-[10px] text-muted-foreground">{proofFileSize}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50 border-emerald-200">
                    Ready
                  </Badge>
                  {proofUrl && activeProofTab !== 'web_link' && (
                    <a
                      href={proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      download={proofFileName || 'settlement_proof'}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Remarks */}
          <div className="space-y-1">
            <Label htmlFor="remarksInput" className="text-xs font-semibold">
              Clearing Remarks (Optional)
            </Label>
            <Input
              id="remarksInput"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Paid from HDFC NetBanking IMPS"
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
              {isSubmitting ? 'Recording Clearance...' : 'Submit Proof & Mark Cleared'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
