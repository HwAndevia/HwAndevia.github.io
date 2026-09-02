import React, { useState, useEffect } from 'react';
import { Product, QualityTier, PricingMode } from '../types';
import { 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  Truck, 
  Wrench, 
  Check, 
  Bot, 
  PhoneCall, 
  ShoppingCart, 
  PackageCheck, 
  Tag, 
  Sparkles,
  Share2,
  Info
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto flex flex-col text-slate-900 animate-fade-in">
      
      {/* Top Sticky Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          
          {/* Back Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 text-slate-700 hover:text-red-600 font-medium text-sm transition-colors py-1.5 px-3 -ml-2 rounded-xl hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
            <span>Volver al Catálogo</span>
          </button>

          {/* Breadcrumb */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
            <span>Inicio</span>
            <span>/</span>
            <span className="text-red-600 font-medium uppercase">{product.category}</span>
            <span>/</span>
            <span className="text-slate-800 font-medium truncate max-w-xs">{product.name}</span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors text-xs flex items-center gap-1.5"
              title="Copiar enlace del producto"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">{copiedLink ? '¡Enlace copiado!' : 'Compartir'}</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Full Page Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        
        {/* Floating Notice Toast */}
        {noticeMessage && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-fade-in">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{noticeMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-start">
          
          {/* LEFT COLUMN: Large Image & Compatibility */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Main Product Image Container */}
            <div className="relative aspect-square sm:aspect-4/3 lg:aspect-square bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs group">
              <img
                src={product.imageUrl || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=600'}
                alt={product.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=600';
                }}
              />
              
              {/* Brand Floating Tag */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                <span className="bg-slate-900 text-white font-bold text-xs uppercase px-3 py-1.5 rounded-xl shadow-md">
                  {product.brand === 'Bajaj' ? 'Torito Bajaj' : product.brand}
                </span>
                {product.isFeatured && (
                  <span className="bg-amber-400 text-slate-950 font-bold text-xs uppercase px-3 py-1.5 rounded-xl shadow-md">
                    Destacado
                  </span>
                )}
              </div>

              {/* SKU Pill */}
              {currentSku && (
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-xs text-slate-700 text-xs font-mono px-3 py-1 rounded-xl shadow-xs border border-slate-200">
                  SKU: <span className="font-bold text-slate-900">{currentSku}</span>
                </div>
              )}
            </div>

            {/* Vehicle Compatibility Banner */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <Wrench className="w-4 h-4 text-red-600" />
                <span>Compatibilidad de Moto</span>
              </div>
              <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 p-2.5 rounded-xl">
                {product.modelCompatibility}
              </p>
            </div>

            {/* Shipping & Delivery Highlights (Hidden on phones / mobile, visible on sm and up) */}
            <div className="hidden sm:block bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase">Envíos a todo el Perú</h4>
                  <p className="text-xs text-slate-500">Agencias Shalom, Marvisur y delivery local express.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-slate-100 pt-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase">Garantía de Calidad</h4>
                  <p className="text-xs text-slate-500">Repuestos 100% nuevos e inspeccionados por especialistas.</p>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Buying Options, Quantity, CTAs & Specs */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Header / Titles */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-red-600 uppercase tracking-widest bg-red-50 px-2.5 py-1 rounded-md border border-red-100">
                  {product.category}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  Marca {product.brand}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {product.name}
              </h1>

              <p className="text-sm text-slate-600 leading-relaxed pt-1">
                {product.description}
              </p>
            </div>

            {/* SELECTOR DE MODALIDAD: POR MENOR vs POR MAYOR */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-red-600" />
                  Modalidad de Compra:
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Botón Comprar al por Menor */}
                <button
                  type="button"
                  onClick={handleSelectMenor}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                    pricingMode === 'menor'
                      ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${pricingMode === 'menor' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs uppercase">Comprar al por menor</div>
                    <div className={`text-[11px] ${pricingMode === 'menor' ? 'text-slate-300' : 'text-slate-500'}`}>
                      De 1 a 2 unidades
                    </div>
                  </div>
                </button>

                {/* Botón Comprar al por Mayor */}
                <button
                  type="button"
                  onClick={handleSelectMayor}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                    pricingMode === 'mayor'
                      ? 'border-amber-500 bg-amber-500 text-slate-950 shadow-md font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${pricingMode === 'mayor' ? 'bg-amber-600 text-slate-950' : 'bg-slate-100 text-slate-700'}`}>
                    <PackageCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs uppercase">Comprar al por mayor</div>
                    <div className={`text-[11px] ${pricingMode === 'mayor' ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                      Desde 3 unidades
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* SELECTOR DE CALIDAD (Original vs Alternativa) */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-tight block">
                Selecciona la Calidad:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Opción Original */}
                <button
                  type="button"
                  onClick={() => setSelectedQuality('Original')}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    selectedQuality === 'Original'
                      ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-400/50 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>Original</span>
                    </div>
                    {selectedQuality === 'Original' && (
                      <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-full">
                        Seleccionado
                      </span>
                    )}
                  </div>
                  
                  <div className="my-2">
                    <div className="text-2xl font-black text-slate-900">
                      S/ {(currentPriceOriginal || 0).toFixed(2)}
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                      {pricingMode === 'mayor' ? 'Precio por mayor' : 'Precio por unidad'}
                    </span>
                  </div>

                  <div className="text-xs font-semibold pt-1 border-t border-amber-200/60 flex items-center justify-between">
                    <span className={stockOriginal > 0 ? 'text-amber-800' : 'text-red-600 font-bold'}>
                      {stockOriginal > 0 ? `Stock: ${stockOriginal} unidades` : 'Agotado'}
                    </span>
                  </div>
                </button>

                {/* Opción Alternativa */}
                <button
                  type="button"
                  onClick={() => setSelectedQuality('Alternativa')}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    selectedQuality === 'Alternativa'
                      ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-400/50 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <span>Alternativa</span>
                    </div>
                    {selectedQuality === 'Alternativa' && (
                      <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
                        Seleccionado
                      </span>
                    )}
                  </div>

                  <div className="my-2">
                    <div className="text-2xl font-black text-slate-900">
                      S/ {(currentPriceAlt || 0).toFixed(2)}
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                      {pricingMode === 'mayor' ? 'Precio por mayor' : 'Precio por unidad'}
                    </span>
                  </div>

                  <div className="text-xs font-semibold pt-1 border-t border-blue-200/60 flex items-center justify-between">
                    <span className={stockAlt > 0 ? 'text-blue-800' : 'text-red-600 font-bold'}>
                      {stockAlt > 0 ? `Stock: ${stockAlt} unidades` : 'Agotado'}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* QUANTITY AND SUBTOTAL / TOTAL CALCULATOR */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-700 block uppercase">
                    Cantidad:
                  </span>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={handleDecrementQuantity}
                      disabled={quantity <= 1}
                      className="w-10 h-10 bg-slate-100 hover:bg-slate-200 font-bold border border-slate-300 rounded-xl text-slate-800 text-base flex items-center justify-center disabled:opacity-40 transition-colors"
                    >
                      -
                    </button>
                    <span className="font-black text-lg w-8 text-center">{quantity}</span>
                    <button
                      type="button"
                      onClick={handleIncrementQuantity}
                      disabled={quantity >= currentStock}
                      className="w-10 h-10 bg-slate-100 hover:bg-slate-200 font-bold border border-slate-300 rounded-xl text-slate-800 text-base flex items-center justify-center disabled:opacity-40 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <span className="text-xs text-slate-500 block font-semibold uppercase">
                    Total a Pagar:
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    S/ {totalAPagar.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Desglose Subtotal + IGV */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-slate-500 font-medium block">Subtotal:</span>
                  <span className="text-sm font-bold text-slate-900">S/ {subtotal.toFixed(2)}</span>
                </div>
                <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/80">
                  <span className="text-emerald-700 font-medium block flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    IGV (18%):
                  </span>
                  <span className="text-sm font-extrabold text-emerald-900">S/ {igvAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* ACTION CTA BUTTONS */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Botón Consultar con IA */}
                <button
                  type="button"
                  onClick={() => onOpenChatIA?.(product, selectedQuality, quantity)}
                  className="py-3.5 px-4 bg-white hover:bg-orange-50/60 border-2 border-orange-500 text-slate-900 font-bold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                >
                  <Bot className="w-5 h-5 text-orange-500" />
                  <span>Consultar con Asesor IA</span>
                </button>

                {/* Botón Comprar WhatsApp */}
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={handleBuyWhatsApp}
                  className={`py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                    isOutOfStock
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25 uppercase'
                  }`}
                >
                  <PhoneCall className="w-5 h-5" />
                  <span>
                    {isOutOfStock 
                      ? 'Sin Stock' 
                      : `Comprar por WhatsApp (S/ ${totalAPagar.toFixed(2)})`}
                  </span>
                </button>
              </div>

              {/* Botón Solo Agregar al Carrito con degradado dorado chevere */}
              {!isOutOfStock && (
                <button
                  type="button"
                  onClick={handleAddToCartOnly}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-600 hover:via-amber-500 hover:to-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2.5 transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-amber-400/30 border border-amber-300/80 active:scale-98"
                >
                  <ShoppingCart className="w-4 h-4 text-slate-950" />
                  <span>Agregar al Carrito de Compras</span>
                </button>
              )}
            </div>

            {/* TECHNICAL SPECIFICATIONS & DETAILS */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 mt-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Ficha Técnica del Repuesto
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900">{key}:</span>{' '}
                        <span className="text-slate-600">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Back Button */}
            <div className="pt-4 flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1.5 transition-colors font-medium py-2 px-4 rounded-xl hover:bg-slate-100"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a ver todos los repuestos</span>
              </button>
            </div>

          </div>

        </div>

      </main>

    </div>
  );
};
