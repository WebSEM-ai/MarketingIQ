import { callTool } from "./mcp-client";
import type { ShoppingProduct, ProductDetail } from "@/lib/types/shopping";

const SERVICE = "google-shopping";
const TIMEOUT = 15000;

export async function searchProducts(
  query: string,
  country?: string,
  options?: {
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
  }
): Promise<ShoppingProduct[]> {
  const args: Record<string, unknown> = { query };
  if (country) args.country = country.toLowerCase();
  if (options?.minPrice !== undefined) args.min_price = options.minPrice;
  if (options?.maxPrice !== undefined) args.max_price = options.maxPrice;
  if (options?.condition) args.condition = options.condition;

  const raw = (await callTool(SERVICE, "search_products", args, TIMEOUT)) as Record<string, unknown>;

  const results = (raw.shopping_results || raw.results || []) as Array<Record<string, unknown>>;
  if (!Array.isArray(results)) return [];

  return results.map((item, idx) => ({
    position: (item.position as number) || idx + 1,
    productId: (item.product_id as string) || "",
    title: (item.title as string) || "",
    price: (item.price as string) || "",
    extractedPrice: (item.extracted_price as number) ?? null,
    rating: (item.rating as number) ?? null,
    reviews: (item.reviews as number) ?? null,
    seller: (item.seller as string) || "",
    thumbnail: item.thumbnail as string | undefined,
    productLink: item.product_link as string | undefined,
    delivery: (item.delivery_return as string) || (item.delivery as string) || undefined,
    condition: item.condition as string | undefined,
  }));
}

export async function filterByPriceRange(
  query: string,
  minPrice: number,
  maxPrice: number,
  country?: string,
  sortBy?: string
): Promise<ShoppingProduct[]> {
  const args: Record<string, unknown> = {
    query,
    min_price: minPrice,
    max_price: maxPrice,
  };
  if (country) args.country = country.toLowerCase();
  if (sortBy) args.sort_by = sortBy;

  const raw = (await callTool(SERVICE, "filter_by_price_range", args, TIMEOUT)) as Record<string, unknown>;

  const results = (raw.shopping_results || raw.results || []) as Array<Record<string, unknown>>;
  if (!Array.isArray(results)) return [];

  return results.map((item, idx) => ({
    position: (item.position as number) || idx + 1,
    productId: (item.product_id as string) || "",
    title: (item.title as string) || "",
    price: (item.price as string) || "",
    extractedPrice: (item.extracted_price as number) ?? null,
    rating: (item.rating as number) ?? null,
    reviews: (item.reviews as number) ?? null,
    seller: (item.seller as string) || "",
    thumbnail: item.thumbnail as string | undefined,
    productLink: item.product_link as string | undefined,
    delivery: (item.delivery_return as string) || (item.delivery as string) || undefined,
    condition: item.condition as string | undefined,
  }));
}

export async function getProductDetails(
  productId: string,
  country?: string
): Promise<ProductDetail> {
  const args: Record<string, unknown> = { product_id: productId };
  if (country) args.country = country.toLowerCase();

  const raw = (await callTool(SERVICE, "get_product_details", args, TIMEOUT)) as Record<string, unknown>;

  const prices = (raw.prices || raw.sellers || []) as Array<Record<string, unknown>>;
  const specs = (raw.specifications || raw.specs || {}) as Record<string, string>;

  return {
    productId,
    title: (raw.title as string) || "",
    description: raw.description as string | undefined,
    prices: Array.isArray(prices)
      ? prices.map((p) => ({
          seller: (p.seller as string) || (p.name as string) || "",
          price: (p.price as string) || "",
          extractedPrice: (p.extracted_price as number) ?? null,
          url: p.url as string | undefined,
          delivery: (p.delivery as string) || (p.delivery_return as string) || undefined,
        }))
      : [],
    specs: typeof specs === "object" ? specs : undefined,
    rating: raw.rating as number | undefined,
    reviews: (raw.reviews as number) || (raw.review_count as number) || undefined,
    images: Array.isArray(raw.images) ? (raw.images as string[]) : undefined,
  };
}

export async function comparePrices(
  productId: string,
  country?: string
): Promise<Array<{ seller: string; price: string; extractedPrice: number | null; url?: string; delivery?: string }>> {
  const args: Record<string, unknown> = { product_id: productId };
  if (country) args.country = country.toLowerCase();

  const raw = (await callTool(SERVICE, "compare_prices", args, TIMEOUT)) as Record<string, unknown>;

  const sellers = (raw.sellers || raw.prices || raw.comparison || []) as Array<Record<string, unknown>>;
  if (!Array.isArray(sellers)) return [];

  return sellers.map((s) => ({
    seller: (s.seller as string) || (s.name as string) || "",
    price: (s.price as string) || "",
    extractedPrice: (s.extracted_price as number) ?? null,
    url: s.url as string | undefined,
    delivery: (s.delivery as string) || (s.delivery_return as string) || undefined,
  }));
}
