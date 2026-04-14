"use client";

import { useState } from "react";
import { Menu, Plus, ChevronDown, LogOut, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useBrand } from "@/lib/brand-context";

interface TopbarProps {
  title: string;
  onMenuClick: () => void;
}

export function Topbar({ title, onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth();
  const { brand, brands, selectBrand, createBrand } = useBrand();
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");

  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) return;
    await createBrand(newBrandName.trim());
    setNewBrandName("");
    setCreating(false);
    setBrandMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0a0a12]/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={onMenuClick} className="lg:hidden p-2 text-white/40 hover:text-white">
            <Menu size={20} />
          </button>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Brand Switcher */}
          <div className="relative">
            <button
              onClick={() => { setBrandMenuOpen(!brandMenuOpen); setUserMenuOpen(false); }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-500/[0.08] border border-violet-500/20 text-violet-400 text-sm font-medium hover:bg-violet-500/[0.12] transition-colors"
            >
              {brand?.name || "Select Brand"}
              <ChevronDown size={14} />
            </button>
            {brandMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#161620] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden">
                <div className="p-2">
                  {brands.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => { selectBrand(b.id); setBrandMenuOpen(false); }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        b.id === brand?.id
                          ? "bg-violet-500/10 text-violet-400"
                          : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
                <div className="border-t border-white/[0.06] p-2">
                  {creating ? (
                    <div className="flex gap-2">
                      <input
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateBrand()}
                        placeholder="Brand name..."
                        autoFocus
                        className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50"
                      />
                      <button
                        onClick={handleCreateBrand}
                        className="px-3 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCreating(true)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:bg-white/[0.04] hover:text-white transition-colors"
                    >
                      <Plus size={14} />
                      New Brand
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => { setUserMenuOpen(!userMenuOpen); setBrandMenuOpen(false); }}
              className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 text-sm font-semibold hover:bg-violet-500/30 transition-colors"
            >
              {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#161620] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <p className="text-sm text-white font-medium">{user?.displayName || "User"}</p>
                  <p className="text-xs text-white/30 mt-0.5">{user?.email}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => { logout(); setUserMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
