const db = require('../config/database');
const openaiService = require('../services/openaiService');
const zapiService = require('../services/zapiService');
// const twilioService = require('../services/twilioService'); // Deprecated

const fs = require('fs');
const path = require('path');

async function handleIncomingMessage(req, res) {
    console.log('Receiving Webhook from Z-API:', JSON.stringify(req.body, null, 2));

    // Log to file for debugging
    try {
        const logPath = path.join(__dirname, '../../webhook.log');
        fs.appendFileSync(logPath, JSON.stringify(req.body, null, 2) + '\n---\n');
    } catch (err) {
        console.error('Error writing to webhook log:', err);
    }

    try {
        // Z-API Structure handling
        // Based on Z-API docs, valid messages usually come in a specific format.
        // We need to extract the phone number and the text/audio message.
        // Simplified extraction based on common Z-API webhooks:
        const { phone, text, senderName } = extractDataFromZapi(req.body);

        if (!phone || !text) {
            console.log('Ignored webhook: No phone or text found.');
            return res.status(200).end();
        }

        const telefone = phone; // Z-API usually sends format like "5511999999999"
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

        // 2. Verificar Consentimento LGPD
        if (!user.consentimento_lgpd) {
            if (Body.trim().toLowerCase() === 'sim') {
                await db.query('UPDATE usuarios SET consentimento_lgpd = true WHERE id = $1', [user.id]);
                await zapiService.sendWhatsAppMessage(telefone, 'Obrigado! Seu consentimento foi registrado. Agora você pode enviar suas medições de pressão e temperatura.');
            } else {
                await zapiService.sendWhatsAppMessage(telefone, 'Olá! Este é o Sistema de Monitoramento de Saúde. Para continuar, precisamos do seu consentimento para tratar seus dados conforme a LGPD. Responda SIM para concordar.');
            }
            return res.status(200).end();
        }

        // 3. Processar mensagem com OpenAI
        const extractedData = await openaiService.extractVitalData(Body);
        console.log('Extracted Data:', extractedData);

        // Check if meaningful data was extracted
        if (!extractedData.sistolica && !extractedData.diastolica && !extractedData.temperatura) {
            console.log('No vital data found in message. Skipping database save.');
            await zapiService.sendWhatsAppMessage(telefone, 'Não entendi seus dados. Por favor, envie sua pressão (ex: 12/8) e/ou temperatura (ex: 36.5).');
            return res.status(200).end();
        }

        // Salvar leitura
        const leituraResult = await db.query(
            `INSERT INTO leituras (usuario_id, pressao_sistolica, pressao_diastolica, temperatura, texto_original, classificacao_risco, sintomas_relatados)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
                user.id,
                extractedData.sistolica,
                extractedData.diastolica,
                extractedData.temperatura,
                Body,
                extractedData.risco,
                extractedData.sintomas
            ]
        );

        const leitura = leituraResult.rows[0];

        // 4. Lógica de Risco e Alerta
        let responseMessage = '';

        if (extractedData.risco === 'vermelho') {
            responseMessage = "🚨 ATENÇÃO! Sua pressão está muito alta. Já alertamos seu familiar. Procure atendimento médico!";

            if (user.telefone_familiar) {
                const alertaMsg = `🚨 ALERTA: ${user.nome} apresentou pressão crítica de ${extractedData.sistolica}/${extractedData.diastolica} às ${new Date().toLocaleTimeString()}. Entre em contato imediatamente!`;
                await zapiService.sendWhatsAppMessage(user.telefone_familiar, alertaMsg);

                await db.query(
                    'INSERT INTO alertas_enviados (leitura_id, telefone_destinatario, status_entrega) VALUES ($1, $2, $3)',
                    [leitura.id, user.telefone_familiar, 'enviado']
                );
            }
        } else if (extractedData.risco === 'amarelo') {
            responseMessage = "⚠️ Sua pressão está um pouco elevada. Procure relaxar e evite sal. Tem sentido dor de cabeça?";
        } else {
            responseMessage = "✅ Ótimo! Sua pressão está controlada. Continue assim!";
        }

        await zapiService.sendWhatsAppMessage(telefone, responseMessage);
        res.status(200).end();

    } catch (error) {
        console.error('Error processing webhook:', error);
        // Using console.error is enough, avoid sending error message loops to user if API is down
        res.status(500).end();
    }
}

// Helper function to extract data from Z-API payload
function extractDataFromZapi(payload) {
    // This needs to be adjusted based on the actual Z-API webhook structure
    // Common structure involves 'phone', 'message', 'text', 'senderName'

    // Example Payload check (adjust as needed after testing):
    // { "phone": "5511...", "text": { "message": "hello" }, "senderName": "..." }

    let phone = payload.phone;
    let text = '';
    let senderName = payload.senderName || payload.pushName; // Some APIs use pushName

    if (payload.text && payload.text.message) {
        text = payload.text.message;
    } else if (typeof payload.text === 'string') {
        text = payload.text;
    } else if (payload.message && payload.message.text) {
        // Another possible structure
        text = payload.message.text;
    }

    // Ensure phone has only numbers if needed, but Z-API usually sends clean usually.
    return { phone, text, senderName };
}


module.exports = { handleIncomingMessage };
