import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ success: true, message: 'Settlement manager active' });
}

export async function GET() {
  return NextResponse.json({ success: true, message: 'Settlement manager active' });
}
