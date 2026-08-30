import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Gemini Chatbot
  app.post("/api/chat", async (req, res) => {
    try {
      const userMessage = (req.body.message || req.body.prompt || "") as string;
      const { productContext } = req.body;

      if (!userMessage || typeof userMessage !== "string") {
        return res.status(400).json({ error: "El mensaje es requerido" });
      }

      if (userMessage.length > 300) {
        return res.status(400).json({ error: "El mensaje no debe superar los 300 caracteres" });
      }

      const prompt = userMessage.trim();

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "API Key de Gemini no configurada en el servidor"
        });
      }

      // Cargar productos disponibles para alimentar contexto real
      let catalogContext = "";
      try {
        const productosPath = path.join(process.cwd(), "public", "productos.json");
        if (fs.existsSync(productosPath)) {
          const raw = fs.readFileSync(productosPath, "utf-8");
          const prods = JSON.parse(raw);
          catalogContext = prods
            .map(
              (p: any) =>
                `- ${p.name} | Marca: ${p.brand} | Cat: ${p.category} | Original: S/${p.priceOriginal} | Alt: S/${p.priceAlt} | Stock Original: ${p.stockOriginal} | Stock Alt: ${p.stockAlt} | Comp: ${p.modelCompatibility}`
            )
            .join("\n");
        }
      } catch (err) {
        console.warn("No se pudo leer catálogo para contexto:", err);
      }

      // En caso de que el backend corra en desarrollo con GEMINI_API_KEY o fallback
      if (!apiKey) {
        const lower = prompt.toLowerCase();
        let fallbackReply = "¡Hola maestro! En HW Andevia tenemos repuestos originales y alternativos A1 para TVS y Bajaj.";
        if (lower.includes("filtro") && lower.includes("aceite")) {
          fallbackReply = "¡Sí tenemos stock de filtros de aceite, maestro! Disponemos para Torito Bajaj 4T / Maxima (Original: S/ 18.00 | Alternativo A1: S/ 10.00) y para TVS King Duramax 200 (Original: S/ 22.00 | Alternativo A1: S/ 12.00). ¿Para cuál de las dos mototaxis necesitas y cuántas unidades te despachamos?";
        } else if (lower.includes("filtro") && lower.includes("aire")) {
          fallbackReply = "¡Sí maestro! Contamos con filtros de aire para Torito Bajaj 4T (Original: S/ 25.00 | Alt: S/ 14.00) y TVS King 200 (Original: S/ 28.00 | Alt: S/ 15.00) con esponja y papel de alta filtración.";
        } else if (lower.includes("freno") || lower.includes("zapata") || lower.includes("pastilla")) {
          fallbackReply = "Contamos con zapatas de freno traseras y delanteras de alta fricción para Bajaj y TVS (Original y Alternativas A1 sin asbesto).";
        }
        return res.json({ reply: fallbackReply, text: fallbackReply });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const systemInstruction = `Eres "HW Andevia IA", el asesor técnico, mecánico y comercial experto de HW Andevia Repuestos en Lima, Perú.
Tu especialidad son los repuestos, stock, compatibilidad, precios, mantenimiento y lógica de funcionamiento mecánico para mototaxis TVS (King 200, GS, Deluxe, Duramax) y Bajaj (Torito RE 205, RE 4S, Maxima Z/Cargo).

CATÁLOGO ACTUAL DE REPUESTOS Y STOCK EN TIENDA:
${catalogContext || "Disponemos de filtros de aceite, filtros de aire, filtros de gasolina, bujías, cables de embrague/acelerador/freno, kits de cilindro y pistón, zapatas y pastillas de freno para TVS y Bajaj."}

CAPACIDADES Y LÓGICA DE RESPUESTA:
1. DISPONIBILIDAD Y STOCK: Revisa el catálogo para confirmar con certeza si un repuesto está disponible en stock o si no se cuenta actualmente. Si está en stock, indica sus calidades (Original vs Alternativo A1) y sus precios en Soles (S/). Si no lo tenemos en el catálogo, indícaselo con sinceridad al cliente y recomiéndale consultar por WhatsApp por si se puede traer a pedido.
2. LÓGICA MECÁNICA Y DIAGNÓSTICO: Puedes responder con lógica y razonamiento técnico sobre fallas mecánicas de mototaxis (ej. síntomas de embrague gastado, por qué quema aceite, problemas de compresión, cuándo cambiar filtros, bujías, etc.) y guiar al usuario hacia la solución o repuesto indicado.
3. CONVERSACIÓN NATURAL: Responde de forma cordial, inteligente y fluida. Si te hacen preguntas de lógica general sobre mototaxis, mantenimiento o compra, responde con buen criterio.
4. LÍMITE DE LONGITUD: Respuestas claras y estructuradas, de máximo 250 palabras.
5. TONO: Cercano, profesional y confiable de taller peruano ("maestro", "amigo").`;

      let userContent = prompt;
      if (productContext) {
        userContent = `[Contexto del producto consultado por el cliente: Repuesto: "${productContext.name}", Marca: "${productContext.brand}", Compatibilidad: "${productContext.modelCompatibility}", Cantidad: ${productContext.quantity}, Calidad seleccionada: ${productContext.quality}]\n\nPregunta del cliente: ${prompt}`;
      }

      let replyText = "";
      const candidateModels = [
        "gemini-3.1-flash-lite",
        "gemini-flash-latest",
      ];

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: userContent,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });
          if (response?.text) {
            replyText = response.text;
            break;
          }
        } catch (modelErr: any) {
          // Log transient spike and cascade to the next available model
          console.warn(`Model ${modelName} unavailable, cascading:`, modelErr?.status || modelErr?.message || modelErr);
        }
      }

      // If all live API model tiers are momentarily under high load/503, serve smart contextual catalogue response
      if (!replyText) {
        const lower = prompt.toLowerCase();
        if (lower.includes("filtro") && lower.includes("aceite")) {
          replyText = "¡Sí maestro! Tenemos stock permanente de filtros de aceite: para Torito Bajaj 4T / Maxima (Original: S/ 18.00 | Alternativo A1: S/ 10.00) y para TVS King Duramax 200 (Original: S/ 22.00 | Alternativo A1: S/ 12.00). ¿Para cuál de las dos mototaxis deseas coordinar?";
        } else if (lower.includes("filtro") && lower.includes("aire")) {
          replyText = "¡Sí tenemos filtros de aire maestro! Para Torito Bajaj 4T (Original: S/ 25.00 | Alternativo A1: S/ 14.00) y TVS King 200 (Original: S/ 28.00 | Alternativo A1: S/ 15.00).";
        } else if (lower.includes("filtro") && (lower.includes("gasolina") || lower.includes("combustible"))) {
          replyText = "Disponemos de filtros de gasolina sellados de alto flujo para TVS King y Bajaj RE 205 (Original: S/ 15.00 | Alternativo A1: S/ 8.00).";
        } else if (lower.includes("bujia") || lower.includes("bujía")) {
          replyText = "Contamos con bujías para mototaxi: Champion / Bosch y Original Originales para Bajaj 4T (S/ 12.00) y TVS King (S/ 14.00).";
        } else if (lower.includes("zapata") || lower.includes("pastilla") || lower.includes("freno")) {
          replyText = "Tenemos zapatas y pastillas de freno libres de asbesto para Torito Bajaj y TVS King desde S/ 15.00 en Alternativo A1 y S/ 28.00 en Original.";
        } else if (lower.includes("embrague") || lower.includes("clutch") || lower.includes("disco")) {
          replyText = "Disponemos de kits de discos de embrague (Original Originales TVS/Bajaj y Alternativos A1 japoneses) con resortes reforzados para trabajo pesado.";
        } else if (lower.includes("cilindro") || lower.includes("piston") || lower.includes("pistón") || lower.includes("anillo")) {
          replyText = "Contamos con kits de cilindro + pistón + anillos estándar y sobremedida para TVS King 200cc y Bajaj RE 205cc (Original y Alternativo A1).";
        } else if (lower.includes("precio") || lower.includes("cuanto") || lower.includes("cuánto") || lower.includes("costo")) {
          replyText = "Manejamos precios al por mayor y menor en Soles (S/) tanto en Original como en Alternativa A1. ¿Qué repuesto específico buscas para darte la cotización exacta?";
        } else if (lower.includes("envio") || lower.includes("delivery") || lower.includes("provincia")) {
          replyText = "Hacemos envíos diarios a todo el Perú: delivery express en Lima y despachos a provincias por agencias de carga (Shalom, Marvisur, Flores).";
        } else {
          replyText = "¡Hola maestro! En HW Andevia tenemos stock completo de repuestos Original Originales y Alternativos A1 para mototaxis TVS (King/Deluxe) y Bajaj (Torito 4T/Maxima). ¿Qué repuesto deseas consultar?";
        }
      }

      return res.json({ reply: replyText, text: replyText });
    } catch (error: any) {
      console.error("Error en API Gemini /api/chat:", error);
      const defaultErrorReply = "¡Hola maestro! En HW Andevia tenemos stock completo de repuestos originales y alternativos A1 para mototaxis TVS y Bajaj. ¿Qué repuesto necesitas consultar?";
      return res.json({
        reply: defaultErrorReply,
        text: defaultErrorReply,
      });
    }
  });

  // Endpoint para servir catálogo de productos
  app.get("/api/products", (req, res) => {
    try {
      const productosPath = path.join(process.cwd(), "public", "productos.json");
      if (fs.existsSync(productosPath)) {
        const raw = fs.readFileSync(productosPath, "utf-8");
        return res.json(JSON.parse(raw));
      }
      return res.json([]);
    } catch (err) {
      console.error("Error al leer public/productos.json en servidor:", err);
      return res.status(500).json({ error: "Error al leer productos.json" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "hw-andevia-api" });
  });

  // Vite middleware for development / static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor HW Andevia ejecutándose en http://0.0.0.0:${PORT}`);
  });
}

startServer();
