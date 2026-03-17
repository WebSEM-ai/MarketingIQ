export interface ShoppingProduct {
  position: number;
  productId: string;
  title: string;
  price: string;
  extractedPrice: number | null;
  rating: number | null;
  reviews: number | null;
  seller: string;
  thumbnail?: string;
  productLink?: string;
  delivery?: string;
  condition?: string;
}

export interface PriceRange {
  min: number;
  max: number;
  avg: number;
  currency: string;
  sellerCount: number;
}

export interface ProductDetail {
  productId: string;
  title: string;
  description?: string;
  prices: Array<{
    seller: string;
    price: string;
    extractedPrice: number | null;
    url?: string;
    delivery?: string;
  }>;
  specs?: Record<string, string>;
  rating?: number;
  reviews?: number;
  images?: string[];
}

export interface ShoppingAnalysis {
  query: string;
  country: string;
  products: ShoppingProduct[];
  priceRange?: PriceRange;
  aiInsights?: string;
}
