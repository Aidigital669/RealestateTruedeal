'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Building2,
  CalendarCheck,
  CheckSquare,
  UserCog,
  PhoneCall,
  BarChart3,
  Settings,
  Plus,
  MoreVertical,
  Globe,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
  UploadCloud
} from 'lucide-react';

interface CrmSidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenAddLead: () => void;
  onLogout: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  onOpenUploadBuyers?: () => void;
}

export function CrmSidebar({
  currentTab,
  onTabChange,
  onOpenAddLead,
  onLogout,
  mobileOpen = false,
  onMobileClose,
  onOpenUploadBuyers
}: CrmSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    name: 'Sales Executive',
    role: 'Sales Executive',
    initials: 'SE'
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('anv_crm_user');
      const storedInitials = localStorage.getItem('anv_crm_initials');
      const storedRole = localStorage.getItem('anv_crm_title') || localStorage.getItem('anv_crm_role');
      if (storedName) {
        setCurrentUser({
          name: storedName,
          role: storedRole || 'Sales Executive',
          initials: storedInitials || storedName.slice(0, 1).toUpperCase()
        });
      }
    }
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'leads', label: 'Leads', icon: Users, badge: null },
    { id: 'customers', label: 'Customers', icon: Briefcase, badge: null },
    { id: 'properties', label: 'Properties', icon: Building2, badge: 'Active', badgeColor: 'bg-emerald-100 text-emerald-700' },
    { id: 'site_visits', label: 'Site Visits', icon: CalendarCheck, badge: null },
    { id: 'calls', label: 'Calls', icon: PhoneCall, badge: null },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, badge: null },
  ];

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const handleActionClick = () => {
    onOpenAddLead();
    if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-zinc-200 flex flex-col select-none transition-transform duration-300 ease-in-out lg:static lg:h-screen lg:sticky lg:top-0 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Brand Header */}
        <div className={`p-4 border-b border-zinc-100 flex items-center justify-between relative`}>
          <Link
            href="/crm"
            onClick={() => { if (onMobileClose) onMobileClose(); }}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 shadow-xs overflow-hidden group-hover:scale-105 transition-transform">
              <Image
                src="/LogoAnv-original.png"
                alt="ANV REEALTY"
                width={40}
                height={40}
                className="w-full h-full object-contain scale-[1.15]"
              />
            </div>
            {(!isCollapsed || mobileOpen) && (
              <div>
                <div className="font-bold text-sm text-zinc-900 tracking-tight leading-tight">
                  Anv Reealty
                </div>
                <p className="text-[10px] text-zinc-400 font-medium">Enterprise Real Estate CRM</p>
              </div>
            )}
          </Link>

          {/* Close button for mobile screens */}
          <button
            type="button"
            onClick={onMobileClose}
            className="lg:hidden p-1.5 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition cursor-pointer"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Expand/Collapse Toggle Button (desktop only) */}
        <div className="hidden lg:block px-3 pt-3 pb-1">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer`}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 shrink-0" />
            ) : (
              <ChevronLeft className="w-4 h-4 shrink-0" />
            )}
            {!isCollapsed && <span>Collapse Sidebar</span>}
          </button>
        </div>

        {/* Primary Action Button: Schedule Site Visit */}
        <div className="px-3 pb-3 pt-2 lg:pt-1">
          <button
            onClick={handleActionClick}
            title="Schedule Site Visit"
            className={`w-full py-2.5 ${isCollapsed ? 'px-0 lg:justify-center' : 'px-3 justify-center gap-2'} bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-bold transition flex items-center shadow-xs cursor-pointer`}
          >
            <CalendarCheck className="w-4 h-4 text-white shrink-0" />
            {(!isCollapsed || mobileOpen) && <span>Schedule Site Visit</span>}
          </button>
          {onOpenUploadBuyers && (
            <button
              onClick={onOpenUploadBuyers}
              title="Upload Buyers via Excel"
              className={`w-full mt-2 py-2 ${isCollapsed ? 'px-0 lg:justify-center' : 'px-3 justify-center gap-2'} bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition flex items-center cursor-pointer`}
            >
              <UploadCloud className="w-4 h-4 shrink-0" />
              {(!isCollapsed || mobileOpen) && <span>Upload Buyers</span>}
            </button>
          )}
        </div>

        {/* Nav Menu */}
        <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${isCollapsed ? 'lg:justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-950 font-bold border-l-2 border-zinc-950'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? 'lg:justify-center' : 'gap-3'}`}>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-zinc-950' : 'text-zinc-500'}`} />
                  {(!isCollapsed || mobileOpen) && <span>{item.label}</span>}
                </div>
                {(!isCollapsed || mobileOpen) && item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md ${
                      isActive && (item.id === 'employees' || item.id === 'calls')
                        ? 'bg-amber-100 text-amber-900 border border-amber-200/80 font-bold'
                        : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Portal Cross-Navigation Bridges */}
        <div className={`p-3 border-t border-zinc-100 bg-zinc-50/50 space-y-1.5 ${isCollapsed ? 'lg:text-center' : ''}`}>
          {(!isCollapsed || mobileOpen) && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-zinc-500 uppercase tracking-wider text-[9px]">Active Portals</span>
            </div>
          )}
          <div className="grid grid-cols-1 gap-1.5">
            <Link
              href="/"
              target="_blank"
              onClick={() => { if (onMobileClose) onMobileClose(); }}
              title={isCollapsed ? 'View Public Website' : undefined}
              className={`flex items-center ${isCollapsed ? 'lg:justify-center' : 'gap-1 px-2.5'} py-2 bg-white border border-zinc-200 hover:border-zinc-300 rounded-lg text-[11px] font-semibold text-zinc-700 hover:text-zinc-950 shadow-2xs transition`}
            >
              <Globe className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              {(!isCollapsed || mobileOpen) && <span>View Public Website</span>}
              {(!isCollapsed || mobileOpen) && <ExternalLink className="w-3 h-3 text-zinc-400 shrink-0 ml-auto" />}
            </Link>
          </div>
        </div>

        {/* Bottom Profile Bar */}
        <div className="p-3 border-t border-zinc-100 bg-white">
          <div className={`flex items-center ${isCollapsed ? 'lg:justify-center' : 'justify-between'} p-2 rounded-xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-100/60 transition cursor-pointer relative group`}>
            <div className={`flex items-center ${isCollapsed ? 'lg:justify-center' : 'gap-2.5'} min-w-0 w-full`}>
              <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {currentUser.initials}
              </div>
              {(!isCollapsed || mobileOpen) && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-zinc-900 truncate">{currentUser.name}</p>
                  <div className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                    <span className="truncate">{currentUser.role}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-emerald-700 font-medium">Online</span>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('anv_crm_auth');
                  localStorage.removeItem('anv_crm_user');
                  localStorage.removeItem('anv_crm_email');
                  localStorage.removeItem('anv_crm_initials');
                  localStorage.removeItem('anv_crm_title');
                  localStorage.removeItem('anv_crm_role');
                  localStorage.removeItem('anv_crm_territory');
                }
                if (onMobileClose) {
                  onMobileClose();
                }
                onLogout();
              }}
              title="Account Options / Sign Out"
              className={`${isCollapsed ? 'hidden lg:group-hover:flex absolute right-0 top-0 h-full w-full bg-zinc-100/90 items-center justify-center rounded-xl backdrop-blur-xs' : 'text-zinc-400 hover:text-zinc-700 p-1'} cursor-pointer`}
            >
              {isCollapsed ? (
                <X className="w-4 h-4 text-rose-600" />
              ) : (
                <MoreVertical className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}