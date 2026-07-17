"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import AppIcon, { type AppIconName } from "./AppIcon";
import BrandMark from "./BrandMark";

const GROUPS: { label: string; items: { href: string; label: string; icon: AppIconName }[] }[] = [
  { label: "Learn", items: [
    { href: "/dashboard", label: "Home", icon: "home" },
    { href: "/library", label: "Library", icon: "library" },
    { href: "/review", label: "Review", icon: "review" },
  ] },
  { label: "Build", items: [{ href: "/create", label: "Create from source", icon: "source" }] },
  { label: "Understand", items: [{ href: "/progress", label: "Evidence", icon: "evidence" }] },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppSidebar({ collapsed = false, onNavigate, onToggle }: { collapsed?: boolean; onNavigate?: () => void; onToggle?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className={`flex h-18 shrink-0 items-center border-b border-ink/8 ${collapsed ? "justify-center px-2" : "px-4"}`}>
        <Link href="/dashboard" aria-label="Museion home" onClick={onNavigate} className="flex min-w-0 items-center gap-3">
          <BrandMark className="h-10 w-10 shrink-0" />
          {!collapsed && <span className="min-w-0"><span className="block font-display text-lg font-semibold leading-none tracking-tight">Museion</span><span className="mt-1 block truncate text-[0.68rem] text-ink-soft">Learning workspace</span></span>}
        </Link>
      </div>

      <nav aria-label="Application navigation" className="min-h-0 flex-1 overflow-y-auto px-2 py-4">
        {GROUPS.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            {!collapsed && <p className="px-3 pb-1.5 text-[0.68rem] font-semibold text-ink-soft">{group.label}</p>}
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                return <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined} aria-current={active ? "page" : undefined} onClick={onNavigate} className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${active ? "bg-lapis-soft text-lapis-dark" : "text-ink-soft hover:bg-paper hover:text-ink"} ${collapsed ? "justify-center" : ""}`}>
                  <AppIcon name={item.icon} className="h-[1.15rem] w-[1.15rem] shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>;
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-ink/8 p-2">
        <Link href="/settings" title={collapsed ? "Settings" : undefined} aria-current={isActive(pathname, "/settings") ? "page" : undefined} onClick={onNavigate} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-ink-soft hover:bg-paper hover:text-ink ${collapsed ? "justify-center" : ""}`}><AppIcon name="settings" className="h-[1.15rem] w-[1.15rem]" />{!collapsed && "Settings"}</Link>
        {onToggle && <button type="button" onClick={onToggle} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className={`mt-1 hidden min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-ink-soft hover:bg-paper hover:text-ink lg:flex ${collapsed ? "justify-center" : ""}`}><AppIcon name="collapse" className={`h-[1.15rem] w-[1.15rem] transition-transform ${collapsed ? "rotate-180" : ""}`} />{!collapsed && "Collapse"}</button>}
      </div>
    </div>
  );
}
