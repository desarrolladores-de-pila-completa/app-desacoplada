import React, { useState, useEffect } from "react";
import "./App.css";

const API_URL = "http://localhost:3000/api";

function App() {
  // Estado para el popup de usuario
  const [showPopup, setShowPopup] = useState(false);
  const [popupOpacity, setPopupOpacity] = useState(0);
  // Estado para formularios
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [logEmail, setLogEmail] = useState("");
  const [logPass, setLogPass] = useState("");
  // Estado para output
  const [outputMsg, setOutputMsg] = useState("");
  const [outputType, setOutputType] = useState("info");
  // Estado para feed
  const [feed, setFeed] = useState([]);
  const [showFeed, setShowFeed] = useState(true);
  // Estado para minimizar output
  const [outputMinimized, setOutputMinimized] = useState(false);
  // Estado para modal de edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTipo, setEditTipo] = useState("");
  const [editContenido, setEditContenido] = useState("");

  // Output
  const showOutput = React.useCallback((message, type = "info") => {
    if (Array.isArray(message)) {
      setOutputMsg(message.map((m) => <div key={m}>{m}</div>));
    } else {
      setOutputMsg(message);
    }
    setOutputType(type);
  }, []);

  // Funciones API
  const getCsrfToken = React.useCallback(async () => {
    const res = await fetch(`${API_URL}/csrf-token`, { credentials: "include" });
    const data = await res.json();
    return data.csrfToken;
  }, []);

  const apiCall = React.useCallback(async (url, method = "GET", options = {}) => {
    const csrfToken = await getCsrfToken();
    const fetchOptions = {
      method,
      headers: {
        "X-CSRF-Token": csrfToken,
        ...(method !== "GET" ? { "Content-Type": "application/json" } : {}),
      },
      credentials: "include",
    };
    if (options.body) fetchOptions.body = JSON.stringify(options.body);
    try {
      const res = await fetch(url, fetchOptions);
      const data = await res.json();
      if (res.ok) {
        if (options.successMsg)
          showOutput(typeof options.successMsg === "function" ? options.successMsg(data) : options.successMsg, "success");
        if (options.infoMsg && (!data || (Array.isArray(data) && data.length === 0)))
          showOutput(options.infoMsg, "info");
        return { success: true, data };
      } else {
        showOutput(data.message || data.error || options.errorMsg || "Error", "error");
        return { success: false, data };
      }
    } catch {
      showOutput(options.errorMsg || "Error de conexión", "error");
      return { success: false };
    }
  }, [getCsrfToken, showOutput]);

  const register = async (email, password) => {
    return await apiCall(`${API_URL}/auth/register`, "POST", {
      body: { email, password },
      successMsg: (d) => d.message || "Registro exitoso",
      errorMsg: "Error en el registro",
    });
  };

  const login = async (email, password) => {
    const loginResult = await apiCall(`${API_URL}/auth/login`, "POST", {
      body: { email, password },
      successMsg: (d) => d.message || "Login exitoso",
      errorMsg: "Error en el login",
    });
    return { ...loginResult, authenticated: !!loginResult.success };
  };

  // Feed
  const cargarFeed = React.useCallback(async () => {
    showOutput("Cargando feed...", "info");
    try {
      const res = await apiCall(`${API_URL}/paginas`, "GET", {
        successMsg: "Feed cargado correctamente.",
        errorMsg: "Error al cargar el feed",
      });
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setFeed(res.data);
        showOutput(`Feed cargado: ${res.data.length}`, "success");
      } else {
        setFeed([]);
        showOutput("No hay textos completos disponibles en el feed.", "info");
      }
    } catch {
      showOutput("Error de conexión", "error");
    }
  }, [apiCall, showOutput]);

  // Popup
  const openPopup = () => {
    setShowPopup(true);
    setTimeout(() => setPopupOpacity(1), 10);
  };
  const closePopup = () => {
    setPopupOpacity(0);
    setTimeout(() => setShowPopup(false), 200);
  };

  // Output minimize
  const toggleOutputMinimize = () => {
    setOutputMinimized((min) => !min);
  };

  // Navegación
  const goToFeed = (e) => {
    e.preventDefault();
    setShowFeed(true);
    cargarFeed();
  };

  // Efectos
  useEffect(() => {
    cargarFeed();
    // Escape para cerrar popup
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && showPopup) closePopup();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPopup, cargarFeed]);

  // Render
  return (
    <>
      <nav>
        <a href="/feed" id="nav-feed" onClick={goToFeed}>Feed</a>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
          <span id="user-icon-container" style={{ cursor: "pointer" }} onClick={openPopup}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="28" height="28">
              <circle cx="12" cy="8" r="4" strokeWidth="2" />
              <path strokeWidth="2" d="M4 20c0-3.314 3.134-6 7-6s7 2.686 7 6" />
            </svg>
          </span>
        </div>
        {/* Popup modal para registro y login */}
        {showPopup && (
          <>
            <div
              id="user-popup-bg"
              style={{ display: "block", position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.25)", zIndex: 999 }}
              onClick={closePopup}
            ></div>
            <div
              id="user-popup"
              style={{ display: "block", position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#fff", color: "#222", boxShadow: "0 4px 24px #0004", borderRadius: "12px", minWidth: "280px", zIndex: 1000, padding: "32px 24px", transition: "opacity 0.2s", opacity: popupOpacity }}
            >
              <div id="dropdown-register" style={{ marginBottom: "24px" }}>
                <form
                  id="registerForm"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (regEmail && regPass) {
                      await register(regEmail, regPass);
                      setRegEmail("");
                      setRegPass("");
                    } else {
                      showOutput("Error en el registro", "error");
                    }
                  }}
                >
                  <h3 style={{ marginTop: 0 }}>Registro</h3>
                  <label>Email:
                    <input type="email" id="regEmail" required value={regEmail} onChange={e => setRegEmail(e.target.value)} />
                  </label>
                  <label>Contraseña:
                    <input type="password" id="regPass" required value={regPass} onChange={e => setRegPass(e.target.value)} />
                  </label>
                  <button type="submit">Registrar</button>
                </form>
              </div>
              <div id="dropdown-login">
                <form
                  id="loginForm"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (logEmail && logPass) {
                      await login(logEmail, logPass);
                      setLogEmail("");
                      setLogPass("");
                    } else {
                      showOutput("Error en el login", "error");
                    }
                  }}
                >
                  <h3 style={{ marginTop: 0 }}>Login</h3>
                  <label>Email:
                    <input type="email" id="logEmail" required value={logEmail} onChange={e => setLogEmail(e.target.value)} />
                  </label>
                  <label>Contraseña:
                    <input type="password" id="logPass" required value={logPass} onChange={e => setLogPass(e.target.value)} />
                  </label>
                  <button type="submit">Iniciar Sesión</button>
                </form>
              </div>
            </div>
          </>
        )}
      </nav>
      <div id="section-paginas" style={{ display: "none", marginBottom: "32px" }}>
        {/* Sección /paginas en blanco */}
      </div>
      {showFeed && (
        <div id="section-feed" style={{ marginBottom: "32px" }}>
          <h3>Feed público</h3>
          <div id="listaFeed">
            {feed.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User ID</th>
                    <th>Título</th>
                    <th>Contenido</th>
                    <th>Creado en</th>
                    <th>Elementos</th>
                  </tr>
                </thead>
                <tbody>
                  {feed.map((row) => (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>{row.user_id}</td>
                      <td>{row.titulo}</td>
                      <td>{row.contenido}</td>
                      <td>{row.creado_en}</td>
                      <td>{row.elementos ? JSON.stringify(row.elementos) : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div>No hay textos completos disponibles en el feed.</div>
            )}
          </div>
        </div>
      )}
      <div id="output-menu-container" style={{ position: "fixed", left: 0, bottom: 0, width: "100vw", zIndex: 1200, pointerEvents: "none" }}>
        <div id="output-menu" style={{ width: "100vw", maxWidth: "480px", margin: "0 auto", background: "#fff", color: "#222", boxShadow: "0 -4px 24px #0004", borderRadius: "16px 16px 0 0", padding: "24px 16px 32px 16px", position: "relative", bottom: outputMinimized ? "-120px" : 0, opacity: outputMinimized ? 0.5 : 1, transition: "bottom 0.3s, opacity 0.3s", pointerEvents: "auto" }}>
          <button id="output-min-btn" style={{ position: "absolute", right: "12px", top: "16px", background: "transparent", color: "#222", border: "none", borderRadius: "50%", padding: 0, width: "16px", height: "16px", fontSize: "1em", cursor: "pointer", pointerEvents: "auto", boxShadow: "none", display: outputMinimized ? "none" : "flex", alignItems: "center", justifyContent: "center" }} onClick={toggleOutputMinimize}>
            <span id="output-arrow-hide" style={{ display: "inline", fontSize: "16px", color: "#222", width: "16px", height: "16px", lineHeight: "16px", textAlign: "center" }}>&#x25BC;</span>
          </button>
          <button id="output-restore-btn" style={{ position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: 0, zIndex: 1300, background: "#eee", color: "#222", border: "none", borderRadius: "16px 16px 0 0", padding: "6px 18px", fontSize: "1.7em", cursor: "pointer", boxShadow: "0 -2px 8px #0002", display: outputMinimized ? "block" : "none" }} onClick={toggleOutputMinimize}>
            <span id="output-arrow-show" style={{ fontSize: "1em", color: "#222" }}>&#x25B2;</span>
          </button>
          <div id="output-area" style={{ minHeight: "32px", fontSize: "1em", color: outputType === "success" ? "green" : outputType === "error" ? "red" : "orange", marginTop: "8px" }}>
            {outputMsg}
          </div>
        </div>
      </div>
      <div id="section-ver-pagina" style={{ display: "none", marginBottom: "32px" }}>
        <div id="paginaPublica"></div>
      </div>
      {/* Modal edición de elemento adaptado a React */}
      {showEditModal && (
        <div id="modal-editar" style={{ display: "flex", position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "24px", borderRadius: "8px", minWidth: "280px", boxShadow: "0 2px 8px #0002" }}>
            <h3>Editar elemento</h3>
            <form
              id="formEditarElemento"
              onSubmit={e => {
                e.preventDefault();
                // Aquí puedes agregar la lógica para guardar el elemento editado
                showOutput(`Elemento editado: ${editTipo}, ${editContenido}`, "success");
                setShowEditModal(false);
                setEditTipo("");
                setEditContenido("");
              }}
            >
              <label>Tipo:
                <input type="text" id="editTipo" required value={editTipo} onChange={e => setEditTipo(e.target.value)} />
              </label>
              <label>Contenido:
                <input type="text" id="editContenido" required value={editContenido} onChange={e => setEditContenido(e.target.value)} />
              </label>
              <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                <button type="submit">Guardar</button>
                <button type="button" id="cancelarEditar" onClick={() => { setShowEditModal(false); setEditTipo(""); setEditContenido(""); }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
