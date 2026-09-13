'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Store,
  Truck,
  ArrowRight,
  ShieldCheck,
  Lock,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';

export default function IntegrationsHubPage() {
  const [store, setStore] = useState({ id: 'apex-casablanca', name: 'Apex Casablanca Store', currency: 'MAD' });

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar currentStore={store} onSelectStore={setStore} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          title="Integrations Hub"
          subtitle="Choose between Storefronts & Sales Channels or Shipping Companies & Couriers"
        />

        <main className="p-6 space-y-6 max-w-5xl">
          {/* Hardware encryption banner */}
          <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border-emerald-500/30 bg-emerald-950/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  AES-256-GCM Secure Multi-Channel Hub
                </p>
                <p className="text-[11px] text-slate-400">
                  Connect external sales channels and logistics carriers with automatic multi-vocabulary translation and end-to-end data isolation.
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Multi-Tenant Guard</span>
            </span>
          </div>

          {/* 2 Primary Hub Cards: Stores & Shipping */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* 1. Stores Integration Card */}
            <Link
              href="/integrations/stores"
              className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/40 transition-all space-y-5 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                    <Store className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    10 Stores
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Stores & Sales Channels
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Connect Google Sheets (with Gemini AI Smart Column Matcher), Shopify, YouCan, Storeep, WooCommerce, Lightfunnels, Storeino, EasyOrders, Magento, or Simple API.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs font-semibold text-emerald-400">
                <span>Configure Store Integrations</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* 2. Shipping Companies Integration Card */}
            <Link
              href="/integrations/shipping"
              className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/40 transition-all space-y-5 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                    <Truck className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    10 Couriers
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                    Shipping Companies & Couriers
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Configure IRSALIYAT, ONESSTA, FORCELOG, AMEEX, CATHEDIS, CHRONO DIALI, SENDIT, OZON EXPRESS, DIGYLOG, and KARGO EXPRESS with unified status normalization.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs font-semibold text-blue-400">
                <span>Configure Shipping Companies</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
