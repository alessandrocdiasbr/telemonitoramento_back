const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = `
Você é um assistente de extração de dados vitais. Extraia do texto:
1. Pressão arterial (formato: sistólica/diastólica) - aceite variações como "12 por 8", "120x80", "12/8"
2. Temperatura corporal (em °C)
3. Sintomas mencionados (dor de cabeça, tontura, náusea, etc)

Classifique o risco da pressão arterial:
- VERDE: PA < 140/90
- AMARELO: PA >= 140/90 e < 180/110
- VERMELHO: PA >= 180/110 ou sintomas graves

Retorne APENAS um JSON válido:
{
  "sistolica": number | null,
  "diastolica": number | null,
  "temperatura": number | null,
  "risco": "verde" | "amarelo" | "vermelho",
  "sintomas": string | null
}
`;

async function extractVitalData(message) {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message },
            ],
            response_format: { type: "json_object" },
        });

        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        console.error("Error extracted vital data:", error);
        throw new Error("Failed to process message with OpenAI");
    }
}

module.exports = { extractVitalData };
