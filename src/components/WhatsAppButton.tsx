import React, { useMemo } from 'react';
import { Phone } from 'lucide-react';
import { buildWhatsAppUrl } from '../utils/Whatsapp';

export interface WhatsAppButtonProps {
  /** Número de teléfono con código de país (ej. "51980722382" o "+51 980 722 382") */
  whatsappNumber?: string;
  /** Mensaje inicial opcional o predeterminado */
  message?: string;
  /** Clases CSS opcionales para personalizar el contenedor */
  className?: string;
  /** Contenido interno opcional */
  children?: React.ReactNode;
  /** Identificador HTML para testing o analítica */
  id?: string;
}

/**
 * Componente funcional reutilizable para abrir WhatsApp de forma segura.
 * Aplica normalización Unicode NFC y encodeURIComponent para evitar que
 * los acentos (á, é, í, ó, ú), la letra 'ñ' y los emojis (🏍️, 🛒) se conviertan
 * en caracteres de reemplazo.
 */
export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  whatsappNumber = '51980722382',
  message = '¡Hola! Vengo de la tienda web de repuestos para mototaxi. Deseo hacer una consulta.',
  className,
  children,
  id = 'whatsapp-floating-button',
}) => {
  const url = useMemo(() => {
    return buildWhatsAppUrl(whatsappNumber, message);
  }, [whatsappNumber, message]);

  return (
    <a
      id={id}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ||
        'fixed bottom-6 right-6 z-40 bg-emerald-500 hover:bg-emerald-400 text-white p-3.5 rounded-full shadow-2xl hover:shadow-emerald-500/50 hover:scale-110 active:scale-95 transition-all flex items-center justify-center group'
      }
      title="Atención directa por WhatsApp"
    >
      {children || (
        <>
          <Phone className="w-7 h-7 fill-white" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-black pl-0 group-hover:pl-2">
            Consulta por WhatsApp
          </span>
        </>
      )}
    </a>
  );
};

export default WhatsAppButton;
