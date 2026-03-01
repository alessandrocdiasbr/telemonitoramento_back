/**
 * Serviço para classificação de risco e frequências de monitoramento
 */
class RiskClassifier {
    /**
     * Classifica o nível de risco do paciente
     * @param {Object} paciente Dados do paciente (idade, comorbidades, pressao)
     * @returns {string} 'BAIXO', 'MEDIO' ou 'ALTO'
     */
    classifyPatient(paciente) {
        let score = 0;

        // 1. Pressão Arterial
        const sistolica = parseInt(paciente.pressao_sistolica);
        const diastolica = parseInt(paciente.pressao_diastolica);

        if (sistolica >= 180 || diastolica >= 120) {
            score += 5; // Crise hipertensiva
        } else if (sistolica >= 160 || diastolica >= 100) {
            score += 3; // Estágio 2
        } else if (sistolica >= 140 || diastolica >= 90) {
            score += 1; // Estágio 1
        }

        // 2. Comorbidades (se existirem no objeto)
        if (paciente.diabetes) score += 2;
        if (paciente.doenca_cardiaca) score += 3;
        if (paciente.doenca_renal) score += 2;
        if (paciente.avc) score += 3;

        // 3. Idade
        if (paciente.idade >= 65) score += 2;
        else if (paciente.idade >= 50) score += 1;

        // 4. IMC (se disponível)
        if (paciente.imc >= 35) score += 2;
        else if (paciente.imc >= 30) score += 1;

        // 5. Histórico de não adesão
        if (paciente.historico_nao_adesao) score += 2;

        // 6. Sintomas recentes
        if (paciente.sintomas && Array.isArray(paciente.sintomas)) {
            score += paciente.sintomas.length;
        }

        // Classificação final (conforme o guia)
        if (score >= 8) return 'ALTO';
        if (score >= 4) return 'MEDIO';
        return 'BAIXO';
    }

    /**
     * Retorna a frequência de monitoramento baseada no risco
     */
    getMonitoringFrequency(riskLevel) {
        const frequencies = {
            'ALTO': {
                days: [1, 3, 5], // Segunda, Quarta, Sexta
                interval: 3,
                description: '3x por semana'
            },
            'MEDIO': {
                days: [1], // Segunda
                interval: 7,
                description: '1x por semana'
            },
            'BAIXO': {
                days: [1], // Segunda a cada 15 dias (verificar dia do mês ou flag)
                interval: 15,
                description: '1x a cada 15 dias'
            }
        };

        return frequencies[riskLevel] || frequencies['BAIXO'];
    }

    /**
     * Analisa resposta do paciente e detecta sinais de alerta
     */
    analyzeResponse(respostas) {
        const alertSignals = [];
        const keywords = {
            critical: ['dor no peito', 'falta de ar', 'desmaio', 'confusão', 'convulsão'],
            warning: ['tontura', 'náusea', 'vômito', 'visão embaçada', 'dor de cabeça forte'],
            attention: ['cansaço', 'palpitação', 'ansiedade']
        };

        const texto = respostas.toLowerCase();

        keywords.critical.forEach(keyword => {
            if (texto.includes(keyword)) {
                alertSignals.push({ level: 'CRITICAL', signal: keyword, action: 'EMERGENCY' });
            }
        });

        keywords.warning.forEach(keyword => {
            if (texto.includes(keyword)) {
                alertSignals.push({ level: 'WARNING', signal: keyword, action: 'CONTACT_DOCTOR' });
            }
        });

        return {
            hasAlerts: alertSignals.length > 0,
            alerts: alertSignals,
            severity: alertSignals.length > 0 ? alertSignals[0].level : 'NORMAL'
        };
    }

    /**
     * Retorna as perguntas do questionário baseado no risco
     */
    getQuestionsByRisk(riskLevel) {
        const baseQuestions = [
            '📊 Como está sua pressão arterial hoje? (Normal/Alta/Muito Alta)',
            '💊 Tomou os medicamentos conforme prescrito?',
            '🩺 Está sentindo dor de cabeça?'
        ];

        const additionalQuestions = {
            'ALTO': [
                '🫀 Sente dor ou desconforto no peito?',
                '😵 Teve tontura ou vertigem?',
                '👁️ Apresenta visão embaçada?',
                '🤢 Sentiu náusea ou vômito?',
                '😰 Sente falta de ar?'
            ],
            'MEDIO': [
                '😰 Sente ansiedade ou palpitações?',
                '💤 Como está sua qualidade de sono?'
            ],
            'BAIXO': []
        };

        return [...baseQuestions, ...(additionalQuestions[riskLevel] || [])];
    }
}

module.exports = new RiskClassifier();

