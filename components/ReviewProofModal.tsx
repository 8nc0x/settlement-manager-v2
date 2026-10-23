'use client';

import React from 'react';
import { Settlement, User } from '@/types';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  X,
  ShieldCheck,
  Maximize2
} from 'lucide-react';

interface ReviewProofModalProps {
  isOpen: boolean;
  settlement: Settlement | null;
  onClose: () => void;
  currentUser: User;
  onSuccess: () => void;
}

export default function ReviewProofModal({
  isOpen,
  settlement,
  onClose,
  currentUser,
  onSuccess,
}: ReviewProofModalProps) {
  const [copiedUtr, setCopiedUtr] = React.useState<boolean>(false);
  const [confirmationNotes, setConfirmationNotes] = React.useState<string>('Funds verified and credited in full.');
  const [isDisputing, setIsDisputing] = React.useState<boolean>(false);
  const [disputeReason, setDisputeReason] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Full-screen image lightbox state
  const [activeLightboxImg, setActiveLightboxImg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setIsDisputing(false);
      setDisputeReason('');
      setErrorMsg(null);
      setActiveLightboxImg(null);
    }
  }, [isOpen]);

  if (!isOpen || !settlement) return null;

  const handleCopyUtr = () => {
    if (settlement.clearing?.utrNumber) {
      navigator.clipboard.writeText(settlement.clearing.utrNumber);
      setCopiedUtr(true);
      setTimeout(() => setCopiedUtr(false), 2000);
    }
  };

  const handleConfirmClose = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/settlements/${settlement.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm',
          actorId: currentUser.id,
          notes: confirmationNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to verify and close settlement');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) {
      setErrorMsg('Please specify the dispute reason (e.g. UTR not found on bank statement, amount mismatch).');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/settlements/${settlement.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dispute',
          actorId: currentUser.id,
          reason: disputeReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to flag dispute');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Dispute failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isClosed = settlement.status === 'completed';
  const isDisputed = settlement.status === 'disputed';

  const clr = settlement.clearing;
  const hasScreenshot = Boolean(clr?.screenshotUrl || (clr?.proofType === 'image' && clr?.proofUrl));
  const screenshotUrl = clr?.screenshotUrl || (clr?.proofType === 'image' ? clr?.proofUrl : undefined);

  const hasDocument = Boolean(clr?.documentUrl || ((clr?.proofType === 'file_excel_csv' || clr?.proofType === 'file_pdf') && clr?.proofUrl));
  const documentUrl = clr?.documentUrl || ((clr?.proofType === 'file_excel_csv' || clr?.proofType === 'file_pdf') ? clr?.proofUrl : undefined);

  const isVoucherFallback = !hasScreenshot && !hasDocument && Boolean(clr?.proofUrl);

  const getDownloadHref = (url?: string) => {
    return url || '#';
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="max-w-2xl bg-[#ffffff] border border-[#e6e5e0] rounded-[12px] p-5 sm:p-6 text-[#26251e] shadow-sm max-h-[92vh] overflow-y-auto">
          <DialogHeader className="flex items-center justify-between pb-3 border-b border-[#efeee8]">
            <div>
              <div className="font-display text-[20px] font-medium tracking-tight text-[#26251e]">
                Verify Settlement &amp; Bank Proof
              </div>
              <div className="text-[12px] text-[#807d72]">
                Record #{settlement.id} · Payout of ₹{Number(settlement.amount).toLocaleString('en-IN')}.00
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

          {/* 1. Mandatory UTR Focus Box */}
          <div className="my-3.5 p-4 rounded-[8px] border border-[#e6e5e0] bg-[#fafaf7]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#807d72]">
                  Bank / UPI Transaction Reference (UTR)
                </div>
                <div className="font-mono text-[20px] sm:text-[22px] font-bold text-[#1f8a65] tracking-wider mt-0.5">
                  {clr?.utrNumber || 'Pending clearance'}
                </div>
              </div>

              {clr?.utrNumber && (
                <button
                  type="button"
                  onClick={handleCopyUtr}
                  className="btn-cursor-secondary text-[12px] h-8 px-3 self-start sm:self-auto"
                >
                  {copiedUtr ? (
                    <>
                      <Check className="size-3.5 text-[#1f8a65]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5 text-[#807d72]" />
                      <span>Copy UTR</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-[#efeee8] flex flex-wrap items-center justify-between text-[11px] text-[#807d72]">
              <span>
                Cleared by <strong className="text-[#26251e]">{clr?.clearedByName || settlement.recipientName}</strong> ({clr?.clearedByRole || 'admin'})
              </span>
              {clr?.clearedAt && (
                <span>{new Date(clr.clearedAt).toLocaleString('en-IN')}</span>
              )}
            </div>
          </div>

          {/* 2. Review Uploaded Proof Files (Stored on Server) */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-[12px] font-semibold text-[#26251e]">
              <span>Attached Banking Media &amp; Files</span>
              <span className="text-[11px] font-mono text-[#807d72]">Stored on Server</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Proof Option 1: Payment Screenshot */}
              {hasScreenshot && screenshotUrl && (
                <div className="p-3.5 rounded-[8px] border border-[#e6e5e0] bg-[#ffffff] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-semibold text-[#26251e] flex items-center gap-1.5">
                        <ImageIcon className="size-4 text-[#f54e00]" />
                        <span>Payment Screenshot</span>
                      </span>
                      <span className="text-[10px] font-mono text-[#1f8a65] bg-[#1f8a65]/10 px-1.5 py-0.5 rounded-[4px]">
                        Image
                      </span>
                    </div>

                    {/* Screenshot Preview with Click to Zoom */}
                    <div 
                      onClick={() => setActiveLightboxImg(screenshotUrl)}
                      className="group relative cursor-pointer rounded-[6px] border border-[#e6e5e0] overflow-hidden bg-[#fafaf7] mb-2.5 max-h-[160px] flex items-center justify-center"
                    >
                      <img
                        src={screenshotUrl}
                        alt="Payment Screenshot"
                        className="max-h-[160px] w-auto object-contain transition-transform group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-[11px] font-medium">
                        <Maximize2 className="size-3.5" />
                        <span>Click to Zoom</span>
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-[#5a5852] truncate mb-1">
                      {clr?.screenshotFileName || clr?.proofFileName || 'payment_receipt.png'}
                    </div>
                    {clr?.screenshotFileSize && (
                      <div className="text-[10px] font-mono text-[#807d72]">
                        Size: {clr.screenshotFileSize}
                      </div>
                    )}
                  </div>

                  {/* Actions: Open in new tab & Download */}
                  <div className="pt-2.5 mt-2 border-t border-[#efeee8] flex items-center gap-2">
                    <a
                      href={screenshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 px-2 rounded-[6px] border border-[#e6e5e0] bg-[#fafaf7] hover:bg-[#f2f1ec] text-[11px] font-medium text-[#26251e] text-center flex items-center justify-center gap-1 transition-colors"
                    >
                      <ExternalLink className="size-3 text-[#807d72]" />
                      <span>Open Full Media</span>
                    </a>
                    <a
                      href={screenshotUrl?.includes('?') ? `${screenshotUrl}&download=1` : `${screenshotUrl}?download=1`}
                      download={clr?.screenshotFileName || 'payment_screenshot.png'}
                      className="py-1.5 px-2.5 rounded-[6px] border border-[#e6e5e0] bg-[#fafaf7] hover:bg-[#f2f1ec] text-[11px] font-medium text-[#26251e] text-center flex items-center justify-center gap-1 transition-colors"
                      title="Download image"
                    >
                      <Download className="size-3 text-[#807d72]" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Proof Option 2: Statement / Document File */}
              {hasDocument && documentUrl && (
                <div className="p-3.5 rounded-[8px] border border-[#e6e5e0] bg-[#ffffff] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-semibold text-[#26251e] flex items-center gap-1.5">
                        <FileText className="size-4 text-[#807d72]" />
                        <span>Banking Document File</span>
                      </span>
                      <span className="text-[10px] font-mono text-[#807d72] bg-[#f2f1ec] px-1.5 py-0.5 rounded-[4px]">
                        {documentUrl.endsWith('.csv') || documentUrl.endsWith('.xlsx') ? 'Excel/CSV' : 'PDF File'}
                      </span>
                    </div>

                    {/* Document Icon Presentation */}
                    <div className="rounded-[6px] border border-[#e6e5e0] bg-[#fafaf7] p-4 text-center my-2 flex flex-col items-center justify-center gap-2">
                      {documentUrl.endsWith('.csv') || documentUrl.endsWith('.xlsx') ? (
                        <FileSpreadsheet className="size-10 text-[#1f8a65]" />
                      ) : (
                        <FileText className="size-10 text-[#cf2d56]" />
                      )}
                      <div>
                        <div className="text-[12px] font-mono font-medium text-[#26251e] truncate max-w-[200px]">
                          {clr?.documentFileName || clr?.proofFileName || 'statement_file.pdf'}
                        </div>
                        <div className="text-[10px] font-mono text-[#807d72] mt-0.5">
                          {clr?.documentFileSize || 'Verified Document'} · Stored on Server
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Open in new tab & Download */}
                  <div className="pt-2.5 mt-2 border-t border-[#efeee8] flex items-center gap-2">
                    <a
                      href={documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 px-2 rounded-[6px] border border-[#e6e5e0] bg-[#fafaf7] hover:bg-[#f2f1ec] text-[11px] font-medium text-[#26251e] text-center flex items-center justify-center gap-1 transition-colors"
                    >
                      <ExternalLink className="size-3 text-[#807d72]" />
                      <span>Open File</span>
                    </a>
                    <a
                      href={documentUrl?.includes('?') ? `${documentUrl}&download=1` : `${documentUrl}?download=1`}
                      download={clr?.documentFileName || 'banking_document'}
                      className="py-1.5 px-2.5 rounded-[6px] border border-[#e6e5e0] bg-[#fafaf7] hover:bg-[#f2f1ec] text-[11px] font-medium text-[#26251e] text-center flex items-center justify-center gap-1 transition-colors"
                      title="Download file"
                    >
                      <Download className="size-3 text-[#807d72]" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Fallback Official SVG Voucher (if no user custom upload) */}
            {isVoucherFallback && clr?.proofUrl && (
              <div className="p-3 rounded-[8px] border border-[#e6e5e0] bg-[#fafaf7] flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-2 text-[12px] font-medium text-[#26251e]">
                  <span>Cryptographic Electronic Banking Voucher</span>
                  <a
                    href={clr.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#f54e00] hover:underline flex items-center gap-1"
                  >
                    <span>Open SVG Voucher</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
                <img
                  src={clr.proofUrl}
                  alt="Banking Settlement Voucher"
                  className="max-h-[300px] w-auto object-contain rounded-[6px] border border-[#e6e5e0]"
                />
              </div>
            )}
          </div>

          {/* 3. Payer Remarks */}
          {clr?.clearingRemarks && (
            <div className="p-3 rounded-[8px] border border-[#e6e5e0] bg-[#ffffff] text-[12px] text-[#5a5852] mb-3">
              <span className="font-semibold text-[#26251e]">Payer Note: </span>
              {clr.clearingRemarks}
            </div>
          )}

          {/* 4. Status Banners */}
          {isClosed && (
            <div className="p-3.5 rounded-[8px] border border-[#c08532]/30 bg-[#faf5ed] text-[12px] text-[#8c5d1b] flex items-center gap-2 mb-3">
              <CheckCircle2 className="size-4 shrink-0 text-[#c08532]" />
              <div>
                <div className="font-semibold">Settlement Permanently Verified &amp; Closed</div>
                <div className="text-[11px] mt-0.5">
                  Verified by {settlement.confirmation?.confirmedByName} on{' '}
                  {settlement.confirmation?.confirmedAt && new Date(settlement.confirmation.confirmedAt).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {isDisputed && (
            <div className="p-3.5 rounded-[8px] border border-[#cf2d56]/25 bg-[#fae8ed] text-[12px] text-[#cf2d56] mb-3">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="size-4" />
                <span>Flagged Dispute Notice</span>
              </div>
              <div className="mt-1 text-[11px] leading-relaxed">
                Reason: {settlement.confirmation?.disputeReason}
              </div>
            </div>
          )}

          {/* Dispute Form */}
          {!isClosed && !isDisputed && isDisputing && (
            <div className="p-3.5 rounded-[8px] border border-[#cf2d56]/30 bg-[#faf5ed] space-y-3 mb-3">
              <div className="text-[12px] font-semibold text-[#cf2d56] flex items-center gap-1.5">
                <AlertTriangle className="size-4" />
                <span>Report Discrepancy or Missing Funds</span>
              </div>
              <Textarea
                rows={2}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="State the reason (e.g. UTR does not appear in bank passbook, net amount received was short)..."
                className="text-[12px] rounded-[8px] border-[#cf2d56]/30 bg-[#ffffff]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDisputing(false)}
                  className="btn-cursor-secondary text-[12px] h-8 px-3"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleDispute}
                  disabled={isSubmitting}
                  className="btn-cursor-primary text-[12px] h-8 px-4 bg-[#cf2d56] hover:bg-[#b52247]"
                >
                  {isSubmitting ? 'Logging Dispute...' : 'Confirm & Log Dispute'}
                </button>
              </div>
            </div>
          )}

          {/* Action Footer for Pending Confirmation */}
          {!isClosed && !isDisputed && !isDisputing && (
            <div className="pt-3 border-t border-[#efeee8] flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsDisputing(true)}
                className="text-[12px] text-[#cf2d56] hover:underline flex items-center gap-1"
              >
                <AlertTriangle className="size-3.5" />
                <span>Report Discrepancy</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-cursor-secondary text-[13px] h-9 px-4"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClose}
                  disabled={isSubmitting}
                  className="btn-cursor-primary text-[13px] h-9 px-5 bg-[#1f8a65] hover:bg-[#186f51]"
                >
                  <ShieldCheck className="size-4" />
                  <span>{isSubmitting ? 'Verifying...' : 'Verify Funds & Close Permanently'}</span>
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lightbox Modal for High-Resolution Screenshot Zoom */}
      {activeLightboxImg && (
        <div 
          onClick={() => setActiveLightboxImg(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-[#ffffff] p-2 rounded-[10px] shadow-2xl">
            <button
              onClick={() => setActiveLightboxImg(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#26251e] text-white flex items-center justify-center shadow-lg hover:bg-[#000000]"
            >
              <X className="size-4" />
            </button>
            <img
              src={activeLightboxImg}
              alt="High Resolution Screenshot"
              className="max-h-[85vh] w-auto rounded-[6px] object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}