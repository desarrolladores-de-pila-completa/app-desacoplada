import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "./Navbar";
import useAuthStore from "../stores/authStore";

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

function RegisterPage({ showOutput }) {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      return showOutput("Correo electrónico inválido", "error");
    }

    if (!validatePassword(password)) {
      return showOutput("La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número", "error");
    }

    const result = await register(email, password);

    if (result.success) {
      showOutput("Registro exitoso", "success");
      // Redirigir automáticamente a la página personal del usuario
      if (result.data?.username) {
        const username = String(result.data.username).replace(/\s+/g, '-');
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
      <form id="registerForm" onSubmit={handleRegister}>
        <h2>Registro</h2>
        <div style={{ display: "flex", alignItems: "center", border: "2px solid #1976d2", borderRadius: 8, padding: "12px", marginBottom: "16px", background: "#f7f7f7", width: "100%", boxSizing: "border-box" }}>
          <label htmlFor="regEmail" style={{ marginRight: "12px", minWidth: "120px" }}>Correo electrónico:</label>
          <input
            type="email"
            id="regEmail"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={isLoading}
            style={{ flex: 1, padding: "8px", borderRadius: 4, border: "1px solid #bbb", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", border: "2px solid #1976d2", borderRadius: 8, padding: "12px", marginBottom: "16px", background: "#f7f7f7", width: "100%", boxSizing: "border-box" }}>
          <label htmlFor="regPass" style={{ marginRight: "12px", minWidth: "120px" }}>Contraseña:</label>
          <input
            type="password"
            id="regPass"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={isLoading}
            style={{ flex: 1, padding: "8px", borderRadius: 4, border: "1px solid #bbb", boxSizing: "border-box" }}
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Registrando..." : "Registrar"}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 16 }}>¿Tienes una cuenta? <Link to="/login">Inicia Sesión</Link></p>
      {/* Cartel de página personal oculto tras registro, solo redirige */}
    </div>
    </>
  );
}

export default RegisterPage;