import React from 'react';
import { ShieldCheck, Truck, CheckCircle2, Award, ArrowRight } from 'lucide-react';
import { ProductBrand } from '../types';

interface HeroBannerProps {
  onSelectBrand: (brand: ProductBrand) => void;
  onScrollToProducts: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onSelectBrand,
  onScrollToProducts,
}) => {
  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden border-b border-slate-800">
      {/* Decorative Background Lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Main Copy */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Tienda HW ANDEVIA Repuestos para <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-amber-500">TVS King</span> y <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Torito Bajaj</span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Encuentra repuestos garantizados con dos niveles de calidad: <strong className="text-amber-300 font-semibold">Calidad Original</strong> y <strong className="text-blue-300 font-semibold">Alternativa Premium</strong>. Filtros, frenos, cables, bujías y más con envío inmediato.
            </p>

            {/* Quality Comparison Badges */}
            <div className="grid grid-cols-2 gap-3 pt-1 max-w-lg mx-auto lg:mx-0">
              <div className="bg-slate-800/90 border border-amber-500/40 rounded-xl p-3 flex items-start gap-2.5">
                <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-amber-300 uppercase tracking-wide">Calidad OEM</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">Original de fábrica TVS y Bajaj. Máxima durabilidad.</div>
                </div>
              </div>

              <div className="bg-slate-800/90 border border-blue-500/40 rounded-xl p-3 flex items-start gap-2.5">
                <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-blue-300 uppercase tracking-wide">Alternativa Premium</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">Marcas reconocidas (Varroc, Suprajit, Endurance). Excelente precio.</div>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={onScrollToProducts}
                className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-red-900/30 hover:shadow-red-900/50 transition-all text-sm group"
              >
                <span>Ver Catálogo Completo</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => {
                  onSelectBrand('TVS');
                  onScrollToProducts();
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-semibold px-4 py-3 rounded-xl text-sm transition-all"
              >
                🔴 Repuestos TVS King
              </button>

              <button
                onClick={() => {
                  onSelectBrand('Bajaj');
                  onScrollToProducts();
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-semibold px-4 py-3 rounded-xl text-sm transition-all"
              >
                🔵 Repuestos Torito Bajaj
              </button>
            </div>

          </div>

          {/* Right Brand Showcase Cards */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            
            {/* TVS Card */}
            <div 
              onClick={() => {
                onSelectBrand('TVS');
                onScrollToProducts();
              }}
              className="group cursor-pointer bg-gradient-to-b from-red-950/60 to-slate-900 border border-red-900/50 hover:border-red-500/80 rounded-2xl p-4 shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-red-600 text-white font-black text-[10px] px-2 py-1 rounded-bl-lg uppercase">
                TVS Motor
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 font-black text-xl mb-3">
                TVS
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-red-300 transition-colors">
                TVS King
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Deluxe, Duramax 200, EFI, GS, Kargo.
              </p>
              <div className="mt-3 flex items-center text-xs font-semibold text-red-400 group-hover:underline">
                Explorar repuestos →
              </div>
            </div>

            {/* Torito Bajaj Card */}
            <div 
              onClick={() => {
                onSelectBrand('Bajaj');
                onScrollToProducts();
              }}
              className="group cursor-pointer bg-gradient-to-b from-blue-950/60 to-slate-900 border border-blue-900/50 hover:border-blue-500/80 rounded-2xl p-4 shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-blue-600 text-white font-black text-[10px] px-2 py-1 rounded-bl-lg uppercase">
                Bajaj RE
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-black text-xl mb-3">
                RE
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                Torito Bajaj
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                RE 2T, RE 4T, FL, Maxima Z / Cargo.
              </p>
              <div className="mt-3 flex items-center text-xs font-semibold text-blue-400 group-hover:underline">
                Explorar repuestos →
              </div>
            </div>

            {/* Guarantee Strip */}
            <div className="col-span-2 bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>Envíos por Shalom / Marvisur</span>
              </div>
              <div className="font-semibold text-amber-300">
                100% Compatibilidad Garantizada
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
