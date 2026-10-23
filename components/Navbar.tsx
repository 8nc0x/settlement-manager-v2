'use client';

import React from 'react';
import { User, Role } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ShieldCheck, UserCheck, Store, LogOut, ChevronDown, Check } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onSwitchRole: (role: Role) => void;
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export default function Navbar({
  currentUser,
  onLogout,
  onSwitchRole,
  currentTab,
  onTabChange,
}: NavbarProps) {
  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'admin':
        return (
          <Badge variant="outline" className="text-purple-700 bg-purple-50 border-purple-200 font-semibold gap-1">
            <ShieldCheck className="w-3 h-3 text-purple-600" />
            Platform Admin
          </Badge>
        );
      case 'subadmin':
        return (
          <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200 font-semibold gap-1">
            <UserCheck className="w-3 h-3 text-blue-600" />
            Sub-Admin (Agent)
          </Badge>
        );
      case 'merchant':
        return (
          <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 font-semibold gap-1">
            <Store className="w-3 h-3 text-emerald-600" />
            Merchant
          </Badge>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-base shadow-xs">
            S
          </div>
          <div>
            <div className="font-bold text-base sm:text-lg tracking-tight text-foreground flex items-center gap-2">
              SettleTrack
              <span className="hidden sm:inline-block text-[11px] font-mono text-muted-foreground font-normal">
                / {currentUser?.role?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium">
          <Button
            variant={currentTab === 'dashboard' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onTabChange('dashboard')}
            className={currentTab === 'dashboard' ? 'font-semibold' : 'text-muted-foreground'}
          >
            Dashboard
          </Button>
          <Button
            variant={currentTab === 'settlements' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onTabChange('settlements')}
            className={currentTab === 'settlements' ? 'font-semibold' : 'text-muted-foreground'}
          >
            Settlements Ledger
          </Button>
          {currentUser?.role === 'subadmin' && (
            <Button
              variant={currentTab === 'merchants' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('merchants')}
              className={currentTab === 'merchants' ? 'font-semibold' : 'text-muted-foreground'}
            >
              My Merchants
            </Button>
          )}
          {currentUser?.role === 'admin' && (
            <>
              <Button
                variant={currentTab === 'accounts' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onTabChange('accounts')}
                className={currentTab === 'accounts' ? 'font-semibold' : 'text-muted-foreground'}
              >
                Collection Banks &amp; UPI
              </Button>
              <Button
                variant={currentTab === 'all-users' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onTabChange('all-users')}
                className={currentTab === 'all-users' ? 'font-semibold' : 'text-muted-foreground'}
              >
                Users &amp; Agents
              </Button>
            </>
          )}
          {currentUser?.role === 'merchant' && (
            <Button
              variant={currentTab === 'agent-info' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('agent-info')}
              className={currentTab === 'agent-info' ? 'font-semibold' : 'text-muted-foreground'}
            >
              Agent &amp; Banking
            </Button>
          )}
        </nav>

        {/* Zone 3: Active User & Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick Persona Switcher with DropdownMenu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted text-foreground h-8 gap-1.5 cursor-pointer transition-colors shadow-2xs">
              <span className="hidden sm:inline text-muted-foreground">Role:</span>
              <span className="capitalize font-semibold text-emerald-700">{currentUser?.role}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Switch Test Role
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => onSwitchRole('admin')}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs">Vikram Singhania</span>
                    <span className="text-[10px] text-muted-foreground">Platform Admin (Owner)</span>
                  </div>
                  {currentUser?.role === 'admin' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onSwitchRole('subadmin')}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs">Rahul Deshmukh</span>
                    <span className="text-[10px] text-muted-foreground">Sub-Admin (Agent)</span>
                  </div>
                  {currentUser?.role === 'subadmin' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onSwitchRole('merchant')}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs">Sunil Sharma</span>
                    <span className="text-[10px] text-muted-foreground">Merchant (Store)</span>
                  </div>
                  {currentUser?.role === 'merchant' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Name & Details */}
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-xs font-semibold text-foreground truncate max-w-[140px]">
              {currentUser?.name}
            </span>
            <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">
              {currentUser?.businessName || currentUser?.email}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
