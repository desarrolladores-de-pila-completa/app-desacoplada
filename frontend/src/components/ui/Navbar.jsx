
import React, { useState } from "react";
import { Link } from "react-router-dom";

function Navbar({ onFeedClick }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

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

      <div style={{ position: 'relative' }}>
        <Link to="/login" style={{ padding: '8px', background: '#dc3545', color: '#fff', borderRadius: 4, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <img src="https://cdn-icons-png.flaticon.com/512/1077/1077063.png" alt="Cuenta" style={{ width: 24, height: 24 }} />
        </Link>
      </div>

      <Link to="/registro">Registro</Link>
      <Link to="/login">Login</Link>
    </nav>
  );
}

export default Navbar;