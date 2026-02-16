import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api',
});

// Interceptor para adicionar token se necessário (futuro)
// api.interceptors.request.use((config) => {
//   return config;
// });

export default api;
