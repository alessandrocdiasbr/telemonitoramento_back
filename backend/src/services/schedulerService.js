const cron = require('node-cron');
const db = require('../config/database');
const telegramService = require('./telegramService');
const riskClassifier = require('./riskClassifier');

class SchedulerService {
    constructor() {
        this.jobs = [];
    }

    /**
     * Inicia o agendamento diário
     */
    start() {
        // Todos os dias às 09:00h
        const job = cron.schedule('0 9 * * *', async () => {
            console.log('--- Iniciando Verificação Diária de Monitoramento ---');
            await this.checkAndSendMessages();
        }, {
            timezone: "America/Sao_Paulo"
        });

        this.jobs.push(job);
        console.log('Scheduler Service iniciado: 09:00 (America/Sao_Paulo)');
    }

    /**
     * Verifica quais pacientes devem receber mensagem hoje
     */
    async checkAndSendMessages() {
        try {
            // Busca todos os pacientes com Telegram configurado
            const query = `
                SELECT id, nome, telegram_chat_id, nivel_risco 
                FROM usuarios 
                WHERE role = 'paciente' 
                AND telegram_chat_id IS NOT NULL
            `;
            const result = await db.query(query);
            const pacientes = result.rows;

            for (const paciente of pacientes) {
                const shouldSend = await this.shouldSendToday(paciente);
                if (shouldSend) {
                    await this.sendMonitoring(paciente);
                }
            }
        } catch (error) {
            console.error('Erro ao verificar mensagens agendadas:', error);
        }
    }

    /**
     * Lógica de decisão de envio baseada no nível de risco e último envio
     */
    async shouldSendToday(paciente) {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 (Dom) a 6 (Sab)

        // Busca o último envio para este paciente na tabela monitoramentos
        const lastQuery = `
            SELECT data_criacao 
            FROM monitoramentos 
            WHERE usuario_id = $1 
            AND tipo = 'QUESTIONARIO_ENVIADO' 
            ORDER BY data_criacao DESC 
            LIMIT 1
        `;
        const lastResult = await db.query(lastQuery, [paciente.id]);
        const lastEnvio = lastResult.rows[0];

        if (!lastEnvio) return true; // Nunca recebeu, envia hoje

        const diffDays = Math.floor((today - new Date(lastEnvio.data_criacao)) / (1000 * 60 * 60 * 24));
        const frequency = riskClassifier.getMonitoringFrequency(paciente.nivel_risco);

        // Se o intervalo mínimo não passou, não envia
        if (diffDays < frequency.interval) return false;

        // Se passou o intervalo, verifica se hoje é um dos dias preferenciais da semana
        // frequency.days usa 1=Seg, 3=Qua, 5=Sex etc.
        return frequency.days.includes(dayOfWeek);
    }

    /**
     * Dispara o questionário e registra na tabela de monitoramentos
     */
    async sendMonitoring(paciente) {
        try {
            console.log(`Enviando monitoramento para: ${paciente.nome} (${paciente.nivel_risco})`);

            await telegramService.sendMonitoringQuestionnaire(paciente.telegram_chat_id, paciente.nivel_risco);

            // Registrar na tabela monitoramentos
            const insertQuery = `
                INSERT INTO monitoramentos (usuario_id, tipo, nivel_risco, status)
                VALUES ($1, 'QUESTIONARIO_ENVIADO', $2, 'AGUARDANDO_RESPOSTA')
            `;
            await db.query(insertQuery, [paciente.id, paciente.nivel_risco]);

            console.log(`Monitoramento registrado para ${paciente.nome}`);
        } catch (error) {
            console.error(`Erro ao enviar monitoramento para ${paciente.nome}:`, error.message);
        }
    }
}

module.exports = new SchedulerService();
