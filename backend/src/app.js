const express = require('express');
const cors = require('cors');
require('dotenv').config();

const webhookController = require('./controllers/webhookController');
const pacientesController = require('./controllers/pacientesController');
const financeiroController = require('./controllers/financeiroController');
const authController = require('./controllers/authController');
const adminController = require('./controllers/adminController');
const cronService = require('./services/cronService');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.post('/webhook', webhookController.handleIncomingMessage);
app.get('/api/pacientes', pacientesController.getPacientes);
app.post('/api/pacientes', pacientesController.createPaciente);
app.get('/api/pacientes/:id', pacientesController.getPacienteById);
app.put('/api/pacientes/:id', pacientesController.updatePaciente);
app.delete('/api/pacientes/:id', pacientesController.deletePaciente);
app.get('/api/pacientes/:id/leituras', pacientesController.getLeituras);
app.get('/api/leituras/recentes', pacientesController.getRecentLeituras);
app.get('/api/historico/:usuarioId', pacientesController.getHistorico);

// Financial Routes
app.get('/api/financeiro/stats', financeiroController.getFinanceiroStats);
app.post('/api/financeiro/boletos', financeiroController.createBoleto);
app.get('/api/financeiro/pagamentos', financeiroController.getPagamentos);

// Auth Routes
app.post('/api/auth/login', authController.login);
app.post('/api/auth/reset-password', authController.resetPassword);

// Admin Routes
app.get('/api/admin/users', adminController.listUsers);
app.post('/api/admin/users', adminController.createUser);
app.delete('/api/admin/users/:id', adminController.deleteUser);
app.post('/api/admin/users/:id/reset-password', adminController.adminResetPassword);

// System Settings Routes
app.get('/api/sistema/settings', adminController.getSettings);
app.put('/api/sistema/settings', adminController.updateSettings);

// Health Check Route (Diagnóstico)
const db = require('./config/database');
app.get('/api/health-check', async (req, res) => {
    try {
        const result = await db.query('SELECT current_database(), current_user');
        const columns = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'usuarios'
        `);
        res.json({
            status: 'ok',
            database: result.rows[0],
            usuarios_columns: columns.rows
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
            code: error.code
        });
    }
});

const zapiService = require('./services/zapiService');

// Trigger Test Cron (endpoint somente para teste manual se necessário)
app.post('/api/enviar-mensagem-programada', async (req, res) => {
    // Lógica manual para teste
    res.send('Cron triggered manually (dummy endpoint)');
});

// Endpoint para envio manual de mensagem (Novo)
app.post('/api/send-message', async (req, res) => {
    const { phone, message } = req.body;

    if (!phone || !message) {
        return res.status(400).json({ error: 'Phone and message are required' });
    }

    try {
        await zapiService.sendWhatsAppMessage(phone, message);
        res.status(200).json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending manual message:', error.response?.data || error.message);

        const statusCode = error.response?.status || 500;
        res.status(statusCode).json({
            error: 'Failed to send message',
            details: error.response?.data || error.message
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    cronService.initCronJobs();
});
