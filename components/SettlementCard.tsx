'use client';

import React from 'react';
import { Settlement, User } from '@/types';
import {
  Calendar,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Copy,
  Check,
  Building,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';

interface SettlementCardProps {
  settlement: Settlement;
  currentUser: User;
  onClear: (settlement: Settlement) => void;
  onReview: (settlement: Settlement) => void;
  onViewDetails: (settlement: Settlement) => void;
}

const statusBadges: Record<
  Settlement['status'],
  { label: string; pillClass: string; icon: React.ElementType }
> = {
  completed: {
    label: 'Closed & Locked',
    pillClass: 'bg-[#c08532] text-white',
    icon: CheckCircle2,
  },
  paid_pending_confirmation: {
    label: 'Awaiting Verification',
    pillClass: 'bg-[#9fbbe0] text-[#26251e]',
    icon: Clock3,
  },
  pending: {
    label: 'Pending Clearance',
    pillClass: 'bg-[#dfa88f] text-[#26251e]',
    icon: Clock3,
  },
  disputed: {
    label: 'Discrepancy Reported',
    pillClass: 'bg-[#cf2d56] text-white',
    icon: AlertTriangle,
  },
  rejected: {
    label: 'Rejected',
    pillClass: 'bg-[#e6e5e0] text-[#5a5852]',
    icon: AlertTriangle,
  },
};

export default function SettlementCard({
  settlement,
  currentUser,
  onClear,
  onReview,
  onViewDetails,
}: SettlementCardProps) {
  const [copiedUtr, setCopiedUtr] = React.useState<boolean>(false);
  const statusMeta = statusBadges[settlement.status] || statusBadges.pending;
  const StatusIcon = statusMeta.icon;

  const isRequester = settlement.requesterId === currentUser.id;
  const isRecipient = settlement.recipientId === currentUser.id;
  const isAdmin = currentUser.role === 'admin';

  const canClear =
    (isRecipient || isAdmin) && settlement.status === 'pending';
  const canReview =
    (isRequester || isAdmin) &&
    settlement.status === 'paid_pending_confirmation';

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedUtr(true);
    setTimeout(() => setCopiedUtr(false), 2000);
  };

  return (
    <div
      onClick={() => onViewDetails(settlement)}
      className="group relative rounded-[12px] border border-[#e6e5e0] bg-[#ffffff] p-3.5 sm:p-5 hover:border-[#cfcdc4] transition-all cursor-pointer overflow-hidden"
    >
      {/* Top row: Status pill + Date range */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-[#efeee8]">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-[0.04em] uppercase ${statusMeta.pillClass}`}
          >
            <StatusIcon className="size-3" />
            <span>{statusMeta.label}</span>
          </span>
          <span className="font-mono text-[11px] text-[#807d72] uppercase">
            ID: {settlement.id}
          </span>
          {settlement.type === 'merchant_to_admin' && (
            <span className="px-2 py-0.5 rounded-[4px] bg-[#f54e00]/10 text-[#f54e00] font-mono text-[10px] font-semibold uppercase">
              Platform Direct
            </span>
          )}
          {settlement.type === 'merchant_to_subadmin' && (
            <span className="px-2 py-0.5 rounded-[4px] bg-[#9fbbe0]/20 text-[#26251e] font-mono text-[10px] font-medium uppercase">
              Agent Route
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#807d72]">
          <Calendar className="size-3.5" />
          <span>
            {settlement.dateRange.startDate} → {settlement.dateRange.endDate}
          </span>
        </div>
      </div>

      {/* Middle row: Amount + Parties */}
      <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase font-mono tracking-wider text-[#807d72]">
            Turnover Settlement Amount
          </div>
          <div className="font-mono text-[26px] sm:text-[28px] font-medium tracking-tight text-[#26251e] mt-0.5">
            ₹{Number(settlement.amount).toLocaleString('en-IN')}.00
          </div>
          {settlement.merchantNotes && (
            <p className="text-[12px] text-[#5a5852] line-clamp-1 mt-1 max-w-xl">
              “{settlement.merchantNotes}”
            </p>
          )}
        </div>

        {/* Requester vs Recipient */}
        <div className="flex flex-col sm:items-end gap-1 text-[12px]">
          <div className="flex items-center gap-1.5">
            <span className="text-[#807d72] text-[11px]">Requested by:</span>
            <span className="font-medium text-[#26251e]">{settlement.requesterName}</span>
            <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-[#e6e5e0] text-[#5a5852]">
              {settlement.requesterRole}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#807d72] text-[11px]">Cleared to:</span>
            <span className="font-medium text-[#26251e]">{settlement.recipientName}</span>
            <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-[#e6e5e0] text-[#5a5852]">
              {settlement.recipientRole}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom details & Actions */}
      <div className="pt-3 border-t border-[#efeee8] flex flex-wrap items-center justify-between gap-3">
        {/* Payout method & UTR */}
        <div className="flex flex-wrap items-center gap-3 text-[12px]">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-[6px] bg-[#fafaf7] border border-[#e6e5e0]">
            {settlement.payoutDetails.method === 'upi' ? (
              <Smartphone className="size-3.5 text-[#f54e00]" />
            ) : (
              <Building className="size-3.5 text-[#807d72]" />
            )}
            <span className="font-mono font-medium text-[#26251e]">
              {settlement.payoutDetails.method === 'upi'
                ? settlement.payoutDetails.upiId
                : `${settlement.payoutDetails.bankName || 'Bank'} A/C ${settlement.payoutDetails.accountNumber}`}
            </span>
          </div>

          {/* UTR Pill if cleared */}
          {settlement.clearing?.utrNumber && (
            <button
              type="button"
              onClick={(e) => handleCopy(e, settlement.clearing!.utrNumber!)}
              className="group/utr flex items-center gap-1.5 px-2 py-1 rounded-[6px] bg-[#fafaf7] border border-[#e6e5e0] hover:border-[#cfcdc4] text-[11px] font-mono text-[#26251e]"
            >
              <span className="text-[#807d72] uppercase">UTR:</span>
              <span className="font-semibold text-[#1f8a65]">
                {settlement.clearing.utrNumber}
              </span>
              {copiedUtr ? (
                <Check className="size-3 text-[#1f8a65]" />
              ) : (
                <Copy className="size-3 text-[#807d72] group-hover/utr:text-[#26251e]" />
              )}
            </button>
          )}

          {/* Proof Media Badges */}
          {settlement.clearing?.screenshotUrl && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-[6px] bg-[#fafaf7] border border-[#e6e5e0] text-[11px] font-mono text-[#5a5852]">
              <ImageIcon className="size-3 text-[#f54e00]" />
              <span>Screenshot</span>
            </span>
          )}
          {settlement.clearing?.documentUrl && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-[6px] bg-[#fafaf7] border border-[#e6e5e0] text-[11px] font-mono text-[#5a5852]">
              <FileText className="size-3 text-[#1f8a65]" />
              <span>Document</span>
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-auto" onClick={(e) => e.stopPropagation()}>
          {canClear && (
            <button
              type="button"
              onClick={() => onClear(settlement)}
              className="btn-cursor-primary text-[12px] h-8 px-3"
            >
              <span>Clear with UTR</span>
              <ArrowUpRight className="size-3.5" />
            </button>
          )}

          {canReview && (
            <button
              type="button"
              onClick={() => onReview(settlement)}
              className="btn-cursor-primary text-[12px] h-8 px-3 bg-[#1f8a65] hover:bg-[#186f51]"
            >
              <span>Verify & Close</span>
              <ShieldCheck className="size-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onViewDetails(settlement)}
            className="btn-cursor-secondary text-[12px] h-8 px-3"
          >
            <span>Audit Trail</span>
          </button>
        </div>
      </div>
    </div>
  );
}
