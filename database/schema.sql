-- Habilita extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE, -- Adicionado para login
    senha VARCHAR(255),        -- Adicionado para login
    telefone VARCHAR(20) UNIQUE NOT NULL, -- formato: +5531999999999
    data_nascimento DATE,
    telefone_familiar VARCHAR(20) NOT NULL,
    nome_familiar VARCHAR(255),
    cpf VARCHAR(14) UNIQUE,
    cpf_familiar VARCHAR(14),
    role VARCHAR(20) DEFAULT 'paciente', -- 'admin' ou 'paciente'
    is_first_login BOOLEAN DEFAULT TRUE,
    plano VARCHAR(50) DEFAULT 'standart',
    consentimento_lgpd BOOLEAN DEFAULT FALSE,
    data_registro TIMESTAMP DEFAULT NOW()
);

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
    valor TEXT NOT NULL
);

-- Inserção de dados iniciais
INSERT INTO sistema_settings (chave, valor) VALUES 
('preco_plano_standart', '20.00'),
('preco_plano_premium', '30.00')
ON CONFLICT (chave) DO NOTHING;

-- Inserção de um usuário administrador padrão
INSERT INTO usuarios (nome, email, senha, telefone, telefone_familiar, role, is_first_login)
VALUES ('Administrador', 'admin@admin.com', 'admin123', '00000000000', '00000000000', 'admin', false)
ON CONFLICT (email) DO NOTHING;
