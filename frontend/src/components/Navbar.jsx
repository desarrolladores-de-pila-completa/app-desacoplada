
import React, { useState } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../stores/authStore";

function Navbar({ onFeedClick }) {
  const { isAuthenticated, user, logout, isCheckingAuth } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <nav style={{ display: "flex", gap: "24px", alignItems: "center", padding: "16px 24px", background: "#f0f0f0", borderBottom: "1px solid #ccc" }}>
      <Link
        to="/"
        id="nav-feed"
        onClick={onFeedClick}
        style={{
          padding: '8px 16px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '1em',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          border: '2px solid transparent'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
          e.target.style.borderColor = '#fff';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
          e.target.style.borderColor = 'transparent';
        }}
      >
        🏠 Feed
      </Link>

      {isAuthenticated && (
        <>
          <Link
            to={`/pagina/${user?.username}`}
            style={{
              padding: '8px 16px',
              background: '#28a745',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: 4,
              fontWeight: 'bold'
            }}
          >
            📋 Mis publicaciones
          </Link>
          <Link
            to={`/${user?.username}/publicar`}
            style={{
              padding: '8px 16px',
              background: '#1976d2',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: 4,
              fontWeight: 'bold'
            }}
          >
            📝 Publicar
          </Link>
        </>
      )}
      {!isCheckingAuth && (
        <div style={{ position: 'relative' }}>
          {isAuthenticated ? (
            <button onClick={toggleDropdown} style={{ padding: '8px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <img src="https://cdn-icons-png.flaticon.com/512/1077/1077063.png" alt="Cuenta" style={{ width: 24, height: 24 }} />
            </button>
          ) : (
            <Link to="/login" style={{ padding: '8px', background: '#dc3545', color: '#fff', borderRadius: 4, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <img src="https://cdn-icons-png.flaticon.com/512/1077/1077063.png" alt="Cuenta" style={{ width: 24, height: 24 }} />
            </Link>
          )}
          {dropdownOpen && isAuthenticated && (
            <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', background: '#fff', border: '1px solid #ccc', borderRadius: 4, boxShadow: '0 4px 8px rgba(0,0,0,0.1)', zIndex: 1001, minWidth: 120 }}>
              <div style={{ padding: '8px 16px', borderBottom: '1px solid #eee', color: '#333' }}>
                Bienvenido, <Link to={`/pagina/${user?.username}`} onClick={() => setDropdownOpen(false)} style={{ color: '#007bff', textDecoration: 'none' }}>{user?.display_name || user?.username}</Link>
              </div>
              <Link to={`/${user?.username}/publicar`} onClick={() => setDropdownOpen(false)} style={{ display: 'block', padding: '8px 16px', textDecoration: 'none', color: '#007bff', borderBottom: '1px solid #eee' }}>📝 Crear publicación</Link>
              <Link to="/cuenta" onClick={() => setDropdownOpen(false)} style={{ display: 'block', padding: '8px 16px', textDecoration: 'none', color: '#333', borderBottom: '1px solid #eee' }}>⚙️ Cuenta</Link>
              <button onClick={handleLogout} style={{ width: '100%', padding: '8px 16px', background: 'none', border: 'none', textAlign: 'center', cursor: 'pointer', color: '#333' }}>
                Logout
              </button>
            </div>
          )}
        </div>
      )}
      {!isAuthenticated && (
        <>
          <Link to="/registro">Registro</Link>
          <Link to="/login">Login</Link>
        </>
      )}
    </nav>
  );
}

export default Navbar;