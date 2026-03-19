import { useEffect, useState, useRef } from "react";

const POLL_INTERVAL = 1000;

export const useMetalPrices = () => {
  const [goldPrice, setGoldPrice] = useState(null);
  const [silverPrice, setSilverPrice] = useState(null);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SHOP_BE_URL}/metal-prices`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        setGoldPrice(data.gold_price_1gm);
        setSilverPrice(data.silver_price_1gm);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch metal prices:", err);
        setError(err.message);
      }
    };

    fetchPrices();
    intervalRef.current = setInterval(fetchPrices, POLL_INTERVAL);

    return () => clearInterval(intervalRef.current);
  }, []);
  return { goldPrice, silverPrice, error };
};
