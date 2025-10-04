import React from "react";
import { useNavigate } from "react-router-dom";

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}



function RegisterPage({ regEmail, regPass, setRegEmail, setRegPass, showOutput, register }) {
  const navigate = useNavigate();
  const [paginaPersonal, setPaginaPersonal] = React.useState(null);
  const [esDueno, setEsDueno] = React.useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateEmail(regEmail)) return showOutput("Correo electrónico inválido", "error");
    if (!validatePassword(regPass)) return showOutput("La contraseña no cumple los requisitos", "error");
    const result = await register(regEmail, regPass);
    if (result?.error) return showOutput(result.error, "error");
    showOutput("Registro exitoso", "success");
    if (result.paginaPersonal) {
      setPaginaPersonal(result.paginaPersonal);
      // Verifica si el usuario es dueño de la página creada
      if (String(result.paginaPersonal.user_id) === String(result.id)) {
        setEsDueno(true);
      } else {
        setEsDueno(false);
      }
  // Redirige a la página personal y recarga para actualizar autenticación
  navigate(`/usuario/${result.id}`);
  window.location.reload();
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 4px 24px #0002" }}>
      <form id="registerForm" onSubmit={handleRegister}>
        <h2>Registro</h2>
        <div style={{ display: "flex", alignItems: "center", border: "2px solid #1976d2", borderRadius: 8, padding: "12px", marginBottom: "16px", background: "#f7f7f7", width: "100%", boxSizing: "border-box" }}>
          <label htmlFor="regEmail" style={{ marginRight: "12px", minWidth: "120px" }}>Correo electrónico:</label>
          <input
            type="email"
            id="regEmail"
            required
            value={regEmail}
            onChange={e => setRegEmail(e.target.value)}
            style={{ flex: 1, padding: "8px", borderRadius: 4, border: "1px solid #bbb", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", border: "2px solid #1976d2", borderRadius: 8, padding: "12px", marginBottom: "16px", background: "#f7f7f7", width: "100%", boxSizing: "border-box" }}>
          <label htmlFor="regPass" style={{ marginRight: "12px", minWidth: "120px" }}>Contraseña:</label>
          <input
            type="password"
            id="regPass"
            required
            value={regPass}
            onChange={e => setRegPass(e.target.value)}
            style={{ flex: 1, padding: "8px", borderRadius: 4, border: "1px solid #bbb", boxSizing: "border-box" }}
          />
        </div>
        <button type="submit">Registrar</button>
      </form>
      {paginaPersonal && (
        <div style={{ marginTop: 32, background: "#f7f7f7", padding: 24, borderRadius: 8 }}>
          <h3>{paginaPersonal.titulo}</h3>
          <p>{paginaPersonal.contenido}</p>
          {esDueno ? (
            <div style={{ color: 'green', fontWeight: 'bold', marginTop: '8px' }}>ERES EL DUEÑO</div>
          ) : (
            <div style={{ color: 'red', fontWeight: 'bold', marginTop: '8px' }}>NO ERES EL DUEÑO</div>
          )}
        </div>
      )}
    </div>
  );
}

export default RegisterPage;