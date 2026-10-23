'use client';

import React from 'react';
import { Settlement, User } from '@/types';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  Upload,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Trash2,
  FileCheck,
  Eye,
  Check,
  Building,
  Smartphone
} from 'lucide-react';

interface UploadedFileState {
  url: string;
  fileName: string;
  fileSize: string;
  mimeType?: string;
  previewUrl?: string;
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
  onSuccess,
}: ClearSettlementModalProps) {
  const [utrNumber, setUtrNumber] = React.useState<string>('');
  
  // Dual file upload states (Option 1: Payment Screenshot, Option 2: Statement / Document)
  const [screenshotData, setScreenshotData] = React.useState<UploadedFileState | null>(null);
  const [documentData, setDocumentData] = React.useState<UploadedFileState | null>(null);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = React.useState<boolean>(false);
  const [isUploadingDocument, setIsUploadingDocument] = React.useState<boolean>(false);
  const [screenshotError, setScreenshotError] = React.useState<string | null>(null);
  const [documentError, setDocumentError] = React.useState<string | null>(null);

  const [remarks, setRemarks] = React.useState<string>('Paid via corporate banking net banking IMPS. UTR and proof stored.');
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [duplicateWarning, setDuplicateWarning] = React.useState<string | null>(null);
  const [isValidatingUtr, setIsValidatingUtr] = React.useState<boolean>(false);

  const screenshotInputRef = React.useRef<HTMLInputElement>(null);
  const documentInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setUtrNumber('');
      setScreenshotData(null);
      setDocumentData(null);
      setScreenshotError(null);
      setDocumentError(null);
      setErrorMsg(null);
      setDuplicateWarning(null);
      setRemarks('Paid via corporate banking IMPS. UTR and proof stored.');
    }
  }, [isOpen]);

  // Real-time duplicate UTR check
  React.useEffect(() => {
    const clean = utrNumber.trim();
    if (clean.length < 6) {
      setDuplicateWarning(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsValidatingUtr(true);
      try {
        const res = await fetch(`/api/settlements?checkUtr=${encodeURIComponent(clean)}&excludeId=${settlement?.id}`);
        const data = await res.json();
        if (data.success && !data.isAvailable) {
          setDuplicateWarning(`Duplicate UTR! Reference ${clean} is already logged on settlement #${data.existingSettlementId}`);
        } else {
          setDuplicateWarning(null);
        }
      } catch {
        // silent
      } finally {
        setIsValidatingUtr(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [utrNumber, settlement?.id]);

  if (!isOpen || !settlement) return null;

  const destination = settlement.payoutDetails.method === 'upi'
    ? settlement.payoutDetails.upiId
    : `${settlement.payoutDetails.bankName || 'Bank'} A/C ${settlement.payoutDetails.accountNumber} (IFSC: ${settlement.payoutDetails.ifscCode})`;

  // Upload Option 1: Payment Screenshot (Images)
  const handleScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingScreenshot(true);
    setScreenshotError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'screenshot');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload screenshot to server');
      }

      setScreenshotData({
        url: data.url,
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        previewUrl: data.url,
      });
    } catch (err: any) {
      setScreenshotError(err.message || 'Error uploading screenshot');
    } finally {
      setIsUploadingScreenshot(false);
    }
  };

  // Upload Option 2: Banking Document / File (PDF, Excel, CSV)
  const handleDocumentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDocument(true);
    setDocumentError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'document');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload document file to server');
      }

      setDocumentData({
        url: data.url,
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
      });
    } catch (err: any) {
      setDocumentError(err.message || 'Error uploading document file');
    } finally {
      setIsUploadingDocument(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUtr = utrNumber.trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      setErrorMsg('Mandatory: Please enter a valid 12-digit UPI UTR or Bank Reference Number (at least 6 characters).');
      return;
    }

    if (duplicateWarning) {
      setErrorMsg(duplicateWarning);
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
          utrNumber: cleanUtr,
          proofType: screenshotData ? 'image' : documentData ? 'file_pdf' : 'voucher',
          proofUrl: screenshotData?.url || documentData?.url,
          screenshotUrl: screenshotData?.url,
          screenshotFileName: screenshotData?.fileName,
          screenshotFileSize: screenshotData?.fileSize,
          documentUrl: documentData?.url,
          documentFileName: documentData?.fileName,
          documentFileSize: documentData?.fileSize,
          documentMimeType: documentData?.mimeType,
          remarks: remarks.trim(),
        }),
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
      <DialogContent className="max-w-2xl bg-[#ffffff] border border-[#e6e5e0] rounded-[12px] p-5 sm:p-6 text-[#26251e] shadow-sm max-h-[92vh] overflow-y-auto">
        <DialogHeader className="flex items-center justify-between pb-3 border-b border-[#efeee8]">
          <div>
            <div className="font-display text-[20px] font-medium tracking-tight text-[#26251e]">
              Clear Settlement &amp; Store Proof
            </div>
            <div className="text-[12px] text-[#807d72]">
              Issue bank clearance for {settlement.requesterName} · Ref #{settlement.id}
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

        {/* Amount & Destination Banner */}
        <div className="my-3.5 p-3.5 rounded-[8px] border border-[#e6e5e0] bg-[#fafaf7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-mono uppercase text-[#807d72]">Disbursed Payout</div>
            <div className="font-mono text-[22px] font-medium text-[#26251e]">
              ₹{Number(settlement.amount).toLocaleString('en-IN')}.00
            </div>
          </div>
          <div className="sm:text-right">
            <div className="text-[11px] font-mono uppercase text-[#807d72]">Beneficiary Destination</div>
            <div className="font-mono text-[12px] text-[#26251e] font-medium truncate max-w-sm">
              {destination}
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-3.5 p-3 rounded-[8px] border border-[#cf2d56]/20 bg-[#fae8ed] text-[12px] text-[#cf2d56] flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Mandatory UTR Input */}
          <div className="space-y-1.5 p-3.5 rounded-[8px] border border-[#e6e5e0] bg-[#ffffff]">
            <div className="flex items-center justify-between">
              <Label htmlFor="utrInput" className="text-[12px] font-semibold text-[#26251e] flex items-center gap-1.5">
                <span>12-Digit UPI UTR or Bank Reference Number</span>
                <span className="text-[#f54e00] font-bold">* MANDATORY</span>
              </Label>
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                {isValidatingUtr ? (
                  <span className="text-[#807d72] animate-pulse">Checking...</span>
                ) : duplicateWarning ? (
                  <span className="text-[#cf2d56] font-semibold flex items-center gap-1">
                    <AlertCircle className="size-3" /> Duplicate
                  </span>
                ) : utrNumber.trim().length === 12 ? (
                  <span className="text-[#1f8a65] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> 12/12 Valid
                  </span>
                ) : (
                  <span className="text-[#807d72]">{utrNumber.trim().length}/12</span>
                )}
              </div>
            </div>

            <Input
              id="utrInput"
              type="text"
              required
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
              placeholder="e.g. 603912884912 or CMS982104928190"
              className={`font-mono text-[14px] tracking-wider h-10 rounded-[8px] bg-[#ffffff] focus-visible:ring-1 ${
                duplicateWarning ? 'border-[#cf2d56] focus-visible:ring-[#cf2d56]' : 'border-[#e6e5e0] focus-visible:ring-[#f54e00]'
              }`}
            />

            {duplicateWarning ? (
              <span className="text-[11px] text-[#cf2d56] font-medium block">
                {duplicateWarning}
              </span>
            ) : (
              <span className="text-[11px] text-[#807d72] block">
                Required for banking reconciliation. The opposite party will verify this reference on their bank statement.
              </span>
            )}
          </div>

          {/* 2. Dual File Upload Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[12px] font-semibold text-[#26251e]">
                Proof Attachments (Stored on Server)
              </div>
              <span className="text-[11px] text-[#807d72]">
                Upload 1 or both options
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Payment Screenshot */}
              <div className="p-3.5 rounded-[8px] border border-[#e6e5e0] bg-[#fafaf7] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] font-semibold text-[#26251e] flex items-center gap-1.5">
                      <ImageIcon className="size-4 text-[#f54e00]" />
                      <span>Option 1: Payment Screenshot</span>
                    </span>
                    {screenshotData && (
                      <span className="text-[10px] font-mono text-[#1f8a65] bg-[#1f8a65]/10 px-1.5 py-0.5 rounded-[4px] flex items-center gap-1">
                        <Check className="size-2.5" /> Saved
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#807d72] mb-3">
                    UPI / NetBanking payment success screen (PNG, JPG, WEBP).
                  </p>
                </div>

                <input
                  ref={screenshotInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleScreenshotChange}
                />

                {screenshotData ? (
                  <div className="p-2.5 rounded-[6px] border border-[#e6e5e0] bg-[#ffffff] flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-[4px] overflow-hidden border border-[#e6e5e0] shrink-0 bg-[#fafaf7]">
                      <img
                        src={screenshotData.previewUrl || screenshotData.url}
                        alt="Screenshot Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-mono font-medium text-[#26251e] truncate">
                        {screenshotData.fileName}
                      </div>
                      <div className="text-[10px] text-[#807d72] font-mono">
                        {screenshotData.fileSize} · On Server
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setScreenshotData(null);
                        if (screenshotInputRef.current) screenshotInputRef.current.value = '';
                      }}
                      className="p-1 text-[#807d72] hover:text-[#cf2d56]"
                      title="Remove screenshot"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isUploadingScreenshot}
                    onClick={() => screenshotInputRef.current?.click()}
                    className="w-full py-3 px-3 rounded-[6px] border border-dashed border-[#cfcdc4] bg-[#ffffff] hover:border-[#f54e00] hover:bg-[#fafaf7] text-center transition-colors flex flex-col items-center gap-1"
                  >
                    <Upload className="size-4 text-[#807d72]" />
                    <span className="text-[11px] font-medium text-[#f54e00]">
                      {isUploadingScreenshot ? 'Uploading to server...' : 'Upload Payment Screenshot'}
                    </span>
                    <span className="text-[10px] text-[#a09c92]">Max 10MB</span>
                  </button>
                )}

                {screenshotError && (
                  <span className="text-[10px] text-[#cf2d56] mt-1.5 block">
                    {screenshotError}
                  </span>
                )}
              </div>

              {/* Option 2: Document / Statement File */}
              <div className="p-3.5 rounded-[8px] border border-[#e6e5e0] bg-[#fafaf7] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] font-semibold text-[#26251e] flex items-center gap-1.5">
                      <FileText className="size-4 text-[#807d72]" />
                      <span>Option 2: Document / File</span>
                    </span>
                    {documentData && (
                      <span className="text-[10px] font-mono text-[#1f8a65] bg-[#1f8a65]/10 px-1.5 py-0.5 rounded-[4px] flex items-center gap-1">
                        <Check className="size-2.5" /> Saved
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#807d72] mb-3">
                    Bank statement, CMS sheet, or advice (PDF, XLSX, CSV).
                  </p>
                </div>

                <input
                  ref={documentInputRef}
                  type="file"
                  accept=".pdf,.xlsx,.xls,.csv,.txt"
                  className="hidden"
                  onChange={handleDocumentChange}
                />

                {documentData ? (
                  <div className="p-2.5 rounded-[6px] border border-[#e6e5e0] bg-[#ffffff] flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-[4px] bg-[#fafaf7] border border-[#e6e5e0] flex items-center justify-center shrink-0">
                      {documentData.fileName.endsWith('.csv') || documentData.fileName.endsWith('.xlsx') ? (
                        <FileSpreadsheet className="size-5 text-[#1f8a65]" />
                      ) : (
                        <FileText className="size-5 text-[#cf2d56]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-mono font-medium text-[#26251e] truncate">
                        {documentData.fileName}
                      </div>
                      <div className="text-[10px] text-[#807d72] font-mono">
                        {documentData.fileSize} · On Server
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDocumentData(null);
                        if (documentInputRef.current) documentInputRef.current.value = '';
                      }}
                      className="p-1 text-[#807d72] hover:text-[#cf2d56]"
                      title="Remove file"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isUploadingDocument}
                    onClick={() => documentInputRef.current?.click()}
                    className="w-full py-3 px-3 rounded-[6px] border border-dashed border-[#cfcdc4] bg-[#ffffff] hover:border-[#f54e00] hover:bg-[#fafaf7] text-center transition-colors flex flex-col items-center gap-1"
                  >
                    <Upload className="size-4 text-[#807d72]" />
                    <span className="text-[11px] font-medium text-[#f54e00]">
                      {isUploadingDocument ? 'Uploading to server...' : 'Upload Banking Document'}
                    </span>
                    <span className="text-[10px] text-[#a09c92]">PDF, Excel, CSV up to 15MB</span>
                  </button>
                )}

                {documentError && (
                  <span className="text-[10px] text-[#cf2d56] mt-1.5 block">
                    {documentError}
                  </span>
                )}
              </div>
            </div>

            {/* Helper fallback badge */}
            {!screenshotData && !documentData && (
              <div className="p-2.5 rounded-[6px] border border-[#e6e5e0] bg-[#fafaf7] text-[11px] text-[#807d72] flex items-center gap-2">
                <FileCheck className="size-4 text-[#1f8a65] shrink-0" />
                <span>
                  Tip: If no custom file is attached, an official SVG banking voucher will automatically be generated using your UTR.
                </span>
              </div>
            )}
          </div>

          {/* 3. Remarks */}
          <div className="space-y-1.5">
            <Label htmlFor="remarksInput" className="text-[12px] font-semibold text-[#26251e] block">
              Clearing Remarks &amp; Audit Note
            </Label>
            <Textarea
              id="remarksInput"
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Cleared via corporate netbanking batch..."
              className="text-[12px] rounded-[8px] border-[#e6e5e0] bg-[#ffffff]"
            />
          </div>

          {/* Submit Action */}
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
              disabled={isSubmitting || !!duplicateWarning}
              className="btn-cursor-primary text-[13px] h-9 px-5 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Clearing Settlement...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  <span>Clear &amp; Commit to Ledger</span>
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}