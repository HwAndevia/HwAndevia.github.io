import React, { useState, useEffect } from 'react';
import { Product, QualityTier, PricingMode } from '../types';
import { 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  Wrench, 
  Check, 
  Bot, 
  PhoneCall, 
  ShoppingCart, 
  PackageCheck, 
  Tag, 
  Sparkles,
  Share2,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  initialQuality?: QualityTier;
  onClose: () => void;
  onAddToCart: (product: Product, quality: QualityTier, quantity: number) => void;
  onOpenChatIA?: (product: Product, quality: QualityTier, quantity: number) => void;
  whatsappNumber?: string;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  initialQuality = 'Original',
  onClose,
  onAddToCart,
  onOpenChatIA,
  whatsappNumber = '51980722382',
}) => {
  const [selectedQuality, setSelectedQuality] = useState<QualityTier>(initialQuality);
  const [pricingMode, setPricingMode] = useState<PricingMode>('menor');
  const [quantity, setQuantity] = useState<number>(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [showSpecs, setShowSpecs] = useState(false);

  const showNotice = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => {
      setNoticeMessage(null);
    }, 3500);
  };

  useEffect(() => {
    if (product) {
      setSelectedQuality(initialQuality || 'Original');
      setPricingMode('menor');
      setQuantity(1);
      setNoticeMessage(null);
      setShowSpecs(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [product?.id, initialQuality]);

  // Listener para cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!product) return null;

  // Precios al por menor
  const priceMenorOriginal = Number(product.priceOriginal ?? product.priceOEM ?? product.priceMenor ?? 0);
  const priceMenorAlt = Number(product.priceAlt ?? 0);

  // Precios al por mayor
  const priceMayorOriginal = Number(
    product.priceMayorOriginal ?? 
    product.priceMayorOEM ?? 
    product.priceMayor ?? 
    (priceMenorOriginal > 0 ? Math.round(priceMenorOriginal * 0.85) : 0)
  );
  const priceMayorAlt = Number(
    product.priceMayorAlt ?? 
    (priceMenorAlt > 0 ? Math.round(priceMenorAlt * 0.85) : 0)
  );

  // Precios según modalidad seleccionada
  const currentPriceOriginal = pricingMode === 'mayor' ? priceMayorOriginal : priceMenorOriginal;
  const currentPriceAlt = pricingMode === 'mayor' ? priceMayorAlt : priceMenorAlt;

  // Precio y stock activo según calidad
  const currentPrice = selectedQuality === 'Original' ? currentPriceOriginal : currentPriceAlt;
  const stockOriginal = Number(product.stockOriginal ?? product.stockOEM ?? 0);
  const stockAlt = Number(product.stockAlt ?? 0);
  const currentStock = selectedQuality === 'Original' ? stockOriginal : stockAlt;

  // SKU único
  const currentSku = product.sku || product.skuOriginal || '';
  const isOutOfStock = currentStock <= 0;
  const subtotal = (currentPrice || 0) * quantity;
  const igvAmount = subtotal * 0.18;
  const totalAPagar = subtotal + igvAmount;

  // Manejador de selección de modalidad Por Menor
  const handleSelectMenor = () => {
    setPricingMode('menor');
    if (quantity >= 3) {
      setQuantity(1);
    }
  };

  // Manejador de selección de modalidad Por Mayor (mínimo 3 unidades)
  const handleSelectMayor = () => {
    setPricingMode('mayor');
    if (quantity < 3) {
      const targetStock = currentStock > 0 ? Math.min(3, currentStock) : 3;
      setQuantity(targetStock);
      showNotice('Mínimo 3 unidades para precio por mayor');
    }
  };

  // Manejador para incrementar cantidad con cambio automático a Por Mayor
  const handleIncrementQuantity = () => {
    if (quantity >= currentStock) return;
    const nextQty = quantity + 1;
    setQuantity(nextQty);

    if (nextQty >= 3 && pricingMode !== 'mayor') {
      setPricingMode('mayor');
      showNotice('Precio por mayor activado automáticamente (3+ unidades)');
    }
  };

  // Manejador para decrementar cantidad con cambio automático a Por Menor
  const handleDecrementQuantity = () => {
    if (quantity <= 1) return;
    const nextQty = quantity - 1;
    setQuantity(nextQty);

    if (nextQty < 3 && pricingMode === 'mayor') {
      setPricingMode('menor');
      showNotice('Precio por menor (menos de 3 unidades)');
    }
  };

  const handleBuyWhatsApp = () => {
    if (isOutOfStock) return;
    const qualityLabel = selectedQuality === 'Original' ? 'Original' : 'Alternativa';
    const modeLabel = pricingMode === 'mayor' ? 'Comprar al por mayor (Mayorista)' : 'Comprar al por menor (Detalle)';
    const skuLine = currentSku ? `\n🔢 SKU: ${currentSku}` : '';

    const msg = `Hola HW Andevia, deseo comprar el siguiente repuesto:
📌 Producto: ${product.name}
🏷️ Marca: ${product.brand} (${product.modelCompatibility})
⚙️ Calidad: ${qualityLabel}
🛒 Modalidad: ${modeLabel}
📦 Cantidad: ${quantity} unidad(es)
💵 Precio Unitario: S/ ${(currentPrice || 0).toFixed(2)}
💵 Subtotal: S/ ${(subtotal || 0).toFixed(2)}
📊 IGV (18%): S/ ${(igvAmount || 0).toFixed(2)}
💰 TOTAL A PAGAR: S/ ${(totalAPagar || 0).toFixed(2)}${skuLine}

¿Tienen disponibilidad para coordinar la entrega/envío inmediato?`;

    const safeUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber.replace(/\D/g, '')}&text=${encodeURIComponent(msg.normalize('NFC'))}`;
    window.open(safeUrl, '_blank');
    onAddToCart(product, selectedQuality, quantity);
  };

  const handleAddToCartOnly = () => {
    if (isOutOfStock) return;
    onAddToCart(product, selectedQuality, quantity);
    onClose();
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const hasSpecs = product.specifications && Object.keys(product.specifications).length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto flex flex-col text-white animate-fade-in">
      
      {/* Top Sticky Navigation Bar Compacto */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 py-2 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          
          {/* Back Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-slate-300 hover:text-red-400 font-semibold text-xs transition-colors py-1 px-2.5 -ml-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" />
            <span>Volver</span>
          </button>

          {/* Breadcrumb */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
            <span>Catálogo</span>
            <span>/</span>
            <span className="text-red-400 font-medium uppercase">{product.category}</span>
            <span>/</span>
            <span className="text-slate-200 font-medium truncate max-w-xs">{product.name}</span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="py-1 px-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1 cursor-pointer"
              title="Copiar enlace del producto"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{copiedLink ? '¡Copiado!' : 'Compartir'}</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Container: max-w-xl on mobile, max-w-4xl on tablet, max-w-5xl on desktop */}
      <main className="flex-1 max-w-xl md:max-w-4xl lg:max-w-5xl w-full mx-auto px-3 sm:px-6 py-2 md:py-3">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-5 items-start">
          
          {/* ========================================================
              LEFT COLUMN: 
              - Mobile (< md): Unified ultra-compact header card
              - Desktop/Tablet (>= md): Full product visual showcase
              ======================================================== */}
          <div className="md:col-span-5 lg:col-span-5 space-y-2.5">
            
            {/* MOBILE ONLY: Ultra-compact unified card (Photo, Name, Brand & Compatibility) */}
            <div className="md:hidden bg-slate-900 border border-slate-800 rounded-xl p-2.5 shadow-xs space-y-2">
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 shrink-0 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex items-center justify-center p-1">
                  <img
                    src={product.imageUrl || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=600'}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=600';
                    }}
                  />
                  {product.isFeatured && (
                    <span className="absolute top-0.5 left-0.5 bg-amber-400 text-slate-950 font-black text-[7px] uppercase px-1 rounded shadow-xs">
                      ★
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider bg-red-950/60 px-1.5 py-0.5 rounded border border-red-900/60">
                        {product.category}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-300">
                        {product.brand === 'Bajaj' ? 'Torito Bajaj' : product.brand}
                      </span>
                    </div>
                    {currentSku && (
                      <span className="text-[9px] text-slate-400 font-mono">
                        SKU: <strong className="text-slate-200">{currentSku}</strong>
                      </span>
                    )}
                  </div>

                  <h1 className="text-sm sm:text-base font-black text-white leading-tight">
                    {product.name}
                  </h1>

                  <div className="flex items-center gap-1.5 text-xs sm:text-[13px] text-slate-300">
                    <Wrench className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span className="text-slate-400 font-medium">Compatibilidad:</span>
                    <span className="text-red-400 font-bold truncate">
                      {product.modelCompatibility}
                    </span>
                  </div>
                </div>
              </div>

              {/* Aviso dinámico debajo de la información del producto en móvil */}
              {noticeMessage && (
                <div className="p-1.5 bg-amber-950/90 border border-amber-600 text-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm animate-fade-in">
                  <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{noticeMessage}</span>
                </div>
              )}
            </div>

            {/* DESKTOP/TABLET ONLY: Expanded Product Showcase (Contained height to avoid scrolling) */}
            <div className="hidden md:flex flex-col space-y-2.5">
              {/* Product Image Stage */}
              <div className="relative h-44 lg:h-48 w-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center p-3 group shadow-md">
                <img
                  src={product.imageUrl || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=600'}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=600';
                  }}
                />

                {/* Floating Tags */}
                <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                  <span className="bg-slate-900/95 text-white border border-slate-700 font-bold text-xs uppercase px-2 py-0.5 rounded-lg shadow-sm">
                    {product.brand === 'Bajaj' ? 'Torito Bajaj' : product.brand}
                  </span>
                  {product.isFeatured && (
                    <span className="bg-amber-400 text-slate-950 font-bold text-xs uppercase px-2 py-0.5 rounded-lg shadow-sm">
                      Destacado
                    </span>
                  )}
                </div>

                {currentSku && (
                  <div className="absolute bottom-2.5 right-2.5 bg-slate-900/90 text-slate-300 text-xs font-mono px-2 py-0.5 rounded-lg border border-slate-700">
                    SKU: <strong className="text-white">{currentSku}</strong>
                  </div>
                )}
              </div>

              {/* Title, Brand & Category */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1.5 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] md:text-xs font-bold text-red-400 uppercase tracking-wider bg-red-950/60 px-2 py-0.5 rounded border border-red-900/60">
                    {product.category}
                  </span>
                  <span className="text-xs md:text-sm font-semibold text-slate-400">
                    Marca {product.brand}
                  </span>
                </div>
                <h1 className="text-sm md:text-base lg:text-lg font-black text-white leading-snug">
                  {product.name}
                </h1>
                
                {/* Vehicle Compatibility Banner */}
                <div className="pt-1.5 border-t border-slate-800/80 flex items-start gap-1.5 text-xs md:text-sm">
                  <Wrench className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 font-medium">Compatibilidad:</span>{' '}
                    <span className="text-red-400 font-bold">{product.modelCompatibility}</span>
                  </div>
                </div>

                {/* Aviso dinámico debajo de la compatibilidad en desktop/tablet */}
                {noticeMessage && (
                  <div className="mt-2 p-2 bg-amber-950/90 border border-amber-600 text-amber-200 rounded-lg text-xs md:text-sm font-semibold flex items-center gap-2 shadow-sm animate-fade-in">
                    <Info className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{noticeMessage}</span>
                  </div>
                )}
              </div>

              {/* Desktop Technical Specs: Compact Accordion so it never pushes the page */}
              {hasSpecs && (
                <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowSpecs((prev) => !prev)}
                    className="w-full p-2.5 text-left flex items-center justify-between text-xs md:text-sm font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span className="uppercase text-[11px] md:text-xs">Ficha Técnica del Repuesto</span>
                    </div>
                    {showSpecs ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                  {showSpecs && (
                    <div className="p-2.5 pt-0 border-t border-slate-800/80">
                      <div className="grid grid-cols-2 gap-1.5 text-xs pt-1.5 max-h-36 overflow-y-auto">
                        {Object.entries(product.specifications || {}).map(([key, value]) => (
                          <div key={key} className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/80 flex items-start gap-1.5 text-[11px]">
                            <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-white">{key}:</span>{' '}
                              <span className="text-slate-300">{value}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* ========================================================
              RIGHT COLUMN: Controls, Pricing & Action Buttons
              ======================================================== */}
          <div className="md:col-span-7 lg:col-span-7 space-y-2">
            
            {/* SELECTOR DE MODALIDAD: POR MENOR vs POR MAYOR */}
            <div className="bg-slate-900 p-2.5 md:p-3 rounded-xl border border-slate-800 shadow-xs space-y-1.5">
              <label className="text-[10px] sm:text-[11px] md:text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-red-500" />
                Modalidad de Compra:
              </label>

              <div className="grid grid-cols-2 gap-2 md:gap-2.5">
                {/* Botón Comprar al por Menor (Color Ámbar / Original al presionar) */}
                <button
                  type="button"
                  onClick={handleSelectMenor}
                  className={`p-2 sm:p-2.5 md:p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                    pricingMode === 'menor'
                      ? 'border-amber-500 bg-amber-950/60 text-white shadow-md shadow-amber-950/60 ring-2 ring-amber-400/50'
                      : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div className={`p-1.5 md:p-2 rounded-lg ${pricingMode === 'menor' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-[11px] md:text-sm uppercase tracking-wide">Por Menor</div>
                    <div className={`text-[10px] md:text-xs ${pricingMode === 'menor' ? 'text-amber-200 font-medium' : 'text-slate-400'}`}>
                      1 a 2 unidades
                    </div>
                  </div>
                </button>

                {/* Botón Comprar al por Mayor (Azul al presionar) */}
                <button
                  type="button"
                  onClick={handleSelectMayor}
                  className={`p-2 sm:p-2.5 md:p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                    pricingMode === 'mayor'
                      ? 'border-blue-400 bg-blue-900/80 text-white shadow-md shadow-blue-950/60 ring-2 ring-blue-400 font-bold'
                      : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div className={`p-1.5 md:p-2 rounded-lg ${pricingMode === 'mayor' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    <PackageCheck className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-[11px] md:text-sm uppercase tracking-wide">Por Mayor</div>
                    <div className={`text-[10px] md:text-xs ${pricingMode === 'mayor' ? 'text-blue-200 font-medium' : 'text-slate-400'}`}>
                      Desde 3 unidades
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* SELECTOR DE CALIDAD (Original vs Alternativa) */}
            <div className="bg-slate-900 p-2.5 md:p-3 rounded-xl border border-slate-800 shadow-xs space-y-1.5">
              <label className="text-[10px] sm:text-[11px] md:text-xs font-bold text-slate-300 uppercase tracking-tight block">
                Selecciona la Calidad:
              </label>

              <div className="grid grid-cols-2 gap-2 md:gap-2.5">
                {/* Opción Original */}
                <button
                  type="button"
                  onClick={() => setSelectedQuality('Original')}
                  className={`p-2.5 md:p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    selectedQuality === 'Original'
                      ? 'bg-amber-950/50 border-amber-500 ring-2 ring-amber-400/50 shadow-xs'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs md:text-sm font-bold text-amber-400">
                      <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400" />
                      <span>Original</span>
                    </div>
                  </div>
                  
                  <div className="my-0.5 md:my-1">
                    <div className="text-sm sm:text-base md:text-xl font-black text-white">
                      S/ {(currentPriceOriginal || 0).toFixed(2)}
                    </div>
                    <span className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 block">
                      {pricingMode === 'mayor' ? 'Precio mayor' : 'Precio unitario'}
                    </span>
                  </div>

                  {/* Stock */}
                  <div className="text-[10px] md:text-xs font-semibold pt-1 border-t border-slate-800/80">
                    <span className={stockOriginal > 0 ? 'text-amber-400' : 'text-red-400 font-bold'}>
                      {stockOriginal > 0 ? `Stock: ${stockOriginal} uds` : 'Agotado'}
                    </span>
                  </div>
                </button>

                {/* Opción Alternativa */}
                <button
                  type="button"
                  onClick={() => setSelectedQuality('Alternativa')}
                  className={`p-2.5 md:p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    selectedQuality === 'Alternativa'
                      ? 'bg-blue-900/80 border-blue-400 ring-2 ring-blue-400 shadow-md shadow-blue-950/60'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs md:text-sm font-bold text-blue-200">
                      <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-300" />
                      <span>Alternativa</span>
                    </div>
                  </div>

                  <div className="my-0.5 md:my-1">
                    <div className="text-sm sm:text-base md:text-xl font-black text-white">
                      S/ {(currentPriceAlt || 0).toFixed(2)}
                    </div>
                    <span className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 block">
                      {pricingMode === 'mayor' ? 'Precio mayor' : 'Precio unitario'}
                    </span>
                  </div>

                  {/* Stock */}
                  <div className="text-[10px] md:text-xs font-semibold pt-1 border-t border-slate-800/80">
                    <span className={stockAlt > 0 ? 'text-blue-300' : 'text-red-400 font-bold'}>
                      {stockAlt > 0 ? `Stock: ${stockAlt} uds` : 'Agotado'}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* QUANTITY AND SUBTOTAL / TOTAL CALCULATOR */}
            <div className="bg-slate-900 p-2.5 md:p-3 rounded-xl border border-slate-800 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-[11px] md:text-xs font-bold text-slate-300 uppercase">
                    Cant:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleDecrementQuantity}
                      disabled={quantity <= 1}
                      className="w-7 h-7 md:w-8 md:h-8 bg-slate-800 hover:bg-slate-700 font-bold border border-slate-700 rounded-lg text-white text-sm md:text-base flex items-center justify-center disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-black text-sm md:text-base w-7 text-center text-white">{quantity}</span>
                    <button
                      type="button"
                      onClick={handleIncrementQuantity}
                      disabled={quantity >= currentStock}
                      className="w-7 h-7 md:w-8 md:h-8 bg-slate-800 hover:bg-slate-700 font-bold border border-slate-700 rounded-lg text-white text-sm md:text-base flex items-center justify-center disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 uppercase font-semibold">
                    Total a Pagar (inc. IGV):
                  </div>
                  <div className="text-base sm:text-xl md:text-2xl font-black text-emerald-400 leading-none mt-0.5">
                    S/ {totalAPagar.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Desglose Subtotal + IGV en una sola línea sutil */}
              <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] sm:text-[11px] md:text-xs text-slate-400">
                <span>Subtotal: <strong className="text-slate-200">S/ {subtotal.toFixed(2)}</strong></span>
                <span>IGV (18%): <strong className="text-emerald-400">S/ {igvAmount.toFixed(2)}</strong></span>
              </div>
            </div>

            {/* ACTION CTA BUTTONS */}
            <div className="space-y-1.5 pt-0.5">
              {/* Botón 1: Comprar por WhatsApp */}
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleBuyWhatsApp}
                className={`w-full py-2.5 md:py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm md:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer ${
                  isOutOfStock
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 uppercase tracking-wider'
                }`}
              >
                <PhoneCall className="w-4 h-4 md:w-4.5 md:h-4.5" />
                <span>
                  {isOutOfStock 
                    ? 'Sin Stock Disponible' 
                    : `Comprar por WhatsApp (S/ ${totalAPagar.toFixed(2)})`}
                </span>
              </button>

              {/* Botón 2: Agregar al Carrito (Color ROJO, texto más grande y llamativo) */}
              {!isOutOfStock && (
                <button
                  type="button"
                  onClick={handleAddToCartOnly}
                  className="w-full py-2.5 md:py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-black text-xs sm:text-sm md:text-sm uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md shadow-red-950/40 transition-all active:scale-98 cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4 md:w-4.5 md:h-4.5 text-white" />
                  <span>Agregar al Carrito</span>
                </button>
              )}

              {/* Botón 3: Consultar con Asesor IA (Debajo de Agregar al Carrito) */}
              <button
                type="button"
                onClick={() => onOpenChatIA?.(product, selectedQuality, quantity)}
                className="w-full py-1.5 md:py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-orange-500/90 hover:border-orange-400 text-orange-400 hover:text-orange-300 font-bold rounded-xl text-xs md:text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                <Bot className="w-4 h-4 text-orange-400" />
                <span>¿Dudas de compatibilidad? Consultar con Asesor IA</span>
              </button>
            </div>

            {/* MOBILE ONLY: Technical Specifications Accordion */}
            {hasSpecs && (
              <div className="md:hidden bg-slate-900 rounded-xl border border-slate-800 shadow-xs overflow-hidden mt-1.5">
                <button
                  type="button"
                  onClick={() => setShowSpecs((prev) => !prev)}
                  className="w-full p-2 text-left flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span className="uppercase text-[10px] sm:text-[11px]">Ficha Técnica del Repuesto</span>
                  </div>
                  {showSpecs ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {showSpecs && (
                  <div className="p-2 pt-0 border-t border-slate-800/80">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs pt-1.5">
                      {Object.entries(product.specifications || {}).map(([key, value]) => (
                        <div key={key} className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800 flex items-start gap-1.5 text-[10px]">
                          <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-white">{key}:</span>{' '}
                            <span className="text-slate-300">{value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </main>

    </div>
  );
};
