const axios = require('axios');
require('dotenv').config();

const ZAPI_INSTANCE_ID = process.env.ZAPI_INSTANCE_ID?.trim();
const ZAPI_TOKEN = process.env.ZAPI_TOKEN?.trim();
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN?.trim();

console.log(`Z-API Config: ID=${ZAPI_INSTANCE_ID ? '***' + ZAPI_INSTANCE_ID.slice(-4) : 'MISSING'}, Token=${ZAPI_TOKEN ? 'SET' : 'MISSING'}`);

// Validation
if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN) {
    console.warn("⚠️ Z-API credentials (INSTANCE_ID, TOKEN) are missing in .env");
}

const headers = { 'Content-Type': 'application/json' };
if (ZAPI_CLIENT_TOKEN) {
    headers['Client-Token'] = ZAPI_CLIENT_TOKEN;
}

const api = axios.create({
    baseURL: `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}`,
    headers: headers
});

async function sendWhatsAppMessage(to, body) {
    try {
        // Ensure phone number has country code (Brazil +55)
        let phone = to.replace(/\D/g, '');
        if (phone.length >= 10 && phone.length <= 11) {
            phone = '55' + phone;
        }

        console.log(`Sending message to ${phone} via Z-API...`);
        // Z-API expects 'phone' and 'message' (or 'message' inside 'text' object depending on endpoint)
        // Using /send-text endpoint: https://developer.z-api.io/message/send-text
        const response = await api.post('/send-text', {
            phone: phone,
            message: body
        });

        console.log(`Message sent to ${phone}:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error sending message to ${to} via Z-API:`, error.response ? JSON.stringify(error.response.data) : error.message);
        throw error;
    }
}

module.exports = { sendWhatsAppMessage };
