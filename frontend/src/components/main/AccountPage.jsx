import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../ui/Navbar";
import UsernameUpdateForm from "./UsernameUpdateForm";
import authService from "../../services/authService";

function AccountPage() {
  const user = authService.getCurrentUser();
  const isAuthenticated = authService.isLoggedIn();

  if (!isAuthenticated) {
    return (
      <>
        <Navbar />
        <div style={{ maxWidth: 600, margin: "120px auto", textAlign: "center" }}>
          <p>Debes <Link to="/login">iniciar sesión</Link> para ver tu cuenta.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 600, margin: "120px auto", background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 4px 24px #0002", textAlign: "center" }}>
        <h2>Mi Cuenta</h2>
        <p><strong>Usuario:</strong> {user?.display_name}</p>
        <p><strong>Email:</strong> {user?.email}</p>

        {/* Sección para cambiar nombre de usuario */}
        <div style={{ marginTop: 32, marginBottom: 32 }}>
          <UsernameUpdateForm />
        </div>

        <Link to={`/pagina/${user?.username}`} style={{ display: 'inline-block', marginTop: 16, padding: '8px 16px', background: '#1976d2', color: '#fff', borderRadius: 4, textDecoration: 'none' }}>
          Ver mi página
        </Link>
      </div>
    </>
  );
}

export default AccountPage;