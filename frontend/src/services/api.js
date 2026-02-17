import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;
const baseURL = apiUrl ? `${apiUrl}/api` : 'http://localhost:3000/api';

const api = axios.create({
    baseURL: baseURL,
});

// Interceptor para adicionar token se necessário (futuro)
// api.interceptors.request.use((config) => {
//   return config;
// });

export default api;
