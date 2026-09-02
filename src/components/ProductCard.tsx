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
    <div className="group bg-slate-950 rounded-2xl border border-slate-800/90 shadow-lg shadow-black/40 hover:shadow-2xl hover:border-slate-700 transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Top Image Container - Más achatada (aspect-[2.8/1] max-h-36) */}
      <div 
        className="relative aspect-[2.8/1] max-h-36 bg-slate-900 overflow-hidden cursor-pointer" 
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
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1 items-center">
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md shadow-md border ${brandColors[product.brand as keyof typeof brandColors] || 'bg-slate-800 text-white'}`}>
            {product.brand === 'Bajaj' ? 'Torito Bajaj' : product.brand}
          </span>
          {product.isFeatured && (
            <span className="bg-amber-400 text-slate-950 font-bold text-[9px] uppercase px-1.5 py-0.5 rounded-md shadow-md">
              Destacado
            </span>
          )}
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          {/* Category & Compatibility */}
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-red-400 uppercase tracking-wider text-[11px]">
              {product.category}
            </span>
            {singleModel && (
              <span className="font-medium text-slate-300 uppercase tracking-wider text-[11px] truncate max-w-[55%]" title={singleModel}>
                {singleModel}
              </span>
            )}
          </div>

          {/* Title - en Bold y Texto Blanco */}
          <h3
            onClick={() => onOpenDetail(product, selectedQuality)}
            className="font-bold text-white text-sm sm:text-base leading-snug line-clamp-2 hover:text-red-400 cursor-pointer transition-colors"
            title={product.name}
          >
            {product.name}
          </h3>
        </div>

        {/* QUALITY SELECTOR (Original vs Alternative) */}
        <div className="pt-0.5">
          <div className="grid grid-cols-2 gap-1.5">
            {/* Original Option */}
            <button
              type="button"
              onClick={() => setSelectedQuality('Original')}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                selectedQuality === 'Original'
                  ? 'bg-amber-950/60 border-amber-500 ring-2 ring-amber-400/40 shadow-xs'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Original</span>
              </div>
              <div className="text-sm sm:text-base font-bold text-white mt-0.5">
                S/ {(priceOriginal || 0).toFixed(2)}
              </div>
              <div className="text-[10px] font-medium mt-0.5 flex items-center justify-between">
                <span className={stockOriginal > 0 ? 'text-amber-200' : 'text-red-400 font-semibold'}>
                  {stockOriginal > 0 ? `Stock: ${stockOriginal}` : 'Agotado'}
                </span>
              </div>
            </button>

            {/* Alternative Option */}
            <button
              type="button"
              onClick={() => setSelectedQuality('Alternativa')}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                selectedQuality === 'Alternativa'
                  ? 'bg-blue-800/85 border-blue-400 ring-2 ring-blue-400 shadow-md shadow-blue-950/60'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-1 text-[11px] font-bold text-blue-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                <span>Alternativa</span>
              </div>
              <div className="text-sm sm:text-base font-bold text-white mt-0.5">
                S/ {(priceAlt || 0).toFixed(2)}
              </div>
              <div className="text-[10px] font-medium mt-0.5 flex items-center justify-between">
                <span className={stockAlt > 0 ? 'text-blue-200' : 'text-red-400 font-semibold'}>
                  {stockAlt > 0 ? `Stock: ${stockAlt}` : 'Agotado'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* BOTÓN COMPRAR -> Ancho completo de la tarjeta */}
        <div className="pt-1.5 border-t border-slate-800/80 mt-1">
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={() => onOpenDetail(product, selectedQuality)}
            className={`w-full flex items-center justify-center gap-1.5 font-bold py-2.5 px-3 rounded-xl transition-all shadow-md active:scale-[0.98] text-xs sm:text-sm ${
              isOutOfStock
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-orange-600 hover:bg-orange-500 text-white hover:shadow-orange-600/30 uppercase tracking-wider cursor-pointer shadow-md shadow-orange-950/40'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{isOutOfStock ? 'Agotado' : 'Comprar'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
