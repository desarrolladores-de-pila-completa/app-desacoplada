import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import ContentRenderer from "./ContentRenderer";
import useAuthStore from "../stores/authStore";
import { useUserPage } from "../hooks/useFeed";
import { API_BASE } from "../config/api";
import UserHeader from "./user/UserHeader";
import UserData from "./user/UserData";
import UserContent from "./user/UserContent";
import UserGallery from "./user/UserGallery";
import UserComments from "./user/UserComments";
import UserActions from "./user/UserActions";
import UserStates from "./user/UserStates";

function UserPage() {
  const params = useParams();
  const { user: authUser, isAuthenticated } = useAuthStore();
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [userData, setUserData] = useState(null);
  const [newUsername, setNewUsername] = useState(params.username || paginaUser?.usuario?.username || "");
  const [editMode, setEditMode] = useState(false);

  // Determinar el path para la API basado en los parámetros de la ruta
  let path;
  if (params.publicacionId && params.publicacionId.match(/^\d+$/)) {
    // Si hay publicacionId numérico, es una publicación específica
    path = `${params.username}/publicacion/${params.publicacionId}`;
  } else if (params.username) {
    // Sin parámetros adicionales: mostrar página completa del usuario
    path = `${params.username}`;
  } else {
    path = '';
  }

  // Solo log cuando cambian parámetros importantes para reducir verbosidad
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [UserPage] Path API:', path);
  }

  // Usar React Query para obtener datos
  const { data: paginaUser, isLoading: isLoadingPage, error: pageError } = useUserPage(path);

  // Usar datos del hook principal para evitar duplicación
  useEffect(() => {
    if (paginaUser?.usuario) {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [UserPage] Usuario cargado:', paginaUser.usuario.username);
      }
      setUserData(paginaUser.usuario);
    } else {
      setUserData(null);
    }
  }, [paginaUser?.usuario]);

  // Los comentarios ahora vienen incluidos en paginaUser del endpoint unificado
  const comentarios = paginaUser?.comentarios || [];

  // Sincronizar el nombre de usuario cuando cambian las props
  useEffect(() => {
    setNewUsername(params.username || paginaUser?.usuario?.username || "");
  }, [params.username, paginaUser?.usuario?.username]);

  // Función para refrescar los datos del usuario (evita duplicación)
  const refreshUserData = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 [UserPage] Refrescando datos del usuario...');
    }
    setUserData(null);

    if (paginaUser?.usuario) {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [UserPage] Datos refrescados para:', paginaUser.usuario.username);
      }
      setUserData(paginaUser.usuario);
    } else {
      setUserData(null);
    }
  };

  // Listener para actualizaciones de foto de perfil
  useEffect(() => {
    const handleFotoPerfilUpdate = (event) => {
      const { userId, previewUrl, timestamp, source, forceUpdate } = event.detail;

      if (process.env.NODE_ENV === 'development') {
        console.log('📸 [UserPage] Foto de perfil actualizada recibida:', {
          userId,
          currentUserId: paginaUser?.usuario?.id,
          source,
          timestamp,
          forceUpdate,
          hasPreviewUrl: !!previewUrl
        });
      }

      // Solo actualizar si es para el usuario actual
      if (userId && paginaUser?.usuario?.id && String(userId) === String(paginaUser.usuario.id)) {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [UserPage] Actualizando foto de perfil del usuario actual');
        }

        // Forzar refresco inmediato de los datos del usuario desde el servidor
        if (forceUpdate) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 [UserPage] Forzando refresco de datos del usuario');
          }

          // Limpiar datos actuales para forzar recarga
          setUserData(null);

          // Pequeño delay para asegurar que el componente FotoPerfil se actualice primero
          setTimeout(() => {
            if (paginaUser?.usuario) {
              setUserData(paginaUser.usuario);
            }
          }, 200);
        } else {
          // Actualización normal sin forzar refresco
          setUserData(prevData => ({
            ...prevData,
            foto_perfil: previewUrl
          }));
        }

        // Actualizar el estado global del usuario autenticado si es el mismo usuario
        if (authUser?.id === paginaUser.usuario.id) {
          useAuthStore.setState(prevState => ({
            user: {
              ...prevState.user,
              fotoPerfil: previewUrl
            },
            isAuthenticated: true
          }));

          // También actualizar localStorage para mantener consistencia
          const newUser = useAuthStore.getState().user;
          if (newUser) {
            localStorage.setItem('authUser', JSON.stringify(newUser));
          }
        }

        // Mostrar notificación de actualización exitosa
        if (process.env.NODE_ENV === 'development') {
          console.log('🎉 [UserPage] Foto de perfil actualizada exitosamente');
        }
      }
    };

    // Agregar listener para el evento personalizado
    window.addEventListener('fotoPerfilActualizada', handleFotoPerfilUpdate);

    // Cleanup
    return () => {
      window.removeEventListener('fotoPerfilActualizada', handleFotoPerfilUpdate);
    };
  }, [paginaUser?.usuario?.id, authUser?.id]);

  // Función para manejar el blur del input de edición de username
  const handleUsernameBlur = async (e) => {
    let value = "";
    if (e.target.value !== undefined) {
      value = e.target.value.trim(); // input
    } else if (e.target.innerText !== undefined) {
      value = e.target.innerText.trim(); // h2
    }
    if (!value || value === paginaUser?.usuario?.username) {
      setNewUsername(paginaUser?.usuario?.username || "");
      setEditMode(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/csrf-token`, { credentials: "include" });
      const data = await res.json();
      const csrfToken = data.csrfToken;
      const resp = await fetch(`http://localhost:3000/api/paginas/${paginaUser?.pagina?.id}/usuario`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        body: JSON.stringify({ username: value }),
        credentials: "include"
      });
      if (resp.ok) {
        setNewUsername(value);
        setEditMode(false);
        alert("Nombre de usuario actualizado correctamente");
        // Navegar por el nuevo username sanitizado
        const sanitized = String(value || '').replace(/\s+/g, '-');
        if (sanitized.trim()) {
          navigate(`/pagina/${sanitized}`);
        }
      } else {
        setNewUsername(paginaUser?.usuario?.username || "");
        setEditMode(false);
        alert("Error al actualizar el nombre de usuario");
      }
    } catch (err) {
      setNewUsername(paginaUser?.usuario?.username || "");
      setEditMode(false);
      alert("Error de conexión al actualizar el nombre");
    }
  };

  // Referencia para el input de edición
  const inputRef = React.useRef(null);

  // Efecto para enfocar el input cuando entra en modo edición
  useEffect(() => {
    if (editMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editMode]);

  // Borrado de usuario
  const handleDeleteUser = async () => {
    if (!paginaUser?.usuario?.id || authUser?.id !== paginaUser.usuario.id) return;
    if (!window.confirm("¿Seguro que quieres borrar tu perfil y todo tu rastro? Esta acción es irreversible.")) return;

    try {
      const csrfRes = await fetch(`${API_BASE}/csrf-token`, { credentials: 'include' });
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.csrfToken;

      const res = await fetch(`${API_BASE}/auth/user/${paginaUser.usuario.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken
        }
      });

      if (res.ok) {
        alert("Tu perfil y todos tus datos han sido eliminados.");
        window.location.href = "/";
      } else {
        alert("Error al borrar el usuario.");
      }
    } catch {
      alert("Error de conexión al borrar el usuario.");
    }
  };

  useEffect(() => {
    function handleResize() {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener('resize', handleResize);
    document.body.style.overflowX = 'hidden';
    document.documentElement.style.overflowX = 'hidden';
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.style.overflowX = '';
      document.documentElement.style.overflowX = '';
    };
  }, []);

  // Usar componente de estados para manejar loading, error y casos especiales
  const statesResult = UserStates({ isLoadingPage, pageError, paginaUser, params });
  if (statesResult) {
    return statesResult;
  }

  // Renderizar contenido HTML mejorado con el nuevo sistema
  const renderContent = (content) => {
    if (!content) return null;

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [UserPage] Renderizando contenido, longitud:', content.length);
    }

    return (
      <ContentRenderer
        content={content}
        className="user-page-content"
        style={{
          lineHeight: '1.6',
          fontSize: '16px',
          color: '#333'
        }}
        options={{
          sanitize: true,
          processEntities: true,
          enhanceContent: true,
          allowHTML: true
        }}
        showDebugInfo={process.env.NODE_ENV === 'development'}
        onContentProcessed={(result) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ [UserPage] Contenido procesado:', result.analysis.type);
          }
        }}
        onError={(error) => {
          console.error('❌ [UserPage] Error procesando contenido:', error.message);
        }}
      />
    );
  };
  return (
  <>
    <Navbar />
    <div style={{    maxWidth: '100vw', minHeight: windowSize.height, margin: 0, background: '#fff', padding: 'clamp(8px, 4vw, 24px)', borderRadius: 0, boxShadow: 'none', position: 'relative', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', marginTop: '80px' }}>
      <div style={{  maxWidth: 900, margin: '0 auto', boxSizing: 'border-box', padding: '0 5vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <UserHeader
          authUser={authUser}
          paginaUser={paginaUser}
          newUsername={newUsername}
          setNewUsername={setNewUsername}
          editMode={editMode}
          setEditMode={setEditMode}
          handleUsernameBlur={handleUsernameBlur}
          inputRef={inputRef}
        />

        {/* Mostrar datos obtenidos de /:username */}
        <UserData
          userData={userData}
          params={params}
          refreshUserData={refreshUserData}
        />

        {/* Content and Gallery Section */}
        <div style={{
          width: '100%',
          maxWidth: '100%',
          marginBottom: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          <UserContent paginaUser={paginaUser} renderContent={renderContent} />
          <UserGallery paginaUser={paginaUser} authUser={authUser} />
        </div>
        {/* Comments Section */}
        <UserComments
          paginaUser={paginaUser}
          comentarios={comentarios}
          isAuthenticated={isAuthenticated}
        />
      </div>
        {/* Delete User Section */}
        <UserActions
          authUser={authUser}
          paginaUser={paginaUser}
          handleDeleteUser={handleDeleteUser}
        />
    </div>
  </>
  );
}

export default UserPage;