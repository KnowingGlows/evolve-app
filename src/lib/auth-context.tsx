"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";
import type { User } from "./types";

interface AuthContextType {
  user: FirebaseUser | null;
  userDoc: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

async function ensureUserDoc(fbUser: FirebaseUser) {
  const userRef = doc(db, "users", fbUser.uid);
  const userSnap = await getDoc(userRef);
  const admin = isAdminEmail(fbUser.email);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      email: fbUser.email,
      displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "",
      brands: [],
      role: admin ? "admin" : "member",
      status: admin ? "active" : "pending",
      photoURL: fbUser.photoURL || "",
      createdAt: new Date().toISOString(),
    });
  } else {
    // Migration: ensure role & status exist on existing docs
    const data = userSnap.data();
    const updates: Record<string, unknown> = {};
    if (!data.role) updates.role = admin ? "admin" : "member";
    if (!data.status) updates.status = admin ? "active" : "pending";
    // If this email is in the admin list, promote them regardless
    if (admin && data.role !== "admin") updates.role = "admin";
    if (admin && data.status !== "active") updates.status = "active";
    if (fbUser.photoURL && data.photoURL !== fbUser.photoURL) updates.photoURL = fbUser.photoURL;
    if (Object.keys(updates).length) await updateDoc(userRef, updates);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userDoc, setUserDoc] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (!user) {
        setUserDoc(null);
        setLoading(false);
        return;
      }
      // Ensure doc exists / is migrated
      await ensureUserDoc(user);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        setUserDoc({ uid: snap.id, ...snap.data() } as User);
      }
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const signIn = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await ensureUserDoc(result.user);
  };

  const signUp = async (email: string, password: string, name: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    await ensureUserDoc(result.user);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await ensureUserDoc(result.user);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const isAdmin = userDoc?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, userDoc, loading, signIn, signUp, signInWithGoogle, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
