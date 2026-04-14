"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { BrandProvider, useBrand } from "@/lib/brand-context";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { CmdK } from "@/components/cmd-k";

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
  "/dashboard/users": "Users & Permissions",
  "/dashboard/settings": "Settings",
};

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { brand, brands, loading, createBrand } = useBrand();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOnboard, setShowOnboard] = useState(false);
  const [newName, setNewName] = useState("");
  const [cmdKOpen, setCmdKOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdKOpen((v) => !v);
      }
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        setCmdKOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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
        <Topbar title={title} onMenuClick={() => setSidebarOpen(true)} onCmdK={() => setCmdKOpen(true)} />
        <main className="p-6 lg:p-8 animate-fade-in">{children}</main>
      </div>
      <CmdK open={cmdKOpen} onClose={() => setCmdKOpen(false)} />
    </div>
  );
}

function ApprovalGate({ children }: { children: React.ReactNode }) {
  const { userDoc, logout } = useAuth();

  if (!userDoc) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (userDoc.status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="fixed inset-0 bg-[#0a0a12]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.08),transparent_60%)]" />
        </div>
        <div className="relative w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 mx-auto mb-6 flex items-center justify-center">
            <svg className="w-7 h-7 text-violet-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Waiting for approval</h1>
          <p className="text-sm text-white/40 mb-8">
            Your account is pending admin approval. You&apos;ll get access once the admin lets you in.
          </p>
          <p className="text-xs text-white/25 mb-6">Signed in as {userDoc.email}</p>
          <button
            onClick={logout}
            className="px-4 py-2.5 bg-white/5 border border-white/10 text-white/60 text-sm rounded-xl hover:bg-white/10 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (userDoc.status === "denied") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="fixed inset-0 bg-[#0a0a12]" />
        <div className="relative w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-white mb-3">Access denied</h1>
          <p className="text-sm text-white/40 mb-8">Your account access was denied. Contact the admin if this is a mistake.</p>
          <button
            onClick={logout}
            className="px-4 py-2.5 bg-white/5 border border-white/10 text-white/60 text-sm rounded-xl hover:bg-white/10 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
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
    <ApprovalGate>
      <BrandProvider>
        <DashboardContent>{children}</DashboardContent>
      </BrandProvider>
    </ApprovalGate>
  );
}
