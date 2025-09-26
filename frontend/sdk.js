// Función global para mostrar secciones SPA
window.showSection = function (route) {
  const sectionFeed = document.getElementById("section-feed");
  if (sectionFeed)
    sectionFeed.style.display = route === "/feed" ? "block" : "none";
};

// Inicializa la lógica de usuario (popup, registro, login)
window.initUserPopup = function () {
  const icon = document.getElementById("user-icon-container");
  const popup = document.getElementById("user-popup");
  const popupBg = document.getElementById("user-popup-bg");
  if (icon && popup && popupBg) {
    icon.addEventListener("click", function (e) {
      e.stopPropagation();
      popup.style.display = "block";
      popupBg.style.display = "block";
      setTimeout(() => {
        popup.style.opacity = "1";
      }, 10);
    });
    popupBg.addEventListener("click", function () {
      popup.style.opacity = "0";
      setTimeout(() => {
        popup.style.display = "none";
        popupBg.style.display = "none";
      }, 200);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && popup.style.display === "block") {
        popup.style.opacity = "0";
        setTimeout(() => {
          popup.style.display = "none";
          popupBg.style.display = "none";
        }, 200);
      }
    });
    const regForm = document.getElementById("registerForm");
    if (regForm) {
      regForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const email = document.getElementById("regEmail").value;
        const password = document.getElementById("regPass").value;
        if (email && password) {
          const result = await window.register(email, password);
          if (result.success) {
            window.showOutput(
              result.data?.message || "Registro exitoso",
              "success"
            );
            regForm.reset();
          } else {
            window.showOutput(
              result.data?.message ||
                result.data?.error ||
                "Error en el registro",
              "error"
            );
          }
        } else {
          window.showOutput("Error en el registro", "error");
        }
      });
    }
    const logForm = document.getElementById("loginForm");
    if (logForm) {
      logForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const email = document.getElementById("logEmail").value;
        const password = document.getElementById("logPass").value;
        if (email && password) {
          const result = await window.login(email, password);
          if (result.success) {
            window.showOutput(
              result.data?.message || "Login exitoso",
              "success"
            );
            logForm.reset();
          } else {
            window.showOutput(
              result.data?.message || result.data?.error || "Error en el login",
              "error"
            );
          }
        } else {
          window.showOutput("Error en el login", "error");
        }
      });
    }
  }
};

window.initFeedNav = function () {
  const navFeed = document.getElementById("nav-feed");
  if (navFeed) {
    navFeed.addEventListener("click", function (e) {
      e.preventDefault();
      window.history.pushState({}, "", "/feed");
      window.showSection("/feed");
      window.cargarFeed();
    });
  }
};

window.showOutput = function (message, type = "info") {
  const output = document.getElementById("output-area");
  if (output) {
    if (Array.isArray(message)) {
      output.innerHTML = message.map((m) => `<div>${m}</div>`).join("");
    } else {
      output.textContent = message;
    }
    output.style.color =
      type === "success" ? "green" : type === "error" ? "red" : "orange";
    output.style.display = "block";
  }
};

window.setupOutputMenuMinimize = function () {
  const outputMenu = document.getElementById("output-menu");
  const outputMinBtn = document.getElementById("output-min-btn");
  const arrowHide = document.getElementById("output-arrow-hide");
  const outputRestoreBtn = document.getElementById("output-restore-btn");
  let outputMinimized = false;
  function toggleOutputMinimize() {
    outputMinimized = !outputMinimized;
    if (outputMinimized) {
      outputMenu.style.bottom = "-120px";
      outputMenu.style.opacity = "0.5";
      arrowHide.style.display = "none";
      outputRestoreBtn.style.display = "block";
    } else {
      outputMenu.style.bottom = "0";
      outputMenu.style.opacity = "1";
      arrowHide.style.display = "inline";
      outputRestoreBtn.style.display = "none";
    }
  }
  outputMinBtn.addEventListener("click", toggleOutputMinimize);
  outputRestoreBtn.addEventListener("click", toggleOutputMinimize);
};

