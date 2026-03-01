# Guia Completo: Migração WhatsApp → Telegram - Sistema de Telemonitoramento

## 📋 Sumário Executivo

Este documento apresenta a migração completa do sistema de telemonitoramento de WhatsApp (Z-API) para Telegram, incluindo:
- Sistema de classificação de risco (Baixo, Médio, Alto)
- Automação de mensagens baseada no nível de risco
- Alternativas de implementação (Bot vs API)
- Código completo e passo a passo detalhado

---

## 🎯 Requisitos do Sistema

### Funcionalidades Necessárias
1. ✅ Envio de mensagens automatizadas para pacientes
2. ✅ Classificação de pacientes por nível de risco
3. ✅ Agendamento diferenciado por risco:
   - **Alto Risco**: 3x por semana
   - **Médio Risco**: 1x por semana  
   - **Baixo Risco**: 1x a cada 15 dias
4. ✅ Recebimento e processamento de respostas
5. ✅ Armazenamento de histórico

---

## 💰 Comparativo de Soluções

### Opção 1: Telegram Bot API (RECOMENDADO ✨)
- **Custo**: 100% GRATUITO
- **Limites**: 30 mensagens/segundo
- **Vantagens**: 
  - Nativo e oficial
  - Sem custos operacionais
  - Altamente escalável
  - Webhooks gratuitos
  - Suporte a mídia
- **Ideal para**: Qualquer escala de operação

### Opção 2: Telegram Business API
- **Custo**: Pago (similar ao WhatsApp Business)
- **Vantagens**: Recursos empresariais avançados
- **Desvantagens**: Custo desnecessário para telemonitoramento

### Opção 3: Bibliotecas de Terceiros (node-telegram-bot-api)
- **Custo**: Gratuito
- **Vantagens**: Simplifica desenvolvimento
- **Recomendado**: Sim, usar junto com Bot API

---

## 🏗️ Arquitetura da Solução

```
┌─────────────────┐
│  Paciente       │
│  (Telegram)     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│   Telegram Bot API      │
│   (Webhook/Polling)     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Backend Node.js        │
│  - Recebe mensagens     │
│  - Classifica respostas │
│  - Agenda envios        │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Banco de Dados         │
│  - Pacientes            │
│  - Classificação Risco  │
│  - Histórico            │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Cron/Scheduler         │
│  - node-cron            │
│  - Verifica horários    │
│  - Dispara mensagens    │
└─────────────────────────┘
```

---

## 📦 Estrutura do Projeto Atualizada

```
telemonitoramento_back/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── telegram.config.js          # NOVO
│   ├── controllers/
│   │   ├── pacienteController.js
│   │   ├── telegramController.js       # NOVO
│   │   └── monitoramentoController.js  # ATUALIZADO
│   ├── services/
│   │   ├── telegramService.js          # NOVO (substitui whatsappService)
│   │   ├── riskClassifier.js           # NOVO
│   │   └── schedulerService.js         # NOVO
│   ├── models/
│   │   ├── Paciente.js                 # ATUALIZADO
│   │   ├── Mensagem.js
│   │   └── Monitoramento.js            # ATUALIZADO
│   ├── routes/
│   │   ├── paciente.routes.js
│   │   ├── telegram.routes.js          # NOVO
│   │   └── monitoramento.routes.js
│   ├── utils/
│   │   ├── validators.js
│   │   └── logger.js
│   └── app.js
├── .env
├── package.json
└── README.md
```

---

## 🚀 PASSO A PASSO COMPLETO

### FASE 1: Preparação do Ambiente

#### Passo 1.1: Criar Bot no Telegram
1. Abra o Telegram e procure por **@BotFather**
2. Digite `/newbot`
3. Escolha um nome: `TelemonitoramentoBot`
4. Escolha um username: `telemonitoramento_saude_bot`
5. **Guarde o TOKEN** que será fornecido (ex: `7123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw`)

#### Passo 1.2: Configurar Webhook (Opcional)
```bash
# Se você tiver um domínio com HTTPS
curl -F "url=https://seu-dominio.com/api/telegram/webhook" \
     https://api.telegram.org/bot<SEU_TOKEN>/setWebhook
```

#### Passo 1.3: Instalar Dependências
```bash
cd telemonitoramento_back
npm install node-telegram-bot-api node-cron
npm uninstall z-api-wrapper  # Remover dependência do WhatsApp
```

---

### FASE 2: Configuração do Código

#### Passo 2.1: Atualizar `.env`
```env
# Telegram Configuration
TELEGRAM_BOT_TOKEN=7123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw
TELEGRAM_WEBHOOK_URL=https://seu-dominio.com/api/telegram/webhook

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=telemonitoramento
DB_USER=postgres
DB_PASSWORD=sua_senha

# Scheduling
TIMEZONE=America/Sao_Paulo
```

