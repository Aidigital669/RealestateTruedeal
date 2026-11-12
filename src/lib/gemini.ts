/**
 * Google Gemini API Integration for ANV REEALTY
 * Direct REST API integration with automatic model fallback & temperature control
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

export interface GeminiMessage {
  role: "user" | "assistant" | "model";
  content: string;
}

export interface GeminiOptions {
  systemPrompt?: string;
  messages: GeminiMessage[];
  temperature?: number;
  maxOutputTokens?: number;
  preferredModel?: string;
}

const SUPPORTED_MODELS = [
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-flash-latest",
  "gemini-flash-lite-latest"
];

export async function generateWithGemini(options: GeminiOptions): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY || GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const {
    systemPrompt,
    messages,
    temperature = 0.2,
    maxOutputTokens = 2000,
    preferredModel = "gemini-2.5-flash"
  } = options;

  // Format messages for Gemini API ('assistant' -> 'model')
  const contents = messages
    .filter((m) => m && m.content && m.content.trim())
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content.trim() }]
    }));

  if (contents.length === 0) return null;

  // Try preferred model first, then fallbacks
  const modelsToTry = [
    preferredModel,
    ...SUPPORTED_MODELS.filter((m) => m !== preferredModel)
  ];

  for (const model of modelsToTry) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const payload: any = {
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens,
          thinkingConfig: {
            thinkingBudget: 0
          }
        }
      };

      if (systemPrompt && systemPrompt.trim()) {
        payload.system_instruction = {
          parts: [{ text: systemPrompt.trim() }]
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000)
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.log(`Gemini ${model} HTTP ${res.status}:`, errorText.slice(0, 160));
        // Continue to next available model in SUPPORTED_MODELS
        continue;
      }

      const data = await res.json();
      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (generatedText) {
        return generatedText;
      }
    } catch (err: any) {
      console.log(`Gemini request error (${model}):`, err.message);
      // Continue to next available model on error or timeout
      continue;
    }
  }

  return null;
}
