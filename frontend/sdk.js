// Centralized SDK for API communication
const API_URL = "http://localhost:3000/api";

// Helper function to show messages in the output box
function showOutput(message, type = "info") {
  const output = document.getElementById("output");
  if (output) {
    output.textContent = message;
    output.style.color = type === "success" ? "green" : type === "error" ? "red" : "orange";
    output.style.display = "block";
    setTimeout(() => { output.style.display = "none"; }, 4000);
  }
}

// Obtener el token CSRF
export async function getCsrfToken() {
  const res = await fetch("http://localhost:3000/api/csrf-token", {
    credentials: "include"
  });
  const data = await res.json();
  return data.csrfToken;
}

// Register user
export async function register(email, password) {
  const csrfToken = await getCsrfToken();
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
      },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    const data = await res.json();
    
    if (res.ok && data.message) {
      showOutput(data.message, "success");
      return { success: true, data };
    } else if (data.message === "Email ya registrado") {
      showOutput(data.message, "error");
      return { success: false, data };
    } else if (data.error) {
      showOutput(data.error, "error");
      return { success: false, data };
    } else {
      showOutput("Error en el registro", "error");
      return { success: false, data };
    }
  } catch (error) {
    showOutput("Error de conexión en el registro", "error");
    return { success: false, error };
  }
}

// Login user
export async function login(email, password) {
  const csrfToken = await getCsrfToken();
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
      },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    const data = await res.json();
    
    if (res.ok && data.message) {
      showOutput(data.message, "success");
      return { success: true, data, authenticated: true };
    } else if (data.message === "Credenciales inválidas") {
      showOutput(data.message, "error");
      return { success: false, data, authenticated: false };
    } else if (data.error) {
      showOutput(data.error, "error");
      return { success: false, data, authenticated: false };
    } else {
      showOutput("Error en el login", "error");
      return { success: false, data, authenticated: false };
    }
  } catch (error) {
    showOutput("Error de conexión en el login", "error");
    return { success: false, error, authenticated: false };
  }
}

// Create page
export async function createPage(titulo, contenido, elementos = []) {
  const csrfToken = await getCsrfToken();
  try {
    const res = await fetch(`${API_URL}/paginas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
      },
      body: JSON.stringify({ titulo, contenido, elementos }),
      credentials: "include",
    });
    const data = await res.json();
    
    const message = data.message ? data.message : "Página guardada";
    showOutput(message, res.ok ? "success" : "error");
    
    return { success: res.ok, data };
  } catch (error) {
    showOutput("Error de conexión al crear página", "error");
    return { success: false, error };
  }
}

// Get user's own pages  
export async function getMyPages() {
  const csrfToken = await getCsrfToken();
  try {
    const res = await fetch(`${API_URL}/paginas/mias`, {
      method: "GET",
      headers: {
        "X-CSRF-Token": csrfToken
      },
      credentials: "include",
    });
    
    if (res.status === 401) {
      showOutput("Debes iniciar sesión para ver tus páginas.", "error");
      return { success: false, unauthorized: true, data: [] };
    }
    
    const data = await res.json();
    
    if (Array.isArray(data) && data.length > 0) {
      return { success: true, data };
    } else {
      showOutput("No tienes páginas creadas.", "info");
      return { success: true, data: [] };
    }
  } catch (error) {
    showOutput("Error al cargar tus páginas.", "error");
    return { success: false, error, data: [] };
  }
}

// Get all public pages
export async function getPublicPages() {
  const csrfToken = await getCsrfToken();
  try {
    const res = await fetch(`${API_URL}/paginas`, {
      method: "GET",
      headers: {
        "X-CSRF-Token": csrfToken
      },
    });
    const data = await res.json();
    
    if (Array.isArray(data) && data.length > 0) {
      showOutput("Páginas públicas cargadas correctamente.", "success");
      return { success: true, data };
    } else {
      showOutput("No hay páginas públicas.", "info");
      return { success: true, data: [] };
    }
  } catch (error) {
    showOutput("Error al cargar páginas públicas.", "error");
    return { success: false, error, data: [] };
  }
}

// Get page by ID
export async function getPageById(id) {
  const csrfToken = await getCsrfToken();
  try {
    const res = await fetch(`${API_URL}/paginas/${id}`, {
      method: "GET",
      headers: {
        "X-CSRF-Token": csrfToken
      },
    });
    const data = await res.json();
    
    if (data.error) {
      showOutput(data.error, "error");
      return { success: false, data };
    } else {
      showOutput("Página pública cargada correctamente.", "success");
      return { success: true, data };
    }
  } catch (error) {
    showOutput("Error al cargar la página.", "error");
    return { success: false, error };
  }
}

// Search pages by author username
export async function searchPagesByAuthor(username) {
  const csrfToken = await getCsrfToken();
  try {
    const res = await fetch(`${API_URL}/paginas/autor/${username}`, {
      method: "GET",
      headers: {
        "X-CSRF-Token": csrfToken
      },
    });
    const data = await res.json();
    
    if (Array.isArray(data) && data.length > 0) {
      showOutput(`Encontradas ${data.length} páginas del autor ${username}.`, "success");
      return { success: true, data };
    } else {
      showOutput(`No se encontraron páginas del autor ${username}.`, "info");
      return { success: true, data: [] };
    }
  } catch (error) {
    showOutput("Error al buscar páginas por autor.", "error");
    return { success: false, error, data: [] };
  }
}