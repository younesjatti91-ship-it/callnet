'use client';

import React, { useEffect, useState } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Send,
  Sparkles,
  AlertCircle,
  Copy,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { StatusBadge } from '../../components/StatusBadge';
import { api, Order } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function CallCenterPage() {
  const [store, setStore] = useState<any>({ id: '', name: 'Loading...', currency: 'MAD' });
  const [queue, setQueue] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isCalling, setIsCalling] = useState(false);
  const [callNotes, setCallNotes] = useState('');
  const [callLogs, setCallLogs] = useState<any[]>([]);

  // WhatsApp quick message state
  const [waMessage, setWaMessage] = useState('');
  const [waSentSuccess, setWaSentSuccess] = useState(false);

  // Initialize store dynamically from user session
  useEffect(() => {
    const initStore = async () => {
      const current = api.getCurrentStore();
      if (current && current.id) {
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
    initStore();
  }, []);

  const loadQueue = async () => {
    if (!store.id || store.id === 'default') return;
    try {
      const res = await api.getCallQueue(store.id);
      if (Array.isArray(res)) {
        setQueue(res);
        if (res.length > 0 && !selectedOrder) {
          selectOrder(res[0]);
        } else if (res.length === 0) {
          setSelectedOrder(null);
        }
      }
    } catch (err) {
      setQueue([]);
      setSelectedOrder(null);
    }
  };

  useEffect(() => {
    if (store.id) {
      loadQueue();
    }
  }, [store.id]);

  const selectOrder = async (order: Order) => {
    setSelectedOrder(order);
    setCallDuration(0);
    setIsCalling(false);
    setCallNotes('');
    setWaMessage(
      `Hello ${order.customerName}, this is Apex Support regarding your order #${order.orderNumber} for ${order.currency} ${order.codAmount}. Can you please confirm your delivery address?`
    );

    try {
      const logs = await api.getCallLogs(store.id, order.id);
      setCallLogs(logs || []);
    } catch {
      setCallLogs([]);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [store.id]);

  // Call timer simulation
  useEffect(() => {
    let timer: any;
    if (isCalling) {
      timer = setInterval(() => setCallDuration((d) => d + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isCalling]);

  const handleRecordCall = async (outcome: string) => {
    if (!selectedOrder) return;
    setIsCalling(false);

    try {
      await api.recordCall(store.id, {
        orderId: selectedOrder.id,
        outcome,
        durationSeconds: callDuration,
        notes: callNotes,
      });

      alert(`Call outcome recorded: ${outcome.replace(/_/g, ' ')}`);
      loadQueue();
    } catch (err: any) {
      alert(`Error saving call log: ${err.message}`);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!selectedOrder || !waMessage) return;
    try {
      await api.sendWhatsAppMessage(store.id, selectedOrder.customerPhone, waMessage, selectedOrder.id);
      setWaSentSuccess(true);
      setTimeout(() => setWaSentSuccess(false), 4000);
    } catch (err: any) {
      alert(`WhatsApp error: ${err.message}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar currentStore={store} onSelectStore={setStore} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          title="Call Center Agent Workspace"
          subtitle="Agent verification queue, 1-click dial recording, and automated WhatsApp triggers"
        />

        <main className="p-6 space-y-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Verification Queue */}
            <div className="glass-panel p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Verification Queue
                  </h3>
                  <p className="text-xs text-slate-400">{queue.length} Leads Waiting</p>
                </div>
                <button
                  onClick={loadQueue}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Refresh
                </button>
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-280px)]">
                {queue.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    <UserCheck className="h-8 w-8 mx-auto mb-2 text-emerald-500/60" />
                    <p className="font-semibold text-slate-300">All Calls Up to Date</p>
                    <p className="mt-1 text-slate-500">No orders currently pending verification for this store.</p>
                  </div>
                ) : (
                  queue.map((o) => (
                    <div
                      key={o.id}
                      onClick={() => selectOrder(o)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        selectedOrder?.id === o.id
                          ? 'bg-emerald-950/30 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-white text-xs">{o.orderNumber}</span>
                        <StatusBadge status={o.status} />
                      </div>
                      <p className="text-sm font-semibold text-slate-200 mt-1">{o.customerName}</p>
                      <p className="text-xs font-mono text-emerald-400 mt-0.5">{o.customerPhone}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                        <span>{o.city}</span>
                        <span className="text-amber-400 font-medium">{o.callAttemptsCount} attempts</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right 2 Columns: Active Call & Verification Action Pad */}
            <div className="lg:col-span-2 space-y-6">
              {selectedOrder ? (
                <>
                  {/* Dialing Panel */}
                  <div className="glass-panel p-6 rounded-2xl space-y-5 border-emerald-500/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                      <div>
                        <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                          Active Lead Dialing
                        </span>
                        <h2 className="text-xl font-bold text-white mt-1">
                          {selectedOrder.customerName}
                        </h2>
                        <div className="flex items-center gap-3 mt-1 text-xs">
                          <span className="font-mono text-emerald-400 text-sm font-bold">
                            {selectedOrder.customerPhone}
                          </span>
                          <button
                            onClick={() => navigator.clipboard.writeText(selectedOrder.customerPhone)}
                            title="Copy Phone"
                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-300">{selectedOrder.city}</span>
                        </div>
                      </div>

                      {/* Call Control Simulation */}
                      <div className="flex items-center gap-3">
                        {isCalling && (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-mono">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>
                              {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                        )}

                        {!isCalling ? (
                          <button
                            onClick={() => setIsCalling(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all"
                          >
                            <Phone className="w-4 h-4" />
                            <span>Simulate Dial</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setIsCalling(false)}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-500/20 transition-all"
                          >
                            <PhoneOff className="w-4 h-4" />
                            <span>Hang Up</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Order Details & Delivery Address */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                        <span className="text-slate-400 font-semibold uppercase tracking-wider">
                          Delivery Destination
                        </span>
                        <p className="text-white font-medium">{selectedOrder.shippingAddress || 'Address not filled'}</p>
                        <p className="text-slate-400">{selectedOrder.city}, {selectedOrder.province}</p>
                        {selectedOrder.notes && (
                          <p className="text-amber-400 pt-1 border-t border-slate-800 font-medium">
                            Note: {selectedOrder.notes}
                          </p>
                        )}
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                        <span className="text-slate-400 font-semibold uppercase tracking-wider">
                          COD Amount To Collect
                        </span>
                        <p className="text-2xl font-bold text-emerald-400">
                          {formatCurrency(selectedOrder.codAmount, store.currency)}
                        </p>
                        <p className="text-slate-400">
                          {selectedOrder.items?.[0]?.productName || 'Order Package'}
                        </p>
                      </div>
                    </div>

                    {/* Call Notes Input */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        Call Notes & Customer Feedback
                      </label>
                      <input
                        type="text"
                        value={callNotes}
                        onChange={(e) => setCallNotes(e.target.value)}
                        placeholder="e.g. Confirmed for Thursday morning, spouse will receive"
                        className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>

                    {/* Outcome Action Grid */}
                    <div className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Select Call Outcome & Update Order
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <button
                          onClick={() => handleRecordCall('confirmed')}
                          className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 transition-all font-semibold text-xs gap-1"
                        >
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span>Confirmed</span>
                        </button>

                        <button
                          onClick={() => handleRecordCall('no_answer')}
                          className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 transition-all font-semibold text-xs gap-1"
                        >
                          <PhoneOff className="w-5 h-5 text-amber-400" />
                          <span>No Answer</span>
                        </button>

                        <button
                          onClick={() => handleRecordCall('rescheduled')}
                          className="flex flex-col items-center justify-center p-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 transition-all font-semibold text-xs gap-1"
                        >
                          <Clock className="w-5 h-5 text-sky-400" />
                          <span>Reschedule</span>
                        </button>

                        <button
                          onClick={() => handleRecordCall('cancelled')}
                          className="flex flex-col items-center justify-center p-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 transition-all font-semibold text-xs gap-1"
                        >
                          <XCircle className="w-5 h-5 text-rose-400" />
                          <span>Cancelled</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Quick Follow-up Panel */}
                  <div className="glass-panel p-6 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                          WhatsApp Follow-Up (WAHA Engine)
                        </h3>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Auto-triggers if no answer is recorded
                      </span>
                    </div>

                    <div className="relative">
                      <textarea
                        rows={3}
                        value={waMessage}
                        onChange={(e) => setWaMessage(e.target.value)}
                        className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                      />
                      <button
                        onClick={handleSendWhatsApp}
                        className="absolute right-3 bottom-3 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-md"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send WhatsApp</span>
                      </button>
                    </div>

                    {waSentSuccess && (
                      <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>WhatsApp message dispatched successfully via WAHA!</span>
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="glass-panel p-16 rounded-2xl text-center border border-dashed border-slate-800">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-slate-500 mb-3 border border-slate-800">
                    <UserCheck className="h-7 w-7 text-emerald-500/50" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">Call Center Standby</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    No orders waiting for call verification. Newly ingested orders from your connected stores will appear in the queue automatically.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
