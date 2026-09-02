export type ProductCategory = string;

export type ProductBrand = 'TVS' | 'Bajaj' | 'Universal' | string;

export type QualityTier = 'Original' | 'Alternativa';

export type PricingMode = 'menor' | 'mayor';

export interface Product {
  id: string;
  name: string;
  brand: ProductBrand;
  modelCompatibility: string; // e.g., "TVS King Deluxe / Duramax 200", "Torito Bajaj 2T / 4T / FL"
  category: ProductCategory;
  description?: string;
  imageUrl: string;
  
  // Single SKU - strictly only one SKU
  sku: string;
  skuOriginal?: string;
  skuAlt?: string;
  
  // Quality pricing (Retail / Menor)
  priceOriginal: number;       // Price in Soles S/ for Original Quality (Menor)
  priceOEM?: number;           // Alias for Original price
  priceAlt: number;            // Price in Soles S/ for Alternative Quality (Menor)
  
  // Wholesale pricing (Mayor)
  priceMayorOriginal?: number; // Wholesale Price in Soles S/ for Original Quality
  priceMayorOEM?: number;      // Alias for Original Wholesale price
  priceMayorAlt?: number;      // Wholesale Price in Soles S/ for Alternative Quality
  priceMenor?: number;         // General Retail price
  priceMayor?: number;         // General Wholesale price
  
  // Stock counts
  stockOriginal: number;       // Stock count for Original
  stockOEM?: number;           // Alias for Original stock
  stockAlt: number;            // Stock count for Alternative
  
  brandAltName?: string;       // e.g. "Varroc / Suprajit / Endurance / Bosch"
  isFeatured?: boolean;
  specifications?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quality: QualityTier;
  quantity: number;
  unitPrice: number;
}

export interface StoreSettings {
  whatsappNumber: string; // e.g. "51980722382"
  storeName: string;
  subtitle: string;
  phone: string;
  address: string;
  city: string;
  yapeNumber: string;
  plinNumber: string;
  bcpAccount: string;
  noticeText: string;
}

export interface CustomerOrderDetails {
  customerName: string;
  phone: string;
  cityDistrict: string;
  deliveryMethod: 'domicilio' | 'tienda' | 'agencia';
  agencyName?: string;
  paymentMethod: 'yape' | 'plin' | 'transferencia' | 'efectivo';
  notes?: string;
  mototaxiModel?: string;
}
