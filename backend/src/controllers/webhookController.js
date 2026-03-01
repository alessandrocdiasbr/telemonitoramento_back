const db = require('../config/database');
const messageService = require('../services/messageService');
const fs = require('fs');
const path = require('path');

async function handleIncomingMessage(req, res) {
    console.log('Receiving Webhook from Z-API:', JSON.stringify(req.body, null, 2));

    // Log para depuração
    try {
        const logPath = path.join(__dirname, '../../webhook.log');
        fs.appendFileSync(logPath, JSON.stringify(req.body, null, 2) + '\n---\n');
    } catch (err) {
        console.error('Error writing to webhook log:', err);
    }

    try {
        const { phone, text, senderName } = extractDataFromZapi(req.body);

        if (!phone || !text) {
            console.log('Ignored webhook: No phone or text found.');
            return res.status(200).end();
        }

        const telefone = phone;
        const Body = text;

        // 1. Verificar usuário
        const userResult = await db.query('SELECT * FROM usuarios WHERE telefone = $1', [telefone]);
        let user = userResult.rows[0];

        // Se usuário não existe, registrar como novo
        if (!user) {
            const newUser = await db.query(
                'INSERT INTO usuarios (nome, telefone, telefone_familiar, consentimento_lgpd) VALUES ($1, $2, $3, $4) RETURNING *',
                [senderName || 'Novo Usuário', telefone, '', false]
            );
            user = newUser.rows[0];
        }

        // 2. Processar mensagem via serviço unificado
        await messageService.processIncomingMessage(user, Body, 'whatsapp');

        res.status(200).end();

    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).end();
    }
}

async function handleTelegramWebhook(req, res) {
    console.log('Receiving Webhook from Telegram:', JSON.stringify(req.body, null, 2));

    try {
        const { message } = req.body;
        if (!message || !message.text) {
            return res.status(200).end();
        }

        const chatId = message.chat.id.toString();
        const text = message.text;
        const firstName = message.from.first_name || 'Usuário Telegram';

        // 1. Verificar usuário pelo telegram_chat_id
        const userResult = await db.query('SELECT * FROM usuarios WHERE telegram_chat_id = $1', [chatId]);
        let user = userResult.rows[0];

        // Se usuário não existe por chat_id, tentar vincular ou criar novo
        if (!user) {
            // Aqui poderíamos ter uma lógica para vincular por telefone se o usuário enviar o contato,
            // mas por simplificação, criaremos um novo se não acharmos.
            const newUser = await db.query(
                'INSERT INTO usuarios (nome, telefone, telefone_familiar, telegram_chat_id, consentimento_lgpd) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [firstName, 'telegram_' + chatId, 'telegram_' + chatId, chatId, false]
            );
            user = newUser.rows[0];
        }

        // 2. Processar mensagem via serviço unificado
        await messageService.processIncomingMessage(user, text, 'telegram');

        res.status(200).end();

    } catch (error) {
        console.error('Error processing Telegram webhook:', error);
        res.status(500).end();
    }
}

// Helper function to extract data from Z-API payload
function extractDataFromZapi(payload) {
    let phone = payload.phone;
    let text = '';
    let senderName = payload.senderName || payload.pushName;

    if (payload.text && payload.text.message) {
        text = payload.text.message;
    } else if (typeof payload.text === 'string') {
        text = payload.text;
    } else if (payload.message && payload.message.text) {
        text = payload.message.text;
    }

    return { phone, text, senderName };
}

module.exports = {
    handleIncomingMessage,
    handleTelegramWebhook
};
