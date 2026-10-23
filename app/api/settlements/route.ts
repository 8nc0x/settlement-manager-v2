import { NextRequest, NextResponse } from 'next/server';
import { getSettlements, createSettlement, getUserById, checkUtrAvailability } from '@/lib/db';
import { Role } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const checkUtr = searchParams.get('checkUtr');
    const excludeId = searchParams.get('excludeId') || undefined;
    if (checkUtr) {
      const result = checkUtrAvailability(checkUtr, excludeId);
      return NextResponse.json({ success: true, ...result });
    }

    const role = (searchParams.get('role') as Role) || undefined;
    const userId = searchParams.get('userId') || undefined;
    const status = searchParams.get('status') || undefined;
    const type = searchParams.get('type') || undefined;
    const search = searchParams.get('search') || undefined;

    const list = getSettlements({
      role,
      userId,
      status,
      type,
      search
    });

    return NextResponse.json({ success: true, settlements: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch settlements' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requesterId, amount, dateRange, payoutDetails, merchantNotes, recipientType } = body;

    if (!requesterId) {
      return NextResponse.json({ success: false, error: 'Requester ID is required' }, { status: 400 });
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ success: false, error: 'Valid numerical settlement amount is required' }, { status: 400 });
    }

    if (!dateRange || !dateRange.startDate || !dateRange.endDate) {
      return NextResponse.json({ success: false, error: 'Settlement start and end dates are required' }, { status: 400 });
    }

    if (!payoutDetails || !payoutDetails.method) {
      return NextResponse.json({ success: false, error: 'Payout method (UPI or Bank) is required' }, { status: 400 });
    }

    if (payoutDetails.method === 'upi' && !payoutDetails.upiId) {
      return NextResponse.json({ success: false, error: 'Destination UPI ID is required for UPI payout' }, { status: 400 });
    }

    if (payoutDetails.method === 'bank' && (!payoutDetails.accountNumber || !payoutDetails.ifscCode)) {
      return NextResponse.json({ success: false, error: 'Account number and IFSC code are required for Bank payout' }, { status: 400 });
    }

    const newSettlement = createSettlement({
      requesterId,
      amount: Number(amount),
      dateRange: {
        startDate: dateRange.startDate,
        startTime: dateRange.startTime || '00:00',
        endDate: dateRange.endDate,
        endTime: dateRange.endTime || '23:59'
      },
      payoutDetails,
      merchantNotes,
      recipientType
    });

    return NextResponse.json({ success: true, settlement: newSettlement }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create settlement' }, { status: 500 });
  }
}
