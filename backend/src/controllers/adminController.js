const db = require('../config/database');

// GET /api/admin/users
async function listUsers(req, res) {
    try {
        const query = 'SELECT id, nome, email, cpf, telefone, role, is_first_login FROM usuarios ORDER BY nome';
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
}

// POST /api/admin/users
async function createUser(req, res) {
    const { nome, email, cpf, telefone, role } = req.body;
    const senhaPadrao = 'senha123'; // Senha inicial padrão

    try {
        const query = `
            INSERT INTO usuarios (nome, email, cpf, telefone, role, senha, is_first_login, telefone_familiar)
            VALUES ($1, $2, $3, $4, $5, $6, true, $4)
            RETURNING id, nome, email, role
        `;
        const values = [nome, email, cpf, telefone, role, senhaPadrao];
        const result = await db.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Email já cadastrado.' });
        }
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
}

// DELETE /api/admin/users/:id
async function deleteUser(req, res) {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM usuarios WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
}

// POST /api/admin/users/:id/reset-password
async function adminResetPassword(req, res) {
    const { id } = req.params;
    const novaSenha = 'senha123'; // Reset para a senha padrão
    try {
        await db.query('UPDATE usuarios SET senha = $1, is_first_login = true WHERE id = $2', [novaSenha, id]);
        res.json({ success: true, message: 'Senha resetada para o padrão (senha123).' });
    } catch (error) {
        console.error('Erro ao resetar senha pelo admin:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
}

// GET /api/sistema/settings
async function getSettings(req, res) {
    try {
        const result = await db.query('SELECT * FROM sistema_settings');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar configurações:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
}

// PUT /api/sistema/settings
async function updateSettings(req, res) {
    const { settings } = req.body; // Array de {chave, valor}

    try {
        for (const item of settings) {
            await db.query('UPDATE sistema_settings SET valor = $1 WHERE chave = $2', [item.valor, item.chave]);
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao atualizar configurações:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
}

module.exports = {
    listUsers,
    createUser,
    deleteUser,
    adminResetPassword,
    getSettings,
    updateSettings
};
