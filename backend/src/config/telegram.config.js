const { Telegraf } = require('telegraf');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN não encontrado no arquivo .env');
}

const bot = token ? new Telegraf(token) : null;

module.exports = bot;
