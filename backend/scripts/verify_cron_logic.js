const db = require('../src/config/database');
const riskClassifier = require('../src/services/riskClassifier');

async function verifyCronSimulation() {
    console.log('--- Simulando Lógica de Cron baseada em Risco ---');
    try {
        const result = await db.query(`
            SELECT u.nome, u.id, u.nivel_risco,
            (SELECT data_hora FROM leituras WHERE usuario_id = u.id ORDER BY data_hora DESC LIMIT 1) as data_ultima_leitura
            FROM usuarios u 
            WHERE u.role = 'paciente' AND u.consentimento_lgpd = true
        `);

        const hoje = new Date();
        const diaSemana = hoje.getDay();
        const nomesDias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

        console.log(`Hoje é ${nomesDias[diaSemana]}`);

        for (const user of result.rows) {
            const dataUltima = user.data_ultima_leitura ? new Date(user.data_ultima_leitura) : null;
            const diasDesdeUltima = dataUltima ? Math.floor((hoje - dataUltima) / (100 * 60 * 60 * 24)) : Infinity;

            let deveEnviar = false;
            const nivel = user.nivel_risco || 'BAIXO';

            if (nivel === 'ALTO') {
                deveEnviar = [1, 3, 5].includes(diaSemana);
            } else if (nivel === 'MEDIO') {
                deveEnviar = diaSemana === 1 && (diasDesdeUltima >= 6 || !dataUltima);
            } else {
                deveEnviar = diaSemana === 1 && (diasDesdeUltima >= 13 || !dataUltima);
            }

            console.log(`Paciente: ${user.nome} | Risco: ${nivel} | Última: ${dataUltima ? dataUltima.toLocaleDateString() : 'Nunca'} | Deve enviar hoje? ${deveEnviar ? '✅ SIM' : '❌ NÃO'}`);
        }
    } catch (error) {
        console.error('Erro na simulação:', error.message);
    } finally {
        process.exit();
    }
}

verifyCronSimulation();
