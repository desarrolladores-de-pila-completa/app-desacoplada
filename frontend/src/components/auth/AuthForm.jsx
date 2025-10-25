import React, { useState } from "react";
import { Link } from "react-router-dom";
import authService from "../../services/authService";

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

function AuthForm({ mode, showOutput, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (mode === "register") {
      if (!validateEmail(email)) {
        setIsLoading(false);
        return showOutput("Correo electrónico inválido", "error");
      }
      if (!validatePassword(password)) {
        setIsLoading(false);
        return showOutput("La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número", "error");
      }
    }

    const result = mode === "login" ? await authService.login(email, password) : await authService.register(email, password);
    setIsLoading(false);

    if (result.success) {
      showOutput(`${mode === "login" ? "Login" : "Registro"} exitoso`, "success");
      if (onSuccess) onSuccess(result);
    } else {
      setError(result.error);
      showOutput(result.error, "error");
    }
  };

  const isRegister = mode === "register";
  const title = isRegister ? "Registro" : "Login";
  const buttonText = isLoading ? (isRegister ? "Registrando..." : "Iniciando sesión...") : (isRegister ? "Registrar" : "Login");
  const linkText = isRegister ? "¿Tienes una cuenta? Inicia Sesión" : "¿No estás registrado? Regístrate";
  const linkTo = isRegister ? "/login" : "/registro";

  return (
    <div style={{ maxWidth: 400, margin: "120px auto", background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 4px 24px #0002" }}>
      <form onSubmit={handleSubmit}>
        <h2>{title}</h2>
        <div style={{ display: "flex", alignItems: "center", border: "2px solid #1976d2", borderRadius: 8, padding: "12px", marginBottom: "16px", background: "#f7f7f7", width: "100%", boxSizing: "border-box" }}>
          <label htmlFor={`${mode}Email`} style={{ marginRight: "12px", minWidth: "120px" }}>Correo electrónico:</label>
          <input
            type="email"
            id={`${mode}Email`}
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={isLoading}
            style={{ flex: 1, padding: "8px", borderRadius: 4, border: "1px solid #bbb", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", border: "2px solid #1976d2", borderRadius: 8, padding: "12px", marginBottom: "16px", background: "#f7f7f7", width: "100%", boxSizing: "border-box" }}>
          <label htmlFor={`${mode}Pass`} style={{ marginRight: "12px", minWidth: "120px" }}>Contraseña:</label>
          <input
            type="password"
            id={`${mode}Pass`}
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={isLoading}
            style={{ flex: 1, padding: "8px", borderRadius: 4, border: "1px solid #bbb", boxSizing: "border-box" }}
          />
        </div>
        {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: 16 }}>{error}</p>}
        <button type="submit" disabled={isLoading}>
          {buttonText}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 16 }}>
        <Link to={linkTo}>{linkText}</Link>
      </p>
    </div>
  );
}

export default AuthForm;