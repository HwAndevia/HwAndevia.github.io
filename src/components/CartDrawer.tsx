import React, { useState } from 'react';
import { CartItem, CustomerOrderDetails, StoreSettings } from '../types';
import { X, Trash2, ShoppingBag, Send, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quality: 'OEM' | 'Alternativa', quantity: number) => void;
  onRemoveItem: (productId: string, quality: 'OEM' | 'Alternativa') => void;
  onClearCart: () => void;
  settings: StoreSettings;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  settings,
}) => {
  if (!isOpen) return null;

  const [orderDetails, setOrderDetails] = useState<CustomerOrderDetails>({
    customerName: '',
    phone: '',
    cityDistrict: '',
    deliveryMethod: 'agencia',
    agencyName: 'Agencia Shalom',
    paymentMethod: 'yape',
    notes: '',
    mototaxiModel: '',
  });

  const [formError, setFormError] = useState<string>('');

  const cartTotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const handleSendWhatsAppOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderDetails.customerName.trim()) {
      setFormError('Por favor ingresa tu Nombre y Apellido.');
      return;
    }
    if (!orderDetails.phone.trim()) {
      setFormError('Por favor ingresa tu Número de Celular.');
      return;
    }
    if (!orderDetails.cityDistrict.trim()) {
      setFormError('Por favor ingresa tu Ciudad / Distrito.');
      return;
    }

    setFormError('');

    // Format WhatsApp message
    let message = `*¡Hola ${settings.storeName}!* 👋\n`;
    message += `Deseo realizar un pedido de repuestos de mototaxi:\n\n`;
    message += `🛒 *DETALLE DEL PEDIDO:*\n`;

    cartItems.forEach((item, index) => {
      const qualityLabel = item.quality === 'OEM' ? 'Original OEM 🟢' : 'Alternativa Premium 🔵';
      const lineTotal = (item.unitPrice * item.quantity).toFixed(2);
      message += `${index + 1}. *${item.product.name}*\n`;
      message += `   • Cantidad: ${item.quantity}\n`;
      message += `   • Calidad: ${qualityLabel}\n`;
      message += `   • Precio Unit: S/ ${item.unitPrice.toFixed(2)} | Subtotal: S/ ${lineTotal}\n\n`;
    });

    message += `💰 *TOTAL A PAGAR: S/ ${cartTotal.toFixed(2)}*\n\n`;
    message += `📋 *DATOS DE ENTREGA Y CLIENTE:*\n`;
    message += `• *Cliente:* ${orderDetails.customerName}\n`;
    message += `• *Teléfono:* ${orderDetails.phone}\n`;
    message += `• *Ciudad/Distrito:* ${orderDetails.cityDistrict}\n`;
    
    if (orderDetails.mototaxiModel) {
      message += `• *Modelo Mototaxi:* ${orderDetails.mototaxiModel}\n`;
    }

    const deliveryLabels = {
      agencia: `Envío por Agencia (${orderDetails.agencyName || 'Shalom / Marvisur'})`,
      domicilio: 'Envío a Domicilio',
      tienda: 'Recojo en Tienda',
    };
    message += `• *Modalidad:* ${deliveryLabels[orderDetails.deliveryMethod]}\n`;

    const paymentLabels = {
      yape: 'Yape',
      plin: 'Plin',
      transferencia: 'Transferencia Bancaria BCP/BBVA',
      efectivo: 'Efectivo contra-entrega',
    };
    message += `• *Pago Preferido:* ${paymentLabels[orderDetails.paymentMethod]}\n`;

    if (orderDetails.notes) {
      message += `• *Notas:* ${orderDetails.notes}\n`;
    }

    message += `\nQuedo a la espera de confirmación de stock y número de cuenta/QR para completar el pago. ¡Gracias!`;

    // Clean phone number (remove spaces/dashes)
    const targetPhone = settings.whatsappNumber.replace(/\D/g, '') || '51980722382';
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(message.normalize('NFC'))}`;

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col justify-between border-l border-slate-200">
        
        {/* Cart Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-600 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white leading-tight">
                Mi Carrito de Pedidos
              </h2>
              <p className="text-xs text-slate-400">
                {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'} seleccionados
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items Scroll Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {cartItems.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-base">
                Tu carrito está vacío
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Selecciona repuestos para TVS King o Torito Bajaj del catálogo para armar tu pedido.
              </p>
              <button
                onClick={onClose}
                className="mt-2 text-xs font-bold bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors"
              >
                Explorar Catálogo
              </button>
            </div>
          ) : (
            <>
              {/* Item List */}
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={`${item.product.id}_${item.quality}`}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex gap-3 items-center justify-between shadow-sm"
                  >
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-14 h-14 object-cover rounded-lg bg-white border border-slate-200 shrink-0"
                    />

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                          {item.product.brand}
                        </span>
                        {item.quality === 'OEM' ? (
                          <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3 text-amber-600" />
                            Original
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            Alternativa
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 truncate">
                        {item.product.name}
                      </h4>

                      <div className="text-xs font-black text-slate-900">
                        S/ {item.unitPrice.toFixed(2)}{' '}
                        <span className="text-[10px] text-slate-500 font-normal">c/u</span>
                      </div>
                    </div>

                    {/* Quantity controls & Delete */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <button
                        onClick={() => onRemoveItem(item.product.id, item.quality)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                        title="Eliminar del carrito"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-0.5 text-xs">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quality, item.quantity - 1)}
                          className="w-5 h-5 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 rounded"
                        >
                          -
                        </button>
                        <span className="w-5 text-center font-extrabold text-xs">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quality, item.quantity + 1)}
                          className="w-5 h-5 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 rounded"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Clear All button */}
              <div className="flex justify-between items-center text-xs text-slate-500 pt-1 border-t border-slate-100">
                <span>Total de items: {cartItems.reduce((acc, i) => acc + i.quantity, 0)}</span>
                <button
                  onClick={onClearCart}
                  className="text-red-600 hover:underline font-semibold"
                >
                  Vaciar carrito
                </button>
              </div>

              {/* Customer Order Form */}
              <div className="border-t border-slate-200 pt-3 space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  Datos para enviar por WhatsApp
                </h3>

                {formError && (
                  <div className="bg-red-50 text-red-700 p-2.5 rounded-xl text-xs flex items-center gap-2 border border-red-200">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5">
                      Nombre y Apellido *
                    </label>
                    <input
                      type="text"
                      required
                      value={orderDetails.customerName}
                      onChange={(e) => setOrderDetails({ ...orderDetails, customerName: e.target.value })}
                      placeholder="Ej. Juan Pérez"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">
                        Teléfono / Celular *
                      </label>
                      <input
                        type="tel"
                        required
                        value={orderDetails.phone}
                        onChange={(e) => setOrderDetails({ ...orderDetails, phone: e.target.value })}
                        placeholder="Ej. 987654321"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">
                        Ciudad / Distrito *
                      </label>
                      <input
                        type="text"
                        required
                        value={orderDetails.cityDistrict}
                        onChange={(e) => setOrderDetails({ ...orderDetails, cityDistrict: e.target.value })}
                        placeholder="Lima"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5">
                      Modelo exacto de Mototaxi (Recomendado)
                    </label>
                    <input
                      type="text"
                      value={orderDetails.mototaxiModel}
                      onChange={(e) => setOrderDetails({ ...orderDetails, mototaxiModel: e.target.value })}
                      placeholder="Ej. Torito Bajaj 4T 2021 / TVS King Duramax 200"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">
                        Modalidad de Envío
                      </label>
                      <select
                        value={orderDetails.deliveryMethod}
                        onChange={(e) => setOrderDetails({ ...orderDetails, deliveryMethod: e.target.value as any })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="agencia">Envío por Agencia (Shalom/Marvisur)</option>
                        <option value="domicilio">Envío a Domicilio</option>
                        <option value="tienda">Recojo en Tienda</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">
                        Método de Pago
                      </label>
                      <select
                        value={orderDetails.paymentMethod}
                        onChange={(e) => setOrderDetails({ ...orderDetails, paymentMethod: e.target.value as any })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="yape">Yape</option>
                        <option value="plin">Plin</option>
                        <option value="transferencia">Transferencia BCP / BBVA</option>
                        <option value="efectivo">Efectivo contra-entrega</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5">
                      Notas adicionales
                    </label>
                    <input
                      type="text"
                      value={orderDetails.notes}
                      onChange={(e) => setOrderDetails({ ...orderDetails, notes: e.target.value })}
                      placeholder="Ej. Factura / Boleta / Agencia específica"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

              </div>
            </>
          )}

        </div>

        {/* Cart Drawer Footer */}
        {cartItems.length > 0 && (
          <div className="p-4 bg-slate-900 text-white border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-300">Total a Pagar:</span>
              <span className="text-2xl font-black text-amber-400">
                S/ {cartTotal.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleSendWhatsAppOrder}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 text-sm transition-all active:scale-98"
            >
              <Send className="w-5 h-5 fill-white" />
              <span>ENVIAR PEDIDO POR WHATSAPP</span>
            </button>

            <p className="text-[11px] text-center text-slate-400">
              Se abrirá WhatsApp para confirmar tu pedido directamente con un asesor.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
