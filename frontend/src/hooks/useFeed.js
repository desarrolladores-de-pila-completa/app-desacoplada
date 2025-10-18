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


// Hook para eliminar comentario
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pageId, commentId }) => {
      const csrfToken = await getCsrfToken();
      const response = await fetch(`${API_BASE}/paginas/${pageId}/comentarios/${commentId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar comentario');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidar cache de comentarios de la página
      queryClient.invalidateQueries(['comments', variables.pageId]);
    },
  });
};

// Hook para obtener página de usuario
export const useUserPage = (path) => {
  return useQuery({
    queryKey: ['userPage', path],
    queryFn: async () => {
      let url;
      let params = new URLSearchParams();

      if (path.includes('/publicacion/')) {
        // Para publicación específica
        const parts = path.split('/');
        const username = parts[0];
        const publicacionId = parts[2];
        url = `${API_BASE}/paginas/${username}`;
        params.append('action', 'publicacion');
        params.append('publicacionId', publicacionId);
        console.log('📄 [useUserPage] Solicitando publicación específica:', { username, publicacionId });
      } else if (path.endsWith('/list')) {
        // Para lista de publicaciones/páginas públicas del usuario
        const username = path.replace('/list', '');
        url = `${API_BASE}/paginas/${username}`;
        params.append('action', 'lista');
        console.log('📋 [useUserPage] Solicitando lista de páginas públicas para:', username);
      } else {
        // Para página de usuario con información completa (nueva estructura)
        const username = path;
        url = `${API_BASE}/paginas/${username}`;
        params.append('action', 'info');
        console.log('👤 [useUserPage] Solicitando página completa del usuario:', username);
      }

      // Añadir parámetros de query si existen
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      console.log('🚀 [useUserPage] Haciendo petición a:', url);
      const response = await fetch(url, {
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('❌ [useUserPage] Error en respuesta:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        });

        // Manejo específico de errores
        if (response.status === 404) {
          throw new Error('Usuario no encontrado');
        } else if (response.status === 500) {
          throw new Error('Error interno del servidor');
        } else {
          throw new Error(`Error al cargar página de usuario (${response.status})`);
        }
      }

      const data = await response.json();

      // Logs detallados para debugging del contenido HTML
      console.log('🔄 [DEBUG] useUserPage - Datos recibidos del backend:', {
        url,
        dataType: typeof data,
        hasUsuario: !!data?.usuario,
        hasPagina: !!data?.pagina,
        hasGaleria: !!data?.galeria,
        hasComentarios: !!data?.comentarios,
        usuario: data?.usuario ? {
          id: data.usuario.id,
          username: data.usuario.username,
          display_name: data.usuario.display_name,
          hasFotoPerfil: !!data.usuario.foto_perfil
        } : null,
        pagina: data?.pagina ? {
          id: data.pagina.id,
          titulo: data.pagina.titulo,
          contenidoLength: data.pagina.contenido?.length,
          contenidoPreview: data.pagina.contenido?.substring(0, 300)
        } : null,
        galeriaCount: data?.galeria?.length || 0,
        comentariosCount: data?.comentarios?.length || 0
      });

      return data;
    },
    enabled: !!path,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Función auxiliar para obtener CSRF token
async function getCsrfToken() {
  const res = await fetch(`${API_BASE}/csrf-token`, { credentials: 'include' });
  const data = await res.json();
  return data.csrfToken;
}