import { Product, StoreSettings } from '../types';

const DEFAULT_SETTINGS: StoreSettings = {
  whatsappNumber: '51980722382',
  storeName: 'HW ANDEVIA IMPORT - Repuestos TVS & Torito Bajaj',
  subtitle: 'Especialistas en repuestos originales y alternativos para mototaxis',
  phone: '+51 980 722 382',
  address: 'Av. Nicolás Ayllón, Lima, Perú',
  city: 'Lima, Perú',
  yapeNumber: '980 722 382',
  plinNumber: '980 722 382',
  bcpAccount: '191-98765432-0-12',
  noticeText: 'Envíos diarios a todo el Perú por Shalom, Marvisur y Olva Courier.'
};

export const fetchProducts = async (): Promise<Product[]> => {
  const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const timestamp = Date.now();

  // Posibles rutas para garantizar compatibilidad con dev, prod, previews y static hosting
  const endpoints = [
    `${cleanBase}productos.json?v=${timestamp}`,
    `/productos.json?v=${timestamp}`,
    `./productos.json?v=${timestamp}`,
    `productos.json?v=${timestamp}`,
    `/api/products?v=${timestamp}`
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          return data.map((p: any, idx: number): Product => {
            const priceOrig = Number(p.priceOriginal ?? p.priceOEM ?? p.price ?? p.priceMenor ?? 0);
            const priceAlternative = Number(p.priceAlt ?? p.priceAlternative ?? (priceOrig > 0 ? Math.round(priceOrig * 0.6) : 0));
            const priceMayorOrig = Number(p.priceMayorOriginal ?? p.priceMayorOEM ?? p.priceMayor ?? (priceOrig > 0 ? Math.round(priceOrig * 0.85) : 0));
            const priceMayorAlternative = Number(p.priceMayorAlt ?? (priceAlternative > 0 ? Math.round(priceAlternative * 0.85) : 0));
            const stockOrig = Number(p.stockOriginal ?? p.stockOEM ?? p.stock ?? 10);
            const stockAlternative = Number(p.stockAlt ?? p.stockAlternative ?? 15);
            const cleanSku = String(p.sku || p.skuOriginal || `SKU-${idx + 1}`);

            return {
              id: String(p.id || `p-${idx + 1}`),
              name: String(p.name || 'Repuesto Mototaxi'),
              brand: p.brand || 'Universal',
              modelCompatibility: String(p.modelCompatibility || 'TVS King / Torito Bajaj'),
              category: String(p.category || 'General'),
              description: String(p.description || `Repuesto para mototaxi ${p.brand || ''} ${p.modelCompatibility || ''}.`),
              imageUrl: String(p.imageUrl || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=600'),
              priceOriginal: priceOrig,
              priceOEM: priceOrig,
              priceAlt: priceAlternative,
              priceMayorOriginal: priceMayorOrig,
              priceMayorOEM: priceMayorOrig,
              priceMayorAlt: priceMayorAlternative,
              priceMenor: priceOrig,
              priceMayor: priceMayorOrig,
              stockOriginal: stockOrig,
              stockOEM: stockOrig,
              stockAlt: stockAlternative,
              sku: cleanSku,
              skuOriginal: cleanSku,
              skuAlt: cleanSku,
              brandAltName: p.brandAltName || 'Marca Certificada A1',
              isFeatured: Boolean(p.isFeatured),
              specifications: p.specifications || {}
            };
          });
        }
      }
    } catch {
      continue;
    }
  }

  console.warn('No se pudo cargar productos.json desde ninguna de las rutas de catálogo.');
  return [];
};

export const createProduct = async (productData: Omit<Product, 'id'>): Promise<Product> => {
  const newProduct: Product = {
    ...productData,
    id: `p-${Date.now()}`
  };
  return newProduct;
};

export const updateProduct = async (id: string, updates: Partial<Product>): Promise<Product> => {
  return { id, ...updates } as Product;
};

export const deleteProduct = async (id: string): Promise<{ success: boolean; deletedId: string }> => {
  return { success: true, deletedId: id };
};

export const resetCatalog = async (): Promise<Product[]> => {
  return fetchProducts();
};

export const fetchSettings = async (): Promise<StoreSettings> => {
  return DEFAULT_SETTINGS;
};

export const updateSettings = async (settings: Partial<StoreSettings>): Promise<StoreSettings> => {
  return { ...DEFAULT_SETTINGS, ...settings };
};
