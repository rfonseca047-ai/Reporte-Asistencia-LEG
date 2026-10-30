import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware for large payload (multiple screenshots in base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY || '';
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

interface ImagePayload {
  data: string; // base64
  mimeType: string;
  filename?: string;
}

interface RawDetection {
  sourceImage?: string;
  driver: 'ENRIQUE GRANT' | 'LUIS E. GRANT' | 'OTRO';
  predio?: 'Predio 1' | 'Predio 2' | 'Predio 3' | string;
  movementType: 'INGRESO' | 'SALIDA' | 'DESCONOCIDO';
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  rawTextFound?: string;
  confidenceNotes?: string;
}

// Endpoint to process WhatsApp screenshots
app.post('/api/process-images', async (req: Request, res: Response) => {
  try {
    const { images, defaultYear = '2026', referenceDate = '2026-10-29' } = req.body as {
      images: ImagePayload[];
      defaultYear?: string;
      referenceDate?: string;
    };

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'No se enviaron imágenes para procesar.' });
    }

    if (!aiClient) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY no está configurada en las variables de entorno del servidor.',
      });
    }

    const allDetections: RawDetection[] = [];

    // System instruction tailored for WhatsApp employee attendance screenshots
    const systemInstruction = `Eres un asistente experto en OCR y auditoría de registros de control de asistencia de empleados a partir de capturas de pantalla de WhatsApp, fotos de grupos, bitácoras o reportes.

REGLAS DE IDENTIFICACIÓN:
1. EMPLEADOS:
   - Los empleados son: "ENRIQUE GRANT" y "LUIS E. GRANT".
   - Las fotos en WhatsApp frecuentemente tienen stickers o recortes de texto sobre las fotos de reporte, por ejemplo:
     * "Ingresa Enrique Grant" o "Sale Enrique Grant" -> Empleado: "ENRIQUE GRANT".
     * "Ingresa Luis Grant", "Ingresa Luis G" o "Sale Luis Grant" -> Empleado: "LUIS E. GRANT".
   - Si el sticker o texto sobre la imagen dice el nombre ("Enrique Grant", "Luis E. Grant", "Luis Grant"), usa ese nombre correspondiente.
   - Si no se puede determinar, usa "OTRO".

2. PREDIO / UBICACIÓN:
   - Si el remitente del chat o el texto dice "T. G #1 Millenium", "#1" o "Predio 1" -> asigna predio: "Predio 1".
   - Si el remitente del chat o el texto dice "T. G #2 Millenium", "#2" o "Predio 2" -> asigna predio: "Predio 2".
   - Si el remitente del chat o el texto dice "T. G #3 Millenium", "#3" o "Predio 3" -> asigna predio: "Predio 3".
   - Si no se menciona ningún número, asigna "Predio 3" por defecto o el que se indique.

3. TIPO DE MOVIMIENTO:
   - "INGRESO": si en la foto o sticker dice "Ingresa", "Ingreso", "Entrada", "Entrando", "Llegó", o similar.
   - "SALIDA": si en la foto o sticker dice "Sale", "Salida", "Salió", "Saliendo", "Se fue", o similar.
   - IMPORTANTE: Si la captura de WhatsApp muestra varias burbujas de mensajes (por ejemplo una de ingreso y otra de salida), debes extraer CADA UNA como un evento independiente.

4. FECHA Y HORA:
   - La hora suele aparecer en la esquina inferior derecha de cada burbuja de WhatsApp (por ejemplo "09:35", "10:31", "09:40", "13:15").
   - Convierte siempre la hora al formato de 24 horas HH:MM (ejemplo: "09:35", "10:31", "13:15").
   - Extrae la fecha en formato YYYY-MM-DD. Si no hay fecha explícita en la captura de WhatsApp (lo habitual cuando las burbujas solo muestran la hora), usa EXACTAMENTE la fecha indicada por el usuario: "${referenceDate}". Si la captura contiene una fecha diferente explícita en el encabezado, úsala; si no, usa "${referenceDate}".

5. PRECISIÓN:
   - Extrae exactamente lo que ves en las burbujas y fotos de la captura de WhatsApp.
   - Devuelve la lista en orden cronológico.`;

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      // Clean base64 prefix if present
      const cleanBase64 = img.data.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');

      try {
        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              inlineData: {
                mimeType: img.mimeType || 'image/png',
                data: cleanBase64,
              },
            },
            {
              text: `Analiza esta captura de WhatsApp de control de asistencia. Extrae todos los registros de ingreso y salida de los empleados Enrique Grant y Luis E. Grant. Incluye fecha (YYYY-MM-DD), hora (HH:MM formato 24h), nombre del empleado, predio (Predio 1, Predio 2 o Predio 3), tipo de movimiento y el texto original encontrado.`,
            },
          ],
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              description: 'Lista de eventos de asistencia detectados en la captura',
              items: {
                type: Type.OBJECT,
                properties: {
                  driver: {
                    type: Type.STRING,
                    description: 'Nombre del empleado: ENRIQUE GRANT, LUIS E. GRANT, o OTRO',
                  },
                  predio: {
                    type: Type.STRING,
                    description: 'Predio asignado: Predio 1, Predio 2, o Predio 3',
                  },
                  movementType: {
                    type: Type.STRING,
                    description: 'Tipo de movimiento: INGRESO o SALIDA',
                  },
                  date: {
                    type: Type.STRING,
                    description: 'Fecha en formato YYYY-MM-DD',
                  },
                  time: {
                    type: Type.STRING,
                    description: 'Hora en formato HH:MM (24 horas)',
                  },
                  rawTextFound: {
                    type: Type.STRING,
                    description: 'Texto exacto del mensaje o sticker/foto de WhatsApp detectado',
                  },
                  confidenceNotes: {
                    type: Type.STRING,
                    description: 'Observación o detalles de detección',
                  },
                },
                required: ['driver', 'movementType', 'date', 'time'],
              },
            },
          },
        });

        const textOutput = (response.text || '[]').trim();
        let parsed: RawDetection[] = [];
        try {
          parsed = JSON.parse(textOutput);
        } catch {
          const jsonMatch = textOutput.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          }
        }

        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            allDetections.push({
              ...item,
              sourceImage: img.filename || `Foto ${i + 1}`,
            });
          });
        }
      } catch (err: unknown) {
        console.error(`Error processing image ${img.filename || i}:`, err);
      }
    }

    return res.json({
      success: true,
      detectionsCount: allDetections.length,
      detections: allDetections,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('General error in /api/process-images:', err);
    return res.status(500).json({
      error: err.message || 'Error al procesar las imágenes con IA',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
