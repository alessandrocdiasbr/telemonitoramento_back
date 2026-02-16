const cron = require('node-cron');
const db = require('../config/database');
const twilioService = require('./twilioService');

function initCronJobs() {
    // 8:00 AM
    cron.schedule('0 8 * * *', async () => {
        console.log('Running 8:00 AM job...');
        const result = await db.query('SELECT * FROM usuarios WHERE consentimento_lgpd = true');
        result.rows.forEach(async (user) => {
            await twilioService.sendWhatsAppMessage(
                user.telefone,
                `Bom dia, ${user.nome}! 🌅\nPor favor, informe sua pressão arterial e temperatura de hoje.`
            );
        });
    });

    // 8:00 PM
    cron.schedule('0 20 * * *', async () => {
        console.log('Running 8:00 PM job...');
        const result = await db.query('SELECT * FROM usuarios WHERE consentimento_lgpd = true');
        result.rows.forEach(async (user) => {
            await twilioService.sendWhatsAppMessage(
                user.telefone,
                `Boa noite, ${user.nome}! 🌙\nNão esqueça de enviar sua medição de pressão e temperatura agora.`
            );
        });
    });

    console.log('Cron jobs initialized');
}

module.exports = { initCronJobs };
