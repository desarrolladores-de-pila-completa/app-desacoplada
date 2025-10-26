
import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../ui/Navbar";
import AuthForm from "./AuthForm";

function LoginPage({ showOutput }) {
  const navigate = useNavigate();

  const handleSuccess = (result) => {
    // Redirige a la página del usuario
    if (result.user?.username) {
      const username = String(result.user.username).replace(/\s+/g, '-');
      navigate(`/pagina/${username}`);
    }
  };

  return (
    <>
      <Navbar />
      <AuthForm mode="login" showOutput={showOutput} onSuccess={handleSuccess} />
    </>
  );
}

export default LoginPage;