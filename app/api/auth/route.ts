import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, getUserById, getUsers } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, password, userId, targetRole } = body;

    // Fast switch-role helper (for direct seamless testing in preview)
    if (action === 'switch-role') {
      const users = getUsers();
      let matchedUser = users.find(u => u.role === targetRole);
      if (!matchedUser) {
        matchedUser = users[0];
      }
      const response = NextResponse.json({ success: true, user: matchedUser });
      response.cookies.set('settle_session_uid', matchedUser.id, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30
      });
      return response;
    }

    // Direct switch by user ID
    if (action === 'switch-user' && userId) {
      const user = getUserById(userId);
      if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }
      const response = NextResponse.json({ success: true, user });
      response.cookies.set('settle_session_uid', user.id, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30
      });
      return response;
    }

    // Standard email & password login
    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    const user = getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    if (user.password !== password) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    if (user.status === 'suspended') {
      return NextResponse.json({ success: false, error: 'This account has been suspended by the platform' }, { status: 403 });
    }

    const response = NextResponse.json({ success: true, user });
    response.cookies.set('settle_session_uid', user.id, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30
    });
    return response;

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Authentication error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('settle_session_uid');
    const url = new URL(req.url);
    const requestedUid = url.searchParams.get('uid') || sessionCookie?.value;

    if (!requestedUid) {
      // Return default admin if no session is set
      const users = getUsers();
      const defaultUser = users.find(u => u.role === 'admin') || users[0];
      return NextResponse.json({ success: true, user: defaultUser, isDefault: true });
    }

    const user = getUserById(requestedUid);
    if (!user) {
      const users = getUsers();
      return NextResponse.json({ success: true, user: users[0], isDefault: true });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch session' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  response.cookies.delete('settle_session_uid');
  return response;
}
