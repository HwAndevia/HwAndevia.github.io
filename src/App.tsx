import React, { useState, useEffect, useMemo } from 'react';
import { Product, ProductCategory, ProductBrand, QualityTier, CartItem, StoreSettings } from './types';
import { 
  fetchProducts, 
  fetchSettings 
} from './services/api';

import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer, getCartItemPriceInfo } from './components/CartDrawer';
import { WhatsAppButton } from './components/WhatsAppButton';
import { Footer } from './components/Footer';
import { ChatIA } from './components/ChatIA';

import { Loader2, RefreshCw, Check, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

const DEFAULT_STORE_SETTINGS: StoreSettings = {
  whatsappNumber: '51980722382',
  storeName: 'HW ANDEVIA - Repuestos TVS & Torito Bajaj',
  subtitle: 'Especialistas en repuestos originales y alternativos para mototaxis',
  phone: '+51 980 722 382',
  city: 'Lima, Perú',
  address: 'Av. Nicolás Ayllón, Lima, Perú',
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
    quality: 'Original' | 'Alternativa';
  } | null>(null);

  // Modals State
  const [selectedProductDetail, setSelectedProductDetail] = useState<{
    product: Product;
    quality: QualityTier;
  } | null>(null);

  const handleOpenDetail = (product: Product, initialQuality?: QualityTier) => {
    setSelectedProductDetail({
      product,
      quality: initialQuality || 'Original'
    });
  };

  const handleOpenChatIA = (product?: Product, quality?: QualityTier, quantity?: number) => {
    if (product) {
      setChatProductContext({
        product,
        quality: quality || 'Original',
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

        fetch(healthUrl, { method: 'GET', mode: 'cors' })
          .catch(() => {
            return fetch(urlObj.origin, { method: 'GET', mode: 'cors' });
          })
          .catch(() => {});
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
      // Quality filter
      if (selectedQuality === 'Original' && Number(p.stockOriginal ?? p.stockOEM ?? 0) <= 0 && Number(p.priceOriginal ?? p.priceOEM ?? 0) <= 0) {
        return false;
      }
      if (selectedQuality === 'Alternativa' && Number(p.stockAlt ?? 0) <= 0 && Number(p.priceAlt ?? 0) <= 0) {
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
          p.brandAltName || '',
          p.sku || '',
          p.skuOriginal || '',
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
  }, [products, selectedBrand, selectedCategory, selectedQuality, searchQuery]);

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
    const priceOriginal = Number(product.priceOriginal ?? product.priceOEM ?? 0);
    const priceAlt = Number(product.priceAlt ?? 0);
    const unitPrice = quality === 'Original' ? priceOriginal : priceAlt;
    
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

    // Disparo de fuegos artificiales / confeti silencioso
    triggerConfetti();

    // Toast feedback
    showToast('Añadido al carrito de compras');
  };

  const triggerConfetti = () => {
    try {
      // Disparo central tipo fuegos artificiales
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#FBBF24', '#8B5CF6'],
        disableForReducedMotion: true,
      });

      // Disparos laterales adicionales estilo fuegos artificiales
      setTimeout(() => {
        confetti({
          particleCount: 45,
          angle: 60,
          spread: 55,
          origin: { x: 0.15, y: 0.65 },
          colors: ['#10B981', '#F59E0B', '#FBBF24', '#EF4444']
        });
        confetti({
          particleCount: 45,
          angle: 120,
          spread: 55,
          origin: { x: 0.85, y: 0.65 },
          colors: ['#10B981', '#F59E0B', '#FBBF24', '#3B82F6']
        });
      }, 180);
    } catch {
      // Fallback silencioso si no soporta canvas
    }
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

  const subtotal = cart.reduce((sum, item) => {
    const { unitPrice } = getCartItemPriceInfo(item);
    return sum + unitPrice * (Number(item.quantity) || 1);
  }, 0);
  const cartTotal = subtotal * 1.18;
  const cartCount = cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  const scrollToProducts = () => {
    const el = document.getElementById('catalog-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-red-500 selection:text-white">
      
      {/* Toast Notification Centrado y Grande con fondo blanco, flecha hacia el carrito y desenfoque de fondo al 60% */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none p-4 bg-slate-950/60 backdrop-blur-md overflow-hidden"
          >
            {/* Animated Multicolor Arrow On Top of backdrop pointing directly to the Cart Button */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-[65]"
              viewBox="0 0 1000 1000"
              preserveAspectRatio="none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Dynamic Multicolor Gradient */}
                <linearGradient id="arrow-multicolor" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#EF4444">
                    <animate attributeName="stop-color" values="#EF4444;#F59E0B;#10B981;#3B82F6;#EC4899;#EF4444" dur="2s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="35%" stopColor="#F59E0B">
                    <animate attributeName="stop-color" values="#F59E0B;#10B981;#3B82F6;#EC4899;#EF4444;#F59E0B" dur="2s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="70%" stopColor="#10B981">
                    <animate attributeName="stop-color" values="#10B981;#3B82F6;#EC4899;#EF4444;#F59E0B;#10B981" dur="2s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="100%" stopColor="#3B82F6">
                    <animate attributeName="stop-color" values="#3B82F6;#EC4899;#EF4444;#F59E0B;#10B981;#3B82F6" dur="2s" repeatCount="indefinite" />
                  </stop>
                </linearGradient>

                <marker
                  id="multicolor-arrowhead"
                  viewBox="0 0 10 10"
                  refX="5"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="url(#arrow-multicolor)" />
                </marker>

                <filter id="multicolor-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor="#F59E0B" floodOpacity="0.8" />
                </filter>
              </defs>

              {/* Trajectory path from center (500, 500) sweeping up pointing right towards top-right cart (890, 75) */}
              <motion.path
                d="M 500 500 C 640 460, 800 280, 890 75"
                stroke="url(#arrow-multicolor)"
                strokeWidth="12"
                strokeDasharray="16 10"
                strokeLinecap="round"
                markerEnd="url(#multicolor-arrowhead)"
                filter="url(#multicolor-glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: [0, 1, 0.94, 1], 
                  opacity: 1 
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 0.85, 
                  times: [0, 0.65, 0.8, 1],
                  ease: 'easeInOut' 
                }}
              />
            </svg>

            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="relative z-[70] bg-white text-slate-950 border-3 border-emerald-500 px-8 sm:px-10 py-6 sm:py-7 rounded-3xl shadow-2xl flex items-center gap-5 text-xl sm:text-2xl font-black max-w-lg text-center transform ring-8 ring-emerald-500/20"
            >
              <div className="p-3.5 sm:p-4 bg-emerald-100 text-emerald-700 rounded-2xl shrink-0 shadow-xs">
                <Check className="w-8 h-8 sm:w-10 sm:h-10 stroke-[3.5]" />
              </div>
              <span className="leading-snug tracking-tight">{toastMessage}</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
        isHighlightCart={Boolean(toastMessage)}
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
      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedQuality={selectedQuality}
        onSelectQuality={setSelectedQuality}
        categoryCounts={categoryCounts}
      />

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
              type="button"
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
              type="button"
              onClick={loadData}
              className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              Reintentar
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
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
              type="button"
              onClick={() => {
                setSelectedBrand('Todos');
                setSelectedCategory('Todas');
                setSelectedQuality('Todas');
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
                onOpenDetail={handleOpenDetail}
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
        product={selectedProductDetail?.product || null}
        initialQuality={selectedProductDetail?.quality || 'Original'}
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

    </div>
  );
}
