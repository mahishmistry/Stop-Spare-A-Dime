import { auth } from "./auth";

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:3000";

export type CompareSort = "price" | "rating" | "bang for buck";

export async function registerCurrentUser() {
  const token = await auth.currentUser?.getIdToken();
  const user = auth.currentUser;

  if (!token || !user?.email) {
    throw new Error("No Firebase user to register");
  }

  const res = await fetch(`${API_BASE_URL}/api/user/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      email: user.email,
      name: user.displayName || user.email,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to register user: ${res.status} ${text}`);
  }

  return await res.json();
}

function normalizeProduct(item: any, index: number) {
  return {
    id: item.product_id || item.id || String(index),
    name: item.title || item.name || "Unknown item",
    price: item.extracted_price || item.price || 0,
    store: item.source || item.store || "Unknown store",
    image: item.thumbnail || item.image || "",
    unitPrice: item.price || "",
    snapEligible: item.snapEligible ?? true,
  };
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await auth.currentUser?.getIdToken();

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

export async function searchAndCompareProducts(
  product: string,
  criteria: CompareSort = "price",
  k: number = 20,
  zipCode?: string
) {
  if (!product.trim()) return [];

  const headers = await getAuthHeaders();

  const pricesUrl = new URL(`${API_BASE_URL}/api/prices`);
  pricesUrl.searchParams.set("product", product);
  if (zipCode) pricesUrl.searchParams.set("zipCode", zipCode);

  const pricesRes = await fetch(pricesUrl.toString(), {
    method: "GET",
    headers,
  });

  if (!pricesRes.ok) {
    throw new Error(`Failed to search products: ${pricesRes.status}`);
  }

  const compareUrl = new URL(`${API_BASE_URL}/api/compare`);
  compareUrl.searchParams.set("product", product);
  compareUrl.searchParams.set("criteria", criteria);
  compareUrl.searchParams.set("k", String(k));
  if (zipCode) compareUrl.searchParams.set("zipCode", zipCode);

  const compareRes = await fetch(compareUrl.toString(), {
    method: "GET",
    headers,
  });

  if (!compareRes.ok) {
    throw new Error(`Failed to compare products: ${compareRes.status}`);
  }

  const data = await compareRes.json();

  return Array.isArray(data)
    ? data.map(normalizeProduct)
    : [];
}