import React from "react";
import { useNavigate } from "react-router-dom";
import FotoPerfil from "../content/FotoPerfil";
import authService from "../../services/authService";

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

  const isOwner = authUser?.id && paginaUser?.usuario?.id && String(authUser.id) === String(paginaUser.usuario.id);

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
            // Actualizar el usuario en el servicio
            const currentUser = authService.getCurrentUser();
            const newUser = typeof updater === 'function' ? updater(currentUser) : updater;
            authService.setStoredUser(newUser);
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
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
                    >
                      {displayName}
                    </h2>
                    {isOwner && (
                      <button
                        onClick={() => {
                          setNewUsername(paginaUser?.usuario?.username || "");
                          setEditMode(true);
                        }}
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "#1976d2",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px"
                        }}
                      >
                        Editar
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

export default UserHeader;