// --- API ---
const API_URL = "http://localhost:3000/api";

window.apiCall = async function (url, method = "GET", options = {}) {
  const csrfToken = await window.getCsrfToken();
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
        window.showOutput(
          typeof options.successMsg === "function"
            ? options.successMsg(data)
            : options.successMsg,
          "success"
        );
      if (
        options.infoMsg &&
        (!data || (Array.isArray(data) && data.length === 0))
      )
        window.showOutput(options.infoMsg, "info");
      return { success: true, data };
    } else {
      window.showOutput(
        data.message || data.error || options.errorMsg || "Error",
        "error"
      );
      return { success: false, data };
    }
  } catch (error) {
    window.showOutput(options.errorMsg || "Error de conexión", "error");
    return { success: false, error };
  }
};

window.getCsrfToken = async function () {
  const res = await fetch("http://localhost:3000/api/csrf-token", {
    credentials: "include",
  });
  const data = await res.json();
  return data.csrfToken;
};

window.register = async function (email, password) {
  return await window.apiCall(`${API_URL}/auth/register`, "POST", {
    body: { email, password },
    successMsg: (d) => d.message || "Registro exitoso",
    errorMsg: "Error en el registro",
  });
};

window.login = async function (email, password) {
  const loginResult = await window.apiCall(`${API_URL}/auth/login`, "POST", {
    body: { email, password },
    successMsg: (d) => d.message || "Login exitoso",
    errorMsg: "Error en el login",
  });
  return { ...loginResult, authenticated: !!loginResult.success };
};

window.cargarFeed = async function () {
  const sectionFeed = document.getElementById("section-feed");
  if (!sectionFeed || sectionFeed.style.display === "none") {
    window.showOutput("Solo disponible en la sección feed.", "info");
    return;
  }
  const lista = document.getElementById("listaFeed");
  if (!lista) {
    window.showOutput(
      "No se encontró el área para mostrar el feed (id 'listaFeed').",
      "error"
    );
    return;
  }
  lista.innerHTML = "Cargando...";
  try {
    const res = await window.apiCall(
      "http://localhost:3000/api/paginas",
      "GET",
      {
        successMsg: "Feed cargado correctamente.",
        errorMsg: "Error al cargar el feed",
      }
    );
    lista.innerHTML = "";
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      const table = document.createElement("table");
      table.style.width = "100%";
      table.style.borderCollapse = "collapse";
      table.innerHTML = `<thead>
        <tr>
          <th>ID</th>
          <th>User ID</th>
          <th>Título</th>
          <th>Contenido</th>
          <th>Creado en</th>
          <th>Elementos</th>
        </tr>
      </thead><tbody></tbody>`;
      const tbody = table.querySelector("tbody");
      res.data.forEach((row) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${row.id}</td>
          <td>${row.user_id}</td>
          <td>${row.titulo}</td>
          <td>${row.contenido}</td>
          <td>${row.creado_en}</td>
          <td>${row.elementos ? JSON.stringify(row.elementos) : ""}</td>
        `;
        tbody.appendChild(tr);
      });
      table.querySelectorAll("th, td").forEach((cell) => {
        cell.style.border = "1px solid #ccc";
        cell.style.padding = "4px";
      });
      lista.appendChild(table);
      window.showOutput(`Feed cargado: ${res.data.length}`, "success");
    } else {
      window.showOutput(
        "No hay textos completos disponibles en el feed.",
        "info"
      );
      lista.innerHTML = "No hay textos completos disponibles en el feed.";
    }
  } catch (error) {
    window.showOutput("Error de conexión", "error");
    return { success: false, error };
  }
};

// --- Inicialización automática ---
window.addEventListener("DOMContentLoaded", function () {
  window.initUserPopup();
  window.initFeedNav();
  window.showSection("/feed");
  window.cargarFeed();
});
