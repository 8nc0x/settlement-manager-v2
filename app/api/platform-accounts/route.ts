import { NextRequest, NextResponse } from 'next/server';
import { getPlatformAccounts, savePlatformAccount, deletePlatformAccount, getUserById } from '@/lib/db';

export async function GET() {
  try {
    const accounts = getPlatformAccounts();
    return NextResponse.json({ success: true, accounts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch accounts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { actorId, account } = body;

    const actor = getUserById(actorId);
    if (!actor || actor.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Only Platform Admin can manage collection bank accounts and UPI IDs' }, { status: 403 });
    }

    if (!account.title || !account.accountHolder) {
      return NextResponse.json({ success: false, error: 'Account title and holder name are required' }, { status: 400 });
    }

    if (account.type === 'upi' && !account.upiId) {
      return NextResponse.json({ success: false, error: 'UPI ID is required' }, { status: 400 });
    }

    if (account.type === 'bank' && (!account.accountNumber || !account.ifscCode)) {
      return NextResponse.json({ success: false, error: 'Bank account number and IFSC are required' }, { status: 400 });
    }

    const saved = savePlatformAccount(account);
    return NextResponse.json({ success: true, account: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to save account' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const actorId = searchParams.get('actorId');

    const actor = getUserById(actorId || '');
    if (!actor || actor.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Only Platform Admin can delete accounts' }, { status: 403 });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Account ID required' }, { status: 400 });
    }

    deletePlatformAccount(id);
    return NextResponse.json({ success: true, message: 'Account removed' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to delete' }, { status: 500 });
  }
}
