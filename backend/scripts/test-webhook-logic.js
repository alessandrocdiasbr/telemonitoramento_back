
const { handleIncomingMessage } = require('../src/controllers/webhookController');
const db = require('../src/config/database');
const openaiService = require('../src/services/openaiService');

// Mock req and res
const req = {
    body: {
        phone: "5511999999999",
        text: {
            message: "Minha pressão está 14/9 e temperatura 36.5"
        },
        senderName: "Teste User"
    }
};

const res = {
    status: (code) => {
        console.log(`Response Status: ${code}`);
        return {
            end: () => console.log('Response Ended')
        };
    }
};

// Mock Dependencies
db.query = async (query, params) => {
    console.log('DB Query:', query, params);
    if (query.includes('SELECT * FROM usuarios')) {
        return { rows: [{ id: 1, nome: 'Teste User', telefone: '5511999999999', consentimento_lgpd: true }] };
    }
    if (query.includes('INSERT INTO leituras')) {
        return { rows: [{ id: 1, ...params }] };
    }
    return { rows: [] };
};

openaiService.extractVitalData = async (text) => {
    console.log('OpenAI Extract:', text);
    return {
        sistolica: 140,
        diastolica: 90,
        temperatura: 36.5,
        risco: 'amarelo',
        sintomas: null
    };
};

// Test Execution
(async () => {
    console.log('--- Testing Webhook Logic ---');
    await handleIncomingMessage(req, res);
})();
