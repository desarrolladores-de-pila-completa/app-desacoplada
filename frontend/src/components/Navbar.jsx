
import React from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../stores/authStore";

function Navbar({ onFeedClick }) {
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, width: "100%", display: "flex", gap: "24px", alignItems: "center", padding: "16px 24px", background: "#f0f0f0", borderBottom: "1px solid #ccc", zIndex: 1000 }}>
      <Link to="/" id="nav-feed" onClick={onFeedClick}>Feed</Link>

      {isAuthenticated ? (
        <>
          <span>Bienvenido, <Link to={`/pagina/${user?.username}`}>{user?.username}</Link></span>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}>
            Logout
          </button>
        </>
      ) : (
        <>
          <Link to="/registro">Registro</Link>
          <Link to="/login">Login</Link>
        </>
      )}
    </nav>
  );
}

export default Navbar;