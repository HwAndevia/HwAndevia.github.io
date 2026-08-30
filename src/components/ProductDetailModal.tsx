import React, { useState } from 'react';
import { Product, QualityTier } from '../types';
import { X, ShieldCheck, CheckCircle2, ShoppingCart, Truck, Wrench, Check, ArrowRight, Bot, PhoneCall } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quality: QualityTier, quantity: number) => void;
  onOpenChatIA?: (product: Product, quality: QualityTier, quantity: number) => void;
  whatsappNumber?: string;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onOpenChatIA,
  whatsappNumber = '51980722382',
}) => {
  if (!product) return null;

  const [selectedQuality, setSelectedQuality] = useState<QualityTier>('OEM');
  const [quantity, setQuantity] = useState<number>(1);

  const currentPrice = selectedQuality === 'OEM' ? product.priceOEM : product.priceAlt;
  const currentStock = selectedQuality === 'OEM' ? product.stockOEM : product.stockAlt;
  const currentSku = selectedQuality === 'OEM' ? product.skuOEM : product.skuAlt;
  const isOutOfStock = currentStock <= 0;

  const handleBuyWhatsApp = () => {
    if (isOutOfStock) return;
    const qualityLabel = selectedQuality === 'OEM' ? 'Original' : 'Alternativa';
    const msg = `Hola HW Andevia, deseo comprar ${quantity} unidad(es) de "${product.name}" (${qualityLabel}) por un total de S/ ${(currentPrice * quantity).toFixed(2)}.`;
    const safeUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber.replace(/\D/g, '')}&text=${encodeURIComponent(msg.normalize('NFC'))}`;
    window.open(safeUrl, '_blank');
    onAddToCart(product, selectedQuality, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative text-slate-900">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 space-y-6">
          
          {/* Top Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* Image */}
            <div className="space-y-3">
              <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 bg-slate-900 text-white font-bold text-xs px-2.5 py-1 rounded-lg uppercase shadow">
                  {product.brand === 'Bajaj' ? 'Torito Bajaj' : product.brand}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1 text-slate-600">
                <div className="font-bold text-slate-900 uppercase">Compatibilidad de Modelo:</div>
                <div className="font-semibold text-red-600 flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5" />
                  {product.modelCompatibility}
                </div>
              </div>
            </div>

            {/* Product Title & Details */}
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase text-red-600 tracking-wider">
                  {product.category}
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 leading-tight mt-1">
                  {product.name}
                </h2>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {product.description}
              </p>

              {/* Quality Selection Comparison */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-tight block">
                  Elige la Calidad del Repuesto:
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {/* OEM Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedQuality('OEM')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedQuality === 'OEM'
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/50'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>Calidad OEM (Original)</span>
                    </div>
                    <div className="text-sm font-black text-slate-900 mt-1">
                      S/ {product.priceOEM.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                      Garantía de Fábrica TVS/Bajaj
                    </div>
                  </button>

                  {/* Alternative Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedQuality('Alternativa')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedQuality === 'Alternativa'
                        ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-400/50'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <span>Alternativa</span>
                    </div>
                    <div className="text-sm font-black text-slate-900 mt-1">
                      S/ {product.priceAlt.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-blue-700 font-medium mt-0.5">
                      {product.brandAltName || 'Marca Certificada'}
                    </div>
                  </button>
                </div>
              </div>

              {/* Quantity & Stock */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-700 block">Cantidad:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-7 h-7 bg-white hover:bg-slate-200 font-bold border border-slate-300 rounded-lg text-slate-800 text-sm flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="font-extrabold text-sm w-6 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-7 h-7 bg-white hover:bg-slate-200 font-bold border border-slate-300 rounded-lg text-slate-800 text-sm flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500 block font-semibold">Subtotal:</span>
                  <span className="text-lg font-black text-slate-900">
                    S/ {(currentPrice * quantity).toFixed(2)}
                  </span>
                  {currentSku && (
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      SKU: {currentSku}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Chat con IA + Comprar por WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onOpenChatIA?.(product, selectedQuality, quantity);
                    onClose();
                  }}
                  className="py-3 px-4 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <Bot className="w-4 h-4" />
                  <span>Consultar con IA</span>
                </button>

                <button
                  disabled={isOutOfStock}
                  onClick={handleBuyWhatsApp}
                  className={`py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 ${
                    isOutOfStock
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 uppercase'
                  }`}
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>{isOutOfStock ? 'Agotado' : 'Comprar por WhatsApp'}</span>
                </button>
              </div>

            </div>

          </div>

          {/* Technical Specifications Table */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="border-t border-slate-200 pt-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Ficha Técnica y Especificaciones
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">{key}:</span>{' '}
                      <span className="text-slate-600">{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shipping Guarantee Strip */}
          <div className="bg-slate-900 text-slate-200 p-3 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-400" />
              <span>Envíos rápidos a Lima y Provincias vía Agencia Shalom / Marvisur.</span>
            </div>
            <span className="font-bold text-amber-400 flex items-center gap-1">
              WhatsApp listo <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
