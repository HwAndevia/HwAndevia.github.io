import { Product, StoreSettings } from '../types';

const DEFAULT_SETTINGS: StoreSettings = {
  whatsappNumber: '51980722382',
  storeName: 'HW ANDEVIA IMPORT - Repuestos TVS & Torito Bajaj',
  subtitle: 'Especialistas en repuestos originales y alternativos para mototaxis',
  phone: '+51 980 722 382',
  address:'',
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

  // Posibles rutas para garantizar compatibilidad con dev, prod, GitHub Pages, previews y API Express
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
          return data.map((p, idx) => ({
            ...p,
            id: p.id || `p-${idx + 1}`
          }));
        }
      }
    } catch {
      // Intentar la siguiente ruta
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
