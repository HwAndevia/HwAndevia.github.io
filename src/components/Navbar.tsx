import React from 'react';
import { ShoppingCart, Search, Sparkles } from 'lucide-react';
import { ProductBrand, StoreSettings } from '../types';
import { Logo } from './Logo';

interface NavbarProps {
  settings: StoreSettings;
  selectedBrand: ProductBrand | 'Todos';
  onSelectBrand: (brand: ProductBrand | 'Todos') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  onOpenChatIA?: () => void;
  isHighlightCart?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedBrand,
  onSelectBrand,
  searchQuery,
  onSearchChange,
  cartCount,
  cartTotal,
  onOpenCart,
  onOpenChatIA,
  isHighlightCart = false,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 shadow-xl text-white">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo & Store Title */}
          <div className="cursor-pointer" onClick={() => onSelectBrand('Todos')}>
            <Logo size="md" />
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar filtros, zapatas, cables, bujías..."
              className="w-full bg-slate-800 text-slate-100 placeholder-slate-400 text-sm rounded-lg pl-10 pr-4 py-2.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white bg-slate-700 px-1.5 py-0.5 rounded"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Chat con IA 24/7 */}
            <button
              type="button"
              onClick={onOpenChatIA}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-orange-400 hover:text-orange-300 font-bold px-3 py-2 rounded-xl text-xs shadow-md transition-all active:scale-95 border border-orange-500/80 hover:border-orange-400 cursor-pointer"
              title="Asistente Virtual IA 24/7"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">Asistente IA</span>
            </button>

            {/* Shopping Cart Button */}
            <button
              id="navbar-cart-btn"
              type="button"
              onClick={onOpenCart}
              className={`relative flex items-center gap-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all active:scale-95 ${
                isHighlightCart
                  ? 'ring-4 ring-amber-400 shadow-2xl shadow-red-600/60 scale-105 z-50'
                  : 'hover:shadow-red-900/40'
              }`}
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 text-xs font-black rounded-full w-5 h-5 flex items-center justify-center animate-pulse shadow-md">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-none text-left">
                <span className="text-[10px] text-red-200 uppercase font-semibold">Mi Carrito</span>
                <span className="text-sm font-black">S/ {(cartTotal || 0).toFixed(2)}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar repuestos TVS o Bajaj..."
              className="w-full bg-slate-800 text-slate-100 placeholder-slate-400 text-sm rounded-lg pl-9 pr-4 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

      </div>
    </header>
  );
};
