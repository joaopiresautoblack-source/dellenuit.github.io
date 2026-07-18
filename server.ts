import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Error handler for body parsing / payload size limit exceeded
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err) {
    console.error("Erro no middleware de parsing do body:", err);
    if (err.status === 413) {
      return res.status(413).json({ 
        error: "A imagem é grande demais para ser processada pela IA. Por favor, utilize uma imagem menor (limite de 10MB) ou reduza a resolução." 
      });
    }
    return res.status(err.status || 500).json({ 
      error: err.message || "Erro no processamento dos dados enviados ao servidor." 
    });
  }
  next();
});

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Routes
app.post("/api/ai/parse-product", async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "A imagem do anúncio é obrigatória para o processamento." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ 
        error: "Chave de API do Gemini não configurada no servidor. Por favor, configure a GEMINI_API_KEY." 
      });
    }

    const match = image.match(/^data:(image\/[a-zA-Z+-]+);base64,(.+)$/);
    let imagePart;
    if (match) {
      imagePart = {
        inlineData: {
          mimeType: match[1],
          data: match[2],
        }
      };
    } else {
      return res.status(400).json({ error: "Formato de imagem inválido. Deve ser um Data URL base64." });
    }

    const promptText = `Analise esta foto de anúncio de produto (que pode conter imagem do produto, preço e informações adicionais). 
Extraia ou infira de forma atraente e elegante as informações necessárias para preencher o cadastro de produtos de uma boutique sofisticada de moda íntima e sexshop (Bellenuit).
Se alguma informação não estiver explícita, use sua inteligência para deduzir valores apropriados e luxuosos de acordo com o item visualizado.

Siga exatamente o seguinte esquema JSON:
- name: Nome elegante do produto (ex: 'Conjunto de Renda Divine Noire')
- category: Categoria do produto. Deve ser exatamente 'Lingerie' ou 'Sex Shop'
- price: Preço numérico do produto (apenas o número, sem R$, ex: 149.90. Se houver mais de um item ou preço incerto, coloque um preço estimado ou o preço principal)
- description: Descrição refinada, poética e sensual que destaque o conforto, o design e o luxo do produto (máximo 2-3 frases)
- sizes: Tamanhos disponíveis em formato de lista (ex: ['P', 'M', 'G', 'GG'] ou tamanhos específicos identificados)
- colors: Cores disponíveis identificadas ou deduzidas do produto, descritas com nomes charmosos (ex: ['Preto Absoluto', 'Vermelho Sensual', 'Branco Satin'])
- details: Lista de 2 a 4 destaques/qualidades técnicas ou estéticas curtas (ex: 'Renda antialérgica importada', 'Metais com banho antiferrugem', 'Ajuste regulável perfeito')
- tag: Uma palavra curta chamativa ou nula, ex: 'Luxo', 'Novidade', 'Lançamento', 'Exclusivo'
- cropBox: Um objeto com as coordenadas aproximadas em porcentagem (inteiros de 0 a 100) que delimitam estritamente apenas a região visual da peça/produto em si, ignorando textos de anúncios, preços, logos ou bordas vazias ao redor. Deve conter as chaves: 'x' (posição horizontal inicial, 0-100), 'y' (posição vertical inicial, 0-100), 'width' (largura, 0-100) e 'height' (altura, 0-100).

Por favor, seja preciso com os preços numéricos e preencha todos os campos do JSON em português.`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          imagePart,
          { text: promptText }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              price: { type: Type.NUMBER },
              description: { type: Type.STRING },
              sizes: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }
              },
              colors: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }
              },
              details: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }
              },
              tag: { type: Type.STRING },
              cropBox: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.INTEGER },
                  y: { type: Type.INTEGER },
                  width: { type: Type.INTEGER },
                  height: { type: Type.INTEGER }
                },
                required: ["x", "y", "width", "height"]
              }
            },
            required: ["name", "category", "price", "description", "sizes", "colors", "details"]
          }
        }
      });
    } catch (apiError: any) {
      console.warn("Falha no modelo gemini-3.5-flash ao analisar anúncio, tentando modelo de contingência gemini-flash-latest:", apiError);
      // Wait 300ms before fallback retry
      await new Promise(resolve => setTimeout(resolve, 300));
      response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: [
          imagePart,
          { text: promptText }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              price: { type: Type.NUMBER },
              description: { type: Type.STRING },
              sizes: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }
              },
              colors: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }
              },
              details: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }
              },
              tag: { type: Type.STRING },
              cropBox: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.INTEGER },
                  y: { type: Type.INTEGER },
                  width: { type: Type.INTEGER },
                  height: { type: Type.INTEGER }
                },
                required: ["x", "y", "width", "height"]
              }
            },
            required: ["name", "category", "price", "description", "sizes", "colors", "details"]
          }
        }
      });
    }

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Erro na API de Processamento de Anúncio:", error);
    res.status(500).json({ error: error.message || "Erro interno ao processar e preencher com a IA." });
  }
});
app.post("/api/ai/image", async (req, res) => {
  try {
    const { prompt, image, aspectRatio = "1:1" } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "O prompt é obrigatório." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ 
        error: "Chave de API do Gemini não configurada no servidor. Por favor, configure a GEMINI_API_KEY." 
      });
    }

    const parts: any[] = [];

    if (image) {
      // Image Edit Mode (Image-to-Image)
      const match = image.match(/^data:(image\/[a-zA-Z+-]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          }
        });
      } else {
        return res.status(400).json({ error: "Formato de imagem inválido. Deve ser um Data URL base64." });
      }
    }

    // Add prompt text part
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-image",
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
        }
      }
    });

    let generatedImageBase64 = "";
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          generatedImageBase64 = part.inlineData.data;
          break;
        }
      }
    }

    if (generatedImageBase64) {
      res.json({ image: `data:image/png;base64,${generatedImageBase64}` });
    } else {
      res.status(500).json({ error: "Não foi possível extrair a imagem gerada pelo modelo." });
    }
  } catch (error: any) {
    console.error("Erro na API de Imagem IA:", error);
    res.status(500).json({ error: error.message || "Erro interno ao gerar/editar a imagem." });
  }
});

