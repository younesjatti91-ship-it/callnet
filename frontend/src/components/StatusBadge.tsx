import React from 'react';
import { cn } from '../lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const normalized = status.toLowerCase();

  let styles = 'bg-slate-800 text-slate-300 border-slate-700';
  let label = status.replace(/_/g, ' ');

  if (normalized === 'pending_verification') {
    styles = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    label = 'Pending Verification';
  } else if (normalized === 'confirmed') {
    styles = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    label = 'Confirmed';
  } else if (normalized === 'rescheduled') {
    styles = 'bg-sky-500/15 text-sky-400 border-sky-500/30';
    label = 'Rescheduled';
  } else if (normalized === 'fulfillment') {
    styles = 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    label = 'Fulfillment';
  } else if (normalized === 'shipped' || normalized === 'in_transit') {
    styles = 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    label = 'Shipped / In Transit';
  } else if (normalized === 'delivered') {
    styles = 'bg-teal-500/15 text-teal-300 border-teal-500/40';
    label = 'Delivered';
  } else if (normalized === 'returned') {
    styles = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    label = 'Returned';
  } else if (normalized === 'cancelled') {
    styles = 'bg-red-500/15 text-red-400 border-red-500/30';
    label = 'Cancelled';
  } else if (normalized === 'matched') {
    styles = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    label = 'Matched';
  } else if (normalized === 'amount_mismatch' || normalized === 'underpayment') {
    styles = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    label = 'Amount Mismatch';
  } else if (normalized === 'order_not_found' || normalized === 'ghost_shipment') {
    styles = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    label = 'Ghost Shipment';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize tracking-wide',
        styles,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
};
