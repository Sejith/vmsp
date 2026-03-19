import { useEffect, useState } from "react";

export const useGoldSocket = () => {
  const [goldPrice, setGoldPrice] = useState(null);
  const [silverPrice, setSilverPrice] = useState(null);
  const [rawRows, setRawRows] = useState([]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080/ws");

    ws.onopen = () => {
      console.log("✅ WebSocket Connected");
    };

    ws.onmessage = (event) => {
      try {
        const rows = JSON.parse(event.data);
        console.log("📡 Live rows:", rows);

        setRawRows(rows);

        const goldAndhra = rows.find(
          (r) =>
            r.name === "GOLD Andhra Pradesh - Telangana 999"
        );

        const silverPanIndia = rows.find(
          (r) => r.name === "SILVER 30 KG PAN India"
        );

        if (goldAndhra) {
          setGoldPrice(parseFloat(goldAndhra.price1));
        }

        if (silverPanIndia) {
          setSilverPrice(parseFloat(silverPanIndia.price1));
        }
      } catch (err) {
        console.error("❌ WebSocket parse error:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("⚠️ WebSocket Error", err);
    };

    ws.onclose = () => {
      console.log("🔴 WebSocket Closed");
    };

    return () => {
      console.log("🧹 Closing WebSocket...");
      ws.close();
    };
  }, []);

  return {
    goldPrice,
    silverPrice,
    rawRows,
  };
};
