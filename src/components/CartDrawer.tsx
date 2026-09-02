import React, { useState, useEffect } from 'react';
import { CartItem, StoreSettings, QualityTier } from '../types';
import { 
  ArrowLeft, 
  Trash2, 
  ShoppingBag, 
  Send, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ShoppingBag as CartIcon
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quality: QualityTier, quantity: number) => void;
  onRemoveItem: (productId: string, quality: QualityTier) => void;
  onClearCart: () => void;
  settings: StoreSettings;
}

// Helper to compute unit price based on quantity (>= 3 is wholesale)
export const getCartItemPriceInfo = (item: CartItem) => {
  const isWholesale = (Number(item.quantity) || 1) >= 3;
  const p = item.product;

  let unitPrice: number;
  if (item.quality === 'Original') {
    if (isWholesale) {
      unitPrice = Number(p.priceMayorOriginal ?? p.priceMayorOEM ?? p.priceMayor ?? (p.priceOriginal ? Math.round(p.priceOriginal * 0.85) : 0));
    } else {
      unitPrice = Number(p.priceOriginal ?? p.priceOEM ?? 0);
    }
  } else {
    if (isWholesale) {
      unitPrice = Number(p.priceMayorAlt ?? (p.priceAlt ? Math.round(p.priceAlt * 0.85) : (p.priceMayor ? Math.round(p.priceMayor * 0.6) : 0)));
    } else {
      unitPrice = Number(p.priceAlt ?? 0);
    }
  }

  return { unitPrice, isWholesale };
};

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  settings,
}) => {
  const [orderDetails, setOrderDetails] = useState({
    customerName: '',
    phone: '',
    location: '',
    deliveryMethod: 'agencia',
    agencyName: 'Agencia Shalom',
    paymentMethod: 'yape',
    notes: '',
    mototaxiModel: '',
  });

  const [formError, setFormError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isOpen]);

  // Listener para cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalItemsCount = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const subtotal = cartItems.reduce((sum, item) => {
    const { unitPrice } = getCartItemPriceInfo(item);
    return sum + unitPrice * (Number(item.quantity) || 1);
  }, 0);
  const igvAmount = subtotal * 0.18;
  const totalAPagar = subtotal + igvAmount;

  const handleSendWhatsAppOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderDetails.customerName.trim()) {
      setFormError('Por favor ingresa tu Nombre y Apellido.');
      return;
    }
    if (!orderDetails.location.trim()) {
      setFormError('Por favor ingresa tu Ubicación (Ciudad / Distrito / Dirección).');
      return;
    }

    setFormError('');

    // Formatear mensaje para WhatsApp
    let message = `*¡Hola ${settings.storeName}!* 👋\n`;
    message += `Deseo realizar el siguiente pedido de repuestos:\n\n`;
    message += `🛒 *DETALLE DEL PEDIDO:*\n`;

    cartItems.forEach((item, index) => {
      const { unitPrice, isWholesale } = getCartItemPriceInfo(item);
      const qualityLabel = item.quality === 'Original' ? 'Original' : 'Alternativa';
      const lineTotal = (unitPrice * item.quantity).toFixed(2);
      const priceTypeTag = isWholesale ? '🟢 *Precio al por mayor*' : '⚪ *Precio al por menor*';

      message += `${index + 1}. *${item.product.name}*\n`;
      message += `   • Cantidad: ${item.quantity} unidad(es)\n`;
      message += `   • Calidad: ${qualityLabel}\n`;
      message += `   • Tipo de Precio: ${priceTypeTag}\n`;
      message += `   • Precio Unit: S/ ${unitPrice.toFixed(2)} | Subtotal: S/ ${lineTotal}\n\n`;
    });

    message += `💵 *Subtotal:* S/ ${subtotal.toFixed(2)}\n`;
    message += `📊 *IGV (18%):* S/ ${igvAmount.toFixed(2)}\n`;
    message += `💰 *TOTAL A PAGAR: S/ ${totalAPagar.toFixed(2)}*\n\n`;
    message += `📋 *DATOS PARA EL ENVÍO:*\n`;
    message += `• *Cliente:* ${orderDetails.customerName}\n`;
    message += `• *Ubicación:* ${orderDetails.location}\n`;

    /* 
    // Modalidad de entrega comentada temporalmente para uso futuro:
    const deliveryLabels: Record<string, string> = {
      agencia: `Envío por Agencia (${orderDetails.agencyName || 'Shalom / Marvisur'})`,
      domicilio: 'Envío a Domicilio',
      tienda: 'Recojo en Tienda',
    };
    if (orderDetails.deliveryMethod) {
      message += `• *Modalidad de Entrega:* ${deliveryLabels[orderDetails.deliveryMethod] || orderDetails.deliveryMethod}\n`;
    }
    */

    message += `\nQuedo a la espera de confirmación de stock y número de cuenta/QR para completar el pago. ¡Muchas gracias!`;

    // Número de teléfono limpio
    const targetPhone = settings.whatsappNumber.replace(/\D/g, '') || '51980722382';
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(message.normalize('NFC'))}`;

    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto flex flex-col text-white animate-fade-in">
      
      {/* Sticky Header Navigation */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3.5 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          
          {/* Back to catalog button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 text-slate-300 hover:text-red-400 font-medium text-sm transition-colors py-1.5 px-3 -ml-2 rounded-xl hover:bg-slate-800 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
            <span>Seguir Comprando</span>
          </button>

          {/* Title / Counter */}
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-red-500" />
              <span>Carrito de Compras</span>
            </h1>
            <span className="bg-red-950/70 text-red-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-900/60">
              {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
            </span>
          </div>

          {/* Vaciar Carrito (si hay productos) */}
          {cartItems.length > 0 ? (
            <button
              type="button"
              onClick={onClearCart}
              className="text-xs text-slate-400 hover:text-red-400 font-medium transition-colors py-1.5 px-3 rounded-xl hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Vaciar Carrito</span>
            </button>
          ) : (
            <div className="w-20"></div>
          )}

        </div>
      </header>

      {/* Main Full Page Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        
        {cartItems.length === 0 ? (
          /* Empty State */
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-16 text-center max-w-xl mx-auto shadow-lg space-y-4 my-8">
            <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <CartIcon className="w-10 h-10" />
            </div>
            
            <h2 className="text-2xl font-bold text-white">
              Tu carrito está vacío
            </h2>
            
            <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
              Aún no has agregado repuestos a tu pedido. Explora nuestro catálogo de repuestos para Torito Bajaj y TVS King para agregar los productos que necesitas.
            </p>

            <div className="pt-4">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold text-sm px-6 py-3.5 rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Explorar Catálogo de Repuestos</span>
              </button>
            </div>
          </div>
        ) : (
          /* Populated Cart Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-start">
            
            {/* LEFT COLUMN: Items List (7 cols on lg) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Repuestos seleccionados ({cartItems.length})
                </h2>
                <span className="text-xs text-slate-400">
                  Total: {totalItemsCount} unidades
                </span>
              </div>

              {/* Items Card List */}
              <div className="space-y-3">
                {cartItems.map((item) => {
                  const { unitPrice, isWholesale } = getCartItemPriceInfo(item);
                  const lineTotal = unitPrice * item.quantity;
                  return (
                    <div
                      key={`${item.product.id}_${item.quality}`}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-slate-700"
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        {/* Image */}
                        <img
                          src={item.product.imageUrl || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=600'}
                          alt={item.product.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl bg-slate-950 border border-slate-800 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=600';
                          }}
                        />

                        {/* Product Info */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase text-slate-200 bg-slate-800 px-2 py-0.5 rounded-md">
                              {item.product.brand}
                            </span>
                            {item.quality === 'Original' ? (
                              <span className="text-[10px] font-bold bg-amber-950/70 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-amber-400" />
                                Original
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold bg-blue-950/70 text-blue-300 border border-blue-800/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-blue-400" />
                                Alternativa
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-sm text-white line-clamp-2 leading-tight">
                            {item.product.name}
                          </h3>

                          {/* Unit price and Wholesale / Retail message */}
                          <div className="space-y-1 pt-0.5">
                            <div className="text-xs text-slate-400 font-medium flex items-baseline gap-1.5">
                              <span>Unitario:</span>
                              <span className="font-extrabold text-white text-sm">
                                S/ {unitPrice.toFixed(2)}
                              </span>
                            </div>

                            {isWholesale ? (
                              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-800/80 px-2.5 py-0.5 rounded-md shadow-2xs">
                                <Sparkles className="w-3 h-3 text-emerald-400" />
                                <span>precio al por mayor</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800/80 border border-slate-700/80 px-2 py-0.5 rounded-md">
                                <span>precio al por menor</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quantity Selector, Subtotal & Delete */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                        {/* Quantity Counter */}
                        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.product.id, item.quality, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center font-bold text-slate-300 hover:bg-slate-800 rounded-lg transition-colors text-sm cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-extrabold text-sm text-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.product.id, item.quality, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center font-bold text-slate-300 hover:bg-slate-800 rounded-lg transition-colors text-sm cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        {/* Subtotal per line */}
                        <div className="text-right min-w-[80px]">
                          <span className="text-[10px] text-slate-500 block uppercase">Subtotal</span>
                          <span className="text-base font-black text-white">
                            S/ {lineTotal.toFixed(2)}
                          </span>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.product.id, item.quality)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                          title="Eliminar del pedido"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Add more items prompt */}
              <div className="pt-2 flex justify-start">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-slate-400 hover:text-red-400 font-medium flex items-center gap-1.5 py-2 px-3 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>¿Deseas agregar más repuestos? Seguir comprando</span>
                </button>
              </div>

            </div>

            {/* RIGHT COLUMN: Order Summary & WhatsApp Delivery Form (5 cols on lg) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Total a Pagar Card */}
              <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                    Total a Pagar
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
                    S/ {totalAPagar.toFixed(2)}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-2.5 text-sm font-semibold text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                      <span>Subtotal:</span>
                    </span>
                    <span className="font-bold text-white text-base">
                      S/ {subtotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>IGV (18%):</span>
                    </span>
                    <span className="font-extrabold text-emerald-400 text-base">
                      S/ {igvAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Data Form */}
              <form onSubmit={handleSendWhatsAppOrder} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    Datos para el Envío y WhatsApp
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ingresa tus datos básicos para coordinar la entrega y el pago por WhatsApp.
                  </p>
                </div>

                {formError && (
                  <div className="bg-red-950/70 text-red-300 p-3 rounded-xl text-xs flex items-center gap-2 border border-red-800/80">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      Nombre y Apellido *
                    </label>
                    <input
                      type="text"
                      required
                      value={orderDetails.customerName}
                      onChange={(e) => setOrderDetails({ ...orderDetails, customerName: e.target.value })}
                      placeholder="Ej. Juan Pérez"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      Ubicación *
                    </label>
                    <input
                      type="text"
                      required
                      value={orderDetails.location}
                      onChange={(e) => setOrderDetails({ ...orderDetails, location: e.target.value })}
                      placeholder="Ej. Lima, San Juan de Lurigancho / Trujillo / Chiclayo"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    />
                  </div>

                </div>

                {/* Submit WhatsApp Order CTA Button */}
                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg hover:shadow-emerald-600/30 flex items-center justify-center gap-2.5 text-sm transition-all active:scale-98 uppercase tracking-wide cursor-pointer"
                  >
                    <Send className="w-5 h-5 fill-white" />
                    <span>Enviar Pedido por WhatsApp</span>
                  </button>

                  <p className="text-[11px] text-center text-slate-400 leading-relaxed">
                    Al presionar el botón se abrirá WhatsApp con el resumen de tu pedido para coordinar inmediatamente con nuestro asesor.
                  </p>
                </div>
              </form>

            </div>

          </div>
        )}

      </main>

    </div>
  );
};
