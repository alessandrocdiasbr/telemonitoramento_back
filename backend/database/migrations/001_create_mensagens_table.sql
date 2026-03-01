-- Habilita extensão para UUIDs se ainda não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS mensagens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    direcao VARCHAR(10) CHECK (direcao IN ('enviada', 'recebida')),
    conteudo TEXT NOT NULL,
    tipo VARCHAR(20) DEFAULT 'texto',
    data_envio TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensagens_usuario_id ON mensagens(usuario_id);
