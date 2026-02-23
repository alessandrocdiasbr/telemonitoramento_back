const db = require('../src/config/database');

async function seedPatients() {
    const patients = [
        { nome: 'Alice Silva', telefone: '+5511911111111', email: 'alice.silva@teste.com' },
        { nome: 'Bruno Oliveira', telefone: '+5511922222222', email: 'bruno.oliveira@teste.com' },
        { nome: 'Carla Santos', telefone: '+5511933333333', email: 'carla.santos@teste.com' },
        { nome: 'Daniel Costa', telefone: '+5511944444444', email: 'daniel.costa@teste.com' },
        { nome: 'Eduarda Pereira', telefone: '+5511955555555', email: 'eduarda.pereira@teste.com' },
        { nome: 'Felipe Rocha', telefone: '+5511966666666', email: 'felipe.rocha@teste.com' },
        { nome: 'Gabriela Lima', telefone: '+5511977777777', email: 'gabriela.lima@teste.com' },
        { nome: 'Henrique Souza', telefone: '+5511988888888', email: 'henrique.souza@teste.com' },
        { nome: 'Isabela Almeida', telefone: '+5511999999999', email: 'isabela.almeida@teste.com' },
        { nome: 'João Mendes', telefone: '+5511900000000', email: 'joao.mendes@teste.com' }
    ];

    try {
        console.log('--- Iniciando Semeadura de Pacientes ---');

        for (const p of patients) {
            console.log(`Inserindo paciente: ${p.nome}`);

            const userRes = await db.query(
                `INSERT INTO usuarios (nome, telefone, email, senha, telefone_familiar, role, is_first_login, plano)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (email) DO UPDATE SET nome = EXCLUDED.nome
         RETURNING id`,
                [p.nome, p.telefone, p.email, 'senha123', p.telefone, 'paciente', false, 'standart']
            );

            const usuarioId = userRes.rows[0].id;

            // Gerar leituras para 5 dias, 3 vezes ao dia
            for (let d = 0; d < 5; d++) {
                const date = new Date();
                date.setDate(date.getDate() - d);

                // Períodos: manhã (08:00), tarde (14:00), noite (20:00)
                const hours = [8, 14, 20];

                for (const h of hours) {
                    const readingDate = new Date(date);
                    readingDate.setHours(h, Math.floor(Math.random() * 60), 0);

                    // Lógica para variar os riscos entre os pacientes
                    let sistolica, diastolica, temperatura, risco;

                    // Pacientes com perfis diferentes para testar os alertas
                    const patientIndex = patients.indexOf(p);

                    if (patientIndex % 3 === 0) { // Perfil Saudável (Verde)
                        sistolica = 110 + Math.floor(Math.random() * 15);
                        diastolica = 70 + Math.floor(Math.random() * 15);
                        temperatura = (36.2 + Math.random() * 0.8).toFixed(1);
                        risco = 'verde';
                    } else if (patientIndex % 3 === 1) { // Perfil Alerta (Amarelo)
                        sistolica = 140 + Math.floor(Math.random() * 15);
                        diastolica = 90 + Math.floor(Math.random() * 10);
                        temperatura = (37.2 + Math.random() * 1.0).toFixed(1);
                        risco = 'amarelo';
                    } else { // Perfil Crítico (Vermelho)
                        sistolica = 165 + Math.floor(Math.random() * 20);
                        diastolica = 105 + Math.floor(Math.random() * 15);
                        temperatura = (38.5 + Math.random() * 1.5).toFixed(1);
                        risco = 'vermelho';
                    }

                    // Pequena chance de variar o risco para não ficar totalmente estático
                    if (Math.random() > 0.8) {
                        risco = Math.random() > 0.5 ? 'amarelo' : 'verde';
                        sistolica -= 20;
                    }

                    await db.query(
                        `INSERT INTO leituras (usuario_id, data_hora, pressao_sistolica, pressao_diastolica, temperatura, classificacao_risco, texto_original)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                        [usuarioId, readingDate, sistolica, diastolica, temperatura, risco, `PA: ${sistolica}/${diastolica}, Temp: ${temperatura}`]
                    );
                }
            }
        }

        console.log('--- Semeadura concluída com sucesso! ---');
        process.exit(0);
    } catch (err) {
        console.error('Erro ao semear dados:', err);
        process.exit(1);
    }
}

seedPatients();
