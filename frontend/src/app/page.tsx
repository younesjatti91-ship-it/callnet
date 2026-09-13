'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  PhoneCall,
  Truck,
  MessageSquare,
  DollarSign,
  PackageCheck,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Layers,
  Radio,
  PlusCircle,
  TrendingUp,
  AlertCircle,
  RotateCcw,
  Users,
  Smartphone,
  Check,
} from 'lucide-react';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';

export default function FunnelPage() {
  const { t, language, setLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [store, setStore] = useState<{ id: string; name: string; currency: string }>({
    id: '',
    name: 'Atlas Commerce Live',
    currency: 'MAD',
  });

  // Funnel stats
  const [funnelStats, setFunnelStats] = useState({
    leadsReceived: 0,
    pendingVerification: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    returned: 0,
    cancelled: 0,
    totalCodPipeline: 0,
    deliveredCash: 0,
    confirmationRate: 0,
    deliverySuccessRate: 0,
  });

  // WAHA engine health
  const [wahaHealth, setWahaHealth] = useState({ isAlive: true, mode: 'mock', version: '2026.1' });

  // Simulation state
  const [isSimulatingLead, setIsSimulatingLead] = useState(false);
  const [simulationToast, setSimulationToast] = useState<string | null>(null);

  // Initialize store from session
  useEffect(() => {
    setMounted(true);
    const init = async () => {
      const current = api.getCurrentStore();
      if (current) {
        setStore(current);
      } else {
        try {
          const me = await api.getMe();
          if (me?.stores && me.stores.length > 0) {
            setStore(me.stores[0]);
            api.setCurrentStore(me.stores[0]);
          }
        } catch {}
      }
    };
    init();
  }, []);

  useEffect(() => {
    const loadLiveFunnelData = async () => {
      if (!store.id) return;
      try {
        // Fetch health
        const health = await api.getWhatsAppHealth();
        if (health?.data) setWahaHealth(health.data);

        // Fetch live metrics
        const metrics = await api.getMetrics(store.id);
        if (metrics) {
          setFunnelStats({
            leadsReceived: metrics.totalOrders ?? 0,
            pendingVerification: metrics.pendingVerification ?? 0,
            confirmed: metrics.confirmed ?? 0,
            shipped: metrics.shipped ?? 0,
            delivered: metrics.delivered ?? 0,
            returned: metrics.returned ?? 0,
            cancelled: metrics.cancelled ?? 0,
            totalCodPipeline: metrics.totalCodPipeline ?? 0,
            deliveredCash: metrics.totalCashDelivered ?? 0,
            confirmationRate: metrics.confirmationRate ?? 0,
            deliverySuccessRate: metrics.deliverySuccessRate ?? 0,
          });
        }
      } catch {
        // keep 0s for clean account
      }
    };

    if (store.id) {
      loadLiveFunnelData();
    }
  }, [store.id]);

  const handleSimulateInboundLead = async () => {
    setIsSimulatingLead(true);
    setSimulationToast(null);

    const randNum = Math.floor(1000 + Math.random() * 9000);
    const names = ['Khadija Mansour', 'Amine Tazi', 'Sara Benjelloun', 'Mehdi Alaoui', 'Houda Fassi'];
    const cities = ['Casablanca', 'Rabat', 'Marrakech', 'Tangier', 'Agadir'];
    const chosenName = names[Math.floor(Math.random() * names.length)];
    const chosenCity = cities[Math.floor(Math.random() * cities.length)];

    try {
      await api.createOrder(store.id, {
        customerName: chosenName,
        customerPhone: `+2126${Math.floor(10000000 + Math.random() * 90000000)}`,
        city: chosenCity,
        subtotal: 450,
        shippingFee: 35,
        codAmount: 485,
        currency: 'MAD',
        source: 'shopify',
        items: [
          {
            productName: 'Apex Hydro Cleanser Pro',
            quantity: 1,
            unitPrice: 450,
            totalPrice: 450,
          },
        ],
      });

      setSimulationToast(`✓ New lead ingested for ${chosenName} (${chosenCity})! Sent to Call Center queue.`);
      setFunnelStats((prev) => ({
        ...prev,
        leadsReceived: prev.leadsReceived + 1,
        pendingVerification: prev.pendingVerification + 1,
      }));
      setTimeout(() => setSimulationToast(null), 5000);
    } catch (err: any) {
      setSimulationToast(`✓ Simulated lead added to pending queue! (Mock Mode)`);
      setTimeout(() => setSimulationToast(null), 5000);
    } finally {
      setIsSimulatingLead(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 font-mono text-sm">
        Initializing COD Flow Operations Funnel...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/90 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Sparkles className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                COD<span className="text-emerald-400">Flow</span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-1 font-mono uppercase tracking-wider">
                Funnel Engine v2.4
              </span>
            </div>
          </div>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
            <Link href="/call-center" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
              Call Center ({funnelStats.pendingVerification})
            </Link>
            <Link href="/whatsapp" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
              WhatsApp Engine
            </Link>
            <Link href="/orders" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
              Orders
            </Link>
            <Link href="/couriers" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
              Couriers
            </Link>
            <Link href="/finance" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
              Commissions & Payouts
            </Link>
            <Link href="/admin" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
              Team & Staff
            </Link>
          </nav>

          {/* Right Actions: Lang Switcher & Login */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded ${language === 'en' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('fr')}
                className={`px-2 py-0.5 rounded ${language === 'fr' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
              >
                FR
              </button>
              <button
                onClick={() => setLanguage('ar')}
                className={`px-2 py-0.5 rounded ${language === 'ar' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
              >
                AR
              </button>
            </div>

            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white transition-all"
            >
              Sign In
            </Link>

            <Link
              href="/register"
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all"
            >
              Register Seller
            </Link>
          </div>
        </div>
      </header>

      {/* Main Funnel Body */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 w-full">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>WAHA Docker Integration Port 3008 • Multi-Session WhatsApp Active</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            COD Operations & Payout Funnel
          </h1>
          <p className="text-sm text-slate-400">
            End-to-end Cash-on-Delivery automation: Webhook intake → Agent verification → Multi-device WhatsApp → Carrier dispatch → Last-mile cash collection & Agent commission payout
          </p>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleSimulateInboundLead}
              disabled={isSimulatingLead}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isSimulatingLead ? 'Ingesting Lead...' : 'Simulate Inbound Lead'}</span>
            </button>

            <Link
              href="/call-center"
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 transition-all"
            >
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>Open Call Center Queue ({funnelStats.pendingVerification})</span>
            </Link>

            <Link
              href="/whatsapp"
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 transition-all"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Multi-Lines</span>
            </Link>

            <Link
              href="/finance"
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 transition-all"
            >
              <DollarSign className="w-4 h-4 text-teal-400" />
              <span>Agent Commissions</span>
            </Link>
          </div>

          {simulationToast && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-medium max-w-md mx-auto animate-fade-in">
              {simulationToast}
            </div>
          )}
        </div>

        {/* 5-Stage COD Conversion Funnel Pipeline Visualizer */}
        <div className="glass-panel p-6 rounded-3xl space-y-5 border border-slate-800 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Live 5-Stage COD Funnel Progression</span>
              </h2>
              <p className="text-xs text-slate-400">
                Track each order from lead generation to confirmed delivery and agent cash compensation
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-emerald-400 font-bold">
                Pipeline Value: {formatCurrency(funnelStats.totalCodPipeline, store.currency)}
              </span>
            </div>
          </div>

          {/* Funnel Waterfall Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Stage 1: Lead Intake */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-2 relative group">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-slate-300">Stage 1</span>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">Webhooks</span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Leads Ingested</h3>
                <p className="text-2xl font-extrabold text-white mt-1">{funnelStats.leadsReceived}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Shopify, YouCan & Manual</p>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-emerald-400 font-medium flex items-center justify-between">
                <span>Intake Flow</span>
                <span>100%</span>
              </div>
            </div>

            {/* Stage 2: Call Center Verification */}
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 hover:border-amber-500/50 transition-all space-y-2 relative group">
              <div className="flex items-center justify-between text-xs text-amber-400">
                <span className="font-bold">Stage 2</span>
                <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">Verification</span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Phone Confirmed</h3>
                <p className="text-2xl font-extrabold text-amber-300 mt-1">{funnelStats.confirmed}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{funnelStats.pendingVerification} leads in queue</p>
              </div>
              <div className="pt-2 border-t border-amber-500/20 text-[11px] text-amber-400 font-medium flex items-center justify-between">
                <span>Confirmation Rate</span>
                <span>{funnelStats.confirmationRate}%</span>
              </div>
            </div>

            {/* Stage 3: Multi-Session WhatsApp Engine */}
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 hover:border-emerald-500/50 transition-all space-y-2 relative group">
              <div className="flex items-center justify-between text-xs text-emerald-400">
                <span className="font-bold">Stage 3</span>
                <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">WAHA Eng</span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">WhatsApp Follow-Up</h3>
                <p className="text-2xl font-extrabold text-emerald-300 mt-1">Multi-Line</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Sellers & Agents contact</p>
              </div>
              <div className="pt-2 border-t border-emerald-500/20 text-[11px] text-emerald-400 font-medium flex items-center justify-between">
                <span>WAHA Live Mode</span>
                <span>Port 3008</span>
              </div>
            </div>

            {/* Stage 4: Logistics & Dispatch */}
            <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 hover:border-blue-500/50 transition-all space-y-2 relative group">
              <div className="flex items-center justify-between text-xs text-blue-400">
                <span className="font-bold">Stage 4</span>
                <span className="text-[10px] bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-500/30">Last-Mile</span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Shipped / In Transit</h3>
                <p className="text-2xl font-extrabold text-blue-300 mt-1">{funnelStats.shipped}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">J&T Express & DHL</p>
              </div>
              <div className="pt-2 border-t border-blue-500/20 text-[11px] text-blue-400 font-medium flex items-center justify-between">
                <span>Carrier Dispatch</span>
                <span>Active</span>
              </div>
            </div>

            {/* Stage 5: Delivery & Agent Commission Payout */}
            <div className="p-4 rounded-2xl bg-teal-950/20 border border-teal-500/40 hover:border-teal-500/60 transition-all space-y-2 relative group">
              <div className="flex items-center justify-between text-xs text-teal-300">
                <span className="font-bold">Stage 5</span>
                <span className="text-[10px] bg-teal-500/20 px-1.5 py-0.5 rounded border border-teal-500/30">Delivered</span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Cash & Commission</h3>
                <p className="text-2xl font-extrabold text-teal-300 mt-1">{funnelStats.delivered}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Agent payout unlocked</p>
              </div>
              <div className="pt-2 border-t border-teal-500/20 text-[11px] text-teal-300 font-medium flex items-center justify-between">
                <span>Delivery Rate</span>
                <span>{funnelStats.deliverySuccessRate}%</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Total COD Cash Delivered:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {formatCurrency(funnelStats.deliveredCash, store.currency)}
              </span>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Returns & Refusals:</span>
              <span className="font-mono font-bold text-rose-400 text-sm">
                {funnelStats.returned} ({((funnelStats.returned / (funnelStats.delivered + funnelStats.returned || 1)) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Agent Commission Rate:</span>
              <span className="font-mono font-bold text-teal-300 text-sm">
                5 {store.currency} (Confirm) + 15 {store.currency} (Deliver)
              </span>
            </div>
          </div>
        </div>

        {/* Feature Highlights & Modules Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Multi-Session WhatsApp for Sellers */}
          <div className="glass-panel p-6 rounded-3xl space-y-3 border border-slate-800 hover:border-emerald-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Multi-Session WhatsApp</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every seller can connect multiple WhatsApp phone lines (Support, Sales Line 1, Confirmation Agent). Managed by sellers, agents, managers, and superadmins to contact customers directly.
            </p>
            <div className="pt-2">
              <Link
                href="/whatsapp"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                <span>Manage WhatsApp Lines</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: Agent Commission & Payout System */}
          <div className="glass-panel p-6 rounded-3xl space-y-3 border border-slate-800 hover:border-teal-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-300 flex items-center justify-center border border-teal-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Agent Commission System</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Call center agents earn commission when confirming leads and upon successful delivery. Admins and SuperAdmins configure exact fee rates per confirmed and delivered order.
            </p>
            <div className="pt-2">
              <Link
                href="/finance"
                className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-semibold"
              >
                <span>View Commission Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 3: Multi-Carrier Logistics Tracking */}
          <div className="glass-panel p-6 rounded-3xl space-y-3 border border-slate-800 hover:border-blue-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Logistics & Dispatches</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated integration with J&T Express, DHL Express, and local couriers. Real-time normalized waybill snapshots and COD cash reconciliation.
            </p>
            <div className="pt-2">
              <Link
                href="/couriers"
                className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold"
              >
                <span>Manage Carrier Accounts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Instant Role Access Credentials Box */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Quick Role Credentials & Permissions Access</span>
              </h3>
              <p className="text-xs text-slate-400">
                Test the platform across all role scopes: SuperAdmin, Admin, Seller, and Verification Agent
              </p>
            </div>
            <Link
              href="/login"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              Go to Sign In →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-purple-400 uppercase tracking-wider text-[10px]">SuperAdmin</span>
              <p className="font-mono text-white">superadmin@codflow.io</p>
              <p className="text-slate-400 text-[11px]">Pass: <code className="text-slate-200">SuperAdminPass123!</code></p>
              <p className="text-[10px] text-slate-500 pt-1">Full platform control, global staff creation & all stores</p>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-blue-400 uppercase tracking-wider text-[10px]">Admin</span>
              <p className="font-mono text-white">admin@codflow.io</p>
              <p className="text-slate-400 text-[11px]">Pass: <code className="text-slate-200">AdminPass123!</code></p>
              <p className="text-[10px] text-slate-500 pt-1">Staff management, commission rate configuration</p>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">Seller (Merchant)</span>
              <p className="font-mono text-white">seller@codflow.io</p>
              <p className="text-slate-400 text-[11px]">Pass: <code className="text-slate-200">SellerPass123!</code></p>
              <p className="text-[10px] text-slate-500 pt-1">Owns store, multiple WhatsApp sessions, store orders</p>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">Call Center Agent</span>
              <p className="font-mono text-white">agent@codflow.io</p>
              <p className="text-slate-400 text-[11px]">Pass: <code className="text-slate-200">AgentPass123!</code></p>
              <p className="text-[10px] text-slate-500 pt-1">Verifies orders, contacts clients, earns commission</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-400">
        <p>COD Flow Platform • Multi-Tenant Cash-on-Delivery Operations System • WAHA Companion Ready</p>
      </footer>
    </div>
  );
}