#### Passo 2.2: Criar `src/config/telegram.config.js`
```javascript
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(token, {
  polling: process.env.NODE_ENV === 'development',
  webHook: process.env.NODE_ENV === 'production' ? {
    port: process.env.PORT || 3000
  } : false
});

// Configurar webhook em produção
if (process.env.NODE_ENV === 'production' && process.env.TELEGRAM_WEBHOOK_URL) {
  bot.setWebHook(`${process.env.TELEGRAM_WEBHOOK_URL}`);
}

module.exports = bot;
```

---

### FASE 3: Implementar Serviços Core

#### Passo 3.1: Criar `src/services/telegramService.js`
```javascript
const bot = require('../config/telegram.config');
const logger = require('../utils/logger');

class TelegramService {
  /**
   * Envia mensagem de texto para um paciente
   */
  async sendMessage(chatId, text, options = {}) {
    try {
      const result = await bot.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        ...options
      });
      
      logger.info(`Mensagem enviada para ${chatId}`);
      return result;
    } catch (error) {
      logger.error(`Erro ao enviar mensagem: ${error.message}`);
      throw error;
    }
  }

  /**
   * Envia mensagem com botões interativos
   */
  async sendQuestionWithButtons(chatId, question, buttons) {
    const keyboard = {
      inline_keyboard: buttons.map(row => 
        row.map(btn => ({
          text: btn.text,
          callback_data: btn.data
        }))
      )
    };

    return this.sendMessage(chatId, question, {
      reply_markup: keyboard
    });
  }

  /**
   * Envia questionário de monitoramento baseado no risco
   */
  async sendMonitoringQuestionnaire(chatId, riskLevel) {
    const questions = this.getQuestionsByRisk(riskLevel);
    
    let message = '<b>🏥 Monitoramento de Saúde</b>\n\n';
    message += 'Por favor, responda às seguintes perguntas:\n\n';
    
    questions.forEach((q, index) => {
      message += `${index + 1}. ${q}\n`;
    });
    
    message += '\n<i>Responda com números separados por vírgula. Ex: 1,2,3</i>';

    return this.sendMessage(chatId, message);
  }

  /**
   * Questionário específico para alto risco
   */
  getQuestionsByRisk(riskLevel) {
    const baseQuestions = [
      '📊 Como está sua pressão arterial hoje? (Normal/Alta/Muito Alta)',
      '💊 Tomou os medicamentos conforme prescrito?',
      '🩺 Está sentindo dor de cabeça?'
    ];

    const highRiskQuestions = [
      ...baseQuestions,
      '🫀 Sente dor ou desconforto no peito?',
      '😵 Teve tontura ou vertigem?',
      '👁️ Apresenta visão embaçada?',
      '🤢 Sentiu náusea ou vômito?',
      '😰 Sente falta de ar?'
    ];

    const mediumRiskQuestions = [
      ...baseQuestions,
      '😰 Sente ansiedade ou palpitações?',
      '💤 Como está sua qualidade de sono?'
    ];

    switch (riskLevel) {
      case 'ALTO':
        return highRiskQuestions;
      case 'MEDIO':
        return mediumRiskQuestions;
      case 'BAIXO':
        return baseQuestions;
      default:
        return baseQuestions;
    }
  }

  /**
   * Processa resposta do callback button
   */
  async handleCallback(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: 'Resposta registrada!'
    });

    return { chatId, data };
  }

  /**
   * Envia alerta de emergência
   */
  async sendEmergencyAlert(chatId, pacienteNome) {
    const message = `
🚨 <b>ALERTA DE EMERGÊNCIA</b> 🚨

Paciente: ${pacienteNome}

Foram detectados sinais de complicação grave da hipertensão.

<b>PROCURE ATENDIMENTO MÉDICO IMEDIATAMENTE!</b>

📞 SAMU: 192
🏥 Unidade de Saúde mais próxima

⚠️ Não ignore estes sintomas!
    `.trim();

    return this.sendMessage(chatId, message);
  }
}

module.exports = new TelegramService();
```

