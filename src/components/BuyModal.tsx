import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, CheckCircle2, ShoppingCart, Plus, Minus, PhoneCall, Bot, Sparkles, Truck, Package } from 'lucide-react';
import { Product, QualityTier } from '../types';

interface BuyModalProps {
  isOpen: boolean;
  product: Product | null;
  initialQuality?: QualityTier;
  onClose: () => void;
  onAddToCart: (product: Product, quality: QualityTier, quantity: number) => void;
  onOpenChatIA?: (product: Product, quality: QualityTier, quantity: number) => void;
  whatsappNumber?: string;
}

export const BuyModal: React.FC<BuyModalProps> = ({
  isOpen,
  product,
  initialQuality = 'Original',
  onClose,
  onAddToCart,
  onOpenChatIA,
  whatsappNumber = '51980722382',
}) => {
  if (!isOpen || !product) return null;

  const [quality, setQuality] = useState<QualityTier>(initialQuality);
  const [quantity, setQuantity] = useState<number>(1);

  const price = quality === 'Original' ? product.priceOriginal : product.priceAlt;
  const stock = quality === 'Original' ? product.stockOriginal : product.stockAlt;
  const sku = quality === 'Original' ? product.skuOriginal : product.skuAlt;
  const isOutOfStock = stock <= 0;
  const totalPrice = price * quantity;

  const handleWhatsAppBuy = () => {
    if (isOutOfStock) return;
    const qualityLabel = quality === 'Original' ? 'Original' : 'Alternativa A1';
    const skuLine = sku ? `\n🔢 SKU: ${sku}` : '';
    const msg = `Hola HW Andevia, deseo comprar el siguiente repuesto:
📌 Producto: ${product.name}
🏷️ Marca: ${product.brand} (${product.modelCompatibility})
⚙️ Calidad: ${qualityLabel}
📦 Cantidad: ${quantity} unidad(es)
💰 Subtotal: S/ ${totalPrice.toFixed(2)}${skuLine}

¿Tienen disponibilidad para coordinar la entrega/envío inmediato?`;

    const safeUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber.replace(/\D/g, '')}&text=${encodeURIComponent(msg.normalize('NFC'))}`;
    window.open(safeUrl, '_blank');
    onAddToCart(product, quality, quantity);
    onClose();
  };

  const handleAddToCartOnly = () => {
    if (isOutOfStock) return;
    onAddToCart(product, quality, quantity);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* HEADER DEL MODAL DE COMPRA */}
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white leading-tight flex items-center gap-2">
                  Confirmar Compra
                </h3>
                <p className="text-sm text-slate-400">Selecciona la calidad y cantidad de tu pedido</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* CUERPO DEL MODAL */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 bg-slate-50/50 flex-1">
            {/* INFORMACIÓN PRINCIPAL DEL PRODUCTO */}
            <div className="flex gap-4 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-lg border border-slate-100 shrink-0 bg-slate-100"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=600';
                }}
              />
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className="bg-slate-900 text-white text-[16px] font-black px-1.5 py-0.2 rounded uppercase">
                      {product.brand}
                    </span>
                    <span className="pr-1 text-[16px] text-slate-600 font-semibold truncate">
                      {product.category}
                    </span>
                  </div>
                  <h4 className="pt-3 font-bold text-slate-900 text-[20px] leading-snug line-clamp-2">
                    {product.name}
                  </h4>
                  <p className="pt-3 text-[16px] text-slate-500 mt-0.5 font-medium">
                    Compatibilidad: <span className="text-slate-800 font-bold">{product.modelCompatibility}</span>
                  </p>
                </div>

                {sku && (
                  <div className="text-xs text-slate-400 font-mono mt-2">
                    SKU: <span className="font-bold text-slate-700">{sku}</span>
                  </div>
                )}
              </div>
            </div>

            {/* SELECCIÓN DE CALIDAD (Original vs ALTERNATIVA) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 tracking-wider mb-2">
                1. Selecciona la Calidad del Repuesto:
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {/* Opción Original */}
                <button
                  type="button"
                  onClick={() => setQuality('Original')}
                  className={`p-3 rounded-xl border-2 text-left transition-all relative ${
                    quality === 'Original'
                      ? 'border-amber-500 bg-amber-50/60 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                      Original
                    </span>
                    {quality === 'Original' && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    )}
                  </div>
                  <div className="text-base font-extrabold text-slate-900">
                    S/ {product.priceOriginal.toFixed(2)}
                  </div>
                  <div className="text-[10px] font-semibold mt-1">
                    {product.stockOriginal > 0 ? (
                      <span className="text-emerald-700">Stock: {product.stockOriginal} und</span>
                    ) : (
                      <span className="text-red-600 font-bold">Agotado</span>
                    )}
                  </div>
                </button>

                {/* Opción Alternativa */}
                <button
                  type="button"
                  onClick={() => setQuality('Alternativa')}
                  className={`p-3 rounded-xl border-2 text-left transition-all relative ${
                    quality === 'Alternativa'
                      ? 'border-blue-600 bg-blue-50/60 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      Alternativa
                    </span>
                    {quality === 'Alternativa' && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                    )}
                  </div>
                  <div className="text-base font-extrabold text-slate-900">
                    S/ {product.priceAlt.toFixed(2)}
                  </div>
                  <div className="text-[10px] font-semibold mt-1">
                    {product.stockAlt > 0 ? (
                      <span className="text-emerald-700">Stock: {product.stockAlt} und</span>
                    ) : (
                      <span className="text-red-600 font-bold">Agotado</span>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* SELECCIÓN DE CANTIDAD Y SUBTOTAL */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Cantidad de Unidades:
              </label>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 bg-white hover:bg-slate-200 disabled:opacity-40 rounded-lg text-slate-900 flex items-center justify-center font-bold shadow-xs transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-base font-black px-4 text-slate-900 min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={quantity >= stock}
                    className="w-8 h-8 bg-white hover:bg-slate-200 disabled:opacity-40 rounded-lg text-slate-900 flex items-center justify-center font-bold shadow-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">
                    Subtotal del Pedido:
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900">
                    S/ {totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* CONSULTA PREVIA CON IA */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-600 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-900">¿Dudas de compatibilidad?</div>
                  <div className="text-[11px] text-slate-600 leading-tight">
                    Consulta gratis a HW Andevia IA antes de enviar tu pedido.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onOpenChatIA?.(product, quality, quantity);
                  onClose();
                }}
                className="bg-orange-500 hover:bg-orange-400 text-slate-950 font-black px-3 py-2 rounded-xl text-xs flex items-center gap-1 shrink-0 shadow-md transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Preguntar IA</span>
              </button>
            </div>
          </div>

          {/* FOOTER DEL MODAL / BOTONES ACCIÓN */}
          <div className="p-4 bg-white border-t border-slate-200 shrink-0 space-y-2">
            {/* BOTÓN PRINCIPAL: PEDIR POR WHATSAPP */}
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleWhatsAppBuy}
              className={`w-full py-3.5 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 uppercase tracking-wider ${
                isOutOfStock
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
            >
              <PhoneCall className="w-5 h-5" />
              <span>{isOutOfStock ? 'Sin Stock Disponible' : 'Confirmar Pedido por WhatsApp'}</span>
            </button>

            {/* BOTÓN SECUNDARIO: SOLO AGREGAR AL CARRITO */}
            {!isOutOfStock && (
              <button
                type="button"
                onClick={handleAddToCartOnly}
                className="w-full py-2.5 text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Solo agregar al carrito de compras</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
