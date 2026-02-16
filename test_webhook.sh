#!/bin/bash

# Script para simular um webhook da Z-API para o backend local

# 1. Definir a URL do webhook local
URL="http://localhost:3000/webhook"

# 2. Definir o payload JSON simulando uma mensagem do WhatsApp
# O formato deve corresponder ao esperado pelo webhookController.js
PAYLOAD='{
  "phone": "5511999998888",
  "senderName": "Paciente Teste",
  "text": {
    "message": "Minha pressão hoje está 14 por 9 e estou sentindo um pouco de dor de cabeça."
  }
}'

# 3. Enviar a requisição POST usando curl
echo "Enviando simulação de webhook para $URL..."
echo "Payload: $PAYLOAD"

curl -X POST "$URL" \
     -H "Content-Type: application/json" \
     -d "$PAYLOAD"

echo -e "\n\nSimulação concluída. Verifique os logs do backend para ver o processamento."
