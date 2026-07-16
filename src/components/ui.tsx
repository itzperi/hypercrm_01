import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

export function Card({
  children,
  className,
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <div className={cn("card p-5", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="font-display font-semibold text-sm">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  trend,
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: { value: string; positive?: boolean };
  className?: string;
}) {
  return (
    <div className={cn("card p-5", className)}>
      <p className="stat-label">{label}</p>
      <p className="stat-value mt-1">{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
      {trend && (
        <p
          className={cn(
            "text-xs font-medium mt-2",
            trend.positive ? "text-brand-600" : "text-red-600"
          )}
        >
          {trend.value}
        </p>
      )}
    </div>
  );
}

export function Badge({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const variants = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-brand-100 text-brand-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
        variants[variant]
      )}
    >
      {children}
    </span>
  );
}

export function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-brand-500 rounded-full transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-muted text-sm">{message}</div>
  );
}
