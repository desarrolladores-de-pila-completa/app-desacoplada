import axios from 'axios';
// import { getTokenCookie } from './getTokenCookie';


const api = axios.create({
  baseURL: 'http://10.0.2.2:3000/api', // IP especial para localhost desde emulador Android
  timeout: 10000,
});

// Interceptor para agregar la cookie token en cada petición
// Interceptor eliminado porque getTokenCookie ya no existe

export default api;
