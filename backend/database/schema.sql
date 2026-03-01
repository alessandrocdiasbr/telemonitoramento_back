-- Habilita extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) UNIQUE NOT NULL, -- formato: +5531999999999
    data_nascimento DATE,
    telefone_familiar VARCHAR(20) NOT NULL,
    nome_familiar VARCHAR(255),
    cpf VARCHAR(14) UNIQUE,
    cpf_familiar VARCHAR(14),
    consentimento_lgpd BOOLEAN DEFAULT FALSE,
    data_registro TIMESTAMP DEFAULT NOW()
);

-- Migração: Adiciona colunas faltantes se a tabela já existir
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS senha VARCHAR(255);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'paciente';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT TRUE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS plano VARCHAR(50) DEFAULT 'standart';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(50) UNIQUE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telegram_chat_id_familiar VARCHAR(50);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS nivel_risco VARCHAR(10) DEFAULT 'BAIXO' CHECK (nivel_risco IN ('BAIXO', 'MEDIO', 'ALTO'));

-- Patch de dados: Preenche colunas nulas para usuários que já existiam
UPDATE usuarios SET role = 'paciente' WHERE role IS NULL;
UPDATE usuarios SET is_first_login = false WHERE is_first_login IS NULL;
UPDATE usuarios SET plano = 'standart' WHERE plano IS NULL;

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_usuarios_telefone ON usuarios(telefone);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- 2. Tabela de Leituras (Histórico de PA e Temperatura)
CREATE TABLE IF NOT EXISTS leituras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    data_hora TIMESTAMP DEFAULT NOW(),
    pressao_sistolica INTEGER, -- ex: 120
    pressao_diastolica INTEGER, -- ex: 80
    temperatura DECIMAL(4,1), -- ex: 36.5
    texto_original TEXT, -- mensagem bruta do paciente
    classificacao_risco VARCHAR(20) CHECK (classificacao_risco IN ('verde', 'amarelo', 'vermelho')),
    sintomas_relatados TEXT
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_leituras_usuario_id ON leituras(usuario_id);
CREATE INDEX IF NOT EXISTS idx_leituras_data_hora ON leituras(data_hora);

-- 3. Tabela de Alertas Enviados
CREATE TABLE IF NOT EXISTS alertas_enviados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leitura_id UUID REFERENCES leituras(id) ON DELETE SET NULL,
    telefone_destinatario VARCHAR(20),
    data_envio TIMESTAMP DEFAULT NOW(),
    status_entrega VARCHAR(50) -- 'enviado', 'entregue', 'lido'
);

-- 4. Tabela de Mensagens Agendadas (Cron Jobs)
CREATE TABLE IF NOT EXISTS mensagens_agendadas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    horario_envio TIME NOT NULL, -- ex: '08:00:00'
    tipo_periodo VARCHAR(10) CHECK (tipo_periodo IN ('manha', 'noite')),
    ativo BOOLEAN DEFAULT TRUE
);

-- 5. Tabela de Pagamentos/Financeiro
CREATE TABLE IF NOT EXISTS pagamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    valor DECIMAL(10,2),
    data_vencimento DATE,
    status VARCHAR(20) DEFAULT 'pendente', -- 'pendente', 'pago'
    link_boleto TEXT,
    data_pagamento TIMESTAMP,
    data_criacao TIMESTAMP DEFAULT NOW()
);

-- 6. Tabela de Configurações do Sistema
CREATE TABLE IF NOT EXISTS sistema_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chave VARCHAR(255) UNIQUE NOT NULL,
    valor DECIMAL(10,2) NOT NULL -- Alterado de TEXT para DECIMAL
);

-- Migração: Garante que a coluna valor em sistema_settings seja do tipo correto
ALTER TABLE sistema_settings ALTER COLUMN valor TYPE DECIMAL(10,2) USING valor::numeric;

-- Inserção de dados iniciais
INSERT INTO sistema_settings (chave, valor) VALUES 
('preco_standart', '20.00'), -- Removido prefixo 'plano_' para alinhar com controlador
('preco_premium', '30.00')
ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor;

-- Inserção de um usuário administrador padrão
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE telefone = '00000000000' OR email = 'admin@admin.com') THEN
        INSERT INTO usuarios (nome, email, senha, telefone, telefone_familiar, role, is_first_login)
        VALUES ('Administrador', 'admin@admin.com', 'admin123', '00000000000', '00000000000', 'admin', false);
    END IF;
END $$;

-- Inserção do usuário Master
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE telefone = '11999999999' OR email = 'master@admin.com') THEN
        INSERT INTO usuarios (nome, email, senha, telefone, telefone_familiar, role, is_first_login)
        VALUES ('Master User', 'master@admin.com', 'master123', '11999999999', '11999999999', 'admin', false);
    END IF;
END $$;

-- 7. Tabela de Mensagens
CREATE TABLE IF NOT EXISTS mensagens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    direcao VARCHAR(10) CHECK (direcao IN ('enviada', 'recebida')),
    conteudo TEXT NOT NULL,
    tipo VARCHAR(20) DEFAULT 'texto',
    data_envio TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensagens_usuario_id ON mensagens(usuario_id);

-- 8. Tabela de Monitoramentos (Novo da Migração Telegram)
CREATE TABLE IF NOT EXISTS monitoramentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(30) NOT NULL, -- 'QUESTIONARIO_ENVIADO', 'RESPOSTA_RECEBIDA', 'ALERTA_GERADO', 'EMERGENCIA'
    nivel_risco VARCHAR(10) NOT NULL, -- 'BAIXO', 'MEDIO', 'ALTO'
    status VARCHAR(30) NOT NULL, -- 'AGUARDANDO_RESPOSTA', 'RESPONDIDO', 'ALERTA', 'EMERGENCIA'
    respostas JSONB,
    analise JSONB,
    observacoes TEXT,
    data_criacao TIMESTAMP DEFAULT NOW(),
    data_atualizacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monitoramentos_usuario_id ON monitoramentos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_monitoramentos_status ON monitoramentos(status);

