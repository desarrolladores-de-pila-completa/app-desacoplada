import { useEffect, useState } from "react";
const API_URL = "http://localhost:3000";

export default function useAuthUser() {
  const [authUser, setAuthUser] = useState(null);
  const [authUserId, setAuthUserId] = useState(null);
  useEffect(() => {
    async function fetchAuthUser() {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setAuthUser(data);
          setAuthUserId(data?.id);
        } else if (res.status === 401) {
          setAuthUser(null);
          setAuthUserId(null);
        }
      } catch {
        setAuthUser(null);
        setAuthUserId(null);
      }
    }
    fetchAuthUser();
  }, []);
  return { authUser, authUserId };
}
