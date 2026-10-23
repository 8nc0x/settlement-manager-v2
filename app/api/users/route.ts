import { NextRequest, NextResponse } from 'next/server';
import { getUsers, createUser, resetPassword, updateUserProfile, getUserById } from '@/lib/db';
import { Role } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') as Role | null;
    const subAdminId = searchParams.get('subAdminId');
    const requesterId = searchParams.get('requesterId');

    let all = getUsers();

    // If a subadmin is requesting, show their merchants and the platform admin
    if (subAdminId) {
      all = all.filter(u => u.subAdminId === subAdminId || u.createdBy === subAdminId);
    } else if (role) {
      all = all.filter(u => u.role === role);
    }

    // Sanitize passwords for list view, except for the sub-admin viewing their created merchant credentials
    const safeUsers = all.map(u => ({
      ...u,
      // Sub-admin or admin can see password for merchants they created because user prompt said:
      // "He will create a merchant account and give ID password of it to that merchant... no forget password option. So user will be told to remember the password, and also sub-admin will have option to reset password of his merchant"
      password: (requesterId && (u.createdBy === requesterId || u.subAdminId === requesterId)) ? u.password : undefined
    }));

    return NextResponse.json({ success: true, users: safeUsers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, role, createdBy, subAdminId, businessName, phone, defaultUpiId, bankDetails } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ success: false, error: 'Email, password, and merchant name are required' }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ success: false, error: 'Password must be at least 4 characters long' }, { status: 400 });
    }

    const creator = getUserById(createdBy);
    if (!creator) {
      return NextResponse.json({ success: false, error: 'Creating user account not found' }, { status: 400 });
    }

    // Role verification: only admin can create subadmin; subadmin or admin can create merchant
    const targetRole: Role = role || 'merchant';
    if (targetRole === 'subadmin' && creator.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Only Platform Admin can create Sub-Admins' }, { status: 403 });
    }

    const newUser = createUser({
      email,
      password,
      name,
      role: targetRole,
      createdBy,
      subAdminId: targetRole === 'merchant' ? (subAdminId || (creator.role === 'subadmin' ? creator.id : undefined)) : undefined,
      businessName,
      phone,
      defaultUpiId,
      bankDetails
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create user' }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, targetUserId, newPassword, requesterId, profileUpdates } = body;

    const requester = getUserById(requesterId);
    if (!requester) {
      return NextResponse.json({ success: false, error: 'Requester authentication required' }, { status: 401 });
    }

    if (action === 'reset-password') {
      if (!newPassword || newPassword.length < 4) {
        return NextResponse.json({ success: false, error: 'New password must be at least 4 characters' }, { status: 400 });
      }

      const updated = resetPassword(targetUserId, newPassword, requester.role, requester.id);
      return NextResponse.json({ 
        success: true, 
        message: `Password for ${updated.name} (${updated.email}) updated successfully`,
        user: { ...updated, password: newPassword }
      });
    }

    if (action === 'update-profile') {
      const updated = updateUserProfile(targetUserId, profileUpdates);
      return NextResponse.json({ success: true, user: updated });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Update failed' }, { status: 400 });
  }
}
