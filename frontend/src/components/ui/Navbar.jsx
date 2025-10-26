
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

function Navbar({ onFeedClick }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
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

      {isAuthenticated ? (
        <div style={{ position: 'relative' }}>
          <button
            onClick={toggleDropdown}
            style={{
              padding: '8px',
              background: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <img src="https://cdn-icons-png.flaticon.com/512/1077/1077063.png" alt="Cuenta" style={{ width: 24, height: 24 }} />
            {user?.username && <span style={{ marginLeft: 8 }}>{user.username}</span>}
          </button>
          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              background: '#fff',
              border: '1px solid #ccc',
              borderRadius: 4,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              zIndex: 1000,
              minWidth: 150
            }}>
              <Link
                to={`/pagina/${user?.username}`}
                style={{ display: 'block', padding: '8px 16px', textDecoration: 'none', color: '#333' }}
                onClick={() => setDropdownOpen(false)}
              >
                Mi Página
              </Link>
              <Link
                to="/cuenta"
                style={{ display: 'block', padding: '8px 16px', textDecoration: 'none', color: '#333' }}
                onClick={() => setDropdownOpen(false)}
              >
                Cuenta
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: '#dc3545'
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <Link to="/registro" style={{ padding: '8px 16px', background: '#007bff', color: '#fff', textDecoration: 'none', borderRadius: 4 }}>
            Registro
          </Link>
          <Link to="/login" style={{ padding: '8px 16px', background: '#dc3545', color: '#fff', textDecoration: 'none', borderRadius: 4 }}>
            Login
          </Link>
        </>
      )}
    </nav>
  );
}

export default Navbar;