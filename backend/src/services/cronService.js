const cron = require('node-cron');
const db = require('../config/database');
const zapiService = require('./zapiService');
const telegramService = require('./telegramService');

const riskClassifier = require('./riskClassifier');

function initCronJobs() {
    // 9:00 AM - Verificação Geral baseada em Risco
    cron.schedule('0 9 * * *', async () => {
        console.log('Running 9:00 AM Risk-Based Monitoring job...');
        try {
            const result = await db.query(`
                SELECT u.*, 
                (SELECT data_hora FROM leituras WHERE usuario_id = u.id ORDER BY data_hora DESC LIMIT 1) as data_ultima_leitura,
                (SELECT classificacao_risco FROM leituras WHERE usuario_id = u.id ORDER BY data_hora DESC LIMIT 1) as ultimo_risco_leitura
                FROM usuarios u 
                WHERE u.role = 'paciente' AND u.consentimento_lgpd = true
            `);

            const hoje = new Date();
            const diaSemana = hoje.getDay(); // 0-6 (Dom-Sab)

            for (const user of result.rows) {
                // Se não tem nível de risco definido, classificar agora (ou usar default)
                if (!user.nivel_risco) {
                    user.nivel_risco = riskClassifier.classifyPatient({
                        ...user,
                        ultimo_risco: user.ultimo_risco_leitura
                    });
                    await db.query('UPDATE usuarios SET nivel_risco = $1 WHERE id = $2', [user.nivel_risco, user.id]);
                }

                const freq = riskClassifier.getMonitoringFrequency(user.nivel_risco);
                const dataUltima = user.data_ultima_leitura ? new Date(user.data_ultima_leitura) : new Date(0);
                const diasDesdeUltima = Math.floor((hoje - dataUltima) / (1000 * 60 * 60 * 24));

                let deveEnviar = false;

                if (user.nivel_risco === 'ALTO') {
                    // Seg, Qua, Sex (1, 3, 5)
                    deveEnviar = [1, 3, 5].includes(diaSemana);
                } else if (user.nivel_risco === 'MEDIO') {
                    // Seg (1) e pelo menos 7 dias
                    deveEnviar = diaSemana === 1 && diasDesdeUltima >= 6;
                } else {
                    // Seg (1) e pelo menos 14 dias
                    deveEnviar = diaSemana === 1 && diasDesdeUltima >= 13;
                }

                // Sempre envia se nunca enviou (diasDesdeUltima muito grande)
                if (!user.data_ultima_leitura) deveEnviar = true;

                if (deveEnviar) {
                    try {
                        if (user.telegram_chat_id) {
                            await telegramService.sendMonitoringQuestionnaire(user.telegram_chat_id, user.nivel_risco);
                        } else if (user.telefone) {
                            const message = `Olá, ${user.nome}! 🏥\nEste é seu monitoramento periódico (${user.nivel_risco}). Por favor, informe sua pressão e temperatura de hoje.`;
                            await zapiService.sendWhatsAppMessage(user.telefone, message);
                        }
                    } catch (err) {
                        console.error(`Erro ao enviar monitoramento para ${user.nome}:`, err.message);
                    }
                }
            }
        } catch (err) {
            console.error('Erro no job de monitoramento de risco:', err.message);
        }
    });

    console.log('Cron jobs initialized');
}

module.exports = { initCronJobs };
