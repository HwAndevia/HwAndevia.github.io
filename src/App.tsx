import React, { useState, useEffect, useMemo } from 'react';
import { Product, ProductCategory, ProductBrand, QualityTier, CartItem, StoreSettings } from './types';
import { 
  fetchProducts, 
  fetchSettings 
} from './services/api';

import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
//import { CategoryFilter } from './components/CategoryFilter';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { WhatsAppButton } from './components/WhatsAppButton';
import { Footer } from './components/Footer';
import { ChatIA } from './components/ChatIA';
import { BuyModal } from './components/BuyModal';

import { Loader2, RefreshCw, Check, Sparkles } from 'lucide-react';

const DEFAULT_STORE_SETTINGS: StoreSettings = {
  whatsappNumber: '51980722382',
  storeName: 'HW ANDEVIA - Repuestos TVS & Torito Bajaj',
  subtitle: 'Especialistas en repuestos originales y alternativos para mototaxis',
  phone: '+51 980 722 382',
  city: 'Lima, Perú',
  address: '',
  yapeNumber: '980 722 382',
  plinNumber: '980 722 382',
  bcpAccount: '191-98765432-0-12',
  noticeText: 'Envíos diarios a todo el Perú por Shalom, Marvisur y Olva Courier.'
};

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [selectedBrand, setSelectedBrand] = useState<ProductBrand | 'Todos'>('Todos');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'Todas'>('Todas');
  const [selectedQuality, setSelectedQuality] = useState<QualityTier | 'Todas'>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Chat IA State
  const [isChatIAOpen, setIsChatIAOpen] = useState<boolean>(false);
  const [chatProductContext, setChatProductContext] = useState<{
    product: Product;
    quantity: number;
    quality: 'OEM' | 'Alternativa';
  } | null>(null);

  // Buy Modal State
  const [buyModalContext, setBuyModalContext] = useState<{
    product: Product;
    quality: QualityTier;
  } | null>(null);

  const handleOpenBuyModal = (product: Product, quality: QualityTier) => {
    setBuyModalContext({ product, quality });
  };

  // Modals State
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);

  const handleOpenChatIA = (product?: Product, quality?: QualityTier, quantity?: number) => {
    if (product) {
      setChatProductContext({
        product,
        quality: quality || 'OEM',
        quantity: quantity || 1
      });
    } else {
      setChatProductContext(null);
    }
    setIsChatIAOpen(true);
  };

  // Initial Data Fetching from dynamic endpoints / productos.json
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedProds, fetchedSets] = await Promise.all([
        fetchProducts(),
        fetchSettings()
      ]);
      setProducts(fetchedProds || []);
      if (fetchedSets) {
        setSettings(fetchedSets);
      }
    } catch (err: any) {
      console.error('Error cargando datos:', err);
      setError('No se pudo cargar el catálogo de repuestos. Por favor, reintenta.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Warm-up ping en segundo plano para despertar el backend en Render
    const chatbotUrl =
      (import.meta.env.VITE_CHATBOT_URL as string) ||
      ((typeof process !== 'undefined' && (process.env as any)?.REACT_APP_CHATBOT_URL) as string) ||
      'https://backend-chat-ia-eenf.onrender.com/chat';

    if (chatbotUrl && chatbotUrl.startsWith('http')) {
      try {
        const urlObj = new URL(chatbotUrl);
        const healthUrl = `${urlObj.origin}/health`;

        // Petición GET silenciosa de calentamiento
        fetch(healthUrl, { method: 'GET', mode: 'cors' })
          .catch(() => {
            return fetch(urlObj.origin, { method: 'GET', mode: 'cors' });
          })
          .catch(() => {
            // Ignorado intencionalmente
          });
      } catch {
        fetch(chatbotUrl, { method: 'GET', mode: 'cors' }).catch(() => {});
      }
    }
  }, []);

  // Filter products logic
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Brand filter
      if (selectedBrand !== 'Todos' && p.brand !== selectedBrand && p.brand !== 'Universal') {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'Todas' && p.category !== selectedCategory) {
        return false;
      }
      // Search Query: multi-term token search across all relevant fields
      if (searchQuery && searchQuery.trim()) {
        const terms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
        const searchableText = [
          p.name || '',
          p.brand || '',
          p.category || '',
          p.modelCompatibility || '',
          p.description || '',
          p.brandAltName || '',
          p.skuOEM || '',
          p.skuAlt || '',
          ...(p.specifications ? Object.entries(p.specifications).map(([k, v]) => `${k} ${v}`) : [])
        ].join(' ').toLowerCase();

        const allTermsMatch = terms.every((term) => searchableText.includes(term));
        if (!allTermsMatch) {
          return false;
        }
      }
      return true;
    });
  }, [products, selectedBrand, selectedCategory, searchQuery]);

  // Calculate counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 'Todas': products.length };
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Cart operations
  const handleAddToCart = (product: Product, quality: QualityTier, quantity: number = 1) => {
    const unitPrice = quality === 'OEM' ? product.priceOEM : product.priceAlt;
    
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.product.id === product.id && item.quality === quality
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [...prevCart, { product, quality, quantity, unitPrice }];
      }
    });

    // Toast feedback
    const qualityLabel = quality === 'OEM' ? 'Original' : 'Alternativa';
    showToast(`¡Añadido al carrito: ${product.name} (${qualityLabel})!`);
  };

  const handleUpdateCartQuantity = (productId: string, quality: QualityTier, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(productId, quality);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId && item.quality === quality
          ? { ...item, quantity: newQty }
          : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string, quality: QualityTier) => {
    setCart((prev) => prev.filter((item) => !(item.product.id === productId && item.quality === quality)));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const scrollToProducts = () => {
    const el = document.getElementById('catalog-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-red-500 selection:text-white">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white border border-slate-700 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <div className="p-1 bg-emerald-500 text-slate-950 rounded-full">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Store Layout */}
      {/* Header */}
      <Navbar
        settings={settings}
        selectedBrand={selectedBrand}
        onSelectBrand={setSelectedBrand}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenChatIA={() => handleOpenChatIA()}
      />

          {/* Hero Banner (hidden during active search to maximize product visibility) */}
          {!searchQuery.trim() && (
            <HeroBanner
              onSelectBrand={(brand) => {
                setSelectedBrand(brand);
                scrollToProducts();
              }}
              onScrollToProducts={scrollToProducts}
            />
          )}

          {/* Sticky Category & Quality Filter Bar */}
          {/*<CategoryFilter
       //     selectedCategory={selectedCategory}
       //     onSelectCategory={setSelectedCategory}
       //     selectedQuality={selectedQuality}
       //     onSelectQuality={setSelectedQuality}
       //     categoryCounts={categoryCounts}
          />*/}

          {/* Main Product Catalog Section */}
          <main id="catalog-section" className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            
            {/* Catalog Section Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Catálogo de Repuestos
                  </h2>
                  <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-200">
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
                  </span>
                </div>
              </div>

              {/* Active Filters Reset */}
              {(selectedBrand !== 'Todos' || selectedCategory !== 'Todas' || selectedQuality !== 'Todas' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedBrand('Todos');
                    setSelectedCategory('Todas');
                    setSelectedQuality('Todas');
                    setSearchQuery('');
                  }}
                  className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Limpiar todos los filtros</span>
                </button>
              )}
            </div>

            {/* Loading / Error States */}
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <Loader2 className="w-10 h-10 animate-spin text-red-600 mx-auto" />
                <p className="text-sm font-bold text-slate-600">Cargando catálogo de repuestos...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center space-y-3">
                <p className="font-bold text-sm">{error}</p>
                <button
                  onClick={loadData}
                  className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
                >
                  Reintentar
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="font-black text-slate-800 text-lg">
                  No encontramos repuestos en esta categoría
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Prueba cambiando la marca (TVS / Torito Bajaj), la categoría de repuestos o el término de búsqueda.
                </p>
                <button
                  onClick={() => {
                    setSelectedBrand('Todos');
                    setSelectedCategory('Todas');
                    setSearchQuery('');
                  }}
                  className="bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Ver todos los repuestos
                </button>
              </div>
            ) : (
              /* Product Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onOpenDetail={setSelectedProductDetail}
                    onOpenBuyModal={handleOpenBuyModal}
                    onOpenChatIA={(p, qual, qty) => handleOpenChatIA(p, qual, qty)}
                    whatsappNumber={settings.whatsappNumber}
                  />
                ))}
              </div>
            )}

          </main>

          {/* Footer */}
          <Footer
            settings={settings}
          />

          {/* Floating WhatsApp Button */}
          <WhatsAppButton whatsappNumber={settings.whatsappNumber} />

      {/* Cart Drawer Modal */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        settings={settings}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProductDetail}
        onClose={() => setSelectedProductDetail(null)}
        onAddToCart={handleAddToCart}
        onOpenChatIA={(p, qual, qty) => handleOpenChatIA(p, qual, qty)}
        whatsappNumber={settings.whatsappNumber}
      />

      {/* Chat IA Modal */}
      <ChatIA
        isOpen={isChatIAOpen}
        onClose={() => setIsChatIAOpen(false)}
        productContext={chatProductContext}
        whatsappNumber={settings.whatsappNumber}
      />

      {/* Buy Modal (Recuadro Grande de Compra) */}
      <BuyModal
        isOpen={!!buyModalContext}
        product={buyModalContext?.product || null}
        initialQuality={buyModalContext?.quality || 'OEM'}
        onClose={() => setBuyModalContext(null)}
        onAddToCart={handleAddToCart}
        onOpenChatIA={(p, qual, qty) => handleOpenChatIA(p, qual, qty)}
        whatsappNumber={settings.whatsappNumber}
      />

    </div>
  );
}
