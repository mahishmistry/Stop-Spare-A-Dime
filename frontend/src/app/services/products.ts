import { auth } from "./auth";

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:3000";

export type CompareSort = "price" | "rating" | "bang for buck" | "unit price";

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
  const price = item.extracted_price || item.price || 0;
  const pricePerUnit =
    typeof item.price_per_unit === "number" && item.unit_type
      ? `$${item.price_per_unit.toFixed(2)}/${item.unit_type}`
      : undefined;

  return {
    id: item.product_id || item.id || String(index),
    name: item.title || item.name || "Unknown item",
    price,
    store: item.source || item.store || "Unknown store",
    image: item.thumbnail || item.image || "",
    unitPrice: pricePerUnit || item.price || (price ? `$${Number(price).toFixed(2)}` : ""),
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
  userLocation?: string
) {
  if (!product.trim()) return [];

  const headers = await getAuthHeaders();

  const pricesUrl = new URL(`${API_BASE_URL}/api/prices`);
  pricesUrl.searchParams.set("product", product);
  if (userLocation) pricesUrl.searchParams.set("location", userLocation);

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
  if (userLocation) compareUrl.searchParams.set("location", userLocation);

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




//Ava's changings to implement connect store autocomplete for settings page
export async function getStores(): Promise<string[]> {
  try {
    const headers = await getAuthHeaders();
    
    const res = await fetch(`${API_BASE_URL}/api/stores`, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      console.warn(`Failed to fetch stores: ${res.status}`);
      return []; 
    }

    const data = await res.json();
    
    // to make sure it returns an array, even if the backend acts up
    return Array.isArray(data) ? data : [];
    
  } catch (error) {
    console.error("Error fetching stores:", error);
    return [];
  }
}



//Ava's changing for connecting account settings task
export async function updateUserProfile(data: { name?: string; email?: string; zipCode?: string }) {
  const headers = await getAuthHeaders();
  
  // We need to add Content-Type since we are sending a JSON body
  const requestHeaders = {
    ...headers,
    "Content-Type": "application/json",
  };

  const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
    method: "PUT",
    headers: requestHeaders,
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}

export async function updateUserNotifications(enabled: boolean) {
  const headers = await getAuthHeaders();
  const requestHeaders = {
    ...headers,
    "Content-Type": "application/json",
  };

  const res = await fetch(`${API_BASE_URL}/api/user/notifications`, {
    method: "PUT",
    headers: requestHeaders,
    body: JSON.stringify({ enabled }),
  });

  if (!res.ok) throw new Error("Failed to update notifications");
  return res.json();
}

//connecting history page , need search history func - ava
export async function getSearchHistory() {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/history`, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      console.warn(`Failed to fetch history: ${res.status}`);
      return []; 
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching search history:", error);
    return [];
  }
}
