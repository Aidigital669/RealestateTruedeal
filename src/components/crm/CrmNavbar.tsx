'use client';

import React, { useState } from 'react';
import {
  Search,
  Calendar,
  MessageSquare,
  Bell,
  PlusCircle,
  Menu,
  Plus,
  UserPlus
} from 'lucide-react';

interface CrmNavbarProps {
  currentTab: string;
  activeNavTab: string;
  onNavTabChange: (tab: string) => void;
  onOpenAddAction: () => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onOpenMobileSidebar?: () => void;
}

export function CrmNavbar({
  currentTab,
  activeNavTab,
  onNavTabChange,
  onOpenAddAction,
  searchTerm,
  onSearchChange,
  onOpenMobileSidebar
}: CrmNavbarProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userInitials, setUserInitials] = useState('SE');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('anv_crm_initials');
      const storedName = localStorage.getItem('anv_crm_user');
      if (stored) {
        setUserInitials(stored);
      } else if (storedName) {
        setUserInitials(storedName.slice(0, 1).toUpperCase());
      }
    }
  }, []);

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'properties', label: 'Properties' },
    { id: 'reports', label: 'Reports' },
  ];

  // Specific Navbar for Calls
  if (currentTab === 'calls') {
    return (
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-20 px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-1.5 -ml-1 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition cursor-pointer shrink-0"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search Box */}
          <div className="relative flex-1 max-w-xs sm:max-w-md">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search calls, leads..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-8 sm:pr-12 py-1.5 bg-zinc-50/70 border border-zinc-200 rounded-lg text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-hidden focus:border-zinc-400 transition"
            />
            <kbd className="hidden sm:inline-block absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right Section: Date, Notifications, + Log Call */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-700 font-medium">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <span>Thursday, 24 Oct 2024</span>
          </div>

          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-1.5 text-zinc-600 hover:text-zinc-900 rounded-lg relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
          </button>

          <button
            onClick={onOpenAddAction}
            className="px-2.5 sm:px-3.5 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>+ Log Call</span>
          </button>
        </div>
      </header>
    );
  }

  // Specific Navbar for Employees
  if (currentTab === 'employees') {
    return (
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-20 px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-1.5 -ml-1 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition cursor-pointer shrink-0"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search Box */}
          <div className="relative flex-1 max-w-xs sm:max-w-md">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search personnel..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-8 sm:pr-12 py-1.5 bg-zinc-50/70 border border-zinc-200 rounded-lg text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-hidden focus:border-zinc-400 transition"
            />
            <kbd className="hidden sm:inline-block absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right Section: Date, Notifications, + Add Employee */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-700 font-medium">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <span>Thursday, 24 Oct 2024</span>
          </div>

          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-1.5 text-zinc-600 hover:text-zinc-900 rounded-lg relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
          </button>

          <button
            onClick={onOpenAddAction}
            className="px-2.5 sm:px-3.5 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-white" />
            <span>+ Add Employee</span>
          </button>
        </div>
      </header>
    );
  }

  // Specific Navbar for Customers
  if (currentTab === 'customers') {
    return (
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-20 px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-1.5 -ml-1 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition cursor-pointer shrink-0"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search Box */}
          <div className="relative flex-1 max-w-[160px] sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-2 sm:pr-10 py-1.5 bg-zinc-50/70 border border-zinc-200 rounded-lg text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-hidden focus:border-zinc-400 transition"
            />
          </div>

          {/* Customer Pipeline Status */}
          <div className="hidden lg:flex items-center gap-6 pl-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 font-medium">Customer Records:</span>
              <span className="font-bold text-zinc-950 text-sm">Active</span>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onOpenAddAction}
            className="px-2.5 sm:px-3.5 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-full text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">+ Add Customer</span>
            <span className="sm:hidden">+ Add</span>
          </button>

          <button className="hidden sm:flex p-1.5 text-zinc-600 hover:text-zinc-900 rounded-lg">
            <Calendar className="w-4 h-4" />
          </button>

          <button className="hidden sm:flex p-1.5 text-zinc-600 hover:text-zinc-900 rounded-lg relative">
            <MessageSquare className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
          </button>

          <button className="p-1.5 text-zinc-600 hover:text-zinc-900 rounded-lg relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
          </button>

          {/* Profile Initials */}
          <div className="flex items-center gap-2 sm:pl-2 border-l border-zinc-200">
            <div className="w-7 h-7 rounded-full bg-[#7a5424] text-white font-bold text-[11px] flex items-center justify-center select-none shadow-2xs">
              RS
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-bold text-zinc-900 leading-tight">Rajesh Sharma</p>
              <p className="text-[10px] text-zinc-400">Sr. Relationship Director</p>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Specific Navbar for Site Visits
  if (currentTab === 'site_visits') {
    return (
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-20 px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-1.5 -ml-1 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition cursor-pointer shrink-0"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search Box */}
          <div className="relative flex-1 max-w-[160px] sm:max-w-sm">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search visits, property..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-2 sm:pr-10 py-1.5 bg-zinc-50/70 border border-zinc-200 rounded-lg text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-hidden focus:border-zinc-400 transition"
            />
          </div>

          {/* Site Visits Metrics */}
          <div className="hidden lg:flex items-center gap-3 pl-2 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-[11px] font-semibold text-zinc-700">
              <span>Site Visits Pipeline</span>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onOpenAddAction}
            className="px-2.5 sm:px-3.5 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">+ Schedule Site Visit</span>
            <span className="sm:hidden">+ Visit</span>
          </button>

          <button className="hidden sm:flex p-1.5 text-zinc-600 hover:text-zinc-900 rounded-lg">
            <Calendar className="w-4 h-4" />
          </button>

          <button className="p-1.5 text-zinc-600 hover:text-zinc-900 rounded-lg relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
          </button>

          <div className="w-7 h-7 rounded-full bg-zinc-950 text-white font-bold text-[11px] flex items-center justify-center select-none shadow-2xs">
            PS
          </div>
        </div>
      </header>
    );
  }

  // Default Navbar (Leads / Dashboard)
  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-20 px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
      {/* Left Section: Mobile Menu, Brand title, Search Bar, Main Nav Links */}
      <div className="flex items-center gap-2 sm:gap-6 flex-1 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-1.5 -ml-1 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition cursor-pointer shrink-0"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="font-bold text-sm sm:text-base text-zinc-900 tracking-tight shrink-0 whitespace-nowrap">
          Anv Reealty CRM
        </div>

        <div className="relative flex-1 max-w-[140px] md:max-w-[200px] xl:max-w-xs">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-2 sm:pr-10 py-1.5 bg-zinc-50/60 border border-zinc-200 rounded-lg text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-hidden focus:border-zinc-400 focus:bg-white transition"
          />
          <kbd className="hidden sm:inline-block absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
            ⌘F
          </kbd>
        </div>

        <nav className="hidden xl:flex items-center gap-6 text-xs shrink-0">
          {navLinks.map((tab) => {
            const isActive = activeNavTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onNavTabChange(tab.id)}
                className={`py-1 transition font-medium cursor-pointer relative ${
                  isActive
                    ? 'text-zinc-950 font-bold border-b-2 border-zinc-950 pb-0.5'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={onOpenAddAction}
          className="px-2.5 sm:px-3.5 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-full text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5 text-white" />
          <span className="hidden sm:inline">+ New Action</span>
          <span className="sm:hidden">+ Action</span>
        </button>

        <button className="hidden sm:flex p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition cursor-pointer">
          <Calendar className="w-4 h-4" />
        </button>

        <div className="relative hidden sm:block">
          <button className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition relative cursor-pointer">
            <MessageSquare className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-zinc-100 border border-zinc-300 text-zinc-600 text-[9px] font-bold rounded-full flex items-center justify-center">
              0
            </span>
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-zinc-200 p-3 z-50 text-xs animate-in fade-in">
              <div className="font-bold text-zinc-900 pb-2 border-b border-zinc-100 flex items-center justify-between">
                <span>Alerts & Notifications</span>
                <span className="text-[10px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">0 New</span>
              </div>
              <div className="py-6 text-center text-zinc-400 text-xs">
                No new notifications
              </div>
            </div>
          )}
        </div>

        <div className="w-7 h-7 rounded-full bg-[#7a5424] text-white font-bold text-[11px] flex items-center justify-center select-none shadow-2xs">
          {userInitials}
        </div>
      </div>
    </header>
  );
}