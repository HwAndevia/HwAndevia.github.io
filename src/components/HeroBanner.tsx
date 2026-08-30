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
      {/* Rojo y Ámbar / Dorado */}
<div className="absolute inset-0 overflow-hidden pointer-events-none">
  {/* Luz Azul - Izquierda */}
  <div className="absolute top-1/2 -left-24 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />

  {/* Luz Naranja - Centro-Izquierda (Ligeramente desplazada a la derecha) */}
  <div className="absolute top-1/2 left-[40%] -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] bg-orange-500/15 rounded-full blur-3xl" />

  {/* Luz Roja - Derecha */}
  <div className="absolute top-1/2 -right-24 -translate-y-1/2 w-96 h-96 bg-red-600/15 rounded-full blur-3xl" />
</div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Main Copy */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Repuestos para <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-amber-500">TVS King</span> y <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Torito Bajaj</span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Encuentra repuestos garantizados con dos niveles de calidad: <strong className="text-amber-300 font-semibold">Original</strong> y <strong className="text-orange-400 font-semibold">Alternativa</strong>. Filtros, frenos, cables, bujías y más con envío inmediato.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={onScrollToProducts}
                className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-red-900/30 hover:shadow-red-900/50 transition-all text-xl group"
              >
                <span>Ver Catálogo Completo</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                className="flex items-center gap-2 bg-gradient-to-r from-blue-950 to-blue-800 hover:from-blue-600 hover:to-blue-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 transition-all text-xl group"
                >
                 <span> Envio por Shalom o Marvisur</span>
              </button>

              

            </div>   
          </div>

          {/* Columna Derecha: Foto Grande con Borde */}
          <div className="lg:col-span-5 flex justify-center lg:justify-center">
            <img 
              src="/Logoimport.jpg" 
              alt="Logo HW Andevia" 
              className="w-full max-w-[300px] h-auto rounded-2xl border-4 border-slate-700 shadow-2xl shadow-slate-950/50 object-contain"
            />
          </div>

        </div>
      </div>
    </div>
  );
};