import axios from 'axios';

// Para desenvolvimento local com o emulador/celular real, 
// você deve usar o seu IP local (ex: 192.168.x.x) em vez de localhost
const API_URL = 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const authService = {
    login: async (telefone: string) => {
        const response = await api.post('/mobile/login', { telefone });
        return response.data;
    },
};

export const chatService = {
    getMessages: async (usuarioId: string) => {
        const response = await api.get(`/mobile/messages/${usuarioId}`);
        return response.data;
    },
    sendMessage: async (usuarioId: string, conteudo: string) => {
        const response = await api.post('/mobile/messages', { usuarioId, conteudo });
        return response.data;
    },
};

export const pacienteService = {
    getHistorico: async (usuarioId: string) => {
        const response = await api.get(`/historico/${usuarioId}`);
        return response.data;
    },
};

export default api;
