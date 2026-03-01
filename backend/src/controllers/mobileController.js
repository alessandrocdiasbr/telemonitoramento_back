const db = require('../config/database');
const messageService = require('../services/messageService');

/**
 * Login simplificado para o App Mobile
 * POST /api/mobile/login
 */
async function login(req, res) {
    const { telefone } = req.body;
    if (!telefone) {
        return res.status(400).json({ error: 'Telefone é obrigatório.' });
    }

    // Limpa o telefone para garantir match (remove tudo que não é dígito)
    const cleanPhone = telefone.replace(/\D/g, '');

    // Procura por 55... ou sem 55
    const phoneVariants = [cleanPhone];
    if (cleanPhone.startsWith('55')) {
        phoneVariants.push(cleanPhone.substring(2));
    } else {
        phoneVariants.push('55' + cleanPhone);
    }

    try {
        const result = await db.query(
            'SELECT * FROM usuarios WHERE telefone ANY($1) AND role = \'paciente\'',
            [phoneVariants]
        );

        if (result.rows.length === 0) {
            // Se não achou com 55 ou sem, tenta like parcial para ser mais flexível no MVP
            const fallbackResult = await db.query(
                'SELECT * FROM usuarios WHERE telefone LIKE $1 AND role = \'paciente\'',
                [`%${cleanPhone.slice(-8)}`]
            );

            if (fallbackResult.rows.length === 0) {
                return res.status(404).json({ error: 'Paciente não encontrado com este telefone.' });
            }

            return res.json({ user: fallbackResult.rows[0] });
        }

        const user = result.rows[0];
        res.json({ user });
    } catch (error) {
        console.error('Mobile login error:', error);
        res.status(500).json({ error: 'Erro interno ao processar login.' });
    }
}

/**
 * Envia uma mensagem do App para processamento
 * POST /api/mobile/messages
 */
async function sendMessage(req, res) {
    const { usuarioId, conteudo } = req.body;

    if (!usuarioId || !conteudo) {
        return res.status(400).json({ error: 'usuarioId e conteudo são obrigatórios.' });
    }

    try {
        const userResult = await db.query('SELECT * FROM usuarios WHERE id = $1', [usuarioId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        const user = userResult.rows[0];

        // Processa a mensagem usando o serviço centralizado (canal 'mobile')
        const responseText = await messageService.processIncomingMessage(user, conteudo, 'mobile');

        res.json({
            success: true,
            response: responseText
        });
    } catch (error) {
        console.error('Mobile sendMessage error:', error);
        res.status(500).json({ error: 'Erro ao processar mensagem.' });
    }
}

/**
 * Retorna o histórico de mensagens estilo chat para o App
 * GET /api/mobile/messages/:usuarioId
 */
async function getMessages(req, res) {
    const { usuarioId } = req.params;

    try {
        const result = await db.query(
            'SELECT id, direcao, conteudo, data_envio as timestamp FROM mensagens WHERE usuario_id = $1 ORDER BY data_envio ASC LIMIT 50',
            [usuarioId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Mobile getMessages error:', error);
        res.status(500).json({ error: 'Erro ao buscar mensagens.' });
    }
}

module.exports = { login, sendMessage, getMessages };
