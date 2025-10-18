
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "./Navbar";
import useAuthStore from "../stores/authStore";

function LoginPage({ showOutput }) {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    const result = await login(email, password);

    if (result.success) {
      showOutput("Login exitoso", "success");
      // Redirige a la página del usuario
      if (result.user?.username) {
        const username = String(result.user.username).replace(/\s+/g, '-');
        navigate(`/pagina/${username}`);
      }
    } else {
      showOutput(result.error, "error");
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 400, margin: "120px auto", background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 4px 24px #0002" }}>
      <form
        id="loginForm"
        onSubmit={handleLogin}
      >
        <h2>Login</h2>
        <div style={{ display: "flex", alignItems: "center", border: "2px solid #1976d2", borderRadius: 8, padding: "12px", marginBottom: "16px", background: "#f7f7f7", width: "100%", boxSizing: "border-box" }}>
          <label htmlFor="logEmail" style={{ marginRight: "12px", minWidth: "120px" }}>Correo electrónico:</label>
          <input
            type="email"
            id="logEmail"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={isLoading}
            style={{ flex: 1, padding: "8px", borderRadius: 4, border: "1px solid #bbb", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", border: "2px solid #1976d2", borderRadius: 8, padding: "12px", marginBottom: "16px", background: "#f7f7f7", width: "100%", boxSizing: "border-box" }}>
          <label htmlFor="logPass" style={{ marginRight: "12px", minWidth: "120px" }}>Contraseña:</label>
          <input
            type="password"
            id="logPass"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={isLoading}
            style={{ flex: 1, padding: "8px", borderRadius: 4, border: "1px solid #bbb", boxSizing: "border-box" }}
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Iniciando sesión..." : "Login"}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 16 }}>¿No estás registrado? <Link to="/registro">Regístrate</Link></p>
    </div>
    </>
  );
}

export default LoginPage;