import React from 'react';
import { ProductBrand } from '../types';

interface HeroBannerProps {
  selectedBrand: ProductBrand;
  onSelectBrand: (brand: ProductBrand) => void;
  onScrollToProducts?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  selectedBrand,
  onSelectBrand,
}) => {
  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden border-b border-slate-800">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 items-center">
          
          {/* Main Copy */}
          <div className="md:col-span-8 space-y-2.5 text-center md:text-left">

            <h1 className="text-[26px] sm:text-3xl lg:text-[34px] font-black tracking-tight text-white leading-tight">
              Repuestos para <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-amber-500">TVS King</span> y <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Torito Bajaj</span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto md:mx-0">
              Encuentra repuestos garantizados con dos niveles de calidad: <strong className="text-amber-300 font-semibold">Original</strong> y <strong className="text-orange-400 font-semibold">Alternativa</strong>. Filtros, frenos, cables, bujías y más con envío inmediato por Shalom o Marvisur.
            </p>
          </div>

          {/* Columna Derecha: Foto del Logo (oculto en pantallas pequeñas para ahorrar espacio vertical) */}
          <div className="hidden md:flex md:col-span-4 justify-center">
            <img 
              src="/Logoimport.jpg" 
              alt="Logo HW Andevia" 
              className="w-full max-w-[150px] sm:max-w-[170px] lg:max-w-[185px] h-auto rounded-xl border-2 border-slate-700 shadow-xl shadow-slate-950/50 object-contain"
            />
          </div>

        </div>
      </div>
    </div>
  );
};