'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  LayoutTemplate,
  FileText,
  Navigation,
  Image as ImageIcon,
  Quote,
  HelpCircle,
  Building,
  Building2,
  MapPin,
  Layers,
  Sparkles,
  BookOpen,
  Tags,
  FolderArchive,
  Inbox,
  ExternalLink,
  MoreVertical,
  CheckCircle2,
  X,
  User,
  ShieldCheck,
  LogOut,
  Settings,
  Globe,
  History,
  Phone,
  Crown
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hasDot?: boolean;
  badge?: string;
  badgeVariant?: 'default' | 'peach';
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

interface SidebarProps {
  currentTab?: string;
  onTabChange?: (tab: string) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  counts?: {
    properties?: number;
    enquiries?: number;
  };
}

export function Sidebar({
  currentTab = 'dashboard',
  onTabChange,
  mobileOpen = false,
  onMobileClose,
  counts
}: SidebarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems: NavGroup[] = [
    {
      group: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      group: 'WEBSITE',
      items: [
        { id: 'homepage-editor', label: 'Homepage Editor', icon: LayoutTemplate, hasDot: true },
        { id: 'premium-ads', label: 'Premium & Client Ads', icon: Crown, hasDot: true, badge: 'Crown', badgeVariant: 'peach' },
        { id: 'pages', label: 'Pages', icon: FileText },
        { id: 'navigation', label: 'Navigation', icon: Navigation },
        { id: 'banners', label: 'Banners', icon: ImageIcon },
        { id: 'testimonials', label: 'Testimonials', icon: Quote },
        { id: 'faqs', label: 'FAQs', icon: HelpCircle }
      ]
    },
    {
      group: 'PROPERTIES',
      items: [
        { id: 'properties', label: 'Properties', icon: Building, badge: counts?.properties !== undefined ? String(counts.properties) : undefined },
        { id: 'scraper', label: 'AI Scraper & Importer', icon: Globe, hasDot: true, badge: 'AI', badgeVariant: 'peach' },
        { id: 'projects', label: 'Projects', icon: Building2 },
        { id: 'locations', label: 'Locations', icon: MapPin },
        { id: 'property-types', label: 'Property Types', icon: Layers },
        { id: 'amenities', label: 'Amenities', icon: Sparkles }
      ]
    },
    {
      group: 'BLOG & EDITORIAL',
      items: [
        { id: 'blog-posts', label: 'Blog Posts', icon: BookOpen },
        { id: 'categories-tags', label: 'Categories & Tags', icon: Tags }
      ]
    },
    {
      group: 'MEDIA & DATA',
      items: [
        { id: 'media-library', label: 'Media Library', icon: FolderArchive },
        { id: 'enquiries', label: 'Enquiries & Leads', icon: Inbox, badge: counts?.enquiries !== undefined ? String(counts.enquiries) : undefined, badgeVariant: 'peach' },
        { id: 'search-history', label: 'Search History', icon: History }
      ]
    },
    {
      group: 'CRM',
      items: [
        { id: 'crm-dashboard', label: 'CRM Dashboard', icon: LayoutDashboard },
        { id: 'crm-leads', label: 'Leads Pipeline', icon: User },
        { id: 'crm-customers', label: 'Customers', icon: User },
        { id: 'crm-site-visits', label: 'Site Visits', icon: MapPin },
        { id: 'crm-employees', label: 'Employees', icon: User },
        { id: 'crm-calls', label: 'Calls', icon: Phone },
        { id: 'properties', label: 'Properties', icon: Building }
      ]
    }
  ];

  const handleSelect = (id: string) => {
    if (onTabChange) {
      onTabChange(id);
    }
    if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-zinc-200/90 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-18 px-5 border-b border-zinc-100 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center p-1 border border-zinc-800 shadow-xs shrink-0">
              <Image
                src="/LogoAnv-original.png"
                alt="ANV REEALTY"
                width={36}
                height={36}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-zinc-900 text-[14px] tracking-tight">
                  Anv Reealty
                </span>
                {/* Verified Gold Badge */}
                <div className="w-3.5 h-3.5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[9px] font-bold">
                  ✓
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 font-medium tracking-tight">
                Website Admin Panel & CMS
              </p>
            </div>
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 text-zinc-400 hover:text-zinc-700 rounded-md"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-5 scrollbar-thin scrollbar-thumb-zinc-200">
          {navItems.map((group) => (
            <div key={group.group}>
              <h3 className="px-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                {group.group}
              </h3>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;

                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleSelect(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all group ${
                          isActive
                            ? 'bg-zinc-100/90 text-zinc-950 font-semibold shadow-2xs'
                            : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`w-4 h-4 transition-colors ${
                              isActive
                                ? 'text-zinc-950'
                                : 'text-zinc-400 group-hover:text-zinc-700'
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {item.hasDot && (
                            <span className="w-2 h-2 rounded-full bg-amber-600 ring-2 ring-amber-100" />
                          )}
                          {item.badge && (
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                item.badgeVariant === 'peach'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-zinc-100 text-zinc-600 group-hover:bg-zinc-200'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3.5 border-t border-zinc-100 space-y-3 bg-zinc-50/30">
          {/* Portal Status Card */}
          <div className="border border-zinc-200/90 bg-white p-3 rounded-xl shadow-2xs">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Portal Status
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-zinc-800">
                Public Website Live
              </span>
              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center gap-1 border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-[11px] font-medium px-2 py-0.5 rounded shadow-2xs transition"
              >
                <span>Preview</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </Link>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100">
              <span className="text-[12px] font-semibold text-zinc-800 flex items-center gap-1">
                <span>Enterprise CRM</span>
                <span className="px-1 py-0.2 bg-amber-100 text-amber-900 text-[9px] font-bold rounded">Integrated</span>
              </span>
              <button
                onClick={() => handleSelect('crm-dashboard')}
                className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 border border-amber-300/80 text-amber-950 text-[11px] font-bold px-2 py-0.5 rounded shadow-2xs transition"
              >
                <span>View CRM</span>
                <ExternalLink className="w-3 h-3 text-amber-700" />
              </button>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="relative">
            <div className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-100/70 transition cursor-pointer">
              <div
                className="flex items-center gap-2.5 flex-1 min-w-0"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-800 to-amber-700 text-white font-semibold text-xs flex items-center justify-center ring-2 ring-white shadow-2xs overflow-hidden shrink-0">
                  <span>RS</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-zinc-900 truncate">
                    Rajesh Sharma
                  </p>
                  <p className="text-[11px] text-zinc-500 truncate">
                    Super Admin
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md"
                aria-label="User Menu"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* User Dropdown */}
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-zinc-200 rounded-xl shadow-lg p-1.5 z-50 text-[12px] animate-in fade-in slide-in-from-bottom-2">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    alert('Profile Settings: Rajesh Sharma (Super Admin)');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-700 hover:bg-zinc-100 transition"
                >
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Admin Profile</span>
                </button>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    alert('System Privileges: Full Super Admin Access Granted');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-700 hover:bg-zinc-100 transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Role & Permissions</span>
                </button>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    alert('CMS Preferences & Cache Settings');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-700 hover:bg-zinc-100 transition"
                >
                  <Settings className="w-3.5 h-3.5 text-zinc-400" />
                  <span>CMS Settings</span>
                </button>
                <div className="border-t border-zinc-100 my-1"></div>
                <button
                  onClick={() => {
                    localStorage.removeItem('anv_admin_logged_in');
                    document.cookie = 'anv_admin_auth=; path=/; max-age=0';
                    window.location.href = '/admin/login';
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Admin Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
