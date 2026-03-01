const riskClassifier = require('../src/services/riskClassifier');

const testCases = [
    {
        name: 'Baixo Risco - Jovem Saudável',
        paciente: {
            data_nascimento: '1995-01-01',
            pressao_sistolica: 120,
            pressao_diastolica: 80,
            ultimo_risco: 'verde'
        },
        expected: 'BAIXO'
    },
    {
        name: 'Médio Risco - Idoso com pressão levemente alta',
        paciente: {
            data_nascimento: '1950-01-01',
            pressao_sistolica: 145,
            pressao_diastolica: 95,
            ultimo_risco: 'amarelo'
        },
        expected: 'MEDIO'
    },
    {
        name: 'Alto Risco - Crise hipertensiva',
        paciente: {
            data_nascimento: '1980-01-01',
            pressao_sistolica: 190,
            pressao_diastolica: 120,
            ultimo_risco: 'vermelho'
        },
        expected: 'ALTO'
    }
];

console.log('--- Iniciando Testes de Lógica de Risco ---');

testCases.forEach(tc => {
    const result = riskClassifier.classifyPatient(tc.paciente);
    const passed = result === tc.expected;
    console.log(`${passed ? '✅' : '❌'} ${tc.name}: Resultado=${result} (Esperado=${tc.expected})`);
});

console.log('--- Verificando Frequências ---');
['ALTO', 'MEDIO', 'BAIXO'].forEach(level => {
    const freq = riskClassifier.getMonitoringFrequency(level);
    console.log(`Risco ${level}: ${freq.description} (Dias: ${freq.days.join(', ')})`);
});