#### Passo 3.2: Criar `src/services/riskClassifier.js`
```javascript
class RiskClassifier {
  /**
   * Classifica paciente com base em dados clínicos
   */
  classifyPatient(paciente) {
    let score = 0;

    // Critérios de classificação
    
    // 1. Pressão Arterial
    if (paciente.pressaoSistolica >= 180 || paciente.pressaoDiastolica >= 120) {
      score += 5; // Crise hipertensiva
    } else if (paciente.pressaoSistolica >= 160 || paciente.pressaoDiastolica >= 100) {
      score += 3; // Estágio 2
    } else if (paciente.pressaoSistolica >= 140 || paciente.pressaoDiastolica >= 90) {
      score += 1; // Estágio 1
    }

    // 2. Comorbidades
    if (paciente.diabetes) score += 2;
    if (paciente.doencaCardiaca) score += 3;
    if (paciente.doencaRenal) score += 2;
    if (paciente.avc) score += 3;

    // 3. Idade
    if (paciente.idade >= 65) score += 2;
    else if (paciente.idade >= 50) score += 1;

    // 4. IMC
    if (paciente.imc >= 35) score += 2;
    else if (paciente.imc >= 30) score += 1;

    // 5. Histórico de não adesão
    if (paciente.historicoNaoAdesao) score += 2;

    // 6. Sintomas recentes
    if (paciente.sintomas && paciente.sintomas.length > 0) {
      score += paciente.sintomas.length;
    }

    // Classificação final
    if (score >= 8) return 'ALTO';
    if (score >= 4) return 'MEDIO';
    return 'BAIXO';
  }

  /**
   * Retorna frequência de monitoramento
   */
  getMonitoringFrequency(riskLevel) {
    const frequencies = {
      'ALTO': {
        days: [1, 3, 5], // Segunda, Quarta, Sexta
        interval: 3, // 3 dias
        description: '3x por semana'
      },
      'MEDIO': {
        days: [1], // Segunda
        interval: 7, // 7 dias
        description: '1x por semana'
      },
      'BAIXO': {
        days: [1], // Segunda a cada 2 semanas
        interval: 15, // 15 dias
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

    // Palavras-chave de alerta
    const keywords = {
      critical: ['dor no peito', 'falta de ar', 'desmaio', 'confusão', 'convulsão'],
      warning: ['tontura', 'náusea', 'vômito', 'visão embaçada', 'dor de cabeça forte'],
      attention: ['cansaço', 'palpitação', 'ansiedade']
    };

    const texto = respostas.toLowerCase();

    // Verifica sinais críticos
    keywords.critical.forEach(keyword => {
      if (texto.includes(keyword)) {
        alertSignals.push({
          level: 'CRITICAL',
          signal: keyword,
          action: 'EMERGENCY'
        });
      }
    });

    // Verifica sinais de alerta
    keywords.warning.forEach(keyword => {
      if (texto.includes(keyword)) {
        alertSignals.push({
          level: 'WARNING',
          signal: keyword,
          action: 'CONTACT_DOCTOR'
        });
      }
    });

    return {
      hasAlerts: alertSignals.length > 0,
      alerts: alertSignals,
      severity: alertSignals.length > 0 ? alertSignals[0].level : 'NORMAL'
    };
  }
}

module.exports = new RiskClassifier();
```

#### Passo 3.3: Criar `src/services/schedulerService.js`
```javascript
const cron = require('node-cron');
const { Paciente, Monitoramento } = require('../models');
const telegramService = require('./telegramService');
const riskClassifier = require('./riskClassifier');
const logger = require('../utils/logger');

class SchedulerService {
  constructor() {
    this.jobs = new Map();
  }

  /**
   * Inicia todos os agendamentos
   */
  startAll() {
    // Executa todos os dias às 9h
    this.scheduleDaily();
    
    logger.info('Scheduler iniciado com sucesso');
  }

  /**
   * Agendamento diário de verificação
   */
  scheduleDaily() {
    // Executa de Segunda a Sexta às 09:00
    cron.schedule('0 9 * * 1-5', async () => {
      logger.info('Executando verificação diária de monitoramento');
      await this.checkAndSendMessages();
    }, {
      timezone: process.env.TIMEZONE || 'America/Sao_Paulo'
    });
  }

  /**
   * Verifica quais pacientes devem receber mensagem hoje
   */
  async checkAndSendMessages() {
    try {
      const pacientes = await Paciente.findAll({
        where: { ativo: true }
      });

      for (const paciente of pacientes) {
        const shouldSend = await this.shouldSendToday(paciente);
        
        if (shouldSend) {
          await this.sendMonitoringMessage(paciente);
        }
      }
    } catch (error) {
      logger.error(`Erro no scheduler: ${error.message}`);
    }
  }

  /**
   * Verifica se deve enviar mensagem hoje
   */
  async shouldSendToday(paciente) {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0-6 (Domingo-Sábado)

    // Busca último monitoramento
    const lastMonitoring = await Monitoramento.findOne({
      where: { pacienteId: paciente.id },
      order: [['createdAt', 'DESC']]
    });

    if (!lastMonitoring) return true; // Primeiro envio

    const frequency = riskClassifier.getMonitoringFrequency(paciente.nivelRisco);
    const daysSinceLastMonitoring = Math.floor(
      (today - new Date(lastMonitoring.createdAt)) / (1000 * 60 * 60 * 24)
    );

    // Verifica se já passou o intervalo
    if (daysSinceLastMonitoring < frequency.interval) {
      return false;
    }

    // Para alto risco: segunda, quarta, sexta (1, 3, 5)
    // Para médio/baixo: segunda (1)
    return frequency.days.includes(dayOfWeek);
  }

  /**
   * Envia mensagem de monitoramento
   */
  async sendMonitoringMessage(paciente) {
    try {
      await telegramService.sendMonitoringQuestionnaire(
        paciente.telegramChatId,
        paciente.nivelRisco
      );

      // Registra envio
      await Monitoramento.create({
        pacienteId: paciente.id,
        tipo: 'QUESTIONARIO_ENVIADO',
        nivelRisco: paciente.nivelRisco,
        status: 'AGUARDANDO_RESPOSTA'
      });

      logger.info(`Mensagem enviada para paciente ${paciente.nome}`);
    } catch (error) {
      logger.error(`Erro ao enviar para ${paciente.nome}: ${error.message}`);
    }
  }

  /**
   * Para todos os agendamentos
   */
  stopAll() {
    this.jobs.forEach(job => job.stop());
    this.jobs.clear();
    logger.info('Todos os agendamentos foram parados');
  }
}

module.exports = new SchedulerService();
```

