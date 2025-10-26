import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../ui/Navbar";
import AuthForm from "./AuthForm";

function RegisterPage({ showOutput }) {
  const navigate = useNavigate();

  const handleSuccess = (result) => {
    // Redirigir automáticamente a la página personal del usuario
    if (result.data?.username) {
      const username = String(result.data.username).replace(/\s+/g, '-');
      navigate(`/pagina/${username}`);
    }
  };

  return (
    <>
      <Navbar />
      <AuthForm mode="register" showOutput={showOutput} onSuccess={handleSuccess} />
    </>
  );
}

export default RegisterPage;