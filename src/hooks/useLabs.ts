import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const useLabs = () => {
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLabs = async () => {
    try {
      setLoading(true);
      // Removed the Authorization header because you are not using tokens
      const res = await fetch(`${API_BASE}/api/labs`);
      
      if (!res.ok) throw new Error("Failed to fetch labs");
      
      const data = await res.json();
      setLabs(data);
    } catch (error) {
      console.error("Fetch labs error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  // Return refreshLabs so your "Add Lab" form can update the list
  return { labs, loading, refreshLabs: fetchLabs };
};