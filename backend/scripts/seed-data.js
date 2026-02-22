const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5434/telemonitoramento'
});

async function seedData() {
    try {
        await client.connect();
        console.log('Connected to database');

        const pacientesData = [
            { nome: 'Ana Silva', email: 'ana.silva@email.com', telefone: '11988880001', plano: 'premium' },
            { nome: 'João Souza', email: 'joao.souza@email.com', telefone: '11988880002', plano: 'standart' },
            { nome: 'Maria Oliveira', email: 'maria.oliveira@email.com', telefone: '11988880003', plano: 'premium' },
            { nome: 'Carlos Pereira', email: 'carlos.pereira@email.com', telefone: '11988880004', plano: 'standart' },
            { nome: 'Lucia Santos', email: 'lucia.santos@email.com', telefone: '11988880005', plano: 'premium' },
            { nome: 'Roberto Lima', email: 'roberto.lima@email.com', telefone: '11988880006', plano: 'standart' },
            { nome: 'Fernanda Costa', email: 'fernanda.costa@email.com', telefone: '11988880007', plano: 'premium' },
            { nome: 'Paulo Rocha', email: 'paulo.rocha@email.com', telefone: '11988880008', plano: 'standart' },
            { nome: 'Sonia Almeida', email: 'sonia.almeida@email.com', telefone: '11988880009', plano: 'premium' },
            { nome: 'Ricardo Mendes', email: 'ricardo.mendes@email.com', telefone: '11988880010', plano: 'standart' }
        ];

        for (const p of pacientesData) {
            // Insert patient
            const res = await client.query(`
                INSERT INTO usuarios (nome, email, telefone, plano, role, is_first_login, senha, telefone_familiar, cpf)
                VALUES ($1, $2, $3, $4, 'paciente', false, 'senha123', $3, $5)
                ON CONFLICT (email) DO NOTHING
                RETURNING id
            `, [p.nome, p.email, p.telefone, p.plano, '000000000' + p.telefone.slice(-2)]);

            let usuarioId;
            if (res.rows.length > 0) {
                usuarioId = res.rows[0].id;
            } else {
                const existing = await client.query('SELECT id FROM usuarios WHERE email = $1', [p.email]);
                usuarioId = existing.rows[0].id;
            }

            console.log(`Inserting readings for ${p.nome}...`);

            // Insert readings for 5 days, twice a day
            for (let day = 0; day < 5; day++) {
                for (let period = 0; period < 2; period++) {
                    const date = new Date();
                    date.setDate(date.getDate() - day);
                    date.setHours(period === 0 ? 8 : 20, Math.floor(Math.random() * 60), 0);

                    // Random health data
                    const syst = 110 + Math.floor(Math.random() * 40);
                    const diast = 70 + Math.floor(Math.random() * 25);
                    const temp = (36 + Math.random() * 1.5).toFixed(1);

                    let risco = 'verde';
                    if (syst > 140 || diast > 90) risco = 'amarelo';
                    if (syst > 160 || diast > 100) risco = 'vermelho';

                    await client.query(`
                        INSERT INTO leituras (usuario_id, data_hora, pressao_sistolica, pressao_diastolica, temperatura, classificacao_risco, texto_original)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                    `, [usuarioId, date, syst, diast, temp, risco, `Pressão: ${syst}/${diast}, Temperatura: ${temp}`]);
                }
            }

            // Generate some payments for the financial dashboard
            const valor = p.plano === 'premium' ? 30 : 20;
            const randomID = Math.random().toString(36).substring(7);
            await client.query(`
                INSERT INTO pagamentos (paciente_id, valor, data_vencimento, status, link_boleto)
                VALUES ($1, $2, CURRENT_DATE, $3, $4)
            `, [usuarioId, valor, Math.random() > 0.5 ? 'pago' : 'pendente', 'https://boleto.com/' + randomID]);
        }

        console.log('Seed data inserted successfully!');
    } catch (err) {
        console.error('Error seeding data:', err);
    } finally {
        await client.end();
    }
}

seedData();
