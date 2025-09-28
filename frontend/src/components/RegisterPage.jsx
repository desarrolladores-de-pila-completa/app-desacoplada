import React from "react";

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  // Al menos 8 caracteres, una mayúscula, una minúscula y un número
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

function RegisterPage({ regEmail, regPass, setRegEmail, setRegPass, showOutput, register }) {
  const [loading] = React.useState(false);

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 4px 24px #0002" }}>
      <form
        id="registerForm"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!validateEmail(regEmail)) {
            showOutput("Correo electrónico inválido", "error");
            return;
          }
          if (!validatePassword(regPass)) {
            showOutput("La contraseña no cumple los requisitos", "error");
            return;
          }
          const result = await register(regEmail, regPass);
          if (result?.error) {
            showOutput(result.error, "error");
            return;
          }
          showOutput("Registro exitoso", "success");
          // Si quieres redirigir al usuario:
          // navigate(`/usuario/${result.id}`);
        }}
      >
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
        <button type="submit" disabled={loading}>Registrar</button>
      </form>
    </div>
  );
}

export default RegisterPage;