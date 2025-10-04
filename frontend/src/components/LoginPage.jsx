
import { useNavigate } from "react-router-dom";

function LoginPage({ logEmail, logPass, setLogEmail, setLogPass, login, showOutput }) {
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await login(logEmail, logPass);
    if (result?.error) return showOutput(result.error, "error");
    showOutput("Login exitoso", "success");
    // Redirige siempre si hay id
    if (result?.username) {
      navigate(`/pagina/${result.username}`);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 4px 24px #0002" }}>
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
            value={logEmail}
            onChange={e => setLogEmail(e.target.value)}
            style={{ flex: 1, padding: "8px", borderRadius: 4, border: "1px solid #bbb", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", border: "2px solid #1976d2", borderRadius: 8, padding: "12px", marginBottom: "16px", background: "#f7f7f7", width: "100%", boxSizing: "border-box" }}>
          <label htmlFor="logPass" style={{ marginRight: "12px", minWidth: "120px" }}>Contraseña:</label>
          <input
            type="password"
            id="logPass"
            required
            value={logPass}
            onChange={e => setLogPass(e.target.value)}
            style={{ flex: 1, padding: "8px", borderRadius: 4, border: "1px solid #bbb", boxSizing: "border-box" }}
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default LoginPage;