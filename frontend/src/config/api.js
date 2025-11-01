export const API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://api.yposteriormente.com/api'
  : 'http://localhost:3000/api';
export const API_URL = API_BASE;