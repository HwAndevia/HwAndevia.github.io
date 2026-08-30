import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Send, X, MessageSquare, AlertTriangle, Moon, PhoneCall, Sparkles, RefreshCw, RotateCcw } from 'lucide-react';
import { Product } from '../types';

interface ChatIAModalProps {
  isOpen: boolean;
  onClose: () => void;
  productContext?: {
    product: Product;
    quantity: number;
    quality: 'Original' | 'Alternativa';
  } | null;
  whatsappNumber?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'ia' | 'system';
  text: string;
  timestamp: Date;
}

export const ChatIA: React.FC<ChatIAModalProps> = ({
  isOpen,
  onClose,
  productContext,
  whatsappNumber = '51980722382'
}) => {
  // Estado local para mensajes
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Contador de preguntas de la sesión activa
  const [userQuestionsCount, setUserQuestionsCount] = useState<number>(0);
  const lastActiveTimeRef = useRef<number>(Date.now());

  // Control local de consultas por minuto (anti-spam)
  const [clicksUltimoMinuto, setClicksUltimoMinuto] = useState<number>(0);
  const [consultasDelDia, setConsultasDelDia] = useState<number>(0);

  const initWelcomeMessage = () => {
    if (productContext) {
      return [
        {
          id: 'welcome_1',
          sender: 'ia' as const,
          text: `¡Hola maestro! Veo que estás interesado en ${productContext.quantity} unidad(es) de "${productContext.product.name}" (${productContext.quality}). ¿Tienes alguna duda de compatibilidad con tu mototaxi (${productContext.product.brand}) o deseas confirmar el pedido?`,
          timestamp: new Date()
        }
      ];
    } else {
      return [
        {
          id: 'welcome_0',
          sender: 'ia' as const,
          text: '¡Hola maestro mecánico! Soy tu asistente virtual HW Andevia IA. ¿Qué duda tienes sobre repuestos para mototaxis TVS o Bajaj?',
          timestamp: new Date()
        }
      ];
    }
  };

  const handleResetSession = () => {
    setUserQuestionsCount(0);
    lastActiveTimeRef.current = Date.now();
    setMessages(initWelcomeMessage());
  };

  useEffect(() => {
    if (!isOpen) return;

    // Si pasaron más de 5 minutos de inactividad, refrescar sesión automáticamente
    const now = Date.now();
    if (now - lastActiveTimeRef.current > 5 * 60 * 1000 && userQuestionsCount >= 5) {
      setUserQuestionsCount(0);
    }
    lastActiveTimeRef.current = now;

    // Inicializar mensaje de bienvenida según el contexto del producto si está vacío
    if (messages.length === 0) {
      setMessages(initWelcomeMessage());
    }
  }, [isOpen, productContext]);

  // Evaluaciones de límites
  const isUserLimitReached = userQuestionsCount >= 5;
  const isMinuteLimitActive = clicksUltimoMinuto >= 12;
  const isDailyLimitActive = consultasDelDia >= 1450;

  // Enlace a WhatsApp
  const generateWhatsAppUrl = (customText?: string) => {
    let msg = customText || 'Hola HW Andevia Repuestos, quisiera información sobre repuestos para mi mototaxi.';
    if (productContext) {
      msg = `Hola HW Andevia Repuestos, deseo pedir ${productContext.quantity} unidad(es) de "${productContext.product.name}" (${productContext.quality}) para mototaxi ${productContext.product.brand}.`;
    }
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    if (isUserLimitReached || isMinuteLimitActive || isDailyLimitActive) return;

    const userText = input.trim();
    setInput('');

    // Agregar mensaje del usuario
    const newUserMsg: Message = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: userText,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, newUserMsg]);
    setIsLoading(true);

    // Incrementar contadores locales
    setUserQuestionsCount((prev) => prev + 1);
    setClicksUltimoMinuto((prev) => prev + 1);
    setConsultasDelDia((prev) => prev + 1);

    // Reiniciar click de minuto tras 60s
    setTimeout(() => {
      setClicksUltimoMinuto((prev) => Math.max(0, prev - 1));
    }, 60000);

    try {
      // URL activa del backend en Render (configurable por VITE_CHATBOT_URL o por defecto a Render)
      const rawChatbotUrl =
        (import.meta.env.VITE_CHATBOT_URL as string) ||
        ((typeof process !== 'undefined' && (process.env as any)?.REACT_APP_CHATBOT_URL) as string) ||
        'https://backend-chat-ia-eenf.onrender.com/chat';

      // Asegurar que la URL apunte exactamente a /chat sin duplicidades
      let chatbotUrl = rawChatbotUrl.trim();
      if (!chatbotUrl.endsWith('/chat')) {
        chatbotUrl = `${chatbotUrl.replace(/\/+$/, '')}/chat`;
      }

      // Payload estandarizado para FastAPI: { "message": "texto del usuario" }
      const payload: { message: string; [key: string]: any } = {
        message: userText
      };

      if (productContext) {
        payload.productContext = {
          name: productContext.product.name,
          brand: productContext.product.brand,
          modelCompatibility: productContext.product.modelCompatibility,
          quantity: productContext.quantity,
          quality: productContext.quality
        };
      }

      const res = await fetch(chatbotUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.detail || `Error ${res.status} en comunicación con el backend`);
      }

      const data = await res.json();
      // Soporta formato estandarizado { reply: "..." } y retrocompatibilidad { text: "..." }
      const replyText = data.reply || data.text || data.response || "¡Hola maestro! En HW Andevia tenemos stock disponible. ¿Qué repuesto deseas cotizar?";

      // Agregar respuesta de IA
      const iaReplyMsg: Message = {
        id: 'ia_' + Date.now(),
        sender: 'ia',
        text: replyText || 'Entendido maestro, cualquier otra duda estoy para ayudarte.',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, iaReplyMsg]);

    } catch (err: any) {
      console.error('Error enviando consulta a IA:', err);
      let errorResponse = '';
      
      const lower = userText.toLowerCase();
      if (lower.includes('filtro') && lower.includes('aceite')) {
        errorResponse = '¡Sí maestro! Tenemos en stock filtros de aceite: para Torito Bajaj 4T / Maxima (Original: S/ 18.00 | Alternativo A1: S/ 10.00) y para TVS King Duramax 200 (Original: S/ 22.00 | Alternativo A1: S/ 12.00). ¿Para cuál de los dos modelos necesitas?';
      } else if (lower.includes('filtro') && lower.includes('aire')) {
        errorResponse = '¡Sí maestro! Contamos con filtros de aire para Torito Bajaj 4T (Original: S/ 25.00 | Alt: S/ 14.00) y TVS King 200 (Original: S/ 28.00 | Alt: S/ 15.00).';
      } else if (lower.includes('bujia') || lower.includes('bujía')) {
        errorResponse = 'Disponemos de bujías Champion / Bosch y Original originales para Bajaj 4T (S/ 12.00) y TVS King (S/ 14.00).';
      } else if (lower.includes('freno') || lower.includes('zapata') || lower.includes('pastilla')) {
        errorResponse = 'Tenemos zapatas de freno traseras y delanteras de alta fricción para Torito Bajaj y TVS King desde S/ 15.00 en Alternativo A1 y S/ 28.00 en Original.';
      } else if (err?.message === '429' || String(err).includes('429')) {
        errorResponse = 'Hemos alcanzado la cuota de consultas momentánea. Por favor, haz tu pedido directamente por WhatsApp para atenderte de inmediato.';
      } else {
        errorResponse = 'Por el momento la conexión directa con el asistente está en mantenimiento. Por favor, haz tu consulta o pedido de repuestos directamente por WhatsApp para atenderte de inmediato.';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          sender: 'ia',
          text: errorResponse,
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 flex flex-col h-[600px] max-h-[90vh] overflow-hidden"
        >
          {/* HEADER DEL CHAT */}
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white p-0.5 border border-amber-400/40 shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src="/Logoimport.jpg"
                  alt="HW ANDEVIA Logo"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base flex items-center gap-2 text-white leading-tight">
                  <span>HW ANDEVIA</span>
                  <span className="bg-orange-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                    IA 24/7
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Asistente Técnico TVS King & Torito Bajaj</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleResetSession}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors border border-slate-700"
                title="Reiniciar chat y comenzar nueva consulta"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Nueva Consulta</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                title="Cerrar chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* BANNER FRENO DE MANO 2: LÍMITE DIARIO (> 1450 CONSULTAS) */}
          {isDailyLimitActive && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 p-4 text-center shrink-0 flex flex-col items-center justify-center space-y-2">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                <Moon className="w-5 h-5 text-amber-600 animate-bounce" />
                <span>Nuestro asistente virtual está descansando.</span>
              </div>
              <p className="text-xs text-slate-600 max-w-sm">
                Por favor, haz tu pedido directamente por WhatsApp para atenderte sin demoras.
              </p>
              <a
                href={generateWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Contactar por WhatsApp</span>
              </a>
            </div>
          )}

          {/* AREA DE MENSAJES */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white rounded-br-xs font-medium'
                      : msg.sender === 'ia'
                      ? 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                      : 'bg-amber-100 border border-amber-300 text-amber-900 rounded-xl'
                  }`}
                >
                  {msg.sender === 'ia' && (
                    <div className="text-[10px] font-bold uppercase tracking-wider text-orange-600 mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-orange-500" />
                      <span>HW Andevia IA</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span className="text-[9px] opacity-60 block text-right mt-1 font-mono">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-xs text-xs text-slate-500 flex items-center gap-2 shadow-sm">
                  <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
                  <span>Analizando compatibilidad y stock...</span>
                </div>
              </div>
            )}

            {/* FRENO DE MANO 1: AVISO VISUAL LÍMITE POR MINUTO (>= 12 CLICKS) */}
            {isMinuteLimitActive && !isDailyLimitActive && !isUserLimitReached && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-xs flex items-center gap-2.5 shadow-sm"
              >
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 animate-pulse" />
                <div>
                  <span className="font-bold block">Asistente ocupado...</span>
                  <p className="text-[11px] text-amber-700 leading-tight">
                    Hay muchas consultas simultáneas en este momento. Por favor espera unos segundos para hacer tu siguiente pregunta.
                  </p>
                </div>
              </motion.div>
            )}

            {/* AVISO LÍMITE POR USUARIO ALCANZADO (5 PREGUNTAS) */}
            {isUserLimitReached && !isDailyLimitActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-2 shadow-md my-2"
              >
                <div className="text-emerald-800 font-bold text-sm">
                  ¡5 consultas completadas en esta sesión!
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Para coordinar pedidos y entregas directas puedes ir a WhatsApp, o si deseas hacer más preguntas sobre otros repuestos, pulsa en iniciar nueva consulta.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <a
                    href={generateWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 px-4 rounded-xl text-xs shadow-md transition-all active:scale-95 uppercase tracking-wide"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Ir a WhatsApp</span>
                  </a>
                  <button
                    onClick={handleResetSession}
                    className="inline-flex items-center justify-center gap-1.5 flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold py-2.5 px-3 rounded-xl text-xs shadow-sm transition-all active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-orange-500" />
                    <span>Hacer otra consulta</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* FOOTER / INPUT */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0">
            {isDailyLimitActive ? (
              <div className="text-center py-2 text-xs text-slate-500 font-medium">
                Atención habilitada exclusivamente por WhatsApp.
              </div>
            ) : isUserLimitReached ? (
              <div className="flex gap-2">
                <a
                  href={generateWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all uppercase tracking-wider"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
                <button
                  onClick={handleResetSession}
                  className="px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
                  <span>Nueva Consulta</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isMinuteLimitActive
                      ? 'Asistente ocupado... Por favor espera unos segundos'
                      : 'Escribe tu pregunta sobre el repuesto...'
                  }
                  disabled={isLoading || isMinuteLimitActive}
                  className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />

                <button
                  type="submit"
                  disabled={isLoading || !input.trim() || isMinuteLimitActive}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                    isMinuteLimitActive
                      ? 'bg-slate-600 text-slate-300 animate-pulse cursor-not-allowed'
                      : isLoading || !input.trim()
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-none'
                      : 'bg-orange-500 hover:bg-orange-400 text-slate-950 font-extrabold shadow-orange-500/20'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Enviar</span>
                </button>
              </form>
            )}

            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
              <span>Sesión: {userQuestionsCount}/5 preguntas</span>
              <span className={isMinuteLimitActive ? 'text-amber-600 font-bold' : ''}>
                Carga min: {clicksUltimoMinuto}/12
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
