import { NextRequest, NextResponse } from 'next/server';
import { getSettlements } from '@/lib/db';
import { Role } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = (searchParams.get('role') as Role) || undefined;
    const userId = searchParams.get('userId') || undefined;
    const format = searchParams.get('format') || 'csv';

    const settlements = getSettlements({ role, userId });

    if (format === 'json') {
      return new NextResponse(JSON.stringify(settlements, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="settlements-permanent-ledger-${new Date().toISOString().slice(0, 10)}.json"`
        }
      });
    }

    // CSV format
    const headers = [
      'Settlement ID',
      'Type',
      'Status',
      'Amount (INR)',
      'Requester Name',
      'Requester Role',
      'Recipient Name',
      'Recipient Role',
      'Start Date',
      'End Date',
      'Payout Method',
      'Payout Details',
      'UTR Number',
      'Cleared By',
      'Cleared At',
      'Confirmed By',
      'Confirmed At',
      'Dispute Reason',
      'Created At'
    ];

    const rows = settlements.map(s => {
      const payoutStr = s.payoutDetails.method === 'upi' 
        ? `UPI: ${s.payoutDetails.upiId || ''}` 
        : `Bank: ${s.payoutDetails.accountNumber || ''} (${s.payoutDetails.ifscCode || ''})`;

      return [
        s.id,
        s.type,
        s.status,
        s.amount,
        `"${s.requesterName.replace(/"/g, '""')}"`,
        s.requesterRole,
        `"${s.recipientName.replace(/"/g, '""')}"`,
        s.recipientRole,
        `${s.dateRange.startDate} ${s.dateRange.startTime || ''}`.trim(),
        `${s.dateRange.endDate} ${s.dateRange.endTime || ''}`.trim(),
        s.payoutDetails.method.toUpperCase(),
        `"${payoutStr.replace(/"/g, '""')}"`,
        s.clearing?.utrNumber || '',
        `"${(s.clearing?.clearedByName || '').replace(/"/g, '""')}"`,
        s.clearing?.clearedAt || '',
        `"${(s.confirmation?.confirmedByName || '').replace(/"/g, '""')}"`,
        s.confirmation?.confirmedAt || '',
        `"${(s.confirmation?.disputeReason || '').replace(/"/g, '""')}"`,
        s.createdAt
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="settlements-ledger-${new Date().toISOString().slice(0, 10)}.csv"`
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Export error' }, { status: 500 });
  }
}
