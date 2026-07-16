"use client";

import { Pencil, Trash2, Plus, Download, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

export function Btn({
  children,
  variant = "primary",
  size = "sm",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
}) {
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
    secondary: "bg-white border border-border text-foreground hover:bg-slate-50",
    danger: "bg-red-50 text-red-700 border border-red-100 hover:bg-red-100",
    ghost: "text-muted hover:text-foreground hover:bg-slate-100",
  };
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm" };
  return (
    <button
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

export function RowActions({
  onEdit,
  onDelete,
  onDownload,
  onPortal,
  showEdit = true,
  showDelete = true,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onPortal?: () => void;
  showEdit?: boolean;
  showDelete?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {onPortal && (
        <button
          onClick={onPortal}
          title="Create portal"
          className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors"
        >
          <KeyRound className="w-3.5 h-3.5" />
        </button>
      )}
      {onDownload && (
        <button
          onClick={onDownload}
          title="Download PDF"
          className="p-1.5 rounded-lg text-muted hover:bg-slate-100 hover:text-foreground transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      )}
      {showEdit && onEdit && (
        <button
          onClick={onEdit}
          title="Edit"
          className="p-1.5 rounded-lg text-muted hover:bg-slate-100 hover:text-foreground transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
      {showDelete && onDelete && (
        <button
          onClick={onDelete}
          title="Delete"
          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Btn onClick={onClick} size="md">
      <Plus className="w-4 h-4" />
      {label}
    </Btn>
  );
}

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="block text-xs font-medium text-muted mb-1.5">{label}</span>
      {children}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500",
        props.className
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500",
        props.className
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 min-h-[80px]",
        props.className
      )}
    />
  );
}
