"use client";

import { useState, useEffect } from "react";
import { subscribeToCollection } from "@/lib/firestore";
import { useBrand } from "@/lib/brand-context";

export function useCollection<T>(collectionName: string, orderField: string = "createdAt") {
  const { brand } = useBrand();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!brand?.id) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToCollection<T>(brand.id, collectionName, (data) => {
      setItems(data);
      setLoading(false);
    }, orderField);

    return unsubscribe;
  }, [brand?.id, collectionName, orderField]);

  return { items, loading };
}
