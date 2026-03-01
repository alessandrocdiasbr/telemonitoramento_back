const { initCronJobs } = require('./src/services/cronService');
const db = require('./src/config/database');
const telegramService = require('./src/services/telegramService');
const zapiService = require('./src/services/zapiService');
require('dotenv').config();

async function testCronLogic() {
    console.log('--- Testando Lógica de Mensagens Automáticas ---');

    try {
        // Buscar usuários pacientes com consentimento
        const result = await db.query('SELECT nome, telegram_chat_id, telefone FROM usuarios WHERE role = \'paciente\' AND consentimento_lgpd = true');

        if (result.rows.length === 0) {
            console.log('Nenhum paciente com consentimento encontrado para teste.');
            return;
        }

        console.log(`Encontrados ${result.rows.length} pacientes. Iniciando disparos de teste...`);

        for (const user of result.rows) {
            const message = `[TESTE CRON] Olá, ${user.nome}! Esta é uma mensagem automática de teste.`;

            console.log(`Processando usuário: ${user.nome}`);

            if (user.telegram_chat_id) {
                console.log(`-> Enviando via Telegram para Chat ID: ${user.telegram_chat_id}`);
                await telegramService.sendTelegramMessage(user.telegram_chat_id, message);
            } else if (user.telefone) {
                console.log(`-> Enviando via WhatsApp para: ${user.telefone}`);
                await zapiService.sendWhatsAppMessage(user.telefone, message);
            } else {
                console.log('-> Sem canal de contato válido.');
            }
        }

        console.log('--- Teste concluído ---');
    } catch (error) {
        console.error('Falha no teste de cron:', error.message);
    }
}

testCronLogic();