---

### FASE 4: Atualizar Models

#### Passo 4.1: Atualizar `src/models/Paciente.js`
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Paciente = sequelize.define('Paciente', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  telegramChatId: {  // MUDANÇA: era whatsappNumber
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  telegramUsername: {  // NOVO
    type: DataTypes.STRING,
    allowNull: true
  },
  idade: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sexo: {
    type: DataTypes.ENUM('M', 'F', 'OUTRO'),
    allowNull: false
  },
  
  // Dados clínicos
  pressaoSistolica: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  pressaoDiastolica: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  imc: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  
  // Comorbidades
  diabetes: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  doencaCardiaca: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  doencaRenal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  avc: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  // Classificação de risco
  nivelRisco: {
    type: DataTypes.ENUM('BAIXO', 'MEDIO', 'ALTO'),
    allowNull: false,
    defaultValue: 'BAIXO'
  },
  
  // Controle
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  historicoNaoAdesao: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sintomas: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'pacientes',
  timestamps: true
});

module.exports = Paciente;
```

#### Passo 4.2: Criar/Atualizar `src/models/Monitoramento.js`
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Monitoramento = sequelize.define('Monitoramento', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  pacienteId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'pacientes',
      key: 'id'
    }
  },
  tipo: {
    type: DataTypes.ENUM(
      'QUESTIONARIO_ENVIADO',
      'RESPOSTA_RECEBIDA',
      'ALERTA_GERADO',
      'EMERGENCIA'
    ),
    allowNull: false
  },
  nivelRisco: {
    type: DataTypes.ENUM('BAIXO', 'MEDIO', 'ALTO'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(
      'AGUARDANDO_RESPOSTA',
      'RESPONDIDO',
      'ALERTA',
      'EMERGENCIA'
    ),
    allowNull: false
  },
  respostas: {
    type: DataTypes.JSON,
    allowNull: true
  },
  analise: {
    type: DataTypes.JSON,
    allowNull: true
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'monitoramentos',
  timestamps: true
});

module.exports = Monitoramento;
```

---

### FASE 5: Criar Controllers

#### Passo 5.1: Criar `src/controllers/telegramController.js`
```javascript
const telegramService = require('../services/telegramService');
const riskClassifier = require('../services/riskClassifier');
const { Paciente, Monitoramento } = require('../models');
const logger = require('../utils/logger');

class TelegramController {
  /**
   * Webhook do Telegram
   */
  async handleWebhook(req, res) {
    try {
      const update = req.body;
      
      if (update.message) {
        await this.handleMessage(update.message);
      } else if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      }
      
      res.status(200).send('OK');
    } catch (error) {
      logger.error(`Erro no webhook: ${error.message}`);
      res.status(500).send('Error');
    }
  }

  /**
   * Processa mensagens recebidas
   */
  async handleMessage(message) {
    const chatId = message.chat.id;
    const text = message.text;

    // Comando /start - Registro inicial
    if (text === '/start') {
      await this.handleStartCommand(chatId, message.from);
      return;
    }

    // Busca paciente
    const paciente = await Paciente.findOne({
      where: { telegramChatId: chatId.toString() }
    });

    if (!paciente) {
      await telegramService.sendMessage(
        chatId,
        '❌ Você não está cadastrado. Entre em contato com a equipe de saúde.'
      );
      return;
    }

    // Processa resposta do questionário
    await this.processPatientResponse(paciente, text);
  }

  /**
   * Comando /start - Primeiro contato
   */
  async handleStartCommand(chatId, user) {
    const message = `
