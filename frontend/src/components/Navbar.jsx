
import React from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../stores/authStore";

function Navbar({ onFeedClick }) {
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav style={{ display: "flex", gap: "24px", alignItems: "center", padding: "16px 0" }}>
      <Link to="/" id="nav-feed" onClick={onFeedClick}>Feed</Link>

      {isAuthenticated ? (
        <>
          <span>Bienvenido, {user?.username}</span>
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