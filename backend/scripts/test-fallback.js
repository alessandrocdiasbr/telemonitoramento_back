
const { extractVitalData } = require('../src/services/openaiService');

// Mock missing key to force fallback or just rely on the implementation using fallback on error
// But since I can't easily mock the API failure without changing the code, I will rely on the fact that calls will fail if I provide a bad key, OR I can just test the fallback function if I exported it (which I didn't).
// Adjusted strategy: I will modify the test to force an error by setting an invalid API key in the process env for this script execution if possible, or just rely on the current state where quota is exceeded so it WILL fail and trigger fallback.

require('dotenv').config();

const testMessages = [
    "Minha pressão está 12/8 e temperatura 36.5",
    "120x80 37.2",
    "14 por 9, sem febre (36)",
    "Estou com dor de cabeça, pressão 18/11 e temp 38",
    "Só um oi, tudo bem?",
    "12/8"
];

(async () => {
    console.log("--- Testing Vital Data Extraction (Fallback Mode) ---");

    for (const msg of testMessages) {
        console.log(`\nInput: "${msg}"`);
        try {
            const result = await extractVitalData(msg);
            console.log("Result:", result);

            if (result.sistolica || result.temperatura) {
                console.log("✅ Extraction successful");
            } else {
                console.log("⚠️ No data extracted (expected for non-vital messages)");
            }

        } catch (error) {
            console.error("❌ Failed:", error.message);
        }
    }
})();
