import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  setDoc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export function getBrandCollection(brandId: string, collectionName: string) {
  return collection(db, "brands", brandId, collectionName);
}

export function getBrandDoc(brandId: string, collectionName: string, docId: string) {
  return doc(db, "brands", brandId, collectionName, docId);
}

export async function addEntry<T extends Record<string, unknown>>(
  brandId: string,
  collectionName: string,
  data: T
): Promise<string> {
  const ref = await addDoc(getBrandCollection(brandId, collectionName), {
    ...data,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateEntry<T extends Record<string, unknown>>(
  brandId: string,
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<void> {
  await updateDoc(getBrandDoc(brandId, collectionName, docId), data as Record<string, unknown>);
}

export async function deleteEntry(
  brandId: string,
  collectionName: string,
  docId: string
): Promise<void> {
  await deleteDoc(getBrandDoc(brandId, collectionName, docId));
}

export async function setEntry<T extends Record<string, unknown>>(
  brandId: string,
  collectionName: string,
  docId: string,
  data: T
): Promise<void> {
  await setDoc(getBrandDoc(brandId, collectionName, docId), {
    ...data,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

export async function getEntry<T>(
  brandId: string,
  collectionName: string,
  docId: string
): Promise<T | null> {
  const snap = await getDoc(getBrandDoc(brandId, collectionName, docId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as T;
}

export function subscribeToCollection<T>(
  brandId: string,
  collectionName: string,
  callback: (items: T[]) => void,
  orderField: string = "createdAt"
) {
  const q = query(getBrandCollection(brandId, collectionName), orderBy(orderField, "desc"));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
    callback(items);
  });
}

export async function updateBrandSettings(
  brandId: string,
  settings: Record<string, unknown>
): Promise<void> {
  const brandRef = doc(db, "brands", brandId);
  await updateDoc(brandRef, settings);
}
