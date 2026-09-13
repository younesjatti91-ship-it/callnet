'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  PhoneCall,
  Truck,
  MessageSquare,
  DollarSign,
  Layers,
  ShieldCheck,
  Store as StoreIcon,
  ChevronDown,
  ChevronRight,
  LogOut,
  Sparkles,
  Store,
  Package,
  Settings,
  Boxes,
  Users,
  X,
  Navigation,
  MessagesSquare,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../lib/api';

interface SidebarProps {
  currentStore?: { id: string; name: string; currency: string };
  stores?: Array<{ id: string; name: string; currency: string }>;
  onSelectStore?: (store: { id: string; name: string; currency: string }) => void;
  user?: { name: string; email: string; role: string; avatarUrl?: string };
  activeStore?: any;
  onStoreChange?: (store: any) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentStore: explicitPropStore,
  stores: propStores,
  onSelectStore: explicitOnSelectStore,
  user: initialUser,
  activeStore: incomingActiveStore,
  onStoreChange,
}) => {
  const propStore = explicitPropStore || incomingActiveStore;
  const onSelectStore = explicitOnSelectStore || onStoreChange;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStatusParam = searchParams?.get('status') || '';
  const { t } = useLanguage();

  const [storeOpen, setStoreOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(true);
  const [integrationsOpen, setIntegrationsOpen] = useState(
    pathname?.startsWith('/integrations')
  );

  const [activeStore, setActiveStore] = useState<{ id: string; name: string; currency: string }>(
    propStore && propStore.id !== 'default'
      ? propStore
      : { id: '', name: 'Store', currency: 'MAD' }
  );

  const [availableStores, setAvailableStores] = useState<Array<{ id: string; name: string; currency: string }>>(
    propStores && propStores[0]?.id !== 'default' ? propStores : []
  );

  const [currentUser, setCurrentUser] = useState<any>(
    initialUser || { name: 'User', email: 'user@codflow.io', role: 'Seller' }
  );

  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pending_verification: 0,
    confirmed: 0,
    fulfillment: 0,
    shipped: 0,
    delivered: 0,
    returned: 0,
    cancelled: 0,
  });

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setMobileDrawerOpen((prev) => !prev);
    window.addEventListener('toggle-mobile-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-mobile-sidebar', handleToggle);
  }, []);

  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  // Fetch current user and stores if token exists
  useEffect(() => {
    const fetchUserAndStores = async () => {
      // 1. Session store
      const sessionStore = api.getCurrentStore();
      const sessionStores = api.getSavedStores();
      if (sessionStore) setActiveStore(sessionStore);
      if (sessionStores?.length) setAvailableStores(sessionStores);

      // 2. Fetch me
      try {
        const me = await api.getMe();
        if (me?.user) {
          setCurrentUser(me.user);
        }
        if (me?.stores && me.stores.length > 0) {
          setAvailableStores(me.stores);
          if (!sessionStore || !me.stores.some((s: any) => s.id === sessionStore.id)) {
            setActiveStore(me.stores[0]);
            api.setCurrentStore(me.stores[0]);
          }
        }
      } catch {
        // use session
      }
    };
    fetchUserAndStores();
  }, []);

  // Update activeStore if prop changes
  useEffect(() => {
    if (propStore && propStore.id !== 'default' && propStore.id !== activeStore.id) {
      setActiveStore(propStore);
    }
  }, [propStore?.id]);

  // Fetch status counts for current store
  useEffect(() => {
    const fetchCounts = async () => {
      if (!activeStore?.id) return;
      try {
        const metrics = await api.getMetrics(activeStore.id);
        if (metrics) {
          setStatusCounts({
            all: metrics.totalOrders ?? 0,
            pending_verification: metrics.pendingVerification ?? 0,
            confirmed: metrics.confirmed ?? 0,
            fulfillment: 0,
            shipped: metrics.shipped ?? 0,
            delivered: metrics.delivered ?? 0,
            returned: metrics.returned ?? 0,
            cancelled: metrics.cancelled ?? 0,
          });
        }
      } catch {
        // Keep 0s for clean testing accounts
      }
    };
    fetchCounts();
  }, [activeStore?.id]);

  const isSuperAdmin =
    currentUser.role === 'SuperAdmin' ||
    currentUser.role?.toLowerCase() === 'superadmin';

  const isAdmin =
    isSuperAdmin ||
    currentUser.role === 'Admin' ||
    currentUser.role?.toLowerCase() === 'admin';

  const isSeller =
    currentUser.role === 'Seller' ||
    currentUser.role?.toLowerCase() === 'seller';

  const orderStatuses = [
    { key: 'ALL', label: t('allOrders'), count: statusCounts.all, color: 'text-slate-300 bg-slate-800' },
    { key: 'pending_verification', label: t('statusPending'), count: statusCounts.pending_verification, color: 'text-amber-300 bg-amber-500/20 border-amber-500/40' },
    { key: 'confirmed', label: t('statusConfirmed'), count: statusCounts.confirmed, color: 'text-blue-300 bg-blue-500/20 border-blue-500/40' },
    { key: 'fulfillment', label: t('statusFulfillment'), count: statusCounts.fulfillment, color: 'text-indigo-300 bg-indigo-500/20 border-indigo-500/40' },
    { key: 'shipped', label: t('statusShipped'), count: statusCounts.shipped, color: 'text-purple-300 bg-purple-500/20 border-purple-500/40' },
    { key: 'delivered', label: t('statusDelivered'), count: statusCounts.delivered, color: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40' },
    { key: 'returned', label: t('statusReturned'), count: statusCounts.returned, color: 'text-rose-300 bg-rose-500/20 border-rose-500/40' },
    { key: 'cancelled', label: t('statusCancelled'), count: statusCounts.cancelled, color: 'text-slate-400 bg-slate-800 border-slate-700' },
  ];

  const renderSidebarContent = (isMobile = false) => (
    <>
      {/* Brand logo */}
      <div className="p-4 border-b border-slate-800/90 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/25 text-slate-950 font-extrabold">
            <Sparkles className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              COD Flow
              <span className="text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded-md">
                v1.0
              </span>
            </span>
            <p className="text-[11px] text-slate-400 font-medium">COD Operations OS</p>
          </div>
        </div>
        {isMobile && (
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(false)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Store Switcher */}
      <div className="p-3 border-b border-slate-800/80 relative">
        <button
          onClick={() => setStoreOpen(!storeOpen)}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 transition-all text-left group"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-600/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <StoreIcon className="w-4 h-4" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-100 truncate">{activeStore.name}</p>
              <p className="text-[11px] text-emerald-400/90 font-medium">{activeStore.currency} Store</p>
            </div>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", storeOpen && "rotate-180")} />
        </button>

        {storeOpen && (
          <div className="absolute top-full left-3 right-3 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-50">
            {availableStores.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setActiveStore(s);
                  api.setCurrentStore(s);
                  onSelectStore?.(s);
                  setStoreOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between",
                  s.id === activeStore.id ? "bg-emerald-500/20 text-emerald-300 font-bold" : "text-slate-300 hover:bg-slate-800"
                )}
              >
                <span>{s.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">{s.currency}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
        <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {t('operations')}
        </p>

        {/* 1. Dashboard */}
        <Link
          href="/dashboard"
          className={cn(
            'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group',
            (pathname === '/' || pathname === '/dashboard')
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
          )}
        >
          <div className="flex items-center gap-2.5">
            <LayoutDashboard className={cn('w-4 h-4', (pathname === '/' || pathname === '/dashboard') ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-300')} />
            <span>{t('dashboard')}</span>
          </div>
        </Link>

        {/* 2. Orders Center with Expandable Status Submenu */}
        <div className="pt-0.5">
          <div
            className={cn(
              'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all group',
              pathname?.startsWith('/orders')
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
            )}
            onClick={() => setOrdersOpen(!ordersOpen)}
          >
            <Link href="/orders" className="flex items-center gap-2.5 flex-1">
              <ShoppingBag className={cn('w-4 h-4', pathname?.startsWith('/orders') ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-300')} />
              <span>{t('orders')}</span>
            </Link>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOrdersOpen(!ordersOpen);
              }}
              className="p-1 text-slate-400 hover:text-slate-200"
            >
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', ordersOpen ? 'rotate-180' : '')} />
            </button>
          </div>

          {/* Orders Status Submenu */}
          {ordersOpen && (
            <div className="mt-1 ml-3 pl-3 border-l border-slate-800 space-y-0.5 py-1">
              {orderStatuses.map((st) => {
                const isSelected =
                  pathname === '/orders' &&
                  ((st.key === 'ALL' && (!currentStatusParam || currentStatusParam === 'ALL')) ||
                    currentStatusParam === st.key);
                const href = st.key === 'ALL' ? '/orders' : `/orders?status=${st.key}`;

                return (
                  <Link
                    key={st.key}
                    href={href}
                    className={cn(
                      'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors group',
                      isSelected
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    )}
                  >
                    <span className="truncate">{st.label}</span>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-transparent transition-all',
                        st.color
                      )}
                    >
                      {st.count}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Call Center */}
        <Link
          href="/call-center"
          className={cn(
            'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group',
            pathname === '/call-center'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
          )}
        >
          <div className="flex items-center gap-2.5">
            <PhoneCall className={cn('w-4 h-4', pathname === '/call-center' ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-300')} />
            <span>{t('callCenter')}</span>
          </div>
          <span className="text-[10px] font-bold bg-emerald-500/25 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/40">
            Live
          </span>
        </Link>

        {/* 4. Couriers Logistics */}
        <Link
          href="/couriers"
          className={cn(
            'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group',
            pathname === '/couriers'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
          )}
        >
          <div className="flex items-center gap-2.5">
            <Truck className={cn('w-4 h-4', pathname === '/couriers' ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-300')} />
            <span>{t('couriers')}</span>
          </div>
        </Link>

        {/* Live Tracking Page */}
        <Link
          href="/tracking"
          className={cn(
            'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group',
            pathname === '/tracking'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
          )}
        >
          <div className="flex items-center gap-2.5">
            <Navigation className={cn('w-4 h-4', pathname === '/tracking' ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-300')} />
            <span>Live Tracking</span>
          </div>
          <span className="text-[10px] font-bold bg-blue-500/25 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/40">
            GPS
          </span>
        </Link>

        {/* 5. WhatsApp (WAHA) */}
        <Link
          href="/whatsapp"
          className={cn(
            'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group',
            pathname === '/whatsapp'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
          )}
        >
          <div className="flex items-center gap-2.5">
            <MessageSquare className={cn('w-4 h-4', pathname === '/whatsapp' ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-300')} />
            <span>{t('whatsapp')}</span>
          </div>
          <span className="text-[10px] font-bold bg-emerald-500/25 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/40">
            Active
          </span>
        </Link>

        {/* Team Chat / Internal Messages */}
        <Link
          href="/messages"
          className={cn(
            'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group',
            pathname === '/messages'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
          )}
        >
          <div className="flex items-center gap-2.5">
            <MessagesSquare className={cn('w-4 h-4', pathname === '/messages' ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-300')} />
            <span>Team Chat</span>
          </div>
          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
            Internal
          </span>
        </Link>

        {/* 6. Stores Management Portal */}
        <Link
          href="/stores"
          className={cn(
            'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group',
            pathname === '/stores'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
          )}
        >
          <div className="flex items-center gap-2.5">
            <StoreIcon className={cn('w-4 h-4', pathname === '/stores' ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-300')} />
            <span>Stores</span>
          </div>
          <span className="text-[10px] font-medium text-slate-400">
            {availableStores.length}
          </span>
        </Link>

        {/* 7. Products Catalog & Articles */}
        <Link
          href="/products"
          className={cn(
            'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group',
            pathname === '/products'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
          )}
        >
          <div className="flex items-center gap-2.5">
            <Package className={cn('w-4 h-4', pathname === '/products' ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-300')} />
            <span>Products</span>
          </div>
          <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
            Articles
          </span>
        </Link>

        {/* 8. Finance & Remittance (STRICT RBAC: Only SuperAdmin can see this link!) */}
        {isSuperAdmin && (
          <Link
            href="/finance"
            className={cn(
              'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group',
              pathname === '/finance'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
            )}
          >
            <div className="flex items-center gap-2.5">
              <DollarSign className={cn('w-4 h-4', pathname === '/finance' ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-300')} />
              <span>{t('finance')}</span>
            </div>
            <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded">
              SuperAdmin
            </span>
          </Link>
        )}

        {/* User Accounts & Role Management (STRICT RBAC: SuperAdmin & Admin only) */}
        {isAdmin && (
          <Link
            href="/admin/users"
            className={cn(
              'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group',
              pathname === '/admin/users'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
            )}
          >
            <div className="flex items-center gap-2.5">
              <Users className={cn('w-4 h-4', pathname === '/admin/users' ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-300')} />
              <span>User Accounts</span>
            </div>
            <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1 py-0.2 rounded">
              Roles
            </span>
          </Link>
        )}

        {/* 9. Integrations Menu (STRICT RBAC: Only Sellers have access to integrations!) */}
        {isSeller && (
          <div className="pt-0.5">
            <div
              className={cn(
                'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all group',
                pathname?.startsWith('/integrations')
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
              )}
              onClick={() => setIntegrationsOpen(!integrationsOpen)}
            >
              <div className="flex items-center gap-2.5 flex-1">
                <Layers className={cn('w-4 h-4', pathname?.startsWith('/integrations') ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-300')} />
                <span>{t('integrations')}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIntegrationsOpen(!integrationsOpen);
                }}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', integrationsOpen ? 'rotate-180' : '')} />
              </button>
            </div>

            {/* Submenus for Integrations */}
            {integrationsOpen && (
              <div className="mt-1 ml-3 pl-3 border-l border-slate-800 space-y-0.5 py-1">
                <Link
                  href="/integrations/stores"
                  className={cn(
                    'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors',
                    pathname === '/integrations/stores' || pathname === '/integrations'
                      ? 'bg-slate-800 text-emerald-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  )}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>{t('storesIntegration')}</span>
                </Link>
                <Link
                  href="/integrations/shipping"
                  className={cn(
                    'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors',
                    pathname === '/integrations/shipping'
                      ? 'bg-slate-800 text-emerald-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  )}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>{t('shippingIntegration')}</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* 10. Admin & Audits (STRICT RBAC: Only SuperAdmin and Admin can see this link!) */}
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group',
              pathname === '/admin'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
            )}
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className={cn('w-4 h-4', pathname === '/admin' ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-300')} />
              <span>{t('admin')}</span>
            </div>
            <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded">
              RBAC
            </span>
          </Link>
        )}
      </nav>

      {/* User profile footer - Clickable to /profile */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <Link
            href="/profile"
            className="flex items-center gap-2.5 overflow-hidden flex-1 group hover:opacity-95 transition-all cursor-pointer"
            title="Manage Profile & Settings"
          >
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover border border-emerald-500/40 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-900/80 text-emerald-300 font-bold text-xs flex items-center justify-center border border-emerald-500/40 shrink-0">
                {currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'US'}
              </div>
            )}
            <div className="truncate">
              <p className="text-xs font-bold text-slate-100 truncate group-hover:text-emerald-300 transition-colors">
                {currentUser.name}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 capitalize">{currentUser.role}</span>
                {isAdmin && (
                  <span className="text-[9px] px-1 py-0.2 bg-emerald-500/20 text-emerald-400 rounded font-semibold">
                    Admin
                  </span>
                )}
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-0.5">
            <Link
              href="/profile"
              title="Profile Settings"
              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-700/60 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </Link>
            <button
              title={t('logout')}
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('codflow_token');
                  window.location.href = '/login';
                }
              }}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-slate-800 bg-slate-900/95 backdrop-blur-2xl flex-col shrink-0 h-screen sticky top-0 z-30 shadow-2xl">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile / Tablet Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] border-r border-slate-800 bg-slate-900 flex flex-col h-full z-10 shadow-2xl">
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}

      {/* Mobile / Tablet Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-3 py-1.5 flex items-center justify-around shadow-2xl">
        <Link
          href="/dashboard"
          className={cn(
            "flex flex-col items-center gap-0.5 p-1 text-[10px] font-medium transition-colors",
            pathname === '/dashboard' || pathname === '/' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          )}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>
        <Link
          href="/orders"
          className={cn(
            "flex flex-col items-center gap-0.5 p-1 text-[10px] font-medium transition-colors",
            pathname?.startsWith('/orders') ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          )}
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Orders</span>
        </Link>
        <Link
          href="/whatsapp"
          className={cn(
            "flex flex-col items-center gap-0.5 p-1 text-[10px] font-medium transition-colors",
            pathname === '/whatsapp' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          )}
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />
          </div>
          <span>WAHA</span>
        </Link>
        <Link
          href="/stores"
          className={cn(
            "flex flex-col items-center gap-0.5 p-1 text-[10px] font-medium transition-colors",
            pathname === '/stores' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          )}
        >
          <StoreIcon className="w-5 h-5" />
          <span>Stores</span>
        </Link>
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="flex flex-col items-center gap-0.5 p-1 text-[10px] font-medium text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <Boxes className="w-5 h-5" />
          <span>Menu</span>
        </button>
      </div>
    </>
  );
};
