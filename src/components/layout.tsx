"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SessionUser } from "@/lib/types";
import { NotificationBell } from "@/components/notifications";
import { RevealOnMount } from "@/components/animate";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  FolderKanban,
  FileText,
  Calendar,
  Settings,
  LogOut,
  Building2,
} from "lucide-react";

const NAV_BY_ROLE: Record<string, { href: string; label: string; icon: typeof LayoutDashboard }[]> = {
  ceo_admin: [
    { href: "/dashboard/ceo", label: "Dashboard", icon: LayoutDashboard },
    { href: "/sales", label: "Sales", icon: TrendingUp },
    { href: "/clients", label: "Clients", icon: Building2 },
    { href: "/marketing", label: "Marketing", icon: Calendar },
    { href: "/projects", label: "Projects", icon: FolderKanban },
    { href: "/documents", label: "Documents", icon: FileText },
    { href: "/team", label: "Team", icon: Users },
  ],
  cto_admin: [
    { href: "/dashboard/cto", label: "Dashboard", icon: LayoutDashboard },
    { href: "/projects", label: "Projects", icon: FolderKanban },
    { href: "/clients", label: "Clients", icon: Building2 },
    { href: "/documents", label: "Documents", icon: FileText },
    { href: "/sales", label: "Sales", icon: TrendingUp },
    { href: "/marketing", label: "Marketing", icon: Calendar },
    { href: "/team", label: "Team", icon: Users },
  ],
  sales_employee: [
    { href: "/dashboard/sales", label: "Dashboard", icon: LayoutDashboard },
    { href: "/sales", label: "Sales", icon: TrendingUp },
    { href: "/marketing", label: "Marketing", icon: Calendar },
  ],
  tech_employee: [
    { href: "/dashboard/tech", label: "Dashboard", icon: LayoutDashboard },
    { href: "/projects", label: "Projects", icon: FolderKanban },
  ],
};

export function AppShell({
  user,
  children,
  title,
}: {
  user: SessionUser;
  children: React.ReactNode;
  title?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = NAV_BY_ROLE[user.role] || [];

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 border-r border-border bg-white flex flex-col shrink-0">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-display font-bold text-sm">
              H
            </div>
            <div>
              <p className="font-display font-semibold text-sm">Hyperwrike</p>
              <p className="text-xs text-muted capitalize">{user.role.replace(/_/g, " ")}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-brand-50 text-brand-700 font-medium"
                    : "text-muted hover:bg-slate-50 hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <button
            onClick={logout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted hover:bg-slate-50 w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-border px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="font-display font-semibold text-lg">{title || "Dashboard"}</h1>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <span className="text-sm text-muted">{user.name}</span>
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-medium">
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>
        <div className="p-8">{children}</div>
      </main>
      <RevealOnMount />
    </div>
  );
}

export function PortalShell({
  user,
  children,
  title,
}: {
  user: SessionUser;
  children: React.ReactNode;
  title?: string;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <header className="bg-[#15203A] text-white px-6 py-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#A6E635] text-[#15203A] flex items-center justify-center font-display font-bold text-sm">
              H
            </div>
            <div>
              <p className="font-display font-semibold text-sm tracking-wide">Hyperwrike</p>
              <p className="text-xs text-white/50">Client Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-white/50">Client Account</p>
            </div>
            <button onClick={logout} className="text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </header>
      <div className="max-w-6xl mx-auto p-6 md:p-8">
        {children}
      </div>
      <RevealOnMount />
    </div>
  );
}
