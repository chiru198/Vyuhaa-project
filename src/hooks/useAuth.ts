import { useEffect, useState } from "react";

//const API_URL = import.meta.env.VITE_API_BASE_URL;
const API_URL = "http://localhost:5000";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export const useAuth = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  /* ===============================
     LOAD USER FROM JWT ON REFRESH
  ================================ */
  // src/hooks/useAuth.tsx

  useEffect(() => {
    // We remove 'const token = ...' and the check for it
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("user");
      }
    }

    setLoading(false);
  }, []);

  /* ===============================
     LOGIN
  ================================ */
  const signIn = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Login failed");
    }

    const data = await res.json();

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    setUser(data.user);
    return data;
  };

  /* ===============================
     LOGOUT
  ================================ */
  const signOut = () => {
    localStorage.removeItem("user");
    // Remove token removal if you aren't saving it anymore
    localStorage.removeItem("token");
    setUser(null);
    window.location.href = "/"; // Redirect to root
  };

  return {
    user,
    loading,
    signIn,
    signOut,
  };
};
