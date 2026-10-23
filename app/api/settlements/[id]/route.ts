import { NextRequest, NextResponse } from 'next/server';
import { getSettlementById, clearSettlement, confirmSettlement, disputeSettlement } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const settlement = getSettlementById(id);
    if (!settlement) {
      return NextResponse.json({ success: false, error: 'Settlement record not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, settlement });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Error fetching settlement' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { 
      action, 
      actorId, 
      utrNumber, 
      proofUrl, 
      proofType, 
      proofFileName, 
      proofFileSize, 
      proofMimeType, 
      proofLink, 
      remarks, 
      notes, 
      reason 
    } = body;

    if (!actorId) {
      return NextResponse.json({ success: false, error: 'Actor ID is required' }, { status: 400 });
    }

    if (action === 'clear') {
      if (!utrNumber || !utrNumber.trim()) {
        return NextResponse.json({ success: false, error: 'UTR or Transaction reference number is required' }, { status: 400 });
      }
      if (!proofUrl && !proofLink) {
        return NextResponse.json({ success: false, error: 'Payment proof (photo, file, or verification link) is required to clear settlement' }, { status: 400 });
      }

      const updated = clearSettlement({
        settlementId: id,
        actorId,
        utrNumber,
        proofUrl: proofUrl || proofLink,
        proofType,
        proofFileName,
        proofFileSize,
        proofMimeType,
        proofLink,
        remarks
      });
      return NextResponse.json({ success: true, settlement: updated });
    }

    if (action === 'confirm') {
      const updated = confirmSettlement({
        settlementId: id,
        actorId,
        notes
      });
      return NextResponse.json({ success: true, settlement: updated });
    }

    if (action === 'dispute') {
      if (!reason || !reason.trim()) {
        return NextResponse.json({ success: false, error: 'Dispute reason is required' }, { status: 400 });
      }
      const updated = disputeSettlement({
        settlementId: id,
        actorId,
        reason
      });
      return NextResponse.json({ success: true, settlement: updated });
    }

    return NextResponse.json({ success: false, error: `Invalid action '${action}'` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Operation failed' }, { status: 400 });
  }
}
