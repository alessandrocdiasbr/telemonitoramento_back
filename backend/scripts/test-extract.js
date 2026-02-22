
function extractDataFromZapi(payload) {
    // Copied from webhookController.js
    let phone = payload.phone;
    let text = '';
    let senderName = payload.senderName || payload.pushName;

    if (payload.text && payload.text.message) {
        text = payload.text.message;
    } else if (typeof payload.text === 'string') {
        text = payload.text;
    } else if (payload.message && payload.message.text) {
        text = payload.message.text;
    }

    return { phone, text, senderName };
}

// Test cases based on Z-API documentation and common structures
const payloads = [
    {
        name: "Standard Message",
        data: {
            phone: "5511999999999",
            text: { message: "Test message" },
            senderName: "User 1"
        }
    },
    {
        name: "Simple Text",
        data: {
            phone: "5511888888888",
            text: "Simple text message",
            pushName: "User 2"
        }
    },
    {
        name: "Nested Message",
        data: {
            phone: "5511777777777",
            message: { text: "Nested text" },
            senderName: "User 3"
        }
    },
    { // This is what I suspect might be happening if it fails
        name: "Potential Real Structure (Type: ReceivedCallback)",
        data: {
            "phone": "5511999999999",
            "message": {
                "id": "...",
                "type": "text",
                "text": "Minha pressão..."
            }
        }
    }

];

console.log("--- Testing Data Extraction ---");
payloads.forEach(test => {
    const result = extractDataFromZapi(test.data);
    console.log(`[${test.name}] Phone: ${result.phone}, Text: ${result.text}, Name: ${result.senderName}`);
    if (!result.phone || !result.text) {
        console.error(`--> FAILED to extract data for ${test.name}`);
    }
});
