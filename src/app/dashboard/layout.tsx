"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { BrandProvider, useBrand } from "@/lib/brand-context";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/creative": "Creative Roadmap",
  "/dashboard/ads-log": "Ads Log",
  "/dashboard/desires": "Desires",
  "/dashboard/angles": "Angles",
  "/dashboard/avatars": "Avatars",
  "/dashboard/awareness": "Awareness",
  "/dashboard/creators": "Creators",
  "/dashboard/cro": "CRO Tests",
  "/dashboard/cro-roadmap": "CRO Roadmap",
  "/dashboard/calendar": "Calendar",
};

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { brand, brands, loading, createBrand } = useBrand();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOnboard, setShowOnboard] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!loading && brands.length === 0) {
      setShowOnboard(true);
    } else {
      setShowOnboard(false);
    }
  }, [loading, brands]);

  const title = pageTitles[pathname] || (pathname.startsWith("/dashboard/calendar") ? "Calendar" : "Dashboard");

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createBrand(newName.trim());
    setNewName("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (showOnboard) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="fixed inset-0 bg-[#0a0a12]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.08),transparent_60%)]" />
        </div>
        <div className="relative w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-white mb-3">Create Your First Brand</h1>
          <p className="text-sm text-white/40 mb-8">
            A brand is your workspace. Add your company or client name to get started.
          </p>
          <div className="flex gap-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="e.g. Acme Corp"
              autoFocus
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 transition-colors"
            />
            <button
              onClick={handleCreate}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-[260px]">
        <Topbar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-6 lg:p-8 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrandProvider>
      <DashboardContent>{children}</DashboardContent>
    </BrandProvider>
  );
}