👋 <b>Bem-vindo ao Sistema de Telemonitoramento!</b>

Olá, ${user.first_name}!

Este é um sistema de acompanhamento de pacientes com hipertensão.

Para se cadastrar, entre em contato com sua equipe de saúde e forneça seu ID do Telegram: <code>${chatId}</code>

📱 Você receberá mensagens periódicas para monitorar sua saúde.
    `.trim();

    await telegramService.sendMessage(chatId, message);
  }

  /**
   * Processa resposta do paciente
   */
  async processPatientResponse(paciente, respostaTexto) {
    try {
      // Busca último monitoramento pendente
      const monitoramento = await Monitoramento.findOne({
        where: {
          pacienteId: paciente.id,
          status: 'AGUARDANDO_RESPOSTA'
        },
        order: [['createdAt', 'DESC']]
      });

      if (!monitoramento) {
        await telegramService.sendMessage(
          paciente.telegramChatId,
          '✅ Obrigado! Sua mensagem foi recebida.'
        );
        return;
      }

      // Analisa resposta
      const analise = riskClassifier.analyzeResponse(respostaTexto);

      // Atualiza monitoramento
      await monitoramento.update({
        status: analise.hasAlerts ? 'ALERTA' : 'RESPONDIDO',
        respostas: { texto: respostaTexto },
        analise: analise
      });

      // Resposta ao paciente
      if (analise.severity === 'CRITICAL') {
        await telegramService.sendEmergencyAlert(
          paciente.telegramChatId,
          paciente.nome
        );
        
        // Notifica equipe (implementar)
        await this.notifyHealthTeam(paciente, analise);
      } else if (analise.hasAlerts) {
        await telegramService.sendMessage(
          paciente.telegramChatId,
          '⚠️ Identificamos alguns sinais de atenção. Nossa equipe entrará em contato em breve.'
        );
      } else {
        await telegramService.sendMessage(
          paciente.telegramChatId,
          '✅ Obrigado! Suas respostas foram registradas. Continue seguindo as orientações médicas! 💚'
        );
      }

      logger.info(`Resposta processada para paciente ${paciente.nome}`);
    } catch (error) {
      logger.error(`Erro ao processar resposta: ${error.message}`);
    }
  }

  /**
   * Notifica equipe de saúde sobre alerta
   */
  async notifyHealthTeam(paciente, analise) {
    // Implementar notificação para equipe
    // Pode ser email, SMS, dashboard, etc.
    logger.warn(`ALERTA: Paciente ${paciente.nome} apresenta sinais críticos`);
  }

  /**
   * Processa callback de botões
   */
  async handleCallbackQuery(callbackQuery) {
    const { chatId, data } = await telegramService.handleCallback(callbackQuery);
    
    // Processar dados do callback
    logger.info(`Callback recebido: ${data} de ${chatId}`);
  }
}

module.exports = new TelegramController();
```

#### Passo 5.2: Atualizar `src/controllers/pacienteController.js`
```javascript
const { Paciente } = require('../models');
const riskClassifier = require('../services/riskClassifier');
const telegramService = require('../services/telegramService');

class PacienteController {
  /**
   * Criar novo paciente
   */
  async create(req, res) {
    try {
      const dadosPaciente = req.body;
      
      // Classifica risco automaticamente
      const nivelRisco = riskClassifier.classifyPatient(dadosPaciente);
      
      const paciente = await Paciente.create({
        ...dadosPaciente,
        nivelRisco
      });

      // Envia mensagem de boas-vindas
      await this.sendWelcomeMessage(paciente);

      res.status(201).json({
        success: true,
        data: paciente,
        message: 'Paciente cadastrado com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Enviar mensagem de boas-vindas
   */
  async sendWelcomeMessage(paciente) {
    const frequency = riskClassifier.getMonitoringFrequency(paciente.nivelRisco);
    
    const message = `
🏥 <b>Bem-vindo ao Programa de Telemonitoramento, ${paciente.nome}!</b>

Você foi cadastrado com sucesso!

📊 <b>Seu nível de risco:</b> ${paciente.nivelRisco}
📅 <b>Frequência de monitoramento:</b> ${frequency.description}

Você receberá mensagens periódicas com perguntas sobre sua saúde. Por favor, responda sempre que receber.

💊 Lembre-se de tomar seus medicamentos conforme prescrito!

