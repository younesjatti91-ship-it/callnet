'use client';

import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ShieldAlert,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { StatusBadge } from '../../components/StatusBadge';
import { api } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function FinancePage() {
  const [store, setStore] = useState<any>({ id: '', name: 'Loading...', currency: 'MAD' });
  const [files, setFiles] = useState<any[]>([]);
  const [discrepancies, setDiscrepancies] = useState<any[]>([]);

  // Upload simulation state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [remittanceText, setRemittanceText] = useState(
    `trackingNumber,remittedAmount,carrierStatus,notes\nJT99281730MA,720,DELIVERED,Batch Sep-01\nJT99281726MA,280,DELIVERED,Batch Sep-01\nORD-GHOST-888,350,DELIVERED,Unknown waybill`
  );

  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<any>(null);
  const [resolutionStatus, setResolutionStatus] = useState('resolved');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Agent commissions state
  const [confirmRate, setConfirmRate] = useState<number>(5);
  const [deliverRate, setDeliverRate] = useState<number>(15);
  const [isSavingRates, setIsSavingRates] = useState(false);
  const [rateSaveSuccess, setRateSaveSuccess] = useState(false);
  const [agentCommissions, setAgentCommissions] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>('Loading');

  // Initialize store dynamically from user session
  useEffect(() => {
    const initStore = async () => {
      try {
        const me = await api.getMe();
        if (me?.user) {
          setUserRole(me.user.role || 'Seller');
        }
        const current = api.getCurrentStore();
        if (current && current.id) {
          setStore(current);
        } else if (me?.stores && me.stores.length > 0) {
          setStore(me.stores[0]);
          api.setCurrentStore(me.stores[0]);
        }
      } catch {
        setUserRole('Unauthorized');
      }
    };
    initStore();
  }, []);

  const loadFinanceData = async () => {
    if (!store.id || store.id === 'default') return;
    try {
      const liveFiles = await api.getRemittanceFiles(store.id);
      setFiles(Array.isArray(liveFiles) ? liveFiles : []);

      const liveDiscs = await api.getDiscrepancies(store.id);
      setDiscrepancies(Array.isArray(liveDiscs) ? liveDiscs : []);

      const comms = await api.getAgentCommissions(store.id);
      if (comms?.data) {
        if (comms.data.commissionRates) {
          setConfirmRate(comms.data.commissionRates.agentCommissionPerConfirmedOrder ?? 5);
          setDeliverRate(comms.data.commissionRates.agentCommissionPerDeliveredOrder ?? 15);
        }
        setAgentCommissions(Array.isArray(comms.data.agents) ? comms.data.agents : []);
      } else {
        setAgentCommissions([]);
      }
    } catch {
      setFiles([]);
      setDiscrepancies([]);
      setAgentCommissions([]);
    }
  };

  const handleSaveCommissionRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingRates(true);
    try {
      await api.updateStoreCommissions(store.id, {
        agentCommissionPerConfirmedOrder: Number(confirmRate),
        agentCommissionPerDeliveredOrder: Number(deliverRate),
      });
      setRateSaveSuccess(true);
      setTimeout(() => setRateSaveSuccess(false), 4000);
      await loadFinanceData();
    } catch (err: any) {
      alert(`Failed to update commission rates: ${err.message}`);
    } finally {
      setIsSavingRates(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, [store.id]);

  const handleProcessRemittance = async () => {
    const lines = remittanceText.trim().split('\n');
    if (lines.length <= 1) return;
    const headers = lines[0].split(',').map((h) => h.trim());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map((v) => v.trim());
      const row: any = {};
      headers.forEach((h, idx) => {
        row[h] = vals[idx];
      });
      rows.push(row);
    }

    try {
      const result = await api.uploadRemittance(store.id, {
        fileName: `carrier_remittance_${Date.now().toString().slice(-4)}.csv`,
        rows,
      });

      alert(`Remittance processed! Matched: ${result.matchedRows}, Discrepancies: ${result.discrepancyRows}`);
      setShowUploadModal(false);
      loadFinanceData();
    } catch (err: any) {
      alert(`Error processing remittance: ${err.message}`);
    }
  };

  const handleResolveDiscrepancy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDiscrepancy) return;

    try {
      await api.resolveDiscrepancy(store.id, selectedDiscrepancy.id, {
        resolutionStatus,
        resolutionNotes,
      });

      alert('Discrepancy resolution saved!');
      setSelectedDiscrepancy(null);
      loadFinanceData();
    } catch (err: any) {
      alert(`Resolution error: ${err.message}`);
    }
  };

  const totalDiscrepancyCash = discrepancies
    .filter((d) => d.resolutionStatus === 'open')
    .reduce((acc, curr) => acc + Number(curr.discrepancyAmount), 0);

  if (userRole !== 'Loading' && userRole !== 'SuperAdmin' && userRole?.toLowerCase() !== 'superadmin') {
    return (
      <div className="flex h-screen bg-slate-950 font-sans text-slate-100 antialiased overflow-hidden">
        <Sidebar activeStore={store} onStoreChange={setStore} />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Header activeStore={store} />
          <div className="flex flex-col items-center justify-center flex-1 p-8 text-center min-h-[500px]">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-xl">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Access Restricted: SuperAdmin Only</h2>
            <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
              Financial reconciliation, carrier remittance discrepancy resolution, and agent commission accounting are strictly restricted to <strong>SuperAdmin</strong> accounts.
            </p>
            <a
              href="/"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              Return to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-100 antialiased overflow-hidden">
      <Sidebar activeStore={store} onStoreChange={setStore} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header activeStore={store}>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Remittance File</span>
          </button>
        </Header>

        <main className="p-6 space-y-6 max-w-7xl">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-2xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Remitted Cash
              </span>
              <p className="text-2xl font-bold text-white mt-2">
                {formatCurrency(
                  files.reduce((acc, curr) => acc + Number(curr.totalRemittedAmount || 0), 0),
                  store.currency
                )}
              </p>
              <p className="text-xs text-emerald-400 mt-1">Verified against courier bank statements</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Matched Orders
              </span>
              <p className="text-2xl font-bold text-emerald-400 mt-2">
                {files.reduce((acc, curr) => acc + Number(curr.matchedRows || 0), 0)}
              </p>
              <p className="text-xs text-slate-400 mt-1">100% exact cash collection match</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border-rose-500/30">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                Disputed Cash Amount
              </span>
              <p className="text-2xl font-bold text-rose-400 mt-2">
                {formatCurrency(totalDiscrepancyCash, store.currency)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {discrepancies.filter((d) => d.resolutionStatus === 'open').length} open items requiring resolution
              </p>
            </div>
          </div>

          {/* Agent Commission & Payouts Management */}
          <div className="glass-panel p-6 rounded-2xl space-y-5">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Call Center Agent Commissions & Payouts</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Admins & SuperAdmins manage commission rates awarded to agents upon order confirmation and successful delivery
                </p>
              </div>

              {/* Commission Rates Form */}
              <form onSubmit={handleSaveCommissionRates} className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 font-semibold">Per Confirmed:</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={confirmRate}
                    onChange={(e) => setConfirmRate(parseFloat(e.target.value) || 0)}
                    className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-white font-mono font-bold"
                  />
                  <span className="text-slate-400">{store.currency}</span>
                </div>

                <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 font-semibold">Per Delivered:</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={deliverRate}
                    onChange={(e) => setDeliverRate(parseFloat(e.target.value) || 0)}
                    className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-white font-mono font-bold"
                  />
                  <span className="text-slate-400">{store.currency}</span>
                </div>

                <button
                  type="submit"
                  disabled={isSavingRates}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
                >
                  {isSavingRates ? 'Saving...' : 'Update Rates'}
                </button>
              </form>
            </div>

            {rateSaveSuccess && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-medium">
                ✓ Store agent commission rates updated successfully!
              </div>
            )}

            {/* Agent Payouts Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold bg-slate-950/40">
                    <th className="p-3">Agent / Representative</th>
                    <th className="p-3">Assigned Role</th>
                    <th className="p-3">Orders Handled</th>
                    <th className="p-3">Confirmed Orders</th>
                    <th className="p-3">Delivered Orders</th>
                    <th className="p-3 text-right">Commission Accumulated</th>
                    <th className="p-3 text-right">Payout Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {agentCommissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                        No agents assigned to this store yet. Configure commissions above once team members are added.
                      </td>
                    </tr>
                  ) : (
                    agentCommissions.map((ag) => (
                      <tr key={ag.agentId} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3">
                          <p className="font-bold text-white">{ag.agentName}</p>
                          <p className="text-[11px] text-slate-400">{ag.agentEmail}</p>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            {ag.role}
                          </span>
                        </td>
                        <td className="p-3 text-slate-200 font-medium">{ag.ordersHandled}</td>
                        <td className="p-3 text-emerald-400 font-semibold">{ag.confirmedCount}</td>
                        <td className="p-3 text-teal-300 font-semibold">{ag.deliveredCount}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-400 text-sm">
                          {formatCurrency(ag.totalCommissionEarned, store.currency)}
                        </td>
                        <td className="p-3 text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Accrued & Validated
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Open Discrepancies Resolution Table */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Courier Payout Discrepancies</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Cash shortfalls, rate overcharges, ghost parcels, and unremitted delivered orders
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold bg-slate-950/40">
                    <th className="p-3">Waybill Tracking #</th>
                    <th className="p-3">Discrepancy Type</th>
                    <th className="p-3">Difference Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Logged Date</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {discrepancies.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                        <CheckCircle2 className="h-6 w-6 text-emerald-500/50 mx-auto mb-1" />
                        No courier payout discrepancies detected. All shipments balanced.
                      </td>
                    </tr>
                  ) : (
                    discrepancies.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3 font-mono font-bold text-white">{d.trackingNumber}</td>
                        <td className="p-3 capitalize text-slate-200">
                          {d.discrepancyType.replace(/_/g, ' ')}
                        </td>
                        <td className="p-3 font-bold text-rose-400">
                          {formatCurrency(d.discrepancyAmount, store.currency)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              d.resolutionStatus === 'resolved'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {d.resolutionStatus}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{formatDate(d.createdAt)}</td>
                        <td className="p-3 text-right">
                          {d.resolutionStatus === 'open' ? (
                            <button
                              onClick={() => setSelectedDiscrepancy(d)}
                              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all"
                            >
                              Resolve
                            </button>
                          ) : (
                            <span className="text-emerald-400 text-xs font-medium">✓ Settled</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Past Remittance Files History */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>Processed Remittance Files History</span>
                </h3>
                <p className="text-xs text-slate-400">Audited settlement statements from J&T and DHL</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold bg-slate-950/40">
                    <th className="p-3">File Name</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Total Rows</th>
                    <th className="p-3">Matched Rows</th>
                    <th className="p-3">Discrepancies</th>
                    <th className="p-3">Total Remitted</th>
                    <th className="p-3">Processed Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {files.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                        No remittance statements processed yet. Click &quot;Upload Statement&quot; above to reconcile carrier cash files.
                      </td>
                    </tr>
                  ) : (
                    files.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3 font-semibold text-white font-mono">{f.fileName}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {f.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">{f.totalRows}</td>
                        <td className="p-3 text-emerald-400 font-bold">{f.matchedRows}</td>
                        <td className="p-3 text-rose-400 font-bold">{f.discrepancyRows}</td>
                        <td className="p-3 font-bold text-white">
                          {formatCurrency(f.totalRemittedAmount, store.currency)}
                        </td>
                        <td className="p-3 text-slate-400">{formatDate(f.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Upload Remittance Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-xl w-full space-y-4 border border-slate-700">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <span>Upload Courier Cash Remittance Statement</span>
            </h3>
            <p className="text-xs text-slate-400">
              Paste or upload CSV with columns: trackingNumber, remittedAmount, carrierStatus, notes
            </p>
            <textarea
              rows={8}
              value={remittanceText}
              onChange={(e) => setRemittanceText(e.target.value)}
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessRemittance}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg shadow-lg shadow-emerald-500/20"
              >
                Execute Cash Matching
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Discrepancy Modal */}
      {selectedDiscrepancy && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full space-y-4 border border-slate-700">
            <h3 className="text-base font-bold text-white">Resolve Payout Discrepancy</h3>
            <div className="p-3 bg-slate-900 rounded-xl text-xs space-y-1">
              <p className="font-mono text-emerald-400 font-bold">{selectedDiscrepancy.trackingNumber}</p>
              <p className="text-slate-300">Amount: {formatCurrency(selectedDiscrepancy.discrepancyAmount, store.currency)}</p>
              <p className="text-slate-400 capitalize">Type: {selectedDiscrepancy.discrepancyType.replace(/_/g, ' ')}</p>
            </div>

            <form onSubmit={handleResolveDiscrepancy} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Resolution Decision</label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                >
                  <option value="resolved">Resolved (Carrier Credit Received)</option>
                  <option value="carrier_refunded">Carrier Refund Issued</option>
                  <option value="accepted_loss">Accepted Commercial Loss</option>
                  <option value="investigating">Keep Investigating</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Audit Notes</label>
                <input
                  type="text"
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Carrier dispute ticket #9928 approved"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDiscrepancy(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg"
                >
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
