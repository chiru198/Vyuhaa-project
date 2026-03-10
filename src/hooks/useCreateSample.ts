import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const useCreateSample = () => {
  const [loading, setLoading] = useState(false);

  const createSample = async (data: any) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/samples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data), // This now includes the barcode, type, and IDs
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create sample");
      }
      return await res.json();
    } finally {
      setLoading(false);
    }
  };

  return { createSample, loading };
};
