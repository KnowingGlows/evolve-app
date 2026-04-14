"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Shield, User as UserIcon, Trash2, Loader2, Ban } from "lucide-react";
import { collection, onSnapshot, orderBy, query, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { EmptyState } from "@/components/ui/empty-state";
import type { User } from "@/lib/types";

export default function UsersPage() {
  const router = useRouter();
  const { isAdmin, user: currentUser, userDoc } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Gate: only admins allowed
  useEffect(() => {
    if (userDoc && !isAdmin) router.replace("/dashboard");
  }, [isAdmin, userDoc, router]);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as User)));
      setLoading(false);
    });
    return unsub;
  }, []);

  if (!isAdmin) return null;

  const pending = users.filter((u) => u.status === "pending");
  const active = users.filter((u) => u.status === "active");
  const denied = users.filter((u) => u.status === "denied");

  const updateStatus = async (uid: string, status: User["status"]) => {
    await updateDoc(doc(db, "users", uid), { status });
    toast(status === "active" ? "Approved" : status === "denied" ? "Denied" : "Updated");
  };

  const updateRole = async (uid: string, role: User["role"]) => {
    await updateDoc(doc(db, "users", uid), { role });
    toast(`Role updated to ${role}`);
  };

  const removeUser = async (uid: string) => {
    if (uid === currentUser?.uid) { toast("You can't remove yourself", "error"); return; }
    if (!confirm("Remove this user record? This doesn't delete their auth account — they can re-sign-up.")) return;
    await deleteDoc(doc(db, "users", uid));
    toast("User removed");
  };

  return (
    <div className="max-w-5xl space-y-10">
      {/* Pending section — top priority */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-base font-semibold text-white">Pending Approval</h3>
          {pending.length > 0 && (
            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
              {pending.length} waiting
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-white/30 py-8"><Loader2 size={14} className="animate-spin" /> Loading…</div>
        ) : pending.length === 0 ? (
          <div className="bg-[#111119] border border-white/[0.06] rounded-2xl p-6 text-sm text-white/30 text-center">
            No pending requests right now.
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map((u) => (
              <div key={u.uid} className="bg-gradient-to-r from-amber-500/[0.04] to-transparent border border-amber-500/15 rounded-2xl p-4 flex items-center gap-4">
                <Avatar user={u} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{u.displayName || u.email}</p>
                  <p className="text-xs text-white/40 truncate">{u.email}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => updateStatus(u.uid, "active")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 text-emerald-400 text-sm rounded-lg hover:bg-emerald-500/25 transition-colors border border-emerald-500/20"
                  >
                    <Check size={14} /> Approve
                  </button>
                  <button
                    onClick={() => updateStatus(u.uid, "denied")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 text-sm rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/15"
                  >
                    <X size={14} /> Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Active users */}
      <section>
        <h3 className="text-base font-semibold text-white mb-4">Team Members</h3>
        <div className="bg-[#111119] border border-white/[0.06] rounded-2xl overflow-hidden">
          {active.length === 0 ? (
            <p className="text-sm text-white/30 text-center py-8">No active users yet.</p>
          ) : (
            <div>
              {active.map((u, i) => (
                <div key={u.uid} className={`flex items-center gap-4 p-4 ${i !== 0 ? "border-t border-white/[0.03]" : ""}`}>
                  <Avatar user={u} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">{u.displayName || u.email}</p>
                      {u.uid === currentUser?.uid && <span className="text-[10px] text-white/30 uppercase tracking-widest">You</span>}
                    </div>
                    <p className="text-xs text-white/40 truncate">{u.email}</p>
                  </div>
                  <RoleSelect user={u} onChange={(r) => updateRole(u.uid, r)} disabled={u.uid === currentUser?.uid} />
                  <button
                    onClick={() => updateStatus(u.uid, "denied")}
                    disabled={u.uid === currentUser?.uid}
                    title="Revoke access"
                    className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-20 disabled:hover:text-white/30 disabled:hover:bg-transparent transition-colors"
                  >
                    <Ban size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Denied */}
      {denied.length > 0 && (
        <section>
          <h3 className="text-base font-semibold text-white mb-4">Denied / Revoked</h3>
          <div className="bg-[#111119] border border-white/[0.06] rounded-2xl overflow-hidden">
            {denied.map((u, i) => (
              <div key={u.uid} className={`flex items-center gap-4 p-4 ${i !== 0 ? "border-t border-white/[0.03]" : ""}`}>
                <Avatar user={u} muted />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/50 truncate">{u.displayName || u.email}</p>
                  <p className="text-xs text-white/30 truncate">{u.email}</p>
                </div>
                <button
                  onClick={() => updateStatus(u.uid, "active")}
                  className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-sm rounded-lg hover:bg-emerald-500/20 transition-colors border border-emerald-500/15"
                >
                  Restore
                </button>
                <button
                  onClick={() => removeUser(u.uid)}
                  className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Avatar({ user, muted }: { user: User; muted?: boolean }) {
  const initial = (user.displayName || user.email || "?")[0].toUpperCase();
  if (user.photoURL) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={user.photoURL} alt="" className={`w-10 h-10 rounded-full ${muted ? "opacity-50 grayscale" : ""}`} />
    );
  }
  return (
    <div className={`w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/20 flex items-center justify-center text-sm font-semibold text-violet-300 ${muted ? "opacity-50" : ""}`}>
      {initial}
    </div>
  );
}

function RoleSelect({ user, onChange, disabled }: { user: User; onChange: (r: User["role"]) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 bg-white/[0.04] rounded-lg p-1 border border-white/[0.06]">
      {(["admin", "member"] as const).map((role) => {
        const Icon = role === "admin" ? Shield : UserIcon;
        const active = user.role === role;
        return (
          <button
            key={role}
            onClick={() => !active && onChange(role)}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors ${
              active
                ? role === "admin"
                  ? "bg-violet-500/20 text-violet-300"
                  : "bg-white/10 text-white/80"
                : "text-white/40 hover:text-white/70"
            } disabled:cursor-not-allowed`}
          >
            <Icon size={12} />
            {role}
          </button>
        );
      })}
    </div>
  );
}
