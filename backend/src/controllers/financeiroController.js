const db = require('../config/database');

// GET /api/financeiro/stats
async function getFinanceiroStats(req, res) {
    try {
        // Total de clientes (pacientes)
        const totalClientesResult = await db.query("SELECT COUNT(*) FROM usuarios WHERE role = 'paciente'");
        const totalClientes = parseInt(totalClientesResult.rows[0].count);

        // Buscar preços atuais do sistema
        const pricesRes = await db.query('SELECT chave, valor FROM sistema_settings');
        const prices = {};
        pricesRes.rows.forEach(p => prices[p.chave] = parseFloat(p.valor));

        // Receita Projetada (Baseada nos planos atuais gravados no sistema)
        const receitaProjetadaResult = await db.query(`
          SELECT 
            SUM(CASE WHEN plano = 'premium' THEN $1 ELSE $2 END) as projetada
          FROM usuarios
          WHERE role = 'paciente'
        `, [prices.preco_premium || 30, prices.preco_standart || 20]);
        const receitaProjetada = parseFloat(receitaProjetadaResult.rows[0].projetada) || 0;

        // Valores Recebidos (pagamentos com status 'pago')
        const recebidosResult = await db.query(`
      SELECT SUM(valor) as total FROM pagamentos WHERE status = 'pago'
    `);
        const recebidos = parseFloat(recebidosResult.rows[0].total) || 0;

        // Contagem por plano para o gráfico
        const planosCountResult = await db.query(`
      SELECT plano, COUNT(*) FROM usuarios GROUP BY plano
    `);

        res.json({
            totalClientes,
            receitaProjetada,
            recebidos,
            planos: planosCountResult.rows
        });
    } catch (error) {
        console.error('Erro ao buscar stats financeiro:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message,
            code: error.code
        });
    }
}

// POST /api/financeiro/boletos
async function createBoleto(req, res) {
    const { paciente_id, valor, data_vencimento } = req.body;

    if (!paciente_id || !valor || !data_vencimento) {
        return res.status(400).json({ error: 'Paciente, valor e vencimento são obrigatórios.' });
    }

    try {
        const query = `
      INSERT INTO pagamentos (paciente_id, valor, data_vencimento, status, link_boleto)
      VALUES ($1, $2, $3, 'pendente', $4)
      RETURNING *
    `;
        const linkBoleto = `https://boleto-exemplo.com/gerar/${Math.random().toString(36).substring(7)}`;
        const values = [paciente_id, valor, data_vencimento, linkBoleto];

        const result = await db.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao gerar boleto:', error);
        res.status(500).json({ error: 'Erro ao gerar boleto' });
    }
}

// GET /api/financeiro/pagamentos
async function getPagamentos(req, res) {
    try {
        const query = `
      SELECT p.*, u.nome as paciente_nome
      FROM pagamentos p
      JOIN usuarios u ON p.paciente_id = u.id
      ORDER BY p.data_vencimento DESC
    `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar pagamentos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
}

module.exports = {
    getFinanceiroStats,
    createBoleto,
    getPagamentos
};