app.post("/api/assistant", async (req, res) => {
  try {
    const { message, history } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Mensagem vazia." });
    }
    
    // Validate if key is present
    if (!process.env.GEMINI_API_KEY) {
      return res.json({ 
        text: "Olá! Sou a Consultora Virtual da Sensuelle. No momento estou operando de forma offline, mas posso te garantir que nossa loja oferece o que há de melhor em lingeries luxuosas e bem-estar íntimo. Como posso ajudar com suas escolhas hoje?" 
      });
    }

    const systemInstruction = `Você é a Consultora Virtual da "Bellenuit - Moda Íntima & Sexshop".
Seu objetivo é ajudar os clientes de forma extremamente elegante, profissional, empática e respeitosa, mantendo um tom acolhedor e sutilmente sensual, sem nunca ser vulgar.
Você ajuda com:
1. Recomendações de lingeries com base em tamanhos, ocasiões (noite romântica, conforto no dia a dia, comemorações) ou estilo pessoal.
2. Dicas de bem-estar íntimo, massagem sensorial, auto-estima e autocuidado.
3. Sugestão de produtos da nossa loja virtual de forma discreta e sofisticada.
4. Respostas amigáveis a dúvidas sobre cosméticos íntimos (óleos térmicos, velas de massagem, sabonetes) e acessórios sensuais, priorizando sempre a segurança, higiene e o prazer consensual.

Diretrizes adicionais:
- Responda SEMPRE em português do Brasil.
- Garanta que as respostas sejam amigáveis e acolhedoras.
- Lembre ao usuário que a Bellenuit preza pela discrição absoluta: todas as entregas são feitas em caixas e pacotes comuns e pardos, sem qualquer menção externa ao nome da loja ou aos itens adquiridos. O remetente na etiqueta de envio é discreto.
- Mantenha respostas elegantes, formatadas de maneira bonita (use negrito e listas de marcadores quando apropriado).
- Seja breve e envolvente!`;

    // Format chat history for @google/genai
    // We can map role "assistant" to "model" and "user" to "user"
    const contents = [];
    
    // Add system instruction as part of user message or inside config
    // Actually, gemini-3.5-flash supports config.systemInstruction! Let's pass it in config, which is the official and correct way shown in the skill.
    const historyParts = (history || []).map((h: any) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.text }]
    }));

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          ...historyParts,
          { role: "user", parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });
    } catch (apiError: any) {
      console.warn("Falha no modelo gemini-3.5-flash no assistente, tentando modelo de contingência gemini-flash-latest:", apiError);
      // Wait 300ms before fallback retry
      await new Promise(resolve => setTimeout(resolve, 300));
      response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: [
          ...historyParts,
          { role: "user", parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });
    }

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Erro na API do Assistente:", error);
    res.status(500).json({ error: "Erro interno ao processar a resposta da IA." });
  }
});

async function startServer() {
  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