Em caso de emergência, ligue 192 (SAMU).
    `.trim();

    await telegramService.sendMessage(paciente.telegramChatId, message);
  }

  /**
   * Listar todos pacientes
   */
  async list(req, res) {
    try {
      const pacientes = await Paciente.findAll({
        where: { ativo: true },
        order: [['nivelRisco', 'DESC'], ['nome', 'ASC']]
      });

      res.json({
        success: true,
        data: pacientes
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Atualizar paciente
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const dados = req.body;

      const paciente = await Paciente.findByPk(id);
      if (!paciente) {
        return res.status(404).json({
          success: false,
          message: 'Paciente não encontrado'
        });
      }

      // Reclassifica risco se dados clínicos mudaram
      const nivelRiscoAnterior = paciente.nivelRisco;
      const novoNivelRisco = riskClassifier.classifyPatient({
        ...paciente.toJSON(),
        ...dados
      });

      await paciente.update({
        ...dados,
        nivelRisco: novoNivelRisco
      });

      // Notifica se risco mudou
      if (nivelRiscoAnterior !== novoNivelRisco) {
        await this.notifyRiskChange(paciente, nivelRiscoAnterior, novoNivelRisco);
      }

      res.json({
        success: true,
        data: paciente,
        message: 'Paciente atualizado com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Notifica mudança de nível de risco
   */
  async notifyRiskChange(paciente, riscoAnterior, riscoNovo) {
    const message = `
📊 <b>Atualização do seu Monitoramento</b>

Olá, ${paciente.nome}!

Seu nível de risco foi atualizado:
${riscoAnterior} → ${riscoNovo}

${riscoNovo === 'ALTO' ? '⚠️ Você receberá acompanhamento mais frequente.' : ''}
${riscoNovo === 'BAIXO' ? '✅ Continue assim! Seu monitoramento será menos frequente.' : ''}

Continue seguindo as orientações da equipe de saúde.
    `.trim();

    await telegramService.sendMessage(paciente.telegramChatId, message);
  }

  /**
   * Deletar paciente (desativar)
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      
      const paciente = await Paciente.findByPk(id);
      if (!paciente) {
        return res.status(404).json({
          success: false,
          message: 'Paciente não encontrado'
        });
      }

      await paciente.update({ ativo: false });

      res.json({
        success: true,
        message: 'Paciente desativado com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Buscar paciente por ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      
      const paciente = await Paciente.findByPk(id, {
        include: [{
          model: require('../models').Monitoramento,
          as: 'monitoramentos',
          limit: 10,
          order: [['createdAt', 'DESC']]
        }]
      });

      if (!paciente) {
        return res.status(404).json({
          success: false,
          message: 'Paciente não encontrado'
        });
      }

      res.json({
        success: true,
        data: paciente
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Estatísticas gerais
   */
  async getStats(req, res) {
    try {
      const stats = await Paciente.findAll({
        attributes: [
          'nivelRisco',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total']
        ],
        where: { ativo: true },
        group: ['nivelRisco']
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new PacienteController();
```

---

### FASE 6: Configurar Rotas

#### Passo 6.1: Criar `src/routes/telegram.routes.js`
```javascript
const express = require('express');
const router = express.Router();
const telegramController = require('../controllers/telegramController');

// Webhook do Telegram
router.post('/webhook', telegramController.handleWebhook.bind(telegramController));

module.exports = router;
```

#### Passo 6.2: Atualizar `src/routes/paciente.routes.js`
```javascript
const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteController');

router.post('/', pacienteController.create.bind(pacienteController));
router.get('/', pacienteController.list.bind(pacienteController));
router.get('/stats', pacienteController.getStats.bind(pacienteController));
router.get('/:id', pacienteController.getById.bind(pacienteController));
router.put('/:id', pacienteController.update.bind(pacienteController));
router.delete('/:id', pacienteController.delete.bind(pacienteController));

module.exports = router;
```

---

### FASE 7: Atualizar App Principal

#### Passo 7.1: Atualizar `src/app.js`
```javascript
const express = require('express');
const cors = require('cors');
const bot = require('./config/telegram.config');
const schedulerService = require('./services/schedulerService');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api/telegram', require('./routes/telegram.routes'));
app.use('/api/pacientes', require('./routes/paciente.routes'));

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Iniciar scheduler
schedulerService.startAll();

// Iniciar bot em modo polling (desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  bot.on('message', async (msg) => {
    const telegramController = require('./controllers/telegramController');
    await telegramController.handleMessage(msg);
  });

  bot.on('callback_query', async (query) => {
    const telegramController = require('./controllers/telegramController');
    await telegramController.handleCallbackQuery(query);
  });

  console.log('✅ Bot Telegram iniciado em modo polling');
}

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Bot Telegram: Ativo`);
  console.log(`⏰ Scheduler: Ativo`);
});

module.exports = app;
```

---

### FASE 8: Scripts Úteis

#### Passo 8.1: Criar `src/scripts/migrateFromWhatsApp.js`
```javascript
/**
 * Script para migrar dados do WhatsApp para Telegram
 * Execute: node src/scripts/migrateFromWhatsApp.js
 */

const { Paciente } = require('../models');

