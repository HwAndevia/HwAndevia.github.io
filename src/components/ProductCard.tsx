import React, { useState } from 'react';
import { Product, QualityTier } from '../types';
import { ShoppingCart, Eye, ShieldCheck, CheckCircle2, Bot, Plus, Minus, MessageSquare, PhoneCall } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quality: QualityTier, quantity: number) => void;
  onOpenDetail: (product: Product) => void;
  onOpenBuyModal?: (product: Product, quality: QualityTier) => void;
  onOpenChatIA?: (product: Product, quality: QualityTier, quantity: number) => void;
  whatsappNumber?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onOpenDetail,
  onOpenBuyModal,
  onOpenChatIA,
  whatsappNumber = '51980722382',
}) => {
  // Local state for quality toggle on card
  const [selectedQuality, setSelectedQuality] = useState<QualityTier>('Original');
  const [isHovered, setIsHovered] = useState(false);

  const currentPrice = selectedQuality === 'Original' ? product.priceOriginal : product.priceAlt;
  const currentStock = selectedQuality === 'Original' ? product.stockOriginal : product.stockAlt;
  const isOutOfStock = currentStock <= 0;

  const brandColors = {
    TVS: 'bg-red-600 text-white border-red-700',
    Bajaj: 'bg-blue-600 text-white border-blue-700',
    Universal: 'bg-slate-700 text-amber-300 border-slate-600',
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative"
    >
      {/* Top Image Container */}
      <div className="relative aspect-4/3 bg-slate-100 overflow-hidden cursor-pointer" onClick={() => onOpenDetail(product)}>
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
          <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-lg shadow-md border ${brandColors[product.brand as keyof typeof brandColors]}`}>
            {product.brand === 'Bajaj' ? 'Torito Bajaj' : product.brand}
          </span>
          {product.isFeatured && (
            <span className="bg-amber-400 text-slate-950 font-extrabold text-[10px] uppercase px-2 py-1 rounded-lg shadow-md">
              Destacado
            </span>
          )}
        </div>

        {/* Quick View Floating Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(product);
          }}
          className="absolute bottom-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white p-2 rounded-xl backdrop-blur-sm shadow-md transition-all opacity-90 group-hover:opacity-100"
          title="Ver vista previa rápida"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Card Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        
        <div>
          {/* Category & Compatibility */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-red-600 uppercase tracking-wider text-[13px]">
              {product.category}
            </span>
            <span className="font-semibold text-slate-800 uppercase tracking-wider text-[13px]" title={product.modelCompatibility}>
              {product.modelCompatibility}
            </span>
          </div>

          {/* Title */}
          <h3
            onClick={() => onOpenDetail(product)}
            className="font-semibold text-slate-900 text-base leading-snug line-clamp-2 hover:text-red-600 cursor-pointer transition-colors"
            title={product.name}
          >
            {product.name}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* QUALITY SELECTOR (Original vs Alternative) */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 space-y-1.5">
          <div className="font-semibold flex items-center justify-between text-[14px] text-slate-600 tracking-tight">
            <span>Seleccionar Calidad:</span>
            {selectedQuality === 'Original' ? (
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-amber-600" />
                Original
              </span>
            ) : (
              <span className="text-blue-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                Alternativa
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1">
            {/* Original Option */}
            <button
              type="button"
              onClick={() => setSelectedQuality('Original')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center border ${
                selectedQuality === 'Original'
                  ? 'bg-amber-500 text-black border-amber-600 shadow-sm font-bold'
                  : 'bg-orange-300 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="text-[14px] leading-tight">Original</span>
              <span className="text-xs">S/ {product.priceOriginal.toFixed(2)}</span>
            </button>

            {/* Alternative Option */}
            <button
              type="button"
              onClick={() => setSelectedQuality('Alternativa')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center border ${
                selectedQuality === 'Alternativa'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-sm font-semibold'
                  : 'bg-blue-300 text-gray-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="text-[14px] leading-tight">Alternativa</span>
              <span className="text-xs">S/ {product.priceAlt.toFixed(2)}</span>
            </button>
          </div>
          {selectedQuality === 'Alternativa' && product.brandAltName && (
            <div className="text-[14px] text-blue-800 text-center font-medium bg-blue-50/80 rounded py-0.5 border border-blue-100">
              Marca: {product.brandAltName}
            </div>
          )}
        </div>

        {/* Price & Primary Comprar Button */}
        <div className="pt-4 flex items-center justify-between gap-2 border-t border-slate-100 mt-2">
          <div>
            <span className="text-[14px] text-slate-600 block font-semibold leading-none">
              Precio ({selectedQuality})
            </span>
            <div className="text-[18px] font-black text-slate-900 font-extrabold tracking-tight">
              S/ {currentPrice.toFixed(2)}
            </div>
            {/* Stock indicator */}
            <div className="text-[13px] font-semibold mt-0.5">
              {isOutOfStock ? (
                <span className="text-red-600 font-medium">Agotado</span>
              ) : (
                <span className="text-emerald-700 font-medium">
                  {currentStock} disponibles
                </span>
              )}
            </div>
          </div>

          {/* BOTÓN COMPRAR (Abre Modal Completo de Compra) */}
          <button
            disabled={isOutOfStock}
            onClick={() => onOpenBuyModal?.(product, selectedQuality)}
            className={`flex items-center gap-1.5 font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 text-xs ${
              isOutOfStock
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white font-black hover:shadow-emerald-600/30 uppercase tracking-wide'
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

