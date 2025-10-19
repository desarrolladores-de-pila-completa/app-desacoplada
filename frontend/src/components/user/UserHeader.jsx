import React from "react";
import { useNavigate } from "react-router-dom";
import FotoPerfil from "../FotoPerfil";

function UserHeader({
  authUser,
  paginaUser,
  newUsername,
  setNewUsername,
  editMode,
  setEditMode,
  handleUsernameBlur,
  inputRef
}) {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 32,
      padding: '24px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '16px',
      color: 'white',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <FotoPerfil
          user={authUser}
          setUser={(updater) => {
            // Actualizar el usuario en el authStore usando Zustand set
            const { useAuthStore } = require("../../stores/authStore");
            useAuthStore.setState(prevState => ({
              user: typeof updater === 'function' ? updater(prevState.user) : updater,
              isAuthenticated: true
            }));
            // También actualizar localStorage para mantener consistencia
            const newUser = useAuthStore.getState().user;
            if (newUser) {
              localStorage.setItem('authUser', JSON.stringify(newUser));
            }
          }}
          editable={authUser?.id === paginaUser?.usuario?.id}
          authUserId={authUser?.id}
          id={paginaUser?.usuario?.id || paginaUser?.usuario?.username}
          fotoPerfil={paginaUser?.usuario?.foto_perfil}
        />
        <div>
          {(() => {
            const isOwner = authUser?.id && paginaUser?.usuario?.id && String(authUser.id) === String(paginaUser.usuario.id);

            // Si el usuario borra el nombre, mostrar campo vacío (no "usuario")
            // Prioridad: display_name > nombre editado > datos de página > email > texto ayuda
            let displayName = paginaUser?.usuario?.display_name || newUsername;
            if (!displayName) displayName = "Haz click aquí para poner tu nombre";

            return (
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                {isOwner && editMode ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    onBlur={handleUsernameBlur}
                    style={{
                      fontSize: "2rem",
                      textAlign: "center",
                      border: "2px solid #1976d2",
                      borderRadius: 8,
                      padding: "4px 12px",
                      width: "60%"
                    }}
                  />
                ) : (
                  <h2
                    style={{
                      cursor: isOwner ? "pointer" : "default",
                      border: isOwner ? "2px solid #1976d2" : "none",
                      borderRadius: isOwner ? 8 : 0,
                      padding: isOwner ? "4px 12px" : "0",
                      display: "inline-block",
                      outline: "none",
                      textAlign: "center"
                    }}
                    onClick={() => {
                      if (isOwner) {
                        // Al entrar en modo edición, inicializar el input con el nombre actual si está vacío
                        setNewUsername(paginaUser?.usuario?.username || "");
                        setEditMode(true);
                      }
                    }}
                  >
                    {displayName}
                  </h2>
                )}
              </div>
            );
          })()}
        </div>
      </div>
      {/* Botón de prueba para debugging - SOLO PARA DESARROLLO */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={() => {
            console.log('🧪 [TEST] Creando página de prueba con contenido HTML...');
            const testHtml = `
              <h2>Título de Prueba</h2>
              <p>Este es un párrafo de prueba con <strong>texto en negrita</strong> y <em>cursiva</em>.</p>
              <ul>
                <li>Elemento de lista 1</li>
                <li>Elemento de lista 2</li>
                <li>Elemento de lista 3</li>
              </ul>
              <div style="background: #f0f0f0; padding: 10px; margin: 10px 0; border-radius: 4px;">
                <p>Contenido con estilos CSS inline</p>
              </div>
              <p>Más contenido después del div.</p>
            `;

            // Simular datos de prueba
            const testData = {
              titulo: 'Página de Prueba HTML',
              contenido: testHtml,
              created_at: new Date().toISOString()
            };

            console.log('📝 [TEST] Datos de prueba:', {
              titulo: testData.titulo,
              contenidoLength: testData.contenido.length,
              hasHtmlTags: /<\/?[a-z][\s\S]*>/i.test(testData.contenido),
              preview: testData.contenido.substring(0, 200)
            });
          }}
          style={{
            background: 'rgba(255,255,255,0.2)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '12px',
            backdropFilter: 'blur(10px)'
          }}
        >
          🧪 Test HTML
        </button>
      )}
    </div>
  );
}

export default UserHeader;