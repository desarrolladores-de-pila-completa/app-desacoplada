import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE } from '../config/api';

export function useGlobalChat(limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['globalChat', limit, offset],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/chat/global?limit=${limit}&offset=${offset}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        // Para chat público, devolver array vacío en caso de error
        if (response.status === 401 || response.status === 500) {
          return [];
        }
        throw new Error('Error al obtener mensajes del chat');
      }
      return response.json();
    },
    refetchInterval: 5000, // Refrescar cada 5 segundos
    enabled: limit > 0, // Solo ejecutar si hay límite
  });
}

export function usePrivateChat(userId, limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['privateChat', userId, limit, offset],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/private/${userId}?limit=${limit}&offset=${offset}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Error al obtener mensajes privados');
      }
      return response.json();
    },
    refetchInterval: 2000, // Reducir intervalo para mensajes privados (2 segundos)
    enabled: !!userId,
  });
}

export function useSendPrivateMessage(userId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message) => {
      const response = await fetch(`${API_BASE}/private/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message,
          senderId: `guest-${Date.now()}`, // ID único para invitados
          senderUsername: 'Invitado' // Nombre genérico para invitados
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al enviar mensaje privado');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privateChat', userId] });
      // También invalidar el chat global para actualizar la lista de usuarios en línea
      queryClient.invalidateQueries({ queryKey: ['globalChat'] });
    },
    enabled: !!userId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageData) => {
      const response = await fetch(`${API_BASE}/chat/global`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(messageData),
      });
      if (!response.ok) {
        // Para chat público, manejar errores de autenticación permitiendo envío como invitado
        if (response.status === 401) {
          // Intentar enviar sin credenciales para invitados
          const guestResponse = await fetch(`${API_BASE}/chat/global`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(messageData),
          });
          if (!guestResponse.ok) {
            const error = await guestResponse.json();
            throw new Error(error.error || 'Error al enviar mensaje como invitado');
          }
          return guestResponse.json();
        }
        const error = await response.json();
        throw new Error(error.error || 'Error al enviar mensaje');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidar y refetch del chat
      queryClient.invalidateQueries({ queryKey: ['globalChat'] });
    },
  });
}