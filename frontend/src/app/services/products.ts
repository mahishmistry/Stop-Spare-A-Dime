const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:3000";

export type CompareSort = "price" | "rating" | "bang for buck";

function normalizeProduct(item: any, index: number) {
  return {
    id: item.product_id || item.id || String(index),
    name: item.title || item.name || "Unknown item",
    price: item.extracted_price || item.price || 0,
    store: item.source || item.store || "Unknown store",
    image: item.thumbnail || item.image || "",
    unitPrice: item.price || "",
    snapEligible: item.snapEligible ?? true,
    loyaltyProgramIndicator: item.loyaltyProgramIndicator ?? false,
  };
}

export async function getComparedProducts(
  criteria: CompareSort = "price",
  k: number = 20
) {
  const url = new URL(`${API_BASE_URL}/api/compare`);
  url.searchParams.set("criteria", criteria);
  url.searchParams.set("k", String(k));

  const res = await fetch(url.toString(), {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch compared products");
  }

  const data = await res.json();

  return Array.isArray(data)
    ? data.map(normalizeProduct)
    : [];
}