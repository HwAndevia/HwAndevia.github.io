export default {
  async fetch(request, env) {
    // Cabeceras CORS para permitir peticiones desde la tienda web
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Responder a las solicitudes de preflight OPTIONS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Solo se permiten solicitudes POST' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const { prompt, productContext } = await request.json();

      if (!prompt) {
        return new Response(JSON.stringify({ error: 'El mensaje no puede estar vacío' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Clave de API de Gemini guardada en secreto de Cloudflare Worker (env.GEMINI_API_KEY)
      const apiKey = env.GEMINI_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'Variable GEMINI_API_KEY no configurada en Cloudflare Workers' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const systemInstruction = `Eres "HW Andevia IA", el asesor técnico, mecánico y comercial experto de HW Andevia Repuestos en Lima, Perú.
Tu especialidad son los repuestos, disponibilidad y stock, compatibilidad, precios, mantenimiento y lógica mecánica para mototaxis TVS (King 200, GS, Deluxe, Duramax) y Bajaj (Torito RE 205, RE 4S, Maxima Z/Cargo).

PAUTAS DE RESPUESTA:
1. DISPONIBILIDAD Y STOCK: Informa si un repuesto está disponible o no, indicando calidades (Original vs Alternativa) y precios en Soles (S/). Si no se cuenta en almacén, recomienda consultar por WhatsApp para pedido especial.
2. LÓGICA MECÁNICA Y DIAGNÓSTICO: Puedes razonar y asesorar sobre fallas mecánicas de mototaxis (ej. desgaste de embrague, humo en el escape, calibración de bujías, mantenimiento preventivo) para recomendar la solución o pieza correcta.
3. CONVERSACIÓN NATURAL: Responde con sentido común, fluidez y cortesía técnica.
4. LÍMITE DE LONGITUD: Respuestas claras de máximo 250 palabras.
5. TONO: Cercano y profesional de taller o mostrador de repuestos ("maestro", "amigo").`;

      let fullPrompt = prompt;
      if (productContext) {
        fullPrompt = `[Contexto del repuesto: ${productContext.name}, Marca: ${productContext.brand}, Compatibilidad: ${productContext.modelCompatibility || 'General'}]\nPregunta del cliente: ${prompt}`;
      }

      // Llamada directa a la API de Google Gemini (gemini-3.1-flash-lite - versión económica y rápida)
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;

      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `${systemInstruction}\n\n${fullPrompt}` }
              ]
            }
          ]
        })
      });

      const data = await geminiResponse.json();

      if (!geminiResponse.ok) {
        return new Response(JSON.stringify({ error: data.error?.message || 'Error en respuesta de Gemini API' }), {
          status: geminiResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Entendido. ¿Tienes alguna otra duda sobre tu repuesto?';

      return new Response(JSON.stringify({ text: replyText }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message || 'Error interno en el Worker' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
};
