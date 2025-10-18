import { useEffect, useState, useCallback } from "react";
import { API_BASE } from "../config/api";

export default function useAuthUser() {
  const [authUser, setAuthUser] = useState(null);
  const [authUserId, setAuthUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExtended, setSessionExtended] = useState(false);

  // Función para extender sesión automáticamente
  const extendSession = useCallback(async () => {
    try {
      console.log('🔄 Extendiendo sesión automáticamente...');
      const response = await fetch(`${API_BASE}/auth/extend-session`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Sesión extendida exitosamente:', data);

        // Verificar si la sesión fue extendida según headers
        const sessionExtended = response.headers.get('X-Session-Extended') === 'true';
        const tokenRefreshed = response.headers.get('X-Token-Refreshed') === 'true';

        if (sessionExtended || tokenRefreshed) {
          setSessionExtended(true);
          console.log('🎯 Sesión extendida automáticamente');

          // Recargar datos del usuario después de extensión
          await fetchAuthUser();
        }

        return true;
      } else {
        console.log('❌ Error al extender sesión:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Error al extender sesión:', error);
      return false;
    }
  }, []);

  // Función mejorada para obtener datos del usuario
  const fetchAuthUser = useCallback(async () => {
    try {
      console.log('=== DEBUG useAuthUser (Solo /:username) ===');
      console.log('API_BASE:', API_BASE);

      // SOLO hacer petición a /:username - SIN FALLBACK A /me

      // Intentar obtener username de diferentes fuentes
      let currentUsername = null;

      // Fuente 1: Intentar obtener de localStorage (si se guardó previamente)
      const savedUser = localStorage.getItem('authUser');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          currentUsername = parsedUser.username;
          console.log('✅ Username obtenido de localStorage:', currentUsername);
        } catch (e) {
          console.log('❌ Error al parsear usuario de localStorage:', e);
        }
      }

      // Fuente 2: Si no tenemos username, intentar obtenerlo del token JWT
      if (!currentUsername) {
        console.log('🔍 Username no encontrado en localStorage, intentando obtener del token...');
        const token = document.cookie.split('token=')[1]?.split(';')[0];
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUsername = payload.username; // Si el token incluye username
            console.log('✅ Username obtenido del token:', currentUsername);
          } catch (e) {
            console.log('❌ Error al decodificar token:', e);
          }
        }
      }

      if (!currentUsername) {
        console.log('❌ No se pudo obtener username - no se hará petición a /:username');
        console.log('💡 Posibles soluciones:');
        console.log('   - Asegúrate de estar logueado');
        console.log('   - Verifica que el token JWT contenga el username');
        console.log('   - El usuario debe existir en la base de datos');
        setAuthUser(null);
        setAuthUserId(null);
        setSessionExtended(false);
        return;
      }

      const usernameUrl = `${API_BASE}/auth/${currentUsername}`;
      console.log('🚀 Haciendo petición ÚNICAMENTE a /:username:', usernameUrl);

      const res = await fetch(usernameUrl, { credentials: "include" });
      console.log('📡 Respuesta recibida:', {
        status: res.status,
        statusText: res.statusText,
        url: res.url
      });

      if (res.ok) {
        const data = await res.json();
        console.log('✅ Datos de usuario recibidos exitosamente:', data);
        console.log('Estado antes de actualizar:', { authUser, authUserId });
        setAuthUser(data);
        setAuthUserId(data?.id);
        setSessionExtended(false); // Resetear flag de extensión
        console.log('Estado después de actualizar:', { authUser: data, authUserId: data?.id });

        // Guardar en localStorage para futuras peticiones
        localStorage.setItem('authUser', JSON.stringify(data));
      } else if (res.status === 401) {
        console.log('❌ Error 401 - No autenticado');
        console.log('💡 El token podría estar expirado o ser inválido');

        // Intentar extender sesión automáticamente antes de hacer logout
        const extended = await extendSession();
        if (!extended) {
          setAuthUser(null);
          setAuthUserId(null);
          setSessionExtended(false);
          localStorage.removeItem('authUser');
        }
      } else if (res.status === 404) {
        console.log('❌ Error 404 - Usuario no encontrado con username:', currentUsername);
        console.log('💡 Posibles causas:');
        console.log('   - El username no existe en la base de datos');
        console.log('   - El username en el token no coincide con el de la BD');
        console.log('   - NO SE INTENTARÁ CON /me - petición eliminada completamente');
        setAuthUser(null);
        setAuthUserId(null);
        setSessionExtended(false);
        localStorage.removeItem('authUser');
      } else {
        console.log('❌ Error inesperado:', res.status, res.statusText);
        console.log('URL que falló:', res.url);
        console.log('💡 Revisa la configuración del servidor o la ruta /:username');
      }
    } catch (error) {
      console.error('❌ Error de red o parsing:', error);
      console.error('Tipo de error:', error.constructor.name);
      console.error('Mensaje de error:', error.message);
      console.log('💡 Verifica la conexión a internet y la configuración del servidor');
      setAuthUser(null);
      setAuthUserId(null);
      setSessionExtended(false);
    }
  }, [extendSession]);

  useEffect(() => {
    fetchAuthUser();
  }, [fetchAuthUser]);

  return {
    authUser,
    authUserId,
    loading,
    sessionExtended,
    extendSession,
    refreshAuth: fetchAuthUser
  };
}
