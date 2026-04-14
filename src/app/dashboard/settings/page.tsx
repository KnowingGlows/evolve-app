"use client";

import { useState, useEffect } from "react";
import { User as UserIcon, Briefcase, Shield, Trash2, Check, LogOut, Mail } from "lucide-react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useBrand } from "@/lib/brand-context";
import { useToast } from "@/lib/toast-context";

export default function SettingsPage() {
  const { user, userDoc, logout, isAdmin } = useAuth();
  const { brand, brands } = useBrand();
  const { toast } = useToast();

  const [name, setName] = useState(userDoc?.displayName || user?.displayName || "");
  const [brandName, setBrandName] = useState(brand?.name || "");

  useEffect(() => { setName(userDoc?.displayName || user?.displayName || ""); }, [userDoc, user]);
  useEffect(() => { setBrandName(brand?.name || ""); }, [brand]);

  if (!user || !userDoc) return null;

  const saveProfile = async () => {
    if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: name });
    await updateDoc(doc(db, "users", user.uid), { displayName: name });
    toast("Profile updated");
  };

  const saveBrand = async () => {
    if (!brand) return;
    await updateDoc(doc(db, "brands", brand.id), { name: brandName });
    toast("Brand updated");
  };

  const deleteBrand = async () => {
    if (!brand) return;
    if (!confirm(`Delete brand "${brand.name}"? This is irreversible.`)) return;
    await deleteDoc(doc(db, "brands", brand.id));
    toast("Brand deleted");
    window.location.href = "/dashboard";
  };

  return (
    <div className="max-w-2xl space-y-8">
      {/* Profile */}
      <Section icon={UserIcon} title="Your Profile" description="How you appear in the workspace">
        <div className="space-y-4">
          <Field label="Full Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 transition-colors"
            />
          </Field>
          <Field label="Email">
            <div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-2.5 text-sm text-white/50">
              <Mail size={14} />
              {user.email}
            </div>
          </Field>
          <Field label="Role">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold
                ${isAdmin ? "bg-violet-500/15 text-violet-300 border border-violet-500/20" : "bg-white/5 text-white/60 border border-white/10"}`}
              >
                {isAdmin ? <Shield size={12} /> : <UserIcon size={12} />}
                {userDoc.role}
              </span>
              <span className="text-xs text-white/30">{isAdmin ? "You can manage users and all brand data." : "You can view and edit brand data."}</span>
            </div>
          </Field>
          <div className="flex gap-3 pt-2">
            <button onClick={saveProfile} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors">
              <Check size={14} /> Save Changes
            </button>
          </div>
        </div>
      </Section>

      {/* Current brand */}
      {brand && (
        <Section icon={Briefcase} title="Current Brand" description={`${brands.length} brand${brands.length !== 1 ? "s" : ""} in your account`}>
          <div className="space-y-4">
            <Field label="Brand Name">
              <input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                disabled={!isAdmin}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 transition-colors disabled:opacity-50"
              />
            </Field>
            {isAdmin && (
              <div className="flex flex-wrap gap-3 pt-2">
                <button onClick={saveBrand} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors">
                  <Check size={14} /> Save Brand
                </button>
                <button onClick={deleteBrand} className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl hover:bg-red-500/20 transition-colors ml-auto">
                  <Trash2 size={14} /> Delete Brand
                </button>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Sign out */}
      <Section icon={LogOut} title="Session">
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-white/60 text-sm rounded-xl hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut size={14} /> Sign out
        </button>
      </Section>
    </div>
  );
}

function Section({ icon: Icon, title, description, children }: { icon: React.ElementType; title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#111119] border border-white/[0.06] rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
          <Icon size={15} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {description && <p className="text-xs text-white/30 mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
