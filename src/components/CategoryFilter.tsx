import React, { useMemo } from 'react';
import { ProductCategory, QualityTier } from '../types';
import { 
  Droplet, 
  Wind, 
  Fuel, 
  Disc, 
  CircleDot, 
  Gauge, 
  Zap, 
  Layers, 
  Sparkles,
  SlidersHorizontal,
  Wrench,
  Cog,
  Cpu,
  Package
} from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: ProductCategory | 'Todas';
  onSelectCategory: (category: ProductCategory | 'Todas') => void;
  selectedQuality: QualityTier | 'Todas';
  onSelectQuality: (quality: QualityTier | 'Todas') => void;
  categoryCounts: Record<string, number>;
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
  selectedQuality,
  onSelectQuality,
  categoryCounts,
}) => {
  // Obtener lista de categorías reales presentes en los productos cargados
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
    <div className="bg-white border-b border-slate-200 shadow-sm py-4 sticky top-20 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
        
        {/* Category Filter Pills Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Categorías de Repuestos
            </h2>
          </div>

          {/* Quality Tier Quick Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
            <span className="text-slate-500 px-2 font-semibold text-[11px] uppercase">Calidad:</span>
            
            <button
              onClick={() => onSelectQuality('Todas')}
              className={`px-2.5 py-1 rounded-lg transition-all text-xs font-bold ${
                selectedQuality === 'Todas'
                  ? 'bg-slate-900 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ambas
            </button>

            <button
              onClick={() => onSelectQuality('OEM')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all text-xs font-bold ${
                selectedQuality === 'OEM'
                  ? 'bg-amber-500 text-slate-950 shadow font-extrabold'
                  : 'text-slate-700 hover:text-amber-700 hover:bg-amber-50'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-700" />
              Solo OEM Original
            </button>

            <button
              onClick={() => onSelectQuality('Alternativa')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all text-xs font-bold ${
                selectedQuality === 'Alternativa'
                  ? 'bg-blue-600 text-white shadow font-extrabold'
                  : 'text-slate-700 hover:text-blue-700 hover:bg-blue-50'
              }`}
            >
              Solo Alternativa
            </button>
          </div>
        </div>

        {/* Categories Horizontal Scroll Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
          
          {/* All Categories Button */}
          <button
            onClick={() => onSelectCategory('Todas')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border ${
              selectedCategory === 'Todas'
                ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-102'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>Todas las Secciones</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              selectedCategory === 'Todas' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-600'
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
                onClick={() => onSelectCategory(cat.name)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border ${
                  isSelected
                    ? 'bg-red-600 text-white border-red-600 shadow-md scale-102 ring-2 ring-red-200'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span className={isSelected ? 'text-white' : cat.color}>
                  {cat.icon}
                </span>
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-red-800 text-red-100' : 'bg-slate-100 text-slate-500'
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
