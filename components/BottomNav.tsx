'use client';

import React from 'react';
import { Role } from '@/types';
import { LayoutDashboard, FileText, Plus, Users, Building2, UserCircle } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  role: Role;
  onOpenNewAction: () => void;
  pendingClearCount?: number;
  awaitingReviewCount?: number;
}

type Tab = {
  key: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
};

export default function BottomNav({
  currentTab,
  onTabChange,
  role,
  onOpenNewAction,
  pendingClearCount = 0,
  awaitingReviewCount = 0,
}: BottomNavProps) {
  const networkTab: Tab =
    role === 'subadmin'
      ? { key: 'merchants', label: 'Merchants', icon: Users }
      : role === 'admin'
        ? { key: 'all-users', label: 'Directory', icon: Users }
        : { key: 'agent-info', label: 'Agent', icon: Building2 };

  const actionCount = role === 'merchant' ? awaitingReviewCount : pendingClearCount;

  const tabs: Tab[] = [
    { key: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { key: 'settlements', label: 'Ledger', icon: FileText, badge: actionCount },
    networkTab,
    { key: 'profile', label: 'Settings', icon: UserCircle },
  ];

  return (
    <>
      {/* Floating primary action button in signature Cursor Orange */}
      <button
        type="button"
        onClick={onOpenNewAction}
        aria-label={role === 'admin' ? 'Manage collection accounts' : 'Raise a settlement request'}
        className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] z-40 grid size-12 place-items-center rounded-[8px] bg-[#f54e00] hover:bg-[#d04200] text-white shadow-xs transition-transform active:scale-95 md:hidden"
      >
        <Plus className="size-6" strokeWidth={2.2} />
      </button>

      {/* Mobile Bottom Dock */}
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e6e5e0] bg-[#f7f7f4] backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <div className="grid h-14 grid-cols-4 items-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = currentTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key)}
                className={`group relative flex flex-col items-center justify-center gap-0.5 py-1 text-[11px] font-medium transition-colors ${
                  active ? 'text-[#f54e00]' : 'text-[#807d72] hover:text-[#26251e]'
                }`}
              >
                <div className="relative">
                  <Icon className="size-4.5" strokeWidth={active ? 2.2 : 1.8} />
                  {typeof tab.badge === 'number' && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-2 grid min-w-3.5 h-3.5 place-items-center rounded-full bg-[#f54e00] px-1 text-[9px] font-mono font-bold text-white">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight">{tab.label}</span>
                {active && (
                  <span className="absolute bottom-0 w-8 h-[2px] bg-[#f54e00] rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
