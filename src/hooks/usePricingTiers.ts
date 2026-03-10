import { useEffect, useState, useCallback } from "react";

export const usePricingTiers = () => {
  const [pricingTiers, setPricingTiers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTiers = useCallback(async () => {
    try {
      setLoading(true);
      // Removed the ${id} and fixed the fetch structure
      const res = await fetch("http://localhost:5000/pricing-tiers");

      if (!res.ok) throw new Error("Network response was not ok");

      const data = await res.json();
      setPricingTiers(data); // This fills the array so the cards appear
    } catch (err) {
      console.error("Hook fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  return { pricingTiers, loading, refetch: fetchTiers };
};
