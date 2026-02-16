-- Habilita extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Usuários
CREATE TABLE usuarios (
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

-- Índices para otimização
CREATE INDEX idx_usuarios_telefone ON usuarios(telefone);

-- 2. Tabela de Leituras (Histórico de PA e Temperatura)
CREATE TABLE leituras (
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
CREATE INDEX idx_leituras_usuario_id ON leituras(usuario_id);
CREATE INDEX idx_leituras_data_hora ON leituras(data_hora);

-- 3. Tabela de Alertas Enviados
CREATE TABLE alertas_enviados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leitura_id UUID REFERENCES leituras(id) ON DELETE SET NULL,
    telefone_destinatario VARCHAR(20),
    data_envio TIMESTAMP DEFAULT NOW(),
    status_entrega VARCHAR(50) -- 'enviado', 'entregue', 'lido'
);

-- 4. Tabela de Mensagens Agendadas (Cron Jobs)
CREATE TABLE mensagens_agendadas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    horario_envio TIME NOT NULL, -- ex: '08:00:00'
    tipo_periodo VARCHAR(10) CHECK (tipo_periodo IN ('manha', 'noite')),
    ativo BOOLEAN DEFAULT TRUE
);

-- Inserção de dados iniciais para teste (Opcional)
-- INSERT INTO usuarios (nome, telefone, telefone_familiar, consentimento_lgpd) 
-- VALUES ('Paciente Teste', '+5531999999999', '+5531888888888', true);