async function migrate() {
  console.log('🔄 Iniciando migração WhatsApp → Telegram...\n');

  try {
    const pacientes = await Paciente.findAll();

    console.log(`📊 Total de pacientes: ${pacientes.length}\n`);

    for (const paciente of pacientes) {
      console.log(`\n👤 Paciente: ${paciente.nome}`);
      console.log(`📱 WhatsApp: ${paciente.whatsappNumber || 'N/A'}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`⚠️  AÇÃO NECESSÁRIA:`);
      console.log(`1. Peça ao paciente para iniciar conversa com o bot no Telegram`);
      console.log(`2. O paciente deve enviar /start para @${process.env.BOT_USERNAME}`);
      console.log(`3. Anote o Chat ID que será exibido`);
      console.log(`4. Atualize o cadastro com o comando:`);
      console.log(`   UPDATE pacientes SET telegram_chat_id = 'CHAT_ID' WHERE id = '${paciente.id}';`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    }

    console.log('\n✅ Migração manual necessária!');
    console.log('📋 Cada paciente precisa iniciar conversa com o bot.');
  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
  }
}

migrate();
```

#### Passo 8.2: Criar `src/scripts/testTelegram.js`
```javascript
/**
 * Script de teste do Telegram
 * Execute: node src/scripts/testTelegram.js CHAT_ID
 */

const telegramService = require('../services/telegramService');

async function test() {
  const chatId = process.argv[2];

  if (!chatId) {
    console.error('❌ Uso: node testTelegram.js CHAT_ID');
    process.exit(1);
  }

  console.log(`🧪 Testando envio para Chat ID: ${chatId}\n`);

  try {
    // Teste 1: Mensagem simples
    console.log('1️⃣ Enviando mensagem simples...');
    await telegramService.sendMessage(chatId, '✅ Teste de conexão bem-sucedido!');

    // Teste 2: Mensagem com formatação
    console.log('2️⃣ Enviando mensagem formatada...');
    const message = `
<b>🏥 Teste de Monitoramento</b>

Este é um teste do sistema de telemonitoramento.

<i>Se você recebeu esta mensagem, tudo está funcionando! ✅</i>
    `.trim();
    await telegramService.sendMessage(chatId, message);

    // Teste 3: Questionário
    console.log('3️⃣ Enviando questionário...');
    await telegramService.sendMonitoringQuestionnaire(chatId, 'ALTO');

    console.log('\n✅ Todos os testes passaram!');
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

test();
```

---

### FASE 9: Migrations do Banco de Dados

#### Passo 9.1: Criar `migrations/001_add_telegram_fields.sql`
```sql
-- Adicionar campos do Telegram
ALTER TABLE pacientes 
  ADD COLUMN telegram_chat_id VARCHAR(255) UNIQUE,
  ADD COLUMN telegram_username VARCHAR(255);

-- Remover campos do WhatsApp (opcional - manter para histórico)
-- ALTER TABLE pacientes DROP COLUMN whatsapp_number;

-- Atualizar constraint
ALTER TABLE pacientes 
  ALTER COLUMN telegram_chat_id SET NOT NULL;

-- Índice para performance
CREATE INDEX idx_telegram_chat_id ON pacientes(telegram_chat_id);
CREATE INDEX idx_nivel_risco ON pacientes(nivel_risco);
CREATE INDEX idx_ativo ON pacientes(ativo);
```

#### Passo 9.2: Criar `migrations/002_create_monitoramentos.sql`
```sql
-- Criar tabela de monitoramentos
CREATE TABLE IF NOT EXISTS monitoramentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  nivel_risco VARCHAR(20) NOT NULL,
  status VARCHAR(50) NOT NULL,
  respostas JSONB,
  analise JSONB,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_monitoramentos_paciente ON monitoramentos(paciente_id);
CREATE INDEX idx_monitoramentos_status ON monitoramentos(status);
CREATE INDEX idx_monitoramentos_created ON monitoramentos(created_at DESC);
```

---

### FASE 10: Atualizar package.json

#### Passo 10.1: Atualizar `package.json`
```json
{
  "name": "telemonitoramento-backend",
  "version": "2.0.0",
  "description": "Sistema de Telemonitoramento com Telegram",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test:telegram": "node src/scripts/testTelegram.js",
    "migrate:whatsapp": "node src/scripts/migrateFromWhatsApp.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "node-telegram-bot-api": "^0.64.0",
    "node-cron": "^3.0.3",
    "sequelize": "^6.35.2",
    "pg": "^8.11.3",
    "pg-hstore": "^2.3.4",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

## 🎯 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Preparação ✅
- [ ] Criar bot no @BotFather
- [ ] Guardar TOKEN do bot
- [ ] Instalar dependências (`npm install`)
- [ ] Configurar `.env`

### Fase 2: Código ✅
- [ ] Criar `telegram.config.js`
- [ ] Criar `telegramService.js`
- [ ] Criar `riskClassifier.js`
- [ ] Criar `schedulerService.js`
- [ ] Atualizar models
- [ ] Criar controllers
- [ ] Configurar rotas
- [ ] Atualizar `app.js`

### Fase 3: Banco de Dados ✅
- [ ] Executar migration `001_add_telegram_fields.sql`
- [ ] Executar migration `002_create_monitoramentos.sql`
- [ ] Verificar estrutura do banco

### Fase 4: Testes ✅
- [ ] Testar bot com `/start`
- [ ] Testar envio de mensagem (script)
- [ ] Testar cadastro de paciente
- [ ] Testar classificação de risco
- [ ] Testar scheduler

### Fase 5: Migração ✅
- [ ] Executar script de migração
- [ ] Adicionar Chat IDs dos pacientes
- [ ] Notificar pacientes sobre mudança
- [ ] Desativar WhatsApp (Z-API)

### Fase 6: Produção ✅
- [ ] Configurar webhook (se produção)
- [ ] Configurar servidor HTTPS
- [ ] Monitorar logs
- [ ] Documentar para equipe

---

## 📊 TABELA COMPARATIVA: WhatsApp vs Telegram

| Aspecto | WhatsApp (Z-API) | Telegram (Bot API) |
|---------|------------------|-------------------|
| **Custo** | R$ 49-199/mês | **GRATUITO** |
| **Limites** | Variável | 30 msg/segundo |
| **API** | Não oficial | Oficial |
| **Webhooks** | Pagos | Gratuitos |
| **Botões** | Limitado | Completo |
| **Mídia** | Sim | Sim |
| **Grupos** | Sim | Sim |
| **Estabilidade** | Risco de bloqueio | Estável |

---

## 🔒 SEGURANÇA

### Boas Práticas
1. **Nunca** commite o TOKEN no Git
2. Use variáveis de ambiente (`.env`)
3. Valide todos os inputs
4. Use HTTPS em produção
5. Implemente rate limiting
6. Log de todas as ações

### Exemplo `.env.example`
```env
TELEGRAM_BOT_TOKEN=seu_token_aqui
DB_HOST=localhost
DB_NAME=telemonitoramento
NODE_ENV=development
```

---

## 📈 MONITORAMENTO

### Logs Importantes
```javascript
// Exemplo de logs a implementar
logger.info('Mensagem enviada', { pacienteId, risco });
logger.warn('Alerta detectado', { paciente, sintomas });
logger.error('Erro no envio', { erro, paciente });
```

### Métricas a Acompanhar
- Mensagens enviadas/dia
- Taxa de resposta
- Alertas gerados
- Tempo de resposta
- Pacientes por nível de risco

---

## 🆘 TROUBLESHOOTING

### Problema: Bot não responde
**Solução**: 
```bash
# Verificar se bot está ativo
curl https://api.telegram.org/bot<TOKEN>/getMe

# Ver webhooks configurados
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
```

### Problema: Webhook não funciona
**Solução**:
- Verificar se URL é HTTPS
- Verificar certificado SSL
- Usar polling em desenvolvimento

### Problema: Mensagens não chegam
**Solução**:
- Verificar Chat ID
- Verificar se paciente bloqueou bot
- Verificar logs de erro

---

## 📚 RECURSOS ADICIONAIS

### Documentação Oficial
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)
- [node-cron](https://www.npmjs.com/package/node-cron)

### Exemplos de Mensagens
```javascript
// Mensagem de emergência
🚨 EMERGÊNCIA - Procure atendimento IMEDIATAMENTE

// Mensagem de alerta
⚠️ Atenção necessária - Entraremos em contato

// Mensagem de confirmação
✅ Resposta registrada com sucesso

// Mensagem educativa
💊 Lembre-se: Tome seus medicamentos diariamente
```

---

## ✅ CONCLUSÃO

Esta migração oferece:
- ✅ **Custo ZERO** vs R$ 49-199/mês
- ✅ API oficial e estável
- ✅ Classificação automática de risco
- ✅ Agendamento inteligente
- ✅ Análise de respostas
- ✅ Alertas automáticos
- ✅ Escalável e confiável

**Tempo estimado de implementação**: 2-3 dias
**Economia anual**: R$ 588 - R$ 2.388

---

## 📞 PRÓXIMOS PASSOS

1. Revisar código com equipe
2. Testar em ambiente de desenvolvimento
3. Treinar equipe de saúde
4. Migrar pacientes gradualmente
5. Monitorar primeiros 30 dias
6. Ajustar frequências conforme necessário

---

**Desenvolvido para Sistema de Telemonitoramento**
Versão 2.0 - Migração WhatsApp → Telegram
