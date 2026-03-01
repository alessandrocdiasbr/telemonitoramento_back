const bot = require('../config/telegram.config');
const logger = console; // Usando console como logger simples se não houver um logger específico

if (!bot) {
    console.warn("⚠️ Telegram Bot não inicializado: TOKEN ausente.");
}


/**
 * Envia uma mensagem para um chat_id do Telegram
 * @param {string|number} chatId ID do chat do destinatário
 * @param {string} text Conteúdo da mensagem
 * @param {Object} options Opções adicionais (ex: parse_mode)
 */
async function sendTelegramMessage(chatId, text, options = { parse_mode: 'HTML' }) {
    if (!bot) {
        throw new Error('Telegram Bot não configurado. Verifique TELEGRAM_BOT_TOKEN no .env');
    }

    try {
        console.log(`Enviando mensagem para o chat Telegram ${chatId}...`);
        await bot.telegram.sendMessage(chatId, text, options);
        console.log(`Mensagem enviada com sucesso para ${chatId}`);
    } catch (error) {
        console.error(`Erro ao enviar mensagem para ${chatId} via Telegram:`, error.message);
        throw error;
    }
}

/**
 * Envia mensagem com botões interativos
 */
async function sendQuestionWithButtons(chatId, question, buttons) {
    if (!bot) throw new Error('Bot não inicializado');

    const keyboard = {
        inline_keyboard: buttons.map(row =>
            row.map(btn => ({
                text: btn.text,
                callback_data: btn.data
            }))
        )
    };

    return bot.telegram.sendMessage(chatId, question, {
        parse_mode: 'HTML',
        reply_markup: keyboard
    });
}

/**
 * Envia o questionário de monitoramento baseado no risco
 */
async function sendMonitoringQuestionnaire(chatId, riskLevel) {
    const riskClassifier = require('./riskClassifier');
    const questions = riskClassifier.getQuestionsByRisk(riskLevel);

    let message = '<b>🏥 Monitoramento de Saúde</b>\n\n';
    message += 'Por favor, responda às seguintes perguntas:\n\n';

    questions.forEach((q, index) => {
        message += `${index + 1}. ${q}\n`;
    });

    message += '\n<i>Responda com números ou texto livre. Ex: 12/8, Sim, Não.</i>';

    return sendTelegramMessage(chatId, message);
}

/**
 * Envia alerta de emergência
 */
async function sendEmergencyAlert(chatId, pacienteNome) {
    const message = `
🚨 <b>ALERTA DE EMERGÊNCIA</b> 🚨

Paciente: ${pacienteNome}

Foram detectados sinais de complicação grave da hipertensão.

<b>PROCURE ATENDIMENTO MÉDICO IMEDIATAMENTE!</b>

📞 SAMU: 192
🏥 Unidade de Saúde mais próxima

⚠️ Não ignore estes sintomas!
    `.trim();

    return sendTelegramMessage(chatId, message);
}

module.exports = {
    sendTelegramMessage,
    sendMonitoringQuestionnaire,
    sendQuestionWithButtons,
    sendEmergencyAlert,
    bot
};

