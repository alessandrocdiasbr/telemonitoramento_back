const { sendTelegramMessage } = require('./src/services/telegramService');
require('dotenv').config();

const testChatId = process.argv[2];
const testMessage = process.argv[3] || 'Olá! Este é um teste do sistema de telemonitoramento.';

if (!testChatId) {
    console.log('Uso: node test_telegram.js <chat_id> ["mensagem"]');
    process.exit(1);
}

async function runTest() {
    try {
        console.log(`Testando envio de mensagem para ${testChatId}...`);
        await sendTelegramMessage(testChatId, testMessage);
        console.log('Teste concluído com sucesso!');
    } catch (error) {
        console.error('Falha no teste:', error.message);
    }
}

runTest();
