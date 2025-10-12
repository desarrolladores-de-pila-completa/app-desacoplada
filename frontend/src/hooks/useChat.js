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
        throw new Error('Error al obtener mensajes del chat');
      }
      return response.json();
    },
    refetchInterval: 5000, // Refrescar cada 5 segundos
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
    refetchInterval: 5000,
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
        body: JSON.stringify({ message }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al enviar mensaje privado');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privateChat', userId] });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message) => {
      const response = await fetch(`${API_BASE}/chat/global`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ message }),
      });
      if (!response.ok) {
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