const db = require('../config/database');

// POST /api/auth/login
async function login(req, res) {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    try {
        const query = 'SELECT * FROM usuarios WHERE email = $1 AND senha = $2';
        const result = await db.query(query, [email, senha]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Email ou senha inválidos.' });
        }

        const user = result.rows[0];
        res.json({
            token: 'dummy-token-' + user.id, // Em um sistema real, use JWT
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                role: user.role,
                is_first_login: user.is_first_login
            }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message,
            code: error.code
        });
    }
}

// POST /api/auth/reset-password
async function resetPassword(req, res) {
    const { userId, senhaAntiga, senhaNova } = req.body;

    try {
        const userQuery = 'SELECT * FROM usuarios WHERE id = $1';
        const userResult = await db.query(userQuery, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        const user = userResult.rows[0];

        if (user.senha !== senhaAntiga) {
            return res.status(400).json({ error: 'Senha antiga incorreta.' });
        }

        await db.query('UPDATE usuarios SET senha = $1, is_first_login = false WHERE id = $2', [senhaNova, userId]);

        res.json({ success: true, message: 'Senha atualizada com sucesso.' });
    } catch (error) {
        console.error('Erro ao resetar senha:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
}

module.exports = {
    login,
    resetPassword
};
