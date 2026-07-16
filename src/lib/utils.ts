import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isToday, isThisWeek, startOfMonth, endOfMonth } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | null) {
  if (!date) return "—";
  try {
    return format(parseISO(date), "MMM d, yyyy");
  } catch {
    return date;
  }
}

export function formatDateTime(date: string | null) {
  if (!date) return "—";
  try {
    return format(parseISO(date), "MMM d, yyyy h:mm a");
  } catch {
    return date;
  }
}

export function calcGst(amount: number, rate = 0.18) {
  return Math.round(amount * rate * 100) / 100;
}

export function currentMonth() {
  return format(new Date(), "yyyy-MM");
}

export function isInCurrentMonth(dateStr: string) {
  const d = parseISO(dateStr);
  const now = new Date();
  return d >= startOfMonth(now) && d <= endOfMonth(now);
}

export function isDateToday(dateStr: string) {
  try {
    return isToday(parseISO(dateStr));
  } catch {
    return false;
  }
}

export function isDateThisWeek(dateStr: string) {
  try {
    return isThisWeek(parseISO(dateStr));
  } catch {
    return false;
  }
}

export const OFFER_LABELS: Record<string, string> = {
  "10x_throughput": "10x Throughput",
  "500_hour_reclaim": "500-Hour Reclaim",
  ai_visibility_engine: "AI Visibility Engine",
};

export const STAGE_LABELS: Record<string, string> = {
  lead: "Lead",
  contacted: "Contacted",
  meeting_booked: "Meeting Booked",
  proposal_sent: "Proposal Sent",
  negotiation: "Negotiation",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

export const CLIENT_STAGE_LABELS: Record<string, string> = {
  lead: "Lead",
  proposal: "Proposal",
  signed: "Signed",
  onboarded: "Onboarded",
  active: "Active",
  churned: "Churned",
};

export const CONTENT_STATUS_LABELS: Record<string, string> = {
  idea: "Idea",
  draft: "Drafting",
  review: "Review",
  scheduled: "Scheduled",
  published: "Published",
};

export const HEALTH_COLORS: Record<string, string> = {
  on_track: "bg-brand-100 text-brand-800",
  at_risk: "bg-amber-100 text-amber-800",
  delayed: "bg-red-100 text-red-800",
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  paid: "bg-brand-100 text-brand-800",
  unpaid: "bg-slate-100 text-slate-700",
  overdue: "bg-red-100 text-red-800",
};
