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
        console.error("Error extracted vital data (OpenAI failed), falling back to Regex:", error.message);

        // Fallback Logic using Regex
        return extractVitalDataFallback(message);
    }
}

function extractVitalDataFallback(message) {
    let sistolica = null;
    let diastolica = null;
    let temperatura = null;
    let risco = 'verde'; // Default safe, logic below will update
    let sintomas = null; // Cannot reliably extract without NLP

    // 1. Extract Blood Pressure (XX/YY, XXxYY, XX por YY)
    // Matches: 12/8, 120/80, 12x8, 14 por 9
    const bpRegex = /(\d{1,3})[\s\/xX]+(\d{1,3})/;
    const bpMatch = message.match(bpRegex);

    if (bpMatch) {
        let sys = parseInt(bpMatch[1]);
        let dia = parseInt(bpMatch[2]);

        // Normalize (e.g., 12 -> 120)
        if (sys < 30) sys *= 10;
        if (dia < 30) dia *= 10;

        sistolica = sys;
        diastolica = dia;
    }

    // 2. Extract Temperature (XX.X, XX,X)
    // Matches: 36.5, 37,2 (careful not to match BP parts if possible)
    const tempRegex = /(\d{2})[.,](\d{1})/;
    const tempMatch = message.match(tempRegex);

    if (tempMatch) {
        temperatura = parseFloat(`${tempMatch[1]}.${tempMatch[2]}`);
    } else {
        // Try matching whole number temp like 36, 37 (avoiding BP numbers like 120)
        const tempWholeRegex = /\b(3[4-9]|4[0-2])\b/;
        const tempWholeMatch = message.match(tempWholeRegex);
        if (tempWholeMatch) {
            temperatura = parseFloat(tempWholeMatch[1]);
        }
    }

    // 3. Simple Risk Classification Logic
    if (sistolica && diastolica) {
        if (sistolica >= 180 || diastolica >= 110) {
            risco = 'vermelho';
        } else if (sistolica >= 140 || diastolica >= 90) {
            risco = 'amarelo';
        }
    }

    console.log("Fallback Extraction Result:", { sistolica, diastolica, temperatura, risco });

    // Return structured object just like OpenAI would
    return {
        sistolica,
        diastolica,
        temperatura,
        risco,
        sintomas
    };
}

module.exports = { extractVitalData };
