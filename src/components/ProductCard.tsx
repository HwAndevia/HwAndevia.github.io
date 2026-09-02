import React, { useState } from 'react';
import { Product, QualityTier } from '../types';
import { ShoppingCart, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quality: QualityTier, quantity: number) => void;
  onOpenDetail: (product: Product, initialQuality?: QualityTier) => void;
  onOpenChatIA?: (product: Product, quality: QualityTier, quantity: number) => void;
  whatsappNumber?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenDetail,
}) => {
  const [selectedQuality, setSelectedQuality] = useState<QualityTier>('Original');

  const priceOriginal = Number(product.priceOriginal ?? product.priceOEM ?? 0);
  const priceAlt = Number(product.priceAlt ?? 0);
  const stockOriginal = Number(product.stockOriginal ?? product.stockOEM ?? 0);
  const stockAlt = Number(product.stockAlt ?? 0);

  const currentPrice = selectedQuality === 'Original' ? priceOriginal : priceAlt;
  const currentStock = selectedQuality === 'Original' ? stockOriginal : stockAlt;
  const isOutOfStock = currentStock <= 0;

  // Extraer únicamente el primer modelo de moto si vienen varios separados por coma
  const singleModel = product.modelCompatibility 
    ? product.modelCompatibility.split(',')[0].trim() 
    : '';

  const brandColors = {
    TVS: 'bg-red-600 text-white border-red-700',
    Bajaj: 'bg-blue-600 text-white border-blue-700',
    Universal: 'bg-slate-700 text-amber-300 border-slate-600',
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Top Image Container */}
      <div 
        className="relative aspect-4/3 bg-slate-100 overflow-hidden cursor-pointer" 
        onClick={() => onOpenDetail(product, selectedQuality)}
      >
        <img
          src={product.imageUrl || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=600'}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=600';
          }}
        />

        {/* Brand Badge */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
          <span className={`text-[11px] font-normal uppercase px-2.5 py-1 rounded-lg shadow-md border ${brandColors[product.brand as keyof typeof brandColors] || 'bg-slate-800 text-white'}`}>
            {product.brand === 'Bajaj' ? 'Torito Bajaj' : product.brand}
          </span>
          {product.isFeatured && (
            <span className="bg-amber-400 text-slate-950 font-normal text-[10px] uppercase px-2 py-1 rounded-lg shadow-md">
              Destacado
            </span>
          )}
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Category & Compatibility */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-normal text-red-600 uppercase tracking-wider text-[11px]">
              {product.category}
            </span>
            {singleModel && (
              <span className="font-normal text-slate-800 uppercase tracking-wider text-[13px] truncate max-w-[55%]" title={singleModel}>
                {singleModel}
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            onClick={() => onOpenDetail(product, selectedQuality)}
            className="font-semibold text-slate-900 text-base leading-snug line-clamp-2 hover:text-red-600 cursor-pointer transition-colors"
            title={product.name}
          >
            {product.name}
          </h3>
        </div>

        {/* QUALITY SELECTOR (Original vs Alternative) - Estilo ProductDetailModal */}
        <div className="pt-0.2">
          <div className="grid grid-cols-2 gap-2">
            {/* Original Option */}
            <button
              type="button"
              onClick={() => setSelectedQuality('Original')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                selectedQuality === 'Original'
                  ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/50 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-normal text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Original</span>
              </div>
              <div className="text-base font-semibold text-slate-900 mt-1">
                S/ {(priceOriginal || 0).toFixed(2)}
              </div>
              <div className="text-[10px] font-normal mt-0.5 flex items-center justify-between">
                <span className="text-amber-800">
                  {stockOriginal > 0 ? `Stock: ${stockOriginal}` : 'Agotado'}
                </span>
              </div>
            </button>

            {/* Alternative Option */}
            <button
              type="button"
              onClick={() => setSelectedQuality('Alternativa')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                selectedQuality === 'Alternativa'
                  ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-400/50 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-normal text-blue-900">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Alternativa</span>
              </div>
              <div className="text-base font-semibold text-slate-900 mt-1">
                S/ {(priceAlt || 0).toFixed(2)}
              </div>
              <div className="text-[10px] font-normal mt-0.5 flex items-center justify-between">
                <span className="text-blue-800">
                  {stockAlt > 0 ? `Stock: ${stockAlt}` : 'Agotado'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Price & Primary Comprar Button */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 mt-2">
          <div>
            <span className="text-[12px] text-slate-500 block font-normal leading-none">
              Precio ({selectedQuality})
            </span>
            <div className="text-[18px] font-semibold text-slate-900 tracking-tight mt-0.5">
              S/ {(currentPrice || 0).toFixed(2)}
            </div>
            {/* Stock indicator */}
            <div className="text-[12px] font-normal mt-0.5">
              {isOutOfStock ? (
                <span className="text-red-600">Agotado</span>
              ) : (
                <span className="text-emerald-700">
                  {currentStock} disponibles
                </span>
              )}
            </div>
          </div>

          {/* BOTÓN COMPRAR -> Abre el modal de detalle con la calidad seleccionada */}
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={() => onOpenDetail(product, selectedQuality)}
            className={`flex items-center gap-1 font-normal px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 text-xs ${
              isOutOfStock
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-600/30 uppercase tracking-wide'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Comprar</span>
          </button>
        </div>

      </div>
    </div>
  );
};
