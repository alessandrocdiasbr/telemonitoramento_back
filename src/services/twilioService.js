// Twilio Service - DEPRECATED (Moved to Z-API)
// const twilio = require('twilio');
// require('dotenv').config();

// const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// async function sendWhatsAppMessage(to, body) {
//     try {
//         const message = await client.messages.create({
//             body: body,
//             from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
//             to: `whatsapp:${to}`
//         });
//         console.log(`Message sent to ${to}: ${message.sid}`);
//         return message;
//     } catch (error) {
//         console.error(`Error sending message to ${to}:`, error);
//         throw error;
//     }
// }

// module.exports = { sendWhatsAppMessage };
module.exports = {
    sendWhatsAppMessage: async () => { console.log('Twilio is deprecated'); }
};
