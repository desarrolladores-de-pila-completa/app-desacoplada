import React from "react";
import { Link } from "react-router-dom";

function Navbar({ onFeedClick }) {
  return (
    <nav style={{ display: "flex", gap: "24px", alignItems: "center", padding: "16px 0" }}>
      <Link to="/" id="nav-feed" onClick={onFeedClick}>Feed</Link>
      <Link to="/registro">Registro</Link>
      <Link to="/login">Login</Link>
    </nav>
  );
}

export default Navbar;