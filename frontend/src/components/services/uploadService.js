// Servicio de upload para React Page
import { API_BASE } from '../../config/api.js';

export const createUploadFileService = () => {
  return async (file, reportProgress) => {
    try {
      // Obtener CSRF token
      const csrfRes = await fetch(`${API_BASE}/csrf-token`, { credentials: 'include' });
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.csrfToken;

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      return {
        url: result.url,
        id: result.id,
        name: result.name,
        size: result.size,
        type: result.type,
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };
};