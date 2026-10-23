import { NextRequest, NextResponse } from 'next/server';
import { getStats } from '@/lib/db';
import { Role } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = (searchParams.get('role') as Role) || 'admin';
    const userId = searchParams.get('userId') || 'usr_admin';

    const stats = getStats(role, userId);
    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to calculate stats' }, { status: 500 });
  }
}
