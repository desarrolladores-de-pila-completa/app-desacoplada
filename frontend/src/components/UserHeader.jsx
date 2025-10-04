import React from "react";


import useAuthUser from "../hooks/useAuthUser";

function UserHeader({ paginaUser }) {
  const { authUser } = useAuthUser();
  // Si el usuario autenticado es el dueño, muestra su email en el mensaje de bienvenida
  const esDueno = authUser && paginaUser && String(authUser.id) === String(paginaUser.user_id);
  const contenido = esDueno
    ? `Bienvenido ${authUser.email} a tu página personal.`
    : paginaUser?.contenido;
  return (
    <div style={{ textAlign: "center", marginBottom: 24 }}>
      <h2>
        {paginaUser?.username || paginaUser?.email || "usuario"}
      </h2>
      <p>{paginaUser?.titulo}</p>
      <p>{contenido}</p>
    </div>
  );
}

export default UserHeader;
