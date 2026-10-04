import { OrderStatus, PaymentStatus } from '../types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(d);
  } catch {
    return dateString;
  }
};

export const formatRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHour / 24);

    if (diffSec < 5) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  } catch {
    return 'Recently';
  }
};

export const getOrderStatusBadge = (
  status: OrderStatus | string | null | undefined
): { label: string; bg: string; text: string; dot: string; border: string } => {
  switch (typeof status === 'string' ? status.toUpperCase() : '') {
    case 'PLACED':
      return { label: 'Placed', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200' };
    case 'CONFIRMED':
      return { label: 'Confirmed', bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500', border: 'border-sky-200' };
    case 'PREPARING':
      return { label: 'Preparing', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200' };
    case 'READY_FOR_PICKUP':
      return { label: 'Ready for Pickup', bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500', border: 'border-indigo-200' };
    case 'PICKED_UP':
      return { label: 'Picked Up', bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500', border: 'border-teal-200' };
    case 'OUT_FOR_DELIVERY':
      return { label: 'Out for Delivery', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', border: 'border-purple-200' };
    case 'DELIVERED':
      return { label: 'Delivered', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' };
    case 'CANCELLED':
      return { label: 'Cancelled', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500', border: 'border-rose-200' };
    default:
      return {
        label: typeof status === 'string' && status.trim()
          ? status.trim().replace(/_/g, ' ')
          : 'Unknown',
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        dot: 'bg-slate-400',
        border: 'border-slate-200',
      };
  }
};

export const getPaymentStatusBadge = (
  status: PaymentStatus | string | null | undefined
): { label: string; bg: string; text: string } => {
  switch (typeof status === 'string' ? status.toUpperCase() : '') {
    case 'PAID':
      return { label: 'Paid', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700' };
    case 'PENDING':
      return { label: 'Pending', bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700' };
    case 'FAILED':
      return { label: 'Failed', bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-700' };
    case 'REFUNDED':
      return { label: 'Refunded', bg: 'bg-slate-100 text-slate-700 border-slate-200', text: 'text-slate-700' };
    default:
      return {
        label: typeof status === 'string' && status.trim()
          ? status.trim().replace(/_/g, ' ')
          : 'Unknown',
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        text: 'text-slate-700',
      };
  }
};
