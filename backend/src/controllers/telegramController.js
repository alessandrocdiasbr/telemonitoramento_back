const db = require('../config/database');
const telegramService = require('../services/telegramService');
const messageService = require('../services/messageService');

class TelegramController {
    /**
     * Handler principal para o webhook do Telegram
     */
    async handleWebhook(req, res) {
        try {
            const update = req.body;
            console.log('Update recebido do Telegram:', JSON.stringify(update, null, 2));

            if (update.message) {
                await this.handleMessage(update.message);
            } else if (update.callback_query) {
                await this.handleCallback(update.callback_query);
            }

            res.status(200).send('OK');
        } catch (error) {
            console.error('Erro no Telegram Webhook:', error);
            res.status(500).send('Internal Error');
        }
    }

    /**
     * Processa mensagens de texto e comandos
     */
    async handleMessage(message) {
        const chatId = message.chat.id.toString();
        const text = message.text;
        const from = message.from;

        if (text === '/start') {
            await this.handleStart(chatId, from);
            return;
        }

        // Busca o usuário pelo telegram_chat_id
        const userResult = await db.query('SELECT * FROM usuarios WHERE telegram_chat_id = $1', [chatId]);
        let user = userResult.rows[0];

        if (!user) {
            // Se não encontrou pelo chat_id, tenta buscar pelo telefone (se o usuário enviou contato)
            // Por enquanto, apenas avisa que não está cadastrado
            await telegramService.sendTelegramMessage(chatId, '❌ Você não está cadastrado no sistema. Por favor, entre em contato com a equipe de saúde.');
            return;
        }

        // Processa a mensagem usando o serviço de mensagens unificado
        // O messageService já cuida da extração com OpenAI e salvamento da leitura
        await messageService.processIncomingMessage(user, text, 'telegram');

        // Se houver um monitoramento pendente, podemos marcá-lo como respondido
        await this.markMonitoringAsReplied(user.id, text);
    }

    /**
     * Boas-vindas ao comando /start
     */
    async handleStart(chatId, from) {
        const welcomeMsg = `Olá, <b>${from.first_name}</b>! 👋\n\nBem-vindo ao Sistema de Telemonitoramento de Saúde. Este canal será usado para acompanharmos sua pressão arterial e temperatura.\n\nSe você já é um paciente cadastrado, em breve receberá nossas mensagens de acompanhamento.`;
        await telegramService.sendTelegramMessage(chatId, welcomeMsg);
    }

    /**
     * Processa cliques em botões interativos
     */
    async handleCallback(callback) {
        const chatId = callback.message.chat.id.toString();
        const data = callback.data;

        console.log(`Callback recebido de ${chatId}: ${data}`);

        // Aqui podemos tratar botões específicos se necessário
        await telegramService.bot.telegram.answerCbQuery(callback.id, { text: 'Recebido!' });
    }

    /**
     * Marca o monitoramento como respondido se houver um pendente
     */
    async markMonitoringAsReplied(userId, responseText) {
        try {
            const query = `
                UPDATE monitoramentos 
                SET status = 'RESPONDIDO', 
                    respostas = $1,
                    data_atualizacao = NOW()
                WHERE usuario_id = $2 
                AND status = 'AGUARDANDO_RESPOSTA'
                RETURNING *
            `;
            await db.query(query, [JSON.stringify({ text: responseText }), userId]);
        } catch (error) {
            console.error('Erro ao atualizar status do monitoramento:', error);
        }
    }
}

module.exports = new TelegramController();
