'use client';

import React from 'react';
import { User, Role } from '@/types';
import { signOut } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Shield, UserCheck, Store, LogOut, ChevronDown, Check, ArrowRight } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  currentTab: string;
  onTabChange: (tab: string) => void;
}

const roleBadges: Record<Role, { label: string; pillClass: string; icon: React.ElementType }> = {
  admin: {
    label: 'Platform Admin',
    pillClass: 'bg-[#e6e5e0] text-[#26251e] border border-[#cfcdc4]',
    icon: Shield,
  },
  subadmin: {
    label: 'Sub-Admin Agent',
    pillClass: 'bg-[#9fbbe0]/30 text-[#26251e] border border-[#9fbbe0]',
    icon: UserCheck,
  },
  merchant: {
    label: 'Merchant Store',
    pillClass: 'bg-[#9fc9a2]/30 text-[#26251e] border border-[#9fc9a2]',
    icon: Store,
  },
};

export default function Navbar({
  currentUser,
  currentTab,
  onTabChange,
}: NavbarProps) {
  if (!currentUser) return null;

  const roleMeta = roleBadges[currentUser.role];
  const RoleIcon = roleMeta.icon;

  const navItems = [
    { key: 'dashboard', label: 'Overview' },
    { key: 'settlements', label: 'Ledger' },
    ...(currentUser.role === 'admin'
      ? [
          { key: 'all-users', label: 'Organizations & Merchants' },
          { key: 'accounts', label: 'Collection Accounts' },
        ]
      : []),
    ...(currentUser.role === 'subadmin'
      ? [
          { key: 'merchants', label: 'My Merchants' },
          { key: 'accounts', label: 'Collection Accounts' },
        ]
      : []),
    ...(currentUser.role === 'merchant'
      ? [
          { key: 'agent-info', label: 'Assigned Agent' },
        ]
      : []),
    { key: 'profile', label: 'Settings' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#f7f7f4] border-b border-[#e6e5e0]">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Wordmark */}
        <div className="flex items-center gap-6 sm:gap-8">
          <div 
            onClick={() => onTabChange('dashboard')}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <div className="w-2.5 h-2.5 bg-[#f54e00] rounded-[2px] transition-transform duration-150 group-hover:scale-110" />
            <span className="font-display text-[17px] font-medium tracking-[-0.04em] text-[#26251e]">
              SettleTrack
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-[4px] bg-[#e6e5e0] text-[#5a5852] tracking-wider ml-1">
              PROD
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = currentTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onTabChange(item.key)}
                  className={`px-3 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors ${
                    active
                      ? 'bg-[#ffffff] text-[#26251e] border border-[#e6e5e0] shadow-xs'
                      : 'text-[#5a5852] hover:text-[#26251e] hover:bg-[#fafaf7]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right side: Role badge & User Menu */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Role Pill */}
          <div className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${roleMeta.pillClass}`}>
            <RoleIcon className="size-3.5" />
            <span>{roleMeta.label}</span>
          </div>

          {/* Account Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] border border-[#e6e5e0] bg-[#ffffff] hover:bg-[#fafaf7] transition-colors focus:outline-none focus:ring-1 focus:ring-[#f54e00]"
            >
              <div className="w-6 h-6 rounded-full bg-[#e6e5e0] flex items-center justify-center text-[11px] font-mono font-medium text-[#26251e]">
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-[12px] font-medium text-[#26251e] leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] font-mono text-[#807d72] leading-tight">
                  {currentUser.email}
                </div>
              </div>
              <ChevronDown className="size-3.5 text-[#807d72]" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-64 bg-[#ffffff] border border-[#e6e5e0] rounded-[10px] p-1.5 shadow-sm"
            >
              <DropdownMenuLabel className="p-2 text-[11px] font-mono text-[#807d72] uppercase tracking-wider">
                Active Session
              </DropdownMenuLabel>
              <div className="px-2 py-1.5 bg-[#fafaf7] rounded-[6px] border border-[#efeee8] mb-1.5 font-mono text-[11px]">
                <div className="font-semibold text-[#26251e] truncate">{currentUser.name}</div>
                <div className="text-[#807d72] text-[10px] truncate">{currentUser.email}</div>
                <div className="mt-1 flex items-center justify-between text-[10px] pt-1 border-t border-[#e6e5e0]">
                  <span className="uppercase text-[#807d72]">ROLE</span>
                  <span className="font-semibold text-[#f54e00] uppercase">{currentUser.role}</span>
                </div>
              </div>

              <DropdownMenuSeparator className="bg-[#e6e5e0]" />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-[#cf2d56] focus:text-[#cf2d56] focus:bg-[#cf2d56]/10 text-[12px] p-2 rounded-[6px] cursor-pointer flex items-center gap-2"
              >
                <LogOut className="size-3.5" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
