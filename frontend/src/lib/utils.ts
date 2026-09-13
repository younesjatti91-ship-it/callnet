import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | undefined | null, currency: string = 'MAD'): string {
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  } catch {
    return `${currency || 'MAD'} ${safeAmount.toLocaleString()}`;
  }
}

export function formatDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
