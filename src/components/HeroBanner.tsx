import React, { useState, useEffect } from 'react';
import { ProductBrand } from '../types';
import { FileText, MessageCircle, X, Download, ExternalLink } from 'lucide-react';
import { buildWhatsAppUrl } from '../utils/Whatsapp';

interface HeroBannerProps {
  selectedBrand: ProductBrand;
  onSelectBrand: (brand: ProductBrand) => void;
  onScrollToProducts?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  selectedBrand,
  onSelectBrand,
}) => {
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);

  // URL directa de WhatsApp con el mensaje prefijado
  const whatsappUrl = buildWhatsAppUrl('+51 980 722 382', 'Hola, quiero cotizar...');

  // Manejador de tecla Escape y bloqueo de scroll de fondo para la pantalla completa
  useEffect(() => {
    if (!showPdfModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowPdfModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [showPdfModal]);

  return (
    <>
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 items-center">
            
            {/* Main Copy & Botones a la izquierda */}
            <div className="md:col-span-8 space-y-3.5 text-center md:text-left">

              <h1 className="text-[26px] sm:text-3xl lg:text-[34px] font-black tracking-tight text-white leading-tight">
                Repuestos para <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-amber-500">TVS King</span> y <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Torito Bajaj</span>
              </h1>

              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto md:mx-0">
                Encuentra repuestos garantizados con dos niveles de calidad: <strong className="text-amber-300 font-semibold">Original</strong> y <strong className="text-orange-400 font-semibold">Alternativa</strong>. Filtros, frenos, cables, bujías y más con envío inmediato por Shalom o Marvisur.
              </p>

              {/* Botones solicitados a la izquierda: Ver catálogo en PDF y Contactar por WhatsApp */}
              <div className="flex flex-wrap items-center gap-3 pt-1 justify-center md:justify-start">
                
                {/* Botón Naranja: Ver catálogo en PDF */}
                <button
                  id="btn-ver-catalogo-pdf"
                  type="button"
                  onClick={() => setShowPdfModal(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-200 cursor-pointer"
                  title="Abrir catálogo completo en PDF a pantalla completa"
                >
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0" />
                  <span>Ver catalogo en PDF</span>
                </button>

                {/* Botón Verde WhatsApp: Contactar por Whatsapp */}
                <a
                  id="btn-contactar-whatsapp-herobanner"
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 transition-all duration-200 cursor-pointer"
                  title="Enviar consulta directa a WhatsApp (+51 980 722 382)"
                >
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0" />
                  <span>Contactar por Whatsapp</span>
                </a>

              </div>
            </div>

            {/* Columna Derecha: Foto del Logo */}
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

      {/* Visor de PDF a Pantalla Completa (Full Screen sin recuadro) */}
      {showPdfModal && (
        <div 
          id="pdf-fullscreen-viewer"
          className="fixed inset-0 z-[9999] w-screen h-screen bg-slate-950 flex flex-col overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Visor de catálogo en PDF"
        >
          {/* Barra superior de control a pantalla completa */}
          <div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-white shrink-0 z-10 shadow-lg">
            
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 bg-orange-500/20 text-orange-400 rounded-lg shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-white truncate">
                  Catálogo Oficial de Repuestos • HW-Andevia
                </h2>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Visualización en pantalla completa
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              
              {/* Botón Abrir en nueva pestaña */}
              <a
                href="/catalogo.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 hover:text-white transition-colors"
                title="Abrir el PDF en una pestaña independiente del navegador"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Nueva pestaña</span>
              </a>

              {/* Botón Descargar PDF */}
              <a
                href="/catalogo.pdf"
                download="catalogo_hw_andevia.pdf"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 hover:text-white transition-colors"
                title="Descargar archivo PDF en tu dispositivo"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Descargar</span>
              </a>

              {/* Botón Cerrar Pantalla Completa */}
              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition-colors shadow-sm cursor-pointer ml-1"
                title="Cerrar visor a pantalla completa (Escape)"
              >
                <X className="w-4 h-4" />
                <span>Cerrar</span>
              </button>

            </div>
          </div>

          {/* Contenido PDF ocupando el 100% de la pantalla sin márgenes ni recuadros */}
          <div className="flex-1 w-full h-full relative bg-slate-900">
            <iframe
              src="/catalogo.pdf#toolbar=1&navpanes=1&view=FitH"
              className="w-full h-full border-0 absolute inset-0 bg-slate-900"
              title="Catálogo de Repuestos HW-Andevia PDF"
            />
          </div>
        </div>
      )}
    </>
  );
};
