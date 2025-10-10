import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE } from '../config/api';

// Hook para obtener feed
export const useFeed = () => {
  return useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/feed`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al cargar el feed');
      }

      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

// Hook para crear comentario
export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pageId, comentario }) => {
      const csrfToken = await getCsrfToken();
      const response = await fetch(`${API_BASE}/paginas/${pageId}/comentarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ comentario }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear comentario');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidar cache de comentarios de la página
      queryClient.invalidateQueries(['comments', variables.pageId]);
    },
  });
};

// Hook para obtener comentarios de una página
export const useComments = (pageId) => {
  return useQuery({
    queryKey: ['comments', pageId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/paginas/${pageId}/comentarios`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al cargar comentarios');
      }

      return response.json();
    },
    enabled: !!pageId,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
};

// Hook para obtener página de usuario
export const useUserPage = (username) => {
  return useQuery({
    queryKey: ['userPage', username],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/paginas/pagina/${username}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al cargar página de usuario');
      }

      return response.json();
    },
    enabled: !!username,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Función auxiliar para obtener CSRF token
async function getCsrfToken() {
  const res = await fetch(`${API_BASE}/csrf-token`, { credentials: 'include' });
  const data = await res.json();
  return data.csrfToken;
}