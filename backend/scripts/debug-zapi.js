
const zapiService = require('../src/services/zapiService');
require('dotenv').config();

async function testZapi() {
    const phone = '5511999999999'; // Dummy number for testing
    const message = 'Teste de debug Z-API';

    console.log('Testing Z-API with:', { phone, message });

    try {
        const result = await zapiService.sendWhatsAppMessage(phone, message);
        console.log('Success:', result);
    } catch (error) {
        console.error('Caught Error:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
            console.error('Headers:', error.response.headers);
        } else if (error.request) {
            console.error('No response received. Request:', error.request);
        } else {
            console.error('Error message:', error.message);
        }
    }
}

testZapi();
