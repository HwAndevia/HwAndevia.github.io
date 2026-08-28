/**
 * Utilidades para construcción de enlaces seguros de WhatsApp
 * que garantizan la correcta codificación UTF-8 para emojis (🏍️, 📦),
 * caracteres acentuados (á, é, í, ó, ú) y eñes (ñ, Ñ).
 */

/**
 * Normaliza y codifica cualquier texto preservando emojis y caracteres especiales.
 * @param phoneNumber Número de teléfono con o sin código de país o símbolos
 * @param rawMessage Mensaje preescrito en texto plano
 * @returns URL completa y sanitizada lista para usar con wa.me o api.whatsapp.com
 */
export function buildWhatsAppUrl(phoneNumber: string, rawMessage: string): string {
  // 1. Limpiar el número telefónico dejando solo dígitos
  const cleanPhone = (phoneNumber || '').replace(/\D/g, '') || '51980722382';

  // 2. Normalización Unicode Form C (NFC)
  // Combina caracteres base y diacríticos (ej. 'a' + '´' -> 'á') evitando fragmentación de bytes
  let normalizedMessage = (rawMessage || '').normalize('NFC');

  // 3. toWellFormed() previene pares surrogates incompletos si están soportados por el runtime
  if (typeof (normalizedMessage as any).toWellFormed === 'function') {
    normalizedMessage = (normalizedMessage as any).toWellFormed();
  }

  // 4. encodeURIComponent convierte los caracteres UTF-8 en secuencias percent-encoding estándar (%C3%B1, %F0%9F%8F%8D, etc.)
  const encodedText = encodeURIComponent(normalizedMessage.trim());

  // 5. Retornar la URL oficial con el parámetro codificado
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
}
