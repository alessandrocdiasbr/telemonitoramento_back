const db = require('../config/database');
const openaiService = require('./openaiService');
const zapiService = require('./zapiService');
const telegramService = require('./telegramService');

const riskClassifier = require('./riskClassifier');

/**
 * Processa uma mensagem vinda de qualquer canal (WhatsApp, Telegram ou Mobile App)
 * @param {Object} user O objeto do usuário do banco de dados
 * @param {string} messageContent O texto da mensagem
 * @param {string} channel 'whatsapp', 'telegram' ou 'mobile'
 */
async function processIncomingMessage(user, messageContent, channel = 'whatsapp') {
    // 1. Salvar mensagem recebida no histórico
    await db.query(
        'INSERT INTO mensagens (usuario_id, direcao, conteudo) VALUES ($1, $2, $3)',
        [user.id, 'recebida', messageContent]
    );

    // 2. Verificar Consentimento LGPD
    if (!user.consentimento_lgpd) {
        let response = '';
        if (messageContent.trim().toLowerCase() === 'sim') {
            await db.query('UPDATE usuarios SET consentimento_lgpd = true WHERE id = $1', [user.id]);
            response = 'Obrigado! Seu consentimento foi registrado. Agora você pode enviar suas medições de pressão e temperatura.';
        } else {
            response = 'Olá! Este é o Sistema de Monitoramento de Saúde. Para continuar, precisamos do seu consentimento para tratar seus dados conforme a LGPD. Responda SIM para concordar.';
        }

        await saveAndSendResponse(user, response, channel);
        return response;
    }

    // 3. Processar mensagem com OpenAI para extrair dados vitais
    const extractedData = await openaiService.extractVitalData(messageContent);
    console.log(`[${channel}] Extracted Data for ${user.nome}:`, extractedData);

    // Verificar se dados significativos foram extraídos
    if (!extractedData.sistolica && !extractedData.diastolica && !extractedData.temperatura) {
        const response = 'Não entendi seus dados. Por favor, envie sua pressão (ex: 12/8) e/ou temperatura (ex: 36.5).';
        await saveAndSendResponse(user, response, channel);
        return response;
    }

    // 4. Salvar leitura no banco de dados
    const leituraResult = await db.query(
        `INSERT INTO leituras (usuario_id, pressao_sistolica, pressao_diastolica, temperatura, texto_original, classificacao_risco, sintomas_relatados)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
            user.id,
            extractedData.sistolica,
            extractedData.diastolica,
            extractedData.temperatura,
            messageContent,
            extractedData.risco,
            extractedData.sintomas
        ]
    );
    const leitura = leituraResult.rows[0];

    // 5. Atualizar Nível de Risco do Usuário (Novidade da Migração)
    const novoNivelRisco = riskClassifier.classifyPatient({
        ...user,
        pressao_sistolica: extractedData.sistolica,
        pressao_diastolica: extractedData.diastolica,
        ultimo_risco: extractedData.risco
    });

    if (novoNivelRisco !== user.nivel_risco) {
        await db.query('UPDATE usuarios SET nivel_risco = $1 WHERE id = $2', [novoNivelRisco, user.id]);
        console.log(`Risco do usuário ${user.nome} alterado para ${novoNivelRisco}`);
    }

    // 6. Lógica de Risco e Alerta
    let responseMessage = '';
    if (extractedData.risco === 'vermelho') {
        responseMessage = "🚨 <b>ATENÇÃO!</b> Sua pressão está muito alta. Já alertamos seu familiar e a equipe médica. Procure atendimento médico imediato!";

        if (user.telefone_familiar || user.telegram_chat_id_familiar) {
            const alertaMsg = `🚨 <b>ALERTA DE EMERGÊNCIA</b>\n\nPaciente: ${user.nome}\nPressão: ${extractedData.sistolica}/${extractedData.diastolica}\nData: ${new Date().toLocaleString('pt-BR')}\n\nEntre em contato imediatamente!`;

            // Alerta para familiar via Telegram (se configurado) ou WhatsApp
            try {
                if (user.telegram_chat_id_familiar) {
                    await telegramService.sendTelegramMessage(user.telegram_chat_id_familiar, alertaMsg);
                } else if (user.telefone_familiar) {
                    await zapiService.sendWhatsAppMessage(user.telefone_familiar, alertaMsg);
                }

                await db.query(
                    'INSERT INTO alertas_enviados (leitura_id, telefone_destinatario, status_entrega) VALUES ($1, $2, $3)',
                    [leitura.id, user.telegram_chat_id_familiar || user.telefone_familiar, 'enviado']
                );
            } catch (err) {
                console.error('Erro ao enviar alerta para familiar:', err.message);
            }
        }
    } else if (extractedData.risco === 'amarelo') {
        responseMessage = "⚠️ Sua pressão está um pouco elevada. Procure relaxar e evite sal. Tem sentido algum sintoma como dor de cabeça?";
    } else {
        responseMessage = "✅ Ótimo! Sua pressão está controlada. Continue assim!";
    }

    // Adicionar info de frequência se o risco mudou
    if (novoNivelRisco !== user.nivel_risco) {
        const freq = riskClassifier.getMonitoringFrequency(novoNivelRisco);
        responseMessage += `\n\n📝 Com base nos seus dados, seu plano de acompanhamento foi atualizado para: <b>${freq.description}</b>.`;
    }

    // 7. Salvar e enviar resposta para o usuário
    await saveAndSendResponse(user, responseMessage, channel);
    return responseMessage;
}

/**
 * Salva a resposta no banco e envia pelo canal apropriado
 */
async function saveAndSendResponse(user, content, channel) {
    // Salvar no histórico de mensagens
    await db.query(
        'INSERT INTO mensagens (usuario_id, direcao, conteudo) VALUES ($1, $2, $3)',
        [user.id, 'enviada', content]
    );

    // Enviar pelo canal correspondente
    try {
        if (channel === 'telegram' && user.telegram_chat_id) {
            await telegramService.sendTelegramMessage(user.telegram_chat_id, content);
        } else if (channel === 'whatsapp' && user.telefone) {
            await zapiService.sendWhatsAppMessage(user.telefone, content);
        }
    } catch (err) {
        console.error(`Erro ao enviar resposta via ${channel}:`, err.message);
    }
}

module.exports = { processIncomingMessage };
