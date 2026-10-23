'use client';

import React from 'react';
import { Settlement, User } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Link as LinkIcon, 
  Image as ImageIcon,
  AlertCircle
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
  onSuccess
}: ReviewProofModalProps) {
  const [copiedUtr, setCopiedUtr] = React.useState<boolean>(false);
  const [confirmationNotes, setConfirmationNotes] = React.useState<string>('Funds verified and received in full.');
  const [isDisputing, setIsDisputing] = React.useState<boolean>(false);
  const [disputeReason, setDisputeReason] = React.useState<string>('');

  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

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
          notes: confirmationNotes
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to confirm settlement');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error confirming settlement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!disputeReason.trim()) {
      setErrorMsg('Please specify why the funds were not verified or what issue occurred');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/settlements/${settlement.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dispute',
          actorId: currentUser.id,
          reason: disputeReason
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit dispute');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error disputing settlement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRequester = (
    currentUser.id === settlement.requesterId ||
    currentUser.role === 'admin'
  );

  const canConfirm = settlement.status === 'paid_pending_confirmation' && isRequester;
  const proofType = settlement.clearing?.proofType;
  const proofUrl = settlement.clearing?.proofUrl;
  const proofLink = settlement.clearing?.proofLink;
  const proofFileName = settlement.clearing?.proofFileName;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{settlement.id}</span>
            <Badge variant="outline" className="text-xs">
              {settlement.type === 'merchant_to_subadmin' ? 'Merchant Settlement' : 'Platform Settlement'}
            </Badge>
          </div>
          <DialogTitle className="text-lg font-bold">
            Review Payment Proof &amp; Verify Receipt
          </DialogTitle>
          <DialogDescription className="text-xs">
            Review the uploaded proof (photo, spreadsheet, or link) and bank UTR to confirm funds.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Key Metric Banner */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-xs block font-mono">Settlement Amount</span>
              <span className="text-2xl font-bold font-mono text-emerald-400">
                ₹{settlement.amount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 text-xs block">Date Range</span>
              <span className="text-xs font-medium text-slate-200">
                {settlement.dateRange.startDate} → {settlement.dateRange.endDate}
              </span>
            </div>
          </div>

          {/* UTR & Clearance Details Box */}
          <div className="p-3.5 bg-muted/50 rounded-xl border border-border/70 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Bank UTR Number:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-foreground tracking-wider">
                  {settlement.clearing?.utrNumber || 'Pending'}
                </span>
                {settlement.clearing?.utrNumber && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={handleCopyUtr}
                    title="Copy UTR"
                  >
                    {copiedUtr ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-border/60">
              <span className="text-muted-foreground">Cleared By:</span>
              <span className="font-medium text-foreground">
                {settlement.clearing?.clearedByName || settlement.recipientName} ({settlement.clearing?.clearedByRole || 'Agent'})
              </span>
            </div>

            {settlement.clearing?.clearedAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Transfer Timestamp:</span>
                <span className="font-mono text-foreground">
                  {new Date(settlement.clearing.clearedAt).toLocaleString()}
                </span>
              </div>
            )}

            {settlement.clearing?.clearingRemarks && (
              <div className="pt-1 text-muted-foreground">
                <span className="font-medium text-foreground">Remarks: </span>
                {settlement.clearing.clearingRemarks}
              </div>
            )}
          </div>

          {/* Proof Inspection Section based on ProofType */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Submitted Payment Proof
              </span>
              {proofFileName && (
                <span className="text-[11px] text-muted-foreground font-mono">
                  {proofFileName}
                </span>
              )}
            </div>

            {/* If XLSX or CSV document */}
            {proofType === 'file_excel_csv' && proofUrl && (
              <div className="p-4 rounded-xl border border-border bg-emerald-50/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-foreground block">
                      {proofFileName || 'Bank_Reconciliation_Statement.xlsx'}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Excel / CSV Settlement Statement · {settlement.clearing?.proofFileSize || 'Attachment'}
                    </span>
                  </div>
                </div>
                <a
                  href={proofUrl}
                  download={proofFileName || 'settlement_proof.xlsx'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            )}

            {/* If PDF document */}
            {proofType === 'file_pdf' && proofUrl && (
              <div className="p-4 rounded-xl border border-border bg-rose-50/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-foreground block">
                      {proofFileName || 'Bank_Payment_Receipt.pdf'}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      PDF Document Receipt · {settlement.clearing?.proofFileSize || 'Attachment'}
                    </span>
                  </div>
                </div>
                <a
                  href={proofUrl}
                  download={proofFileName || 'settlement_receipt.pdf'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </a>
              </div>
            )}

            {/* If Web or Portal Link */}
            {proofType === 'web_link' && (proofLink || proofUrl) && (
              <div className="p-4 rounded-xl border border-border bg-blue-50/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 truncate">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                    <LinkIcon className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <span className="font-semibold text-xs text-foreground block">External Verification Link</span>
                    <span className="text-[11px] text-blue-600 truncate block font-mono">
                      {proofLink || proofUrl}
                    </span>
                  </div>
                </div>
                <a
                  href={proofLink || proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs shrink-0"
                >
                  <span>Open Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* If Image or SVG voucher */}
            {(proofType === 'image' || proofType === 'voucher' || (!proofType && proofUrl)) && proofUrl && (
              <div className="rounded-xl border border-border overflow-hidden bg-slate-50 p-3 flex flex-col items-center">
                <div className="max-h-72 w-full overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={proofUrl}
                    alt="Payment Voucher Proof"
                    referrerPolicy="no-referrer"
                    className="max-h-72 object-contain rounded-lg shadow-xs"
                  />
                </div>
                <div className="w-full flex items-center justify-between text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border">
                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Transfer Proof
                  </span>
                  <a
                    href={proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>View Full Size</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* If already completed, show status */}
          {settlement.status === 'completed' && settlement.confirmation && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Settlement Permanently Reconciled &amp; Closed</span>
              </div>
              <div className="text-emerald-700 text-[11px]">
                Confirmed by {settlement.confirmation.confirmedByName} on{' '}
                {settlement.confirmation.confirmedAt ? new Date(settlement.confirmation.confirmedAt).toLocaleString() : ''}
              </div>
            </div>
          )}

          {/* If disputed */}
          {settlement.status === 'disputed' && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Dispute Raised by Payee</span>
              </div>
              <p className="text-slate-800 text-xs">
                {settlement.confirmation?.disputeReason}
              </p>
            </div>
          )}

          {/* Audit trail summary */}
          <div className="pt-2 border-t border-border">
            <h4 className="text-xs font-semibold text-foreground mb-2">
              Permanent Audit Trail ({settlement.auditTrail.length} records)
            </h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {settlement.auditTrail.map((log) => (
                <div key={log.id} className="text-[11px] p-2 bg-muted/40 rounded-lg border border-border/60">
                  <div className="flex items-center justify-between text-muted-foreground mb-0.5">
                    <span className="font-semibold text-foreground">
                      {log.actorName} ({log.actorRole.toUpperCase()})
                    </span>
                    <span className="font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="text-muted-foreground">{log.details}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dispute form if toggled */}
          {isDisputing && (
            <form onSubmit={handleDisputeSubmit} className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 space-y-2">
              <span className="text-xs font-bold text-rose-800 block">
                Flag Issue / Dispute Settlement
              </span>
              <Textarea
                required
                rows={2}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Explain why the money was not received or discrepancies with UTR / amount..."
                className="text-xs bg-white"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDisputing(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  variant="destructive"
                  disabled={isSubmitting}
                  className="text-xs font-bold"
                >
                  Submit Dispute
                </Button>
              </div>
            </form>
          )}
        </div>

        <DialogFooter className="pt-2 flex items-center justify-between gap-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Viewer
          </Button>

          {canConfirm && !isDisputing && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDisputing(true)}
                className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs"
              >
                Dispute
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmClose}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Closing...' : 'Confirm Received & Close Settlement'}</span>
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
