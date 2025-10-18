import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import ImageGrid from "./ImageGrid";
import FotoPerfil from "./FotoPerfil";
import ComentariosList from "./ComentariosList";
import AgregarComentario from "./AgregarComentario";
import ContentRenderer from "./ContentRenderer";
import useAuthStore from "../stores/authStore";
import { useUserPage } from "../hooks/useFeed";
import { API_BASE } from "../config/api";

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

  console.log('🔍 [UserPage] Parámetros de ruta:', params);
  console.log('🔍 [UserPage] Path determinado para API:', path);

  // Usar React Query para obtener datos
  const { data: paginaUser, isLoading: isLoadingPage, error: pageError } = useUserPage(path);

  // Usar datos del hook principal para evitar duplicación
  useEffect(() => {
    if (paginaUser?.usuario) {
      console.log('✅ [UserPage] Datos del usuario obtenidos del hook principal:', paginaUser.usuario);
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
    console.log('🔄 [UserPage] Refrescando datos del usuario...');
    setUserData(null);

    if (paginaUser?.usuario) {
      console.log('✅ [UserPage] Datos refrescados exitosamente:', paginaUser.usuario);
      setUserData(paginaUser.usuario);
    } else {
      setUserData(null);
    }
  };

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
      const res = await fetch("/api/csrf-token", { credentials: "include" });
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
      const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' });
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.csrfToken;

      const res = await fetch(`/api/auth/user/${paginaUser.usuario.id}`, {
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

  if (isLoadingPage) {
    return (
      <div style={{ maxWidth: 600, margin: "40px auto", textAlign: "center" }}>
        <p>Cargando...</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div style={{ maxWidth: 600, margin: "40px auto", background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 4px 24px #0002", textAlign: "center" }}>
        <h2>Error al cargar</h2>
        <p>{pageError.message}</p>
      </div>
    );
  }

  // Si es lista de páginas públicas (estructura antigua - ahora viene como { paginas: [...] })
  if (paginaUser && Array.isArray(paginaUser.paginas)) {
    const pages = paginaUser.paginas;
    return (
      <div style={{ maxWidth: 900, margin: "40px auto", background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 4px 24px #0002" }}>
        <h2>Páginas públicas de {params.username}</h2>
        {pages.length === 0 ? (
          <div style={{ textAlign: "center", color: "#666", padding: "40px 0" }}>
            <p>Este usuario no tiene páginas públicas disponibles.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "20px" }}>
            {pages.map((page) => (
              <div key={page.id} style={{
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                padding: "20px",
                background: "#fafafa"
              }}>
                <h3 style={{ marginTop: 0, color: "#333" }}>{page.titulo || "Página sin título"}</h3>
                {page.contenido && (
                  <div style={{
                    color: "#666",
                    lineHeight: "1.5",
                    marginBottom: "16px",
                    fontSize: "14px"
                  }}>
                    {(() => {
                      const plainText = page.contenido.replace(/<[^>]*>/g, '');
                      return plainText.length > 150 ? `${plainText.substring(0, 150)}...` : plainText;
                    })()}
                  </div>
                )}
                <div style={{ marginTop: "16px" }}>
                  <Link
                    to={`/${params.username}/publicacion/${String(page.id)}`}
                    style={{
                      background: "#007bff",
                      color: "white",
                      padding: "8px 16px",
                      textDecoration: "none",
                      borderRadius: "4px",
                      fontSize: "14px",
                      display: "inline-block"
                    }}
                  >
                    Ver página completa
                  </Link>
                </div>
                <p style={{
                  color: '#888',
                  fontSize: '0.8em',
                  marginTop: '12px',
                  marginBottom: 0
                }}>
                  {page.display_name && `Por: ${page.display_name} • `}
                  Creada el {(() => {
                    const dateValue = page.created_at || page.fecha_creacion;
                    if (!dateValue) return 'Fecha no disponible';
                    const date = new Date(dateValue);
                    return isNaN(date.getTime()) ? 'Fecha no disponible' : date.toLocaleDateString();
                  })()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Si es una publicación específica (estructura nueva - { publicacion: {...} })
  if (paginaUser?.publicacion?.titulo && paginaUser?.publicacion?.contenido) {
    const publicacion = paginaUser.publicacion;
    return (
      <div style={{ maxWidth: 900, margin: "40px auto", background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 4px 24px #0002" }}>
        <h2>{publicacion.titulo}</h2>
        <div style={{ marginBottom: '20px' }}>
          {(() => {
            console.log('📦 [DEBUG] Datos de publicación recibidos del backend:', {
              titulo: publicacion.titulo,
              contenidoLength: publicacion.contenido?.length,
              contenidoPreview: publicacion.contenido?.substring(0, 300),
              id: publicacion.id
            });
            return renderContent(publicacion.contenido);
          })()}
        </div>
        <p style={{ color: '#888', fontSize: '0.9em', borderTop: '1px solid #e9ecef', paddingTop: '8px' }}>
          Publicado el {new Date(publicacion.created_at).toLocaleString()}
        </p>
      </div>
    );
  }

  // Si no hay datos del usuario
  if (!paginaUser) {
    return (
      <div style={{ maxWidth: 600, margin: "40px auto", background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 4px 24px #0002", textAlign: "center" }}>
        <h2>Página no encontrada</h2>
        <p>Esta página no existe.</p>
      </div>
    );
  }

  // Renderizar contenido HTML mejorado con el nuevo sistema
  const renderContent = (content) => {
    if (!content) return null;

    console.log('🔍 [UserPage] Renderizando contenido con nuevo sistema:', {
      length: content.length,
      preview: content.substring(0, 200)
    });

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
          console.log('✅ [UserPage] Contenido procesado exitosamente:', {
            type: result.analysis.type,
            needsHTML: result.needsHTML,
            isSafe: result.isSafe,
            elementsCount: result.analysis.elements.length
          });
        }}
        onError={(error) => {
          console.error('❌ [UserPage] Error procesando contenido:', error);
        }}
      />
    );
  };
  return (
  <>
    <Navbar />
    <div style={{    maxWidth: '100vw', minHeight: windowSize.height, margin: 0, background: '#fff', padding: 'clamp(8px, 4vw, 24px)', borderRadius: 0, boxShadow: 'none', position: 'relative', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', marginTop: '80px' }}>
      <div style={{  maxWidth: 900, margin: '0 auto', boxSizing: 'border-box', padding: '0 5vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {/* Header Section - Foto de perfil y nombre de usuario */}
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
              setUser={() => {}}
              editable={authUser?.id === paginaUser?.usuario?.id}
              authUserId={authUser?.id}
              id={paginaUser?.usuario?.id || params.username}
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

        {/* Mostrar datos obtenidos de /:username */}
        {userData && (
          <div style={{
            width: '100%',
            maxWidth: '100%',
            marginBottom: '32px',
            padding: '24px',
            background: '#e8f5e8',
            borderRadius: '8px',
            border: '1px solid #4caf50'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#2e7d32' }}>
              👤 Datos del Usuario (/:username)
            </h3>
            <div style={{ marginBottom: '16px', lineHeight: '1.6' }}>
              <p><strong>🔹 Username:</strong> <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '3px' }}>{userData.username}</code></p>
              <p><strong>🔹 Display Name:</strong> {userData.display_name || <em style={{ color: '#666' }}>No configurado</em>}</p>
              <p><strong>🔹 Foto de Perfil:</strong> {userData.foto_perfil ? <span style={{ color: '#4caf50' }}>✅ Disponible</span> : <span style={{ color: '#f44336' }}>❌ No disponible</span>}</p>
              <p><strong>🔹 Fuente:</strong> <code style={{ background: '#fff3e0', padding: '2px 6px', borderRadius: '3px', fontSize: '11px' }}>/{params.username}</code></p>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <div style={{ marginTop: '16px', padding: '12px', background: '#fff3e0', borderRadius: '4px', fontSize: '12px' }}>
                <p><strong>📊 Información de Debug:</strong></p>
                <p>URL: <code>{API_BASE}/pagina/{params.username}?action=info</code></p>
                <p>Estado: <span style={{ color: '#4caf50' }}>✅ Funcionando correctamente</span></p>
                <button
                  onClick={refreshUserData}
                  style={{
                    background: '#ff9800',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 12px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    marginTop: '8px'
                  }}
                >
                  🔄 Refrescar Datos
                </button>
              </div>
            )}
          </div>
        )}

        {/* Content and Gallery Section */}
        <div style={{
          width: '100%',
          maxWidth: '100%',
          marginBottom: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {/* Mostrar contenido de la página si existe */}
          {paginaUser?.pagina?.contenido && (
            <div style={{
              padding: '32px',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e9ecef',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                height: '4px',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
              }}></div>

              <h3 style={{
                marginTop: '16px',
                marginBottom: '20px',
                color: '#2c3e50',
                fontSize: '1.5em',
                fontWeight: '600'
              }}>
                📄 {paginaUser?.pagina?.titulo || 'Página'}
              </h3>

              <div style={{
                marginBottom: '24px',
                lineHeight: '1.7',
                fontSize: '16px'
              }}>
                {(() => {
                  console.log('📦 [DEBUG] Datos recibidos del backend:', {
                    titulo: paginaUser?.pagina?.titulo,
                    contenidoLength: paginaUser?.pagina?.contenido?.length,
                    contenidoPreview: paginaUser?.pagina?.contenido?.substring(0, 300),
                    contenidoType: typeof paginaUser?.pagina?.contenido,
                    hasContenido: !!paginaUser?.pagina?.contenido
                  });
                  return renderContent(paginaUser?.pagina?.contenido);
                })()}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '16px',
                borderTop: '1px solid #ecf0f1',
                fontSize: '0.9em',
                color: '#7f8c8d'
              }}>
                <span>📅 Publicado el {new Date(paginaUser?.pagina?.creado_en).toLocaleString()}</span>
                <span>ID: {paginaUser?.pagina?.id}</span>
              </div>
            </div>
          )}

          {/* Galería de imágenes */}
          <div style={{
            padding: '32px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e9ecef',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              height: '4px',
              background: 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)'
            }}></div>

            <h3 style={{
              marginTop: '16px',
              marginBottom: '20px',
              color: '#2c3e50',
              fontSize: '1.3em',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🖼️ Galería de Imágenes
            </h3>

            <div style={{
              width: '100%',
              boxSizing: 'border-box',
              overflowX: 'hidden'
            }}>
              <ImageGrid
                paginaId={paginaUser?.pagina?.id}
                editable={authUser?.id === paginaUser?.usuario?.id}
                images={paginaUser?.galeria}
              />
            </div>
          </div>
        </div>
        {/* Comments Section */}
        <div style={{
          width: '100%',
          maxWidth: '100%',
          padding: '32px',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e9ecef',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '4px',
            background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)'
          }}></div>

          <h3 style={{
            marginTop: '16px',
            marginBottom: '24px',
            color: '#2c3e50',
            fontSize: '1.3em',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            💬 Comentarios
          </h3>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {isAuthenticated ? (
              <div style={{
                padding: '20px',
                background: '#f8f9ff',
                borderRadius: '12px',
                border: '1px solid #e3e8ff'
              }}>
                <AgregarComentario paginaId={paginaUser?.pagina?.id} />
              </div>
            ) : (
              <div style={{
                padding: '20px',
                background: '#fff5f5',
                borderRadius: '12px',
                border: '1px solid #ffe3e3',
                textAlign: 'center',
                color: '#e74c3c'
              }}>
                🔒 Debes <Link to="/login" style={{ color: '#e74c3c', textDecoration: 'underline' }}>iniciar sesión</Link> para agregar un comentario.
              </div>
            )}

            <div style={{
              marginTop: '8px'
            }}>
              <ComentariosList comentarios={comentarios} pageId={paginaUser?.pagina?.id} />
            </div>
          </div>
        </div>
      </div>
        {/* Delete User Section */}
        {authUser?.id === paginaUser?.usuario?.id && (
          <div style={{
            width: '100%',
            maxWidth: '100%',
            padding: '24px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '2px solid #dc3545',
            boxShadow: '0 4px 20px rgba(220, 53, 69, 0.15)',
            position: 'relative',
            overflow: 'hidden',
            marginTop: '32px'
          }}>
            <div style={{
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              height: '4px',
              background: '#dc3545'
            }}></div>

            <h3 style={{
              marginTop: '16px',
              marginBottom: '16px',
              color: '#dc3545',
              fontSize: '1.2em',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ⚠️ Zona de Peligro
            </h3>

            <p style={{
              color: '#6c757d',
              marginBottom: '20px',
              lineHeight: '1.6'
            }}>
              Esta acción eliminará permanentemente tu perfil y todos tus datos asociados. <strong>Esta acción es irreversible.</strong>
            </p>

            <button
              onClick={handleDeleteUser}
              style={{
                background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '16px 32px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(220, 53, 69, 0.3)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(220, 53, 69, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(220, 53, 69, 0.3)';
              }}
            >
              🗑️ Borrar mi perfil y todos mis datos
            </button>
          </div>
        )}
    </div>
  </>
  );
}

export default UserPage;