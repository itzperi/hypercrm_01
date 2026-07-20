"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, AlertTriangle, MessageSquare, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: number;
  created_at: string;
};

const ICONS: Record<string, typeof Bell> = {
  task_overdue: AlertTriangle,
  client_message: MessageSquare,
  feature_request: Sparkles,
};

export function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const load = useCallback(() => {
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : { notifications: [], unread: 0 }))
      .then((d) => {
        setItems(d.notifications || []);
        setUnread(d.unread || 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const i = setInterval(load, 15000);
    return () => clearInterval(i);
  }, [load]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function markAll() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    load();
  }

  async function openItem(n: Notification) {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: n.id }),
    });
    setOpen(false);
    load();
    if (n.link) router.push(n.link);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg text-muted hover:text-foreground hover:bg-slate-100 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-white shadow-2xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-white">
            <p className="font-display font-semibold text-sm">Notifications</p>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">You&apos;re all caught up 🎉</p>
          ) : (
            items.map((n) => {
              const Icon = ICONS[n.type] || Bell;
              return (
                <button
                  key={n.id}
                  onClick={() => openItem(n)}
                  className={cn(
                    "w-full text-left flex gap-3 px-4 py-3 border-b border-border/60 hover:bg-slate-50 transition-colors",
                    !n.read && "bg-brand-50/40"
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                      n.type === "task_overdue"
                        ? "bg-red-100 text-red-600"
                        : n.type === "client_message"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-brand-100 text-brand-700"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium truncate">{n.title}</span>
                    {n.body && <span className="block text-xs text-muted line-clamp-2">{n.body}</span>}
                  </span>
                  {!n.read && <span className="shrink-0 w-2 h-2 rounded-full bg-brand-500 mt-1.5" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
