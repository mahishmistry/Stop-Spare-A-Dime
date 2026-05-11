import { getToken } from "./auth.ts";

export async function apiFetchBlacklist(): Promise<string[]> {
  const token = await getToken(); // get logged in state
  if (!token) return []; // if not logged in, no blacklisted stores.

  const res = await fetch("http://localhost:3000/api/block", {
    headers: { Authorization: `Bearer ${token}` },
  }); // get fetched blacklist from backend for that user

  if (!res.ok) throw new Error("Failed to load blocked stores");
  const data = await res.json();
  return data.blockedStores ?? [];
}

export function normalizeStoreName(store: string): string {
  return store.trim().toLowerCase();
}

export function isBlockedStore(
  storeName: string,
  blockedStores: string[]
): boolean {
  const normalizedStore = normalizeStoreName(storeName);

  return blockedStores.some((blockedStore) =>
    normalizedStore.includes(normalizeStoreName(blockedStore))
  );
}