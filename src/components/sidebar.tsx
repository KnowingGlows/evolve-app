"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Palette,
  ScrollText,
  Heart,
  Diamond,
  Users,
  Eye,
  Star,
  TrendingUp,
  Map,
  Calendar,
  ChevronLeft,
} from "lucide-react";

const navSections = [
  {
    label: "Dashboard",
    items: [{ icon: LayoutDashboard, label: "Overview", href: "/dashboard" }],
  },
  {
    label: "Creative",
    items: [
      { icon: Palette, label: "Creative Roadmap", href: "/dashboard/creative" },
      { icon: ScrollText, label: "Ads Log", href: "/dashboard/ads-log" },
      { icon: Heart, label: "Desires", href: "/dashboard/desires" },
      { icon: Diamond, label: "Angles", href: "/dashboard/angles" },
      { icon: Users, label: "Avatars", href: "/dashboard/avatars" },
      { icon: Eye, label: "Awareness", href: "/dashboard/awareness" },
      { icon: Star, label: "Creators", href: "/dashboard/creators" },
    ],
  },
  {
    label: "CRO",
    items: [
      { icon: TrendingUp, label: "CRO Tests", href: "/dashboard/cro" },
      { icon: Map, label: "CRO Roadmap", href: "/dashboard/cro-roadmap" },
    ],
  },
  {
    label: "Planning",
    items: [
      { icon: Calendar, label: "2025 Calendar", href: "/dashboard/calendar?year=2025" },
      { icon: Calendar, label: "2024 Calendar", href: "/dashboard/calendar?year=2024" },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/60 z-[99] lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed top-0 left-0 h-screen w-[260px] bg-[#0c0c14] border-r border-white/[0.06] z-[100] flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="px-6 py-6 border-b border-white/[0.06]">
          <h1 className="text-lg font-bold bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">
            Evolve 2.0
          </h1>
          <p className="text-[10px] text-white/30 uppercase tracking-[2px] mt-1">Growth Guide</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
          {navSections.map((section) => (
            <div key={section.label}>
              <div className="px-6 py-2 text-[10px] font-semibold text-white/20 uppercase tracking-[1.5px]">
                {section.label}
              </div>
              {section.items.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href.split("?")[0]);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-6 py-2.5 text-[13px] transition-all border-l-2 ${
                      isActive
                        ? "bg-violet-500/[0.08] text-violet-400 border-violet-500"
                        : "text-white/40 border-transparent hover:text-white/70 hover:bg-white/[0.02]"
                    }`}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] text-[11px] text-white/20">
          Growth Guide &middot; Evolve 2.0
        </div>
      </aside>
    </>
  );
}
