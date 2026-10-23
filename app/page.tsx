'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { User, Settlement, Role, SettlementStats, PlatformCollectionAccount } from '@/types';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import SettlementCard from '@/components/SettlementCard';
import RaiseSettlementModal from '@/components/RaiseSettlementModal';
import ClearSettlementModal from '@/components/ClearSettlementModal';
import ReviewProofModal from '@/components/ReviewProofModal';
import MerchantManagementModal from '@/components/MerchantManagementModal';
import ResetPasswordModal from '@/components/ResetPasswordModal';
import PlatformAccountsModal from '@/components/PlatformAccountsModal';
import AuthView from '@/components/AuthView';
import {
  Plus,
  Search,
  Download,
  Users,
  Building2,
  KeyRound,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  ArrowUpRight,
  FileText,
  Smartphone,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  Check,
  Calendar,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

const statusFilters = [
  { key: 'all', label: 'All Records' },
  { key: 'pending', label: 'Pending Clearance' },
  { key: 'paid_pending_confirmation', label: 'Awaiting Verification' },
  { key: 'completed', label: 'Closed & Locked' },
  { key: 'disputed', label: 'Discrepancies' },
];

export default function Home() {
  const { data: session, status: authStatus } = useSession();
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [currentTab, setCurrentTab] = React.useState<string>('dashboard');

  // Settlements data
  const [settlements, setSettlements] = React.useState<Settlement[]>([]);
  const [stats, setStats] = React.useState<SettlementStats | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Users data for sub-admin / admin
  const [userList, setUserList] = React.useState<User[]>([]);
  const [platformAccounts, setPlatformAccounts] = React.useState<PlatformCollectionAccount[]>([]);

  // Modals state
  const [isRaiseModalOpen, setIsRaiseModalOpen] = React.useState<boolean>(false);
  const [isClearModalOpen, setIsClearModalOpen] = React.useState<boolean>(false);
  const [selectedSettlementToClear, setSelectedSettlementToClear] = React.useState<Settlement | null>(null);

  const [isReviewModalOpen, setIsReviewModalOpen] = React.useState<boolean>(false);
  const [selectedSettlementToReview, setSelectedSettlementToReview] = React.useState<Settlement | null>(null);

  const [isAddMerchantModalOpen, setIsAddMerchantModalOpen] = React.useState<boolean>(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = React.useState<boolean>(false);
  const [selectedUserToReset, setSelectedUserToReset] = React.useState<User | null>(null);

  const [isPlatformAccountsModalOpen, setIsPlatformAccountsModalOpen] = React.useState<boolean>(false);

  // Sync user from NextAuth session or fallback local query
  React.useEffect(() => {
    if (session?.user) {
      setCurrentUser(session.user as unknown as User);
    } else if (authStatus === 'unauthenticated') {
      // Check if session cookie exists or fetch initial user
      fetch('/api/users')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.users && data.users.length > 0) {
            // Do not force login if demo mode is wanted, but respect NextAuth
          }
        })
        .catch(() => {});
    }
  }, [session, authStatus]);

  // Load settlements, stats, users, and platform accounts
  const reloadData = React.useCallback(async (userToQuery?: User) => {
    const user = userToQuery || currentUser;
    if (!user) return;

    try {
      // Fetch stats
      const statsRes = await fetch(`/api/stats?role=${user.role}&userId=${user.id}`);
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // Fetch settlements
      const settleRes = await fetch(`/api/settlements?role=${user.role}&userId=${user.id}`);
      const settleData = await settleRes.json();
      if (settleData.success) {
        setSettlements(settleData.settlements);
      }

      // Fetch users if subadmin or admin
      if (user.role === 'admin' || user.role === 'subadmin') {
        const usersRes = await fetch(
          `/api/users?requesterId=${user.id}${user.role === 'subadmin' ? `&subAdminId=${user.id}` : ''}`
        );
        const usersData = await usersRes.json();
        if (usersData.success) {
          setUserList(usersData.users);
        }
      }

      // Fetch platform accounts
      const accRes = await fetch('/api/platform-accounts');
      const accData = await accRes.json();
      if (accData.success) {
        setPlatformAccounts(accData.accounts);
      }
    } catch (err) {
      console.error('Error reloading ledger data:', err);
    }
  }, [currentUser]);

  React.useEffect(() => {
    if (currentUser) {
      reloadData();
    }
  }, [currentUser, reloadData]);

  // Visual viewport keyboard inset handling
  React.useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const syncKeyboardInset = () => {
      const inset = window.innerHeight - viewport.height - viewport.offsetTop;
      document.documentElement.style.setProperty(
        '--kb-inset',
        inset > 120 ? `${Math.round(inset)}px` : '0px'
      );
    };

    viewport.addEventListener('resize', syncKeyboardInset);
    viewport.addEventListener('scroll', syncKeyboardInset);
    syncKeyboardInset();

    return () => {
      viewport.removeEventListener('resize', syncKeyboardInset);
      viewport.removeEventListener('scroll', syncKeyboardInset);
    };
  }, []);

  // Scroll to top on tab change
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentTab]);

  // Global hotkey: '/' to focus search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        setCurrentTab('settlements');
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Loading state
  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-[#f7f7f4] flex flex-col items-center justify-center">
        <div className="w-3 h-3 bg-[#f54e00] rounded-[2px] animate-ping mb-3" />
        <div className="font-display text-[16px] text-[#26251e]">
          Initializing SettleTrack Ledger...
        </div>
      </div>
    );
  }

  // Not signed in -> Render AuthView
  if (!currentUser) {
    return (
      <AuthView
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          reloadData(user);
        }}
      />
    );
  }

  // Filtering settlements
  const filteredSettlements = settlements.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        s.id.toLowerCase().includes(q) ||
        s.requesterName.toLowerCase().includes(q) ||
        s.recipientName.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q) ||
        (s.type === 'merchant_to_admin' && (q.includes('direct') || q.includes('platform'))) ||
        (s.type === 'merchant_to_subadmin' && q.includes('agent')) ||
        (s.clearing?.utrNumber && s.clearing.utrNumber.toLowerCase().includes(q)) ||
        (s.payoutDetails.upiId && s.payoutDetails.upiId.toLowerCase().includes(q)) ||
        (s.payoutDetails.accountNumber && s.payoutDetails.accountNumber.includes(q)) ||
        s.amount.toString().includes(q)
      );
    }
    return true;
  });

  const handleClearClick = (s: Settlement) => {
    setSelectedSettlementToClear(s);
    setIsClearModalOpen(true);
  };

  const handleReviewClick = (s: Settlement) => {
    setSelectedSettlementToReview(s);
    setIsReviewModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f7f7f4] text-[#26251e] pb-20 md:pb-16 font-sans w-full max-w-full overflow-x-hidden">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
      />

      <main className="max-w-[1240px] mx-auto px-3 sm:px-6 pt-3 sm:pt-6 w-full max-w-full overflow-x-hidden">
        {/* -------------------------------------------------------------
            TAB: DASHBOARD (OVERVIEW)
            ------------------------------------------------------------- */}
        {currentTab === 'dashboard' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Functional Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-[#e6e5e0]">
              <div>
                <h1 className="font-display text-[22px] sm:text-[30px] font-normal tracking-tight text-[#26251e] leading-snug">
                  Settlement Operations
                </h1>
                <p className="hidden sm:block text-[13px] text-[#5a5852] mt-0.5">
                  Double-entry turnover clearing, UTR verification, and permanent ledger records.
                </p>
              </div>

              {/* Action Buttons in Hero */}
              <div className="flex flex-wrap items-center gap-2">
                {currentUser.role !== 'admin' && (
                  <button
                    type="button"
                    onClick={() => setIsRaiseModalOpen(true)}
                    className="btn-cursor-primary text-[13px] h-9 px-3"
                  >
                    <Plus className="size-4" />
                    <span>Raise Settlement</span>
                  </button>
                )}

                {(currentUser.role === 'admin' || currentUser.role === 'subadmin') && (
                  <button
                    type="button"
                    onClick={() => setIsAddMerchantModalOpen(true)}
                    className="btn-cursor-secondary text-[13px] h-9 px-3"
                  >
                    <Users className="size-4 text-[#807d72]" />
                    <span>Onboard Merchant</span>
                  </button>
                )}

                <a
                  href={`/api/export?role=${currentUser.role}&userId=${currentUser.id}&format=csv`}
                  download
                  className="btn-cursor-secondary text-[13px] h-9 px-3"
                >
                  <Download className="size-4 text-[#807d72]" />
                  <span>Export</span>
                </a>
              </div>
            </div>

            {/* Metrics Grid - 2x2 on Mobile, 4-col on Desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {/* Total Settled */}
              <div className="rounded-[10px] sm:rounded-[12px] border border-[#e6e5e0] bg-[#ffffff] p-3 sm:p-5">
                <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-[#807d72] truncate">
                  Total Settled
                </div>
                <div className="font-mono text-[18px] sm:text-[24px] font-medium text-[#26251e] tracking-tight mt-1 sm:mt-1.5 truncate">
                  ₹{(stats?.totalSettledAmount || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-[#5a5852] mt-0.5 flex items-center gap-1 font-mono">
                  <span className="font-semibold text-[#1f8a65]">{stats?.totalCompletedCount || 0}</span>
                  <span className="text-[10px]">closed</span>
                </div>
              </div>

              {/* Pending Payouts */}
              <div className="rounded-[10px] sm:rounded-[12px] border border-[#e6e5e0] bg-[#ffffff] p-3 sm:p-5">
                <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-[#807d72] truncate">
                  Pending Payouts
                </div>
                <div className="font-mono text-[18px] sm:text-[24px] font-medium text-[#26251e] tracking-tight mt-1 sm:mt-1.5 truncate">
                  ₹{(stats?.totalPendingAmount || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-[#5a5852] mt-0.5 flex items-center gap-1 font-mono">
                  <span className="font-semibold text-[#f54e00]">{stats?.totalPendingCount || 0}</span>
                  <span className="text-[10px]">awaiting</span>
                </div>
              </div>

              {/* Awaiting Review */}
              <div className="rounded-[10px] sm:rounded-[12px] border border-[#e6e5e0] bg-[#ffffff] p-3 sm:p-5">
                <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-[#807d72] truncate">
                  Verification
                </div>
                <div className="font-mono text-[18px] sm:text-[24px] font-medium text-[#26251e] tracking-tight mt-1 sm:mt-1.5 truncate">
                  {stats?.totalAwaitingReviewCount || 0}
                </div>
                <div className="text-[10px] sm:text-[11px] text-[#5a5852] mt-0.5 truncate">
                  With UTR proof
                </div>
              </div>

              {/* Discrepancies */}
              <div className="rounded-[10px] sm:rounded-[12px] border border-[#e6e5e0] bg-[#ffffff] p-3 sm:p-5">
                <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-[#807d72] truncate">
                  Disputes
                </div>
                <div className="font-mono text-[18px] sm:text-[24px] font-medium text-[#cf2d56] tracking-tight mt-1 sm:mt-1.5 truncate">
                  {stats?.totalDisputedCount || 0}
                </div>
                <div className="text-[10px] sm:text-[11px] text-[#5a5852] mt-0.5 truncate">
                  Flagged UTRs
                </div>
              </div>
            </div>

            {/* Recent Settlements List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-[16px] sm:text-[18px] font-normal text-[#26251e]">
                    Recent Ledger Entries
                  </h3>
                  <span className="font-mono text-[11px] text-[#807d72]">
                    ({settlements.length})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentTab('settlements')}
                  className="text-[12px] font-medium text-[#f54e00] hover:underline flex items-center gap-0.5"
                >
                  <span>View All</span>
                  <ChevronRight className="size-3.5" />
                </button>
              </div>

              {settlements.length === 0 ? (
                <div className="p-8 sm:p-12 text-center rounded-[12px] border border-[#e6e5e0] bg-[#ffffff] text-[13px] text-[#807d72]">
                  No settlements recorded yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
                  {settlements.slice(0, 5).map((s) => (
                    <SettlementCard
                      key={s.id}
                      settlement={s}
                      currentUser={currentUser}
                      onClear={handleClearClick}
                      onReview={handleReviewClick}
                      onViewDetails={handleReviewClick}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: SETTLEMENTS LEDGER
            ------------------------------------------------------------- */}
        {currentTab === 'settlements' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e6e5e0]">
              <div>
                <h1 className="font-display text-[26px] font-normal tracking-tight text-[#26251e]">
                  Permanent Settlement Ledger
                </h1>
                <p className="text-[13px] text-[#5a5852]">
                  Search and verify all transactions by UTR, ID, merchant name, or amount.
                </p>
              </div>

              {currentUser.role !== 'admin' && (
                <button
                  type="button"
                  onClick={() => setIsRaiseModalOpen(true)}
                  className="btn-cursor-primary self-start sm:self-auto"
                >
                  <Plus className="size-4" />
                  <span>Raise Settlement</span>
                </button>
              )}
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Status Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {statusFilters.map((flt) => {
                  const active = statusFilter === flt.key;
                  return (
                    <button
                      key={flt.key}
                      type="button"
                      onClick={() => setStatusFilter(flt.key)}
                      className={`px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors ${
                        active
                          ? 'bg-[#26251e] text-white'
                          : 'bg-[#ffffff] text-[#5a5852] border border-[#e6e5e0] hover:border-[#cfcdc4]'
                      }`}
                    >
                      {flt.label}
                    </button>
                  );
                })}
              </div>

              {/* Search Bar with '/' hotkey badge */}
              <div className="relative w-full md:w-80">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#807d72]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search UTR, merchant, amount... (Press /)"
                  className="w-full h-9 pl-9 pr-8 text-[12px] font-mono rounded-[8px] border border-[#e6e5e0] bg-[#ffffff] text-[#26251e] placeholder:text-[#a09c92] focus:outline-none focus:border-[#f54e00]"
                />
                <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-block px-1.5 py-0.5 rounded-[4px] border border-[#e6e5e0] bg-[#fafaf7] text-[10px] font-mono text-[#807d72]">
                  /
                </kbd>
              </div>
            </div>

            {/* Ledger Results */}
            {filteredSettlements.length === 0 ? (
              <div className="p-12 text-center rounded-[12px] border border-[#e6e5e0] bg-[#ffffff] text-[13px] text-[#807d72]">
                No settlement records match your search or filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredSettlements.map((s) => (
                  <SettlementCard
                    key={s.id}
                    settlement={s}
                    currentUser={currentUser}
                    onClear={handleClearClick}
                    onReview={handleReviewClick}
                    onViewDetails={handleReviewClick}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: MERCHANTS & DIRECTORY (ADMIN / SUBADMIN)
            ------------------------------------------------------------- */}
        {(currentTab === 'merchants' || currentTab === 'all-users') && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e6e5e0]">
              <div>
                <h1 className="font-display text-[26px] font-normal tracking-tight text-[#26251e]">
                  {currentUser.role === 'admin' ? 'Organizations & Merchants' : 'Assigned Store Merchants'}
                </h1>
                <p className="text-[13px] text-[#5a5852]">
                  Manage merchant login credentials, assigned agents, and direct password resets.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddMerchantModalOpen(true)}
                className="btn-cursor-primary self-start sm:self-auto"
              >
                <Plus className="size-4" />
                <span>Onboard Merchant</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userList.map((u) => {
                const isMerchant = u.role === 'merchant';
                return (
                  <div
                    key={u.id}
                    className="rounded-[12px] border border-[#e6e5e0] bg-[#ffffff] p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#efeee8]">
                        <span className="font-semibold text-[14px] text-[#26251e] truncate">{u.name}</span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#e6e5e0] text-[#5a5852]">
                          {u.role}
                        </span>
                      </div>

                      <div className="py-3 space-y-1.5 text-[12px]">
                        {u.businessName && (
                          <div className="text-[#26251e] font-medium">{u.businessName}</div>
                        )}
                        <div className="font-mono text-[11px] text-[#807d72]">{u.email}</div>
                        {u.phone && <div className="font-mono text-[11px] text-[#807d72]">{u.phone}</div>}
                        {u.defaultUpiId && (
                          <div className="font-mono text-[11px] text-[#f54e00]">UPI: {u.defaultUpiId}</div>
                        )}
                        {u.subAdminName && (
                          <div className="text-[11px] text-[#807d72]">Agent: {u.subAdminName}</div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#efeee8] flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-[#a09c92]">ID: {u.id}</span>
                      {isMerchant && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUserToReset(u);
                            setIsResetPasswordModalOpen(true);
                          }}
                          className="btn-cursor-secondary text-[11px] h-7 px-2.5"
                        >
                          <KeyRound className="size-3 text-[#f54e00]" />
                          <span>Reset Password</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: AGENT CONTACT (FOR MERCHANTS)
            ------------------------------------------------------------- */}
        {currentTab === 'agent-info' && (
          <div className="max-w-xl mx-auto space-y-5">
            <div>
              <h1 className="font-display text-[26px] font-normal tracking-tight text-[#26251e]">
                Assigned Clearing Agent
              </h1>
              <p className="text-[13px] text-[#5a5852]">
                Your dedicated sub-admin responsible for reviewing and clearing your daily turnover payouts.
              </p>
            </div>

            <div className="rounded-[12px] border border-[#e6e5e0] bg-[#ffffff] p-6 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#efeee8]">
                <div className="w-10 h-10 rounded-full bg-[#9fbbe0]/30 text-[#26251e] flex items-center justify-center font-bold">
                  {currentUser.subAdminName ? currentUser.subAdminName.charAt(0) : 'A'}
                </div>
                <div>
                  <div className="font-semibold text-[15px] text-[#26251e]">
                    {currentUser.subAdminName || 'Platform Clearing Desk'}
                  </div>
                  <div className="text-[11px] text-[#807d72] uppercase font-mono">
                    Authorized Settlement Agent
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-[12px]">
                <div className="p-3 rounded-[8px] border border-[#e6e5e0] bg-[#fafaf7] flex justify-between">
                  <span className="text-[#807d72]">Agent ID:</span>
                  <span className="font-mono text-[#26251e]">{currentUser.subAdminId || 'HQ-DESK-01'}</span>
                </div>
                <div className="p-3 rounded-[8px] border border-[#e6e5e0] bg-[#fafaf7] flex justify-between">
                  <span className="text-[#807d72]">Clearing Window:</span>
                  <span className="font-medium text-[#26251e]">Daily 09:00 - 22:00 IST</span>
                </div>
                <div className="p-3 rounded-[8px] border border-[#e6e5e0] bg-[#fafaf7] flex justify-between">
                  <span className="text-[#807d72]">Settlement Payout Channels:</span>
                  <span className="font-medium text-[#1f8a65]">Instant IMPS &middot; RTGS</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRaiseModalOpen(true)}
                className="w-full btn-cursor-primary"
              >
                <span>Raise Settlement to {currentUser.subAdminName || 'Agent'}</span>
                <ArrowUpRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: COLLECTION ACCOUNTS (ADMIN / SUBADMIN)
            ------------------------------------------------------------- */}
        {currentTab === 'accounts' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e6e5e0]">
              <div>
                <h1 className="font-display text-[26px] font-normal tracking-tight text-[#26251e]">
                  Platform Collection Accounts
                </h1>
                <p className="text-[13px] text-[#5a5852]">
                  Active collection bank accounts and UPI IDs for merchant turnover deposits.
                </p>
              </div>

              {currentUser.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => setIsPlatformAccountsModalOpen(true)}
                  className="btn-cursor-primary self-start sm:self-auto"
                >
                  <Plus className="size-4" />
                  <span>Configure Accounts</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {platformAccounts.map((acc) => {
                const isUpi = acc.type === 'upi';
                return (
                  <div
                    key={acc.id}
                    className="rounded-[12px] border border-[#e6e5e0] bg-[#ffffff] p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#efeee8]">
                      <div className="flex items-center gap-2">
                        {isUpi ? (
                          <Smartphone className="size-4 text-[#f54e00]" />
                        ) : (
                          <Building2 className="size-4 text-[#807d72]" />
                        )}
                        <span className="font-semibold text-[13px] text-[#26251e] truncate">{acc.title}</span>
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#e6e5e0] text-[#5a5852]">
                        {acc.type}
                      </span>
                    </div>

                    <div className="space-y-1 font-mono text-[12px]">
                      <div className="text-[11px] font-sans text-[#807d72]">{acc.accountHolder}</div>
                      {isUpi ? (
                        <div className="text-[14px] font-bold text-[#f54e00]">{acc.upiId}</div>
                      ) : (
                        <div className="text-[#26251e]">
                          {acc.bankName} &middot; A/C {acc.accountNumber}
                          <div className="text-[#807d72] text-[11px]">IFSC: {acc.ifscCode}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: PROFILE & SETTINGS
            ------------------------------------------------------------- */}
        {currentTab === 'profile' && (
          <div className="max-w-xl mx-auto space-y-5">
            <div>
              <h1 className="font-display text-[26px] font-normal tracking-tight text-[#26251e]">
                Account &amp; Settlement Profile
              </h1>
              <p className="text-[13px] text-[#5a5852]">
                Your registered credentials and settlement bank account details.
              </p>
            </div>

            <div className="rounded-[12px] border border-[#e6e5e0] bg-[#ffffff] p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#efeee8]">
                <div>
                  <div className="font-semibold text-[16px] text-[#26251e]">{currentUser.name}</div>
                  <div className="font-mono text-[12px] text-[#807d72]">{currentUser.email}</div>
                </div>
                <span className="text-[11px] font-mono uppercase px-2.5 py-1 rounded-full bg-[#e6e5e0] text-[#26251e] font-semibold">
                  {currentUser.role}
                </span>
              </div>

              <div className="space-y-2 text-[12px]">
                {currentUser.businessName && (
                  <div className="p-3 rounded-[8px] border border-[#e6e5e0] bg-[#fafaf7] flex justify-between">
                    <span className="text-[#807d72]">Registered Business:</span>
                    <span className="font-medium text-[#26251e]">{currentUser.businessName}</span>
                  </div>
                )}
                {currentUser.phone && (
                  <div className="p-3 rounded-[8px] border border-[#e6e5e0] bg-[#fafaf7] flex justify-between">
                    <span className="text-[#807d72]">Contact Mobile:</span>
                    <span className="font-mono text-[#26251e]">{currentUser.phone}</span>
                  </div>
                )}
                {currentUser.defaultUpiId && (
                  <div className="p-3 rounded-[8px] border border-[#e6e5e0] bg-[#fafaf7] flex justify-between">
                    <span className="text-[#807d72]">Default Settlement UPI:</span>
                    <span className="font-mono font-semibold text-[#f54e00]">{currentUser.defaultUpiId}</span>
                  </div>
                )}
                {currentUser.bankDetails && (
                  <div className="p-3 rounded-[8px] border border-[#e6e5e0] bg-[#fafaf7] space-y-1">
                    <div className="text-[#807d72]">Settlement Bank Coordinates:</div>
                    <div className="font-mono text-[#26251e]">
                      {currentUser.bankDetails.bankName} &middot; A/C {currentUser.bankDetails.accountNumber}
                    </div>
                    <div className="font-mono text-[11px] text-[#807d72]">
                      IFSC: {currentUser.bankDetails.ifscCode}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Navigation Dock */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        role={currentUser.role}
        onOpenNewAction={() => {
          if (currentUser.role === 'admin') {
            setIsPlatformAccountsModalOpen(true);
          } else {
            setIsRaiseModalOpen(true);
          }
        }}
        pendingClearCount={stats?.totalPendingCount || 0}
        awaitingReviewCount={stats?.totalAwaitingReviewCount || 0}
      />

      {/* Modals */}
      <RaiseSettlementModal
        isOpen={isRaiseModalOpen}
        onClose={() => setIsRaiseModalOpen(false)}
        currentUser={currentUser}
        onSuccess={() => {
          reloadData();
          setCurrentTab('settlements');
        }}
      />

      <ClearSettlementModal
        isOpen={isClearModalOpen}
        settlement={selectedSettlementToClear}
        onClose={() => {
          setIsClearModalOpen(false);
          setSelectedSettlementToClear(null);
        }}
        currentUser={currentUser}
        onSuccess={() => reloadData()}
      />

      <ReviewProofModal
        isOpen={isReviewModalOpen}
        settlement={selectedSettlementToReview}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedSettlementToReview(null);
        }}
        currentUser={currentUser}
        onSuccess={() => reloadData()}
      />

      <MerchantManagementModal
        isOpen={isAddMerchantModalOpen}
        onClose={() => setIsAddMerchantModalOpen(false)}
        currentUser={currentUser}
        onSuccess={() => reloadData()}
      />

      <ResetPasswordModal
        isOpen={isResetPasswordModalOpen}
        targetUser={selectedUserToReset}
        onClose={() => {
          setIsResetPasswordModalOpen(false);
          setSelectedUserToReset(null);
        }}
        currentUser={currentUser}
        onSuccess={() => reloadData()}
      />

      <PlatformAccountsModal
        isOpen={isPlatformAccountsModalOpen}
        onClose={() => setIsPlatformAccountsModalOpen(false)}
        currentUser={currentUser}
        onSuccess={() => reloadData()}
      />
    </div>
  );
}
