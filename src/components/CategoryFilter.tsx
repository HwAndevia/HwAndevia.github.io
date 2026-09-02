import React, { useMemo } from 'react';
import { ProductCategory } from '../types';
import { 
  Droplet, 
  Wind, 
  Fuel, 
  Disc, 
  CircleDot, 
  Gauge, 
  Zap, 
  Layers, 
  SlidersHorizontal,
  Cog,
  Cpu,
  Package,
  X
} from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: ProductCategory | 'Todas';
  onSelectCategory: (category: ProductCategory | 'Todas') => void;
  categoryCounts: Record<string, number>;
  onClose?: () => void;
}

const getCategoryIconAndColor = (name: string): { icon: React.ReactNode; color: string } => {
  const lower = name.toLowerCase();
  if (lower.includes('motor') || lower.includes('cilindro') || lower.includes('piston') || lower.includes('pistón')) {
    return { icon: <Cog className="w-4 h-4" />, color: 'text-rose-500' };
  }
  if (lower.includes('transmision') || lower.includes('transmisión') || lower.includes('embrague') || lower.includes('disco')) {
    return { icon: <Layers className="w-4 h-4" />, color: 'text-indigo-500' };
  }
  if (lower.includes('freno') || lower.includes('pastilla') || lower.includes('disco de freno')) {
    return { icon: <Disc className="w-4 h-4" />, color: 'text-red-500' };
  }
  if (lower.includes('zapata')) {
    return { icon: <CircleDot className="w-4 h-4" />, color: 'text-orange-500' };
  }
  if (lower.includes('combustible') || lower.includes('carburador') || lower.includes('gasolina') || lower.includes('tanque')) {
    return { icon: <Fuel className="w-4 h-4" />, color: 'text-emerald-500' };
  }
  if (lower.includes('eléctrico') || lower.includes('electrico') || lower.includes('faro') || lower.includes('bateria') || lower.includes('luz')) {
    return { icon: <Zap className="w-4 h-4" />, color: 'text-yellow-500' };
  }
  if (lower.includes('filtro') && lower.includes('aceite')) {
    return { icon: <Droplet className="w-4 h-4" />, color: 'text-amber-500' };
  }
  if (lower.includes('filtro') && lower.includes('aire')) {
    return { icon: <Wind className="w-4 h-4" />, color: 'text-cyan-500' };
  }
  if (lower.includes('cable') || lower.includes('acelerador')) {
    return { icon: <Gauge className="w-4 h-4" />, color: 'text-purple-500' };
  }
  if (lower.includes('bujia') || lower.includes('bujía')) {
    return { icon: <Cpu className="w-4 h-4" />, color: 'text-yellow-400' };
  }
  return { icon: <Package className="w-4 h-4" />, color: 'text-blue-500' };
};

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  onClose,
}) => {
  const dynamicCategories = useMemo(() => {
    return Object.keys(categoryCounts)
      .filter((cat) => cat !== 'Todas' && categoryCounts[cat] > 0)
      .map((cat) => ({
        name: cat,
        ...getCategoryIconAndColor(cat),
        count: categoryCounts[cat]
      }));
  }, [categoryCounts]);

  return (
    <div className="bg-slate-900 border-b border-slate-800 shadow-xl py-3 sticky top-16 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
        
        {/* Category Filter Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wide">
              Categorías de Repuestos
            </h2>
          </div>

          {/* Botón Cerrar */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title="Ocultar categorías"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar</span>
            </button>
          )}
        </div>

        {/* Categories Horizontal Scroll Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
          {/* All Categories Button */}
          <button
            type="button"
            onClick={() => onSelectCategory('Todas')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border cursor-pointer ${
              selectedCategory === 'Todas'
                ? 'bg-red-600 text-white border-red-500 shadow-md ring-2 ring-red-400/50 scale-105'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <span>Todas las Secciones</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              selectedCategory === 'Todas' ? 'bg-red-950 text-red-200' : 'bg-slate-700 text-slate-300'
            }`}>
              {categoryCounts['Todas'] || 0}
            </span>
          </button>

          {/* Dynamic Category Buttons */}
          {dynamicCategories.map((cat) => {
            const isSelected = selectedCategory === cat.name;

            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => onSelectCategory(cat.name)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border cursor-pointer ${
                  isSelected
                    ? 'bg-red-600 text-white border-red-500 shadow-md ring-2 ring-red-400/50 scale-105'
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white hover:border-slate-600'
                }`}
              >
                <span className={isSelected ? 'text-white' : cat.color}>
                  {cat.icon}
                </span>
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-red-900 text-red-100' : 'bg-slate-700 text-slate-300'
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};
