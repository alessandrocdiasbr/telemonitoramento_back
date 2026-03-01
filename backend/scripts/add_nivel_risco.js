const db = require('../src/config/database');

async function migrate() {
    console.log('Iniciando migração: Adicionando coluna nivel_risco...');
    try {
        await db.query(`
            ALTER TABLE usuarios 
            ADD COLUMN IF NOT EXISTS nivel_risco VARCHAR(10) DEFAULT 'BAIXO' 
            CHECK (nivel_risco IN ('BAIXO', 'MEDIO', 'ALTO'))
        `);
        console.log('Migração concluída com sucesso!');
    } catch (error) {
        console.error('Erro na migração:', error.message);
    } finally {
        process.exit();
    }
}

migrate();
