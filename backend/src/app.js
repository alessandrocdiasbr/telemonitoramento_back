const express = require('express');
const cors = require('cors');
require('dotenv').config();

const webhookController = require('./controllers/webhookController');
const pacientesController = require('./controllers/pacientesController');
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
app.get('/api/pacientes/:id/leituras', pacientesController.getLeituras);
app.get('/api/historico/:usuarioId', pacientesController.getHistorico);

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
        console.error('Error sending manual message:', error);
        res.status(500).json({
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
