import React from "react";
import { useParams } from "react-router-dom";

function UserPage() {
  const { id } = useParams();
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      try {
        const res = await fetch(`/api/auth/user/${id}`);
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
      setLoading(false);
    }
    fetchUser();
  }, [id]);

  if (loading) return <div>Cargando...</div>;
  if (!user) return (
    <div style={{ maxWidth: 600, margin: "40px auto", background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 4px 24px #0002" }}>
      <h2>Usuario no encontrado</h2>
    </div>
  );

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 4px 24px #0002" }}>
      <h2>Página personal de usuario</h2>
      <p>Bienvenido, tu ID de usuario es: <strong>{user.id}</strong></p>
      <p>Correo: <strong>{user.email}</strong></p>
      <p>Username: <strong>{user.username}</strong></p>
    </div>
  );
}

export default UserPage;