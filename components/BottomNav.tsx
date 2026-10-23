'use client';

import React from 'react';
import { Role } from '@/types';
import { LayoutDashboard, FileText, PlusCircle, Users, Building2, UserCircle } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  role: Role;
  onOpenNewAction: () => void;
  pendingClearCount?: number;
  awaitingReviewCount?: number;
}

export default function BottomNav({
  currentTab,
  onTabChange,
  role,
  onOpenNewAction,
  pendingClearCount = 0,
  awaitingReviewCount = 0
}: BottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border pb-safe shadow-xs">
      <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-2">
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            currentTab === 'dashboard' ? 'text-emerald-700 font-semibold' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] tracking-tight mt-1">Overview</span>
        </button>

        {/* Tab 2: Settlements List */}
        <button
          onClick={() => onTabChange('settlements')}
          className={`relative flex flex-col items-center justify-center h-full transition-colors ${
            currentTab === 'settlements' ? 'text-emerald-700 font-semibold' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] tracking-tight mt-1">Ledger</span>
          {/* Badge count indicator */}
          {(role === 'merchant' ? awaitingReviewCount : pendingClearCount) > 0 && (
            <span className="absolute top-2 right-4 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-background" />
          )}
        </button>

        {/* Tab 3: Center Primary Action Button */}
        <div className="flex items-center justify-center h-full">
          <button
            onClick={onOpenNewAction}
            className="w-11 h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
            title={role === 'merchant' ? 'Raise Settlement Request' : 'Settle / Request Payout'}
          >
            <PlusCircle className="w-6 h-6 stroke-[2.2]" />
          </button>
        </div>

        {/* Tab 4: Role-specific Management */}
        {role === 'subadmin' && (
          <button
            onClick={() => onTabChange('merchants')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              currentTab === 'merchants' ? 'text-emerald-700 font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-5 h-5 stroke-[1.8]" />
            <span className="text-[10px] tracking-tight mt-1">Merchants</span>
          </button>
        )}
        {role === 'admin' && (
          <button
            onClick={() => onTabChange('accounts')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              currentTab === 'accounts' ? 'text-emerald-700 font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building2 className="w-5 h-5 stroke-[1.8]" />
            <span className="text-[10px] tracking-tight mt-1">Banks/UPI</span>
          </button>
        )}
        {role === 'merchant' && (
          <button
            onClick={() => onTabChange('agent-info')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              currentTab === 'agent-info' ? 'text-emerald-700 font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building2 className="w-5 h-5 stroke-[1.8]" />
            <span className="text-[10px] tracking-tight mt-1">Agent Info</span>
          </button>
        )}

        {/* Tab 5: Profile / Settings */}
        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            currentTab === 'profile' ? 'text-emerald-700 font-semibold' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <UserCircle className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] tracking-tight mt-1">Profile</span>
        </button>
      </div>
    </nav>
  );
}
