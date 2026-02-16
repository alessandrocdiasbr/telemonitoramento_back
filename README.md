
# Sistema de Telemonitoramento de Hipertensos

Sistema MVP para monitoramento de pacientes hipertensos via WhatsApp e Dashboard Web.

## Estrutura do Projeto

- **backend/**: API Node.js + Express
- **frontend/**: Dashboard React + Vite
- **database/**: Scripts SQL

## Pré-requisitos

- Node.js (v18+)
- PostgreSQL
- Conta Twilio (para WhatsApp)
- OpenAI API Key

## Configuração

### 1. Banco de Dados

Crie um banco de dados PostgreSQL e execute o script de esquema:

```bash
psql -U postgres -d telemonitoramento -f database/schema.sql
```

### 2. Backend

1. Entre na pasta backend:
   ```bash
   cd backend
   ```
2. Crie um arquivo `.env` com as configurações:
   ```env
   DATABASE_URL=postgresql://user:pass@localhost:5434/telemonitoramento
   OPENAI_API_KEY=sk-...
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=+1234567890
   PORT=3000
   ```
3. Instale as dependências e inicie:
   ```bash
   npm install
   npm start
   ```

### 3. Configuração do WhatsApp (Z-API)

O sistema utiliza a Z-API para envio e recebimento de mensagens.

1.  **Crie uma conta na Z-API**: [https://z-api.io/](https://z-api.io/)
2.  **Conecte sua instância**: Escaneie o QR Code com o WhatsAppWeb.
3.  **Obtenha as credenciais**:
    -   `Instance ID`
    -   `Token`
    -   `Client Token` (se aplicável/segurança)
4.  **Configure o Webhook**:
    -   Na Z-API, vá em **Webhooks**.
    -   Configure o evento `Ao receber mensagem` (ReceivedCallback) para: `SEU_DOMINIO/api/webhook`.

### 4. Variáveis de Ambiente (.env)

No arquivo `backend/.env`, configure:

```env
# Banco de Dados
DATABASE_URL=postgresql://user:pass@localhost:5434/telemonitoramento

# OpenAI
OPENAI_API_KEY=sk-...

# Z-API (WhatsApp)
ZAPI_INSTANCE_ID=SUA_INSTANCE_ID
ZAPI_TOKEN=SEU_TOKEN
ZAPI_CLIENT_TOKEN=SEU_CLIENT_TOKEN

# Configuração do Servidor
PORT=3000

# Twilio (Depreciado/Backup)
# TWILIO_ACCOUNT_SID=...
# TWILIO_AUTH_TOKEN=...
# TWILIO_PHONE_NUMBER=...
```

### 5. Frontend

1. Entre na pasta frontend:
   ```bash
   cd frontend
   ```
2. Instale as dependências e inicie:
   ```bash
   npm install
   npm run dev
   ```

## Uso

1. **Webhook WhatsApp**: Configure o webhook do Twilio para apontar para `your-domain/webhook`.
2. **Dashboard**: Acesse `http://localhost:5173`.
   - Login: `admin` / `admin123`

## Funcionalidades

- Recebimento de PA e Temperatura via WhatsApp.
- Classificação automática de risco via IA.
- Alertas para familiares se risco VERMELHO.
- Dashboard com atualização em tempo real.
- Gráficos de evolução do paciente.
