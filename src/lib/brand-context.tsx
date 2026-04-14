"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth-context";
import { Brand } from "./types";

interface BrandContextType {
  brand: Brand | null;
  brands: Brand[];
  loading: boolean;
  selectBrand: (brandId: string) => void;
  createBrand: (name: string) => Promise<string>;
}

const BrandContext = createContext<BrandContextType | null>(null);

export function BrandProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBrands([]);
      setBrand(null);
      setLoading(false);
      return;
    }
    loadBrands();
  }, [user]);

  const loadBrands = async () => {
    if (!user) return;
    setLoading(true);
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();
    const brandIds: string[] = userData?.brands || [];

    if (brandIds.length === 0) {
      setBrands([]);
      setBrand(null);
      setLoading(false);
      return;
    }

    const loadedBrands: Brand[] = [];
    for (const id of brandIds) {
      const brandSnap = await getDoc(doc(db, "brands", id));
      if (brandSnap.exists()) {
        loadedBrands.push({ id: brandSnap.id, ...brandSnap.data() } as Brand);
      }
    }

    setBrands(loadedBrands);

    const savedBrandId = typeof window !== "undefined" ? localStorage.getItem("evolve_current_brand") : null;
    const savedBrand = loadedBrands.find((b) => b.id === savedBrandId);
    setBrand(savedBrand || loadedBrands[0] || null);
    setLoading(false);
  };

  const selectBrand = (brandId: string) => {
    const found = brands.find((b) => b.id === brandId);
    if (found) {
      setBrand(found);
      localStorage.setItem("evolve_current_brand", brandId);
    }
  };

  const createBrand = async (name: string): Promise<string> => {
    if (!user) throw new Error("Not authenticated");
    const brandRef = doc(collection(db, "brands"));
    const newBrand: Omit<Brand, "id"> = {
      name,
      ownerId: user.uid,
      members: [{ userId: user.uid, email: user.email || "", role: "owner" }],
      team: [
        { role: "Senior Strategist", name: "" },
        { role: "Copywriter", name: "" },
        { role: "Creative Strategist", name: "" },
        { role: "Media Buyer", name: "" },
      ],
      settings: { adHitRate: "0%", researchDocUrl: "" },
      createdAt: new Date().toISOString(),
    };
    await setDoc(brandRef, newBrand);

    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { brands: arrayUnion(brandRef.id) });

    const brandWithId = { ...newBrand, id: brandRef.id };
    setBrands((prev) => [...prev, brandWithId]);
    setBrand(brandWithId);
    localStorage.setItem("evolve_current_brand", brandRef.id);
    return brandRef.id;
  };

  return (
    <BrandContext.Provider value={{ brand, brands, loading, selectBrand, createBrand }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) throw new Error("useBrand must be used within BrandProvider");
  return context;
}
