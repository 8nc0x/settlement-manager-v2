'use client';

import React from 'react';
import { Settlement, User } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock3, 
  AlertTriangle, 
  FileCheck, 
  Copy, 
  Check, 
  ExternalLink,
  Building,
  Smartphone,
  FileSpreadsheet,
  FileText,
  Link as LinkIcon,
  Image as ImageIcon
} from 'lucide-react';

interface SettlementCardProps {
  settlement: Settlement;
  currentUser: User;
  onClear: (settlement: Settlement) => void;
  onReview: (settlement: Settlement) => void;
  onViewDetails: (settlement: Settlement) => void;
}

export default function SettlementCard({
  settlement,
  currentUser,
  onClear,
  onReview,
  onViewDetails
}: SettlementCardProps) {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const handleCopy = (text: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getStatusBadge = () => {
    switch (settlement.status) {
      case 'completed':
        return (
          <Badge variant="outline" className="text-emerald-700 bg-emerald-50/70 border-emerald-200 gap-1 text-[11px] font-semibold">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Reconciled &amp; Closed</span>
          </Badge>
        );
      case 'paid_pending_confirmation':
        return (
          <Badge variant="outline" className="text-amber-800 bg-amber-50/80 border-amber-300 gap-1 text-[11px] font-semibold">
            <Clock3 className="w-3 h-3 text-amber-600" />
            <span>Proof Uploaded · Awaiting Review</span>
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="text-sky-700 bg-sky-50 border-sky-200 gap-1 text-[11px] font-semibold">
            <Clock3 className="w-3 h-3 text-sky-600" />
            <span>Pending Clearance</span>
          </Badge>
        );
      case 'disputed':
        return (
          <Badge variant="outline" className="text-rose-700 bg-rose-50 border-rose-200 gap-1 text-[11px] font-semibold">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>Disputed by Payee</span>
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="text-muted-foreground bg-muted border-border text-[11px]">
            <span>Rejected</span>
          </Badge>
        );
    }
  };

  const getProofTypeIcon = () => {
    const pType = settlement.clearing?.proofType;
    if (pType === 'file_excel_csv') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
          <span>XLSX/CSV Sheet</span>
        </span>
      );
    }
    if (pType === 'web_link') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          <LinkIcon className="w-3 h-3 text-blue-600" />
          <span>Payment Link</span>
        </span>
      );
    }
    if (pType === 'file_pdf') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
          <FileText className="w-3 h-3 text-rose-600" />
          <span>PDF Statement</span>
        </span>
      );
    }
    if (settlement.clearing?.proofUrl) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
          <ImageIcon className="w-3 h-3 text-slate-600" />
          <span>Screenshot Photo</span>
        </span>
      );
    }
    return null;
  };

  const isMerchant = currentUser.role === 'merchant';
  const isSubAdmin = currentUser.role === 'subadmin';
  const isAdmin = currentUser.role === 'admin';

  const canClear = (
    settlement.status === 'pending' &&
    ((isSubAdmin && settlement.type === 'merchant_to_subadmin' && settlement.recipientId === currentUser.id) ||
     (isAdmin && (settlement.type === 'subadmin_to_admin' || settlement.type === 'merchant_to_subadmin')))
  );

  const canConfirmReceipt = (
    settlement.status === 'paid_pending_confirmation' &&
    ((isMerchant && settlement.requesterId === currentUser.id) ||
     (isSubAdmin && settlement.type === 'subadmin_to_admin' && settlement.requesterId === currentUser.id) ||
     isAdmin)
  );

  return (
    <Card 
      onClick={() => onViewDetails(settlement)}
      className="border border-border/80 bg-card hover:border-slate-300 transition-all cursor-pointer shadow-xs overflow-hidden"
    >
      <CardContent className="p-4 sm:p-5">
        {/* Top Header: ID, Role Type & Amount */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-medium text-muted-foreground">
              <span>{settlement.id}</span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">
                {settlement.type === 'merchant_to_subadmin' ? 'Merchant Settlement' : 'Platform Settlement'}
              </span>
              {getProofTypeIcon()}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight mt-1">
              {settlement.requesterName}
              {settlement.requesterBusiness && (
                <span className="text-xs font-normal text-muted-foreground ml-1.5 hidden sm:inline">
                  ({settlement.requesterBusiness})
                </span>
              )}
            </h3>
          </div>

          <div className="text-right shrink-0">
            <div className="text-lg sm:text-xl font-bold font-mono text-foreground tabular-nums">
              ₹{settlement.amount.toLocaleString('en-IN')}
            </div>
            <div className="mt-1">{getStatusBadge()}</div>
          </div>
        </div>

        {/* Date Range & Time Constraint */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground py-2 border-y border-border/60 my-2">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <span>
              {settlement.dateRange.startDate} {settlement.dateRange.startTime ? `(${settlement.dateRange.startTime})` : ''}
            </span>
            <span className="text-muted-foreground">→</span>
            <span>
              {settlement.dateRange.endDate} {settlement.dateRange.endTime ? `(${settlement.dateRange.endTime})` : ''}
            </span>
          </div>
          <span aria-hidden="true" className="text-border hidden sm:inline">·</span>
          <div>
            Agent: <span className="font-medium text-foreground">{settlement.recipientName}</span>
          </div>
        </div>

        {/* Payout Details & UTR Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
          {/* Payout target */}
          <div className="p-2.5 rounded-lg bg-muted/50 border border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              {settlement.payoutDetails.method === 'upi' ? (
                <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <Building className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              )}
              <div className="truncate">
                <span className="text-muted-foreground text-[10px] block uppercase font-medium">Requested Destination</span>
                <span className="font-mono font-medium text-foreground truncate">
                  {settlement.payoutDetails.method === 'upi' 
                    ? settlement.payoutDetails.upiId 
                    : `${settlement.payoutDetails.bankName || 'Bank'} A/C: ${settlement.payoutDetails.accountNumber}`}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
              onClick={(e) => handleCopy(
                settlement.payoutDetails.method === 'upi' 
                  ? (settlement.payoutDetails.upiId || '') 
                  : `${settlement.payoutDetails.accountNumber} IFSC: ${settlement.payoutDetails.ifscCode}`, 
                `payout_${settlement.id}`,
                e
              )}
              title="Copy details"
            >
              {copiedKey === `payout_${settlement.id}` ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>

          {/* UTR Reference if available */}
          <div className="p-2.5 rounded-lg bg-muted/50 border border-border/60 flex items-center justify-between">
            <div className="truncate">
              <span className="text-muted-foreground text-[10px] block uppercase font-medium">Bank UTR / Reference</span>
              {settlement.clearing?.utrNumber ? (
                <span className="font-mono font-bold text-foreground tracking-wider">
                  {settlement.clearing.utrNumber}
                </span>
              ) : (
                <span className="text-muted-foreground italic">Not generated yet</span>
              )}
            </div>
            {settlement.clearing?.utrNumber && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
                onClick={(e) => handleCopy(settlement.clearing!.utrNumber!, `utr_${settlement.id}`, e)}
                title="Copy UTR"
              >
                {copiedKey === `utr_${settlement.id}` ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Merchant Notes if provided */}
        {settlement.merchantNotes && (
          <p className="text-xs text-muted-foreground mb-3 bg-muted/30 p-2 rounded border border-border/50">
            <span className="font-medium text-foreground">Note: </span>
            {settlement.merchantNotes}
          </p>
        )}

        {/* Bottom Action Footer */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span>Created {new Date(settlement.createdAt).toLocaleDateString()}</span>
            {settlement.auditTrail.length > 1 && (
              <>
                <span aria-hidden="true">·</span>
                <span>{settlement.auditTrail.length} logs</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canClear && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear(settlement);
                }}
                className="h-8 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              >
                <span>Pay &amp; Clear</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            )}

            {canConfirmReceipt && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onReview(settlement);
                }}
                className="h-8 px-3.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 gap-1.5 shadow-xs"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Verify &amp; Close</span>
              </Button>
            )}

            {settlement.status === 'completed' && (settlement.clearing?.proofUrl || settlement.clearing?.proofLink) && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onReview(settlement);
                }}
                className="h-8 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground gap-1"
              >
                <span>View Proof</span>
                <ExternalLink className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
