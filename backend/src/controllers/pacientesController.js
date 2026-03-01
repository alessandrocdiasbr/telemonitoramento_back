const db = require('../config/database');

// GET /api/pacientes
async function getPacientes(req, res) {
  try {
    const query = `
      SELECT 
        u.id, 
        u.nome, 
        u.telefone, 
        u.telefone_familiar,
        u.cpf,
        u.plano,
        u.telegram_chat_id,
        u.telegram_chat_id_familiar,
        u.nivel_risco,
        (
          SELECT json_build_object(
            'data_hora', l.data_hora,
            'pressao', CONCAT(l.pressao_sistolica, '/', l.pressao_diastolica),
            'temperatura', l.temperatura,
            'risco', l.classificacao_risco
          )
          FROM leituras l
          WHERE l.usuario_id = u.id
          ORDER BY l.data_hora DESC
          LIMIT 1
        ) as ultima_leitura
      FROM usuarios u
      WHERE u.role = 'paciente'
      ORDER BY u.nome ASC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pacientes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/historico/:usuarioId
async function getHistorico(req, res) {
  const { usuarioId } = req.params;
  try {
    const query = `
      SELECT 
        to_char(data_hora, 'YYYY-MM-DD HH24:MI') as data_formatada,
        pressao_sistolica,
        pressao_diastolica,
        temperatura
      FROM leituras
      WHERE usuario_id = $1
      ORDER BY data_hora ASC
      LIMIT 30
    `;
    const result = await db.query(query, [usuarioId]);

    const labels = [];
    const sistolica = [];
    const diastolica = [];
    const temperatura = [];

    result.rows.forEach(row => {
      labels.push(row.data_formatada);
      sistolica.push(row.pressao_sistolica);
      diastolica.push(row.pressao_diastolica);
      temperatura.push(row.temperatura);
    });

    res.json({
      labels,
      datasets: [
        { label: 'Sistólica', data: sistolica },
        { label: 'Diastólica', data: diastolica },
        { label: 'Temperatura', data: temperatura }
      ]
    });
  } catch (error) {
    console.error('Error fetching historico:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/pacientes
async function createPaciente(req, res) {
  const { nome, telefone, data_nascimento, telefone_familiar, nome_familiar, cpf, cpf_familiar, consentimento_lgpd, plano, telegram_chat_id, telegram_chat_id_familiar, nivel_risco } = req.body;

  // Validação básica
  if (!nome || !telefone || !telefone_familiar) {
    return res.status(400).json({ error: 'Nome, telefone e telefone familiar são obrigatórios.' });
  }

  try {
    const query = `
            INSERT INTO usuarios (nome, telefone, data_nascimento, telefone_familiar, nome_familiar, cpf, cpf_familiar, consentimento_lgpd, plano, telegram_chat_id, telegram_chat_id_familiar, nivel_risco)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `;
    const values = [nome, telefone, data_nascimento || null, telefone_familiar, nome_familiar || null, cpf || null, cpf_familiar || null, consentimento_lgpd || false, plano || 'standart', telegram_chat_id || null, telegram_chat_id_familiar || null, nivel_risco || 'BAIXO'];

    const result = await db.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Código de erro do Postgres para violação de unicidade
      if (error.constraint === 'usuarios_cpf_key') {
        return res.status(409).json({ error: 'Paciente com este CPF já cadastrado.' });
      }
      return res.status(409).json({ error: 'Paciente com este telefone ou CPF já cadastrado.' });
    }
    console.error('Error creating paciente:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/pacientes/:id
async function getPacienteById(req, res) {
  const { id } = req.params;
  try {
    const query = 'SELECT * FROM usuarios WHERE id = $1';
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching paciente by id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// PUT /api/pacientes/:id
async function updatePaciente(req, res) {
  const { id } = req.params;
  const { nome, telefone, data_nascimento, telefone_familiar, nome_familiar, cpf, cpf_familiar, consentimento_lgpd, plano, telegram_chat_id, telegram_chat_id_familiar, nivel_risco } = req.body;

  if (!nome || !telefone || !telefone_familiar) {
    return res.status(400).json({ error: 'Nome, telefone e telefone familiar são obrigatórios.' });
  }

  try {
    const query = `
      UPDATE usuarios 
      SET nome = $1, telefone = $2, data_nascimento = $3, telefone_familiar = $4, nome_familiar = $5, cpf = $6, cpf_familiar = $7, consentimento_lgpd = $8, plano = $9, telegram_chat_id = $10, telegram_chat_id_familiar = $11, nivel_risco = $12
      WHERE id = $13
      RETURNING *
    `;
    const values = [
      nome,
      telefone,
      data_nascimento || null,
      telefone_familiar,
      nome_familiar || null,
      cpf || null,
      cpf_familiar || null,
      consentimento_lgpd || false,
      plano || 'standart',
      telegram_chat_id || null,
      telegram_chat_id_familiar || null,
      nivel_risco || 'BAIXO',
      id
    ];

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      if (error.constraint === 'usuarios_cpf_key') {
        return res.status(409).json({ error: 'Paciente com este CPF já cadastrado.' });
      }
      return res.status(409).json({ error: 'Paciente com este telefone ou CPF já cadastrado.' });
    }
    console.error('Error updating paciente:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/pacientes/:id/leituras
async function getLeituras(req, res) {
  const { id } = req.params;
  try {
    const query = `
      SELECT 
        id,
        to_char(data_hora, 'DD/MM/YYYY HH24:MI') as data_formatada,
        pressao_sistolica,
        pressao_diastolica,
        temperatura,
        classificacao_risco,
        sintomas_relatados
      FROM leituras
      WHERE usuario_id = $1
      ORDER BY data_hora DESC
    `;
    const result = await db.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leituras:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/leituras/recentes
async function getRecentLeituras(req, res) {
  try {
    const query = `
      SELECT 
        l.id,
        u.nome as paciente_nome,
        to_char(l.data_hora, 'DD/MM/YYYY HH24:MI') as data_formatada,
        CONCAT(l.pressao_sistolica, '/', l.pressao_diastolica) as pressao,
        l.temperatura,
        l.classificacao_risco as risco
      FROM leituras l
      JOIN usuarios u ON l.usuario_id = u.id
      ORDER BY l.data_hora DESC
      LIMIT 10
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching recent leituras:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// DELETE /api/pacientes/:id
async function deletePaciente(req, res) {
  const { id } = req.params;
  try {
    const query = 'DELETE FROM usuarios WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado.' });
    }

    res.json({ message: 'Paciente excluído com sucesso.' });
  } catch (error) {
    console.error('Error deleting paciente:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getPacientes, getHistorico, createPaciente, getPacienteById, updatePaciente, getLeituras, getRecentLeituras, deletePaciente };
