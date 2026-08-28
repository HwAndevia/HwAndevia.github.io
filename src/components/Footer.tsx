import React from 'react';
import { StoreSettings } from '../types';
import { Wrench, Phone, MapPin, Truck, ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';

interface FooterProps {
  settings: StoreSettings;
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ settings }) => {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 text-xs">
      
      {/* Top Value Props Grid */}
      <div className="border-b border-slate-800/80 bg-slate-900/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-red-600/20 text-red-500 rounded-xl border border-red-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-sm">Garantía de Repuesto</h4>
              <p className="text-slate-400 text-xs mt-0.5">
                Calidad OEM Original y marcas alternativas de calidad probada.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-500 rounded-xl border border-blue-500/30">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-sm">Envíos a Nivel Nacional</h4>
              <p className="text-slate-400 text-xs mt-0.5">
                Despacho diario vía Shalom, Marvisur y Olva Courier a todo el Perú.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-600/20 text-amber-500 rounded-xl border border-amber-500/30">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-sm">Asesoría Técnica</h4>
              <p className="text-slate-400 text-xs mt-0.5">
                Te ayudamos a verificar el código o año exacto de tu mototaxi.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-600/20 text-emerald-500 rounded-xl border border-emerald-500/30">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-sm">Atención por WhatsApp</h4>
              <p className="text-slate-400 text-xs mt-0.5">
                Pedidos directos e inmediatos con catálogo actualizado.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-12 gap-8">
        
        <div className="md:col-span-5 space-y-3">
          <Logo size="md" />

          <p className="text-slate-400 text-xs leading-relaxed pr-4 pt-1">
            Especialistas en la importación y distribución de repuestos para mototaxis TVS King y Torito Bajaj. Filtros de aceite, aire, gasolina, pastillas de freno, zapatas, cables y bujías.
          </p>

          <div className="flex items-center gap-2 pt-2">
            <span className="text-xs font-bold text-slate-400">Paga seguro con:</span>
            <span className="bg-purple-900/60 text-purple-300 font-extrabold px-2 py-1 rounded text-[10px] border border-purple-700/50">YAPE</span>
            <span className="bg-cyan-900/60 text-cyan-300 font-extrabold px-2 py-1 rounded text-[10px] border border-cyan-700/50">PLIN</span>
            <span className="bg-blue-900/60 text-blue-300 font-extrabold px-2 py-1 rounded text-[10px] border border-blue-700/50">BCP</span>
            <span className="bg-emerald-900/60 text-emerald-300 font-extrabold px-2 py-1 rounded text-[10px] border border-emerald-700/50">EFECTIVO</span>
          </div>
        </div>

        {/* Models supported */}
        <div className="md:col-span-3 space-y-2">
          <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">
            Modelos Compatibles
          </h4>
          <ul className="space-y-1.5 text-slate-400 text-xs">
            <li>• TVS King Deluxe 200cc</li>
            <li>• TVS King Duramax 200cc EFI</li>
            <li>• Torito Bajaj RE 2 Tiempos</li>
            <li>• Torito Bajaj RE 4 Tiempos</li>
            <li>• Torito Bajaj RE FL / Maxima Z</li>
          </ul>
        </div>

        {/* Contact info */}
        <div className="md:col-span-4 space-y-2">
          <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">
            Atención al Cliente y Tienda
          </h4>
          <div className="space-y-2 text-slate-400 text-xs">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{settings.address}, {settings.city}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>WhatsApp: +{settings.whatsappNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>RUC: 10008289293</span>
            </div>
          </div>

          <div className="pt-2 text-slate-500 text-[11px]">
            <span>Horario: Lunes a Sábado 8:00 AM - 7:00 PM</span>
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-900 py-4 text-center text-slate-500 text-[11px]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} HW ANDEVIA SAC IMPORT. Todos los derechos reservados.</span>
          <span>TVS® y Bajaj® son marcas registradas de sus respectivos fabricantes.</span>
        </div>
      </div>

    </footer>
  );
};
