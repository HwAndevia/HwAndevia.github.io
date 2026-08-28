export type ProductCategory = string;

export type ProductBrand = 'TVS' | 'Bajaj' | 'Universal' | string;

export type QualityTier = 'OEM' | 'Alternativa';

export interface Product {
  id: string;
  name: string;
  brand: ProductBrand;
  modelCompatibility: string; // e.g., "TVS King Deluxe / Duramax 200", "Torito Bajaj 2T / 4T / FL"
  category: ProductCategory;
  description: string;
  imageUrl: string;
  
  // Quality pricing and stock
  priceOEM: number;       // Price in Soles S/ for OEM Quality
  priceAlt: number;       // Price in Soles S/ for Good Quality Alternative
  stockOEM: number;       // Stock count for OEM
  stockAlt: number;       // Stock count for Alternative
  
  skuOEM?: string;
  skuAlt?: string;
  brandAltName?: string;  // e.g. "Varroc / Suprajit / Endurance / Bosch"
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
  whatsappNumber: string; // e.g. "51987654321"
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
