import { useEffect, useState, useRef } from "react";
import goldBg from "../assets/gold_card.png";
import silverBg from "../assets/silver_card.png";
import pageBg from "../assets/background_landscape.png";
import { useMetalPrices } from "../clients/price";

const fmt = (price) =>
  price != null
    ? `₹ ${price.toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`
    : "—";

const MetalCard = ({ title, price1g, bgImage, theme }) => {
  const prevRef = useRef(null);
  const [changePct, setChangePct] = useState(0);
  const [changeAbs, setChangeAbs] = useState(0);
  const [direction, setDirection] = useState("up");

  useEffect(() => {
    if (price1g == null) return;
    if (prevRef.current !== null) {
      const diff = price1g - prevRef.current;
      const pct = (diff / prevRef.current) * 100;
      setChangeAbs(diff);
      setChangePct(pct);
      setDirection(diff >= 0 ? "up" : "down");
    }
    prevRef.current = price1g;
  }, [price1g]);

  const priceSavaran = price1g != null ? price1g * 8 : null;
  const priceMoosa = price1g != null ? price1g * 10 : null;

  const isGold = theme === "gold";
  const headingColor = isGold ? "#FFD966" : "#D4C4A0";
  const dividerColor = isGold
    ? "rgba(255,215,50,0.75)"
    : "rgba(210,195,160,0.65)";
  const upColor = "#4ade80";
  const downColor = "#f87171";
  const tickColor = direction === "up" ? upColor : downColor;

  return (
    <div
      className="relative flex flex-col"
      style={{
        width: 380,
        height: 440,
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
        borderRadius: 4,
      }}
    >
      <div
        className="flex items-center justify-center w-full"
        style={{ height: 62, paddingTop: 22 }}
      >
        <span
          className="tracking-[0.25em] uppercase font-black"
          style={{
            fontSize: 22,
            color: headingColor,
            fontFamily: "'Cinzel', serif",
            textShadow: isGold
              ? "0 0 16px #BF6511, 0 0 6px #DC9422, 0 1px 3px rgba(0,0,0,0.9)"
              : "0 0 12px #936C4E, 0 0 6px #CAAF95, 0 1px 3px rgba(0,0,0,0.9)",
          }}
        >
          {title} Prices
        </span>
      </div>

      <div className="flex flex-col flex-1 justify-center items-center gap-4 px-10 pb-6">
        <div
          className="w-full text-center font-semibold tracking-wide"
          style={{
            fontSize: 16,
            color: headingColor,
            fontFamily: "'Cinzel', serif",
            textShadow:
              "0 0 10px rgba(0,0,0,1), 0 1px 4px rgba(0,0,0,1), 0 2px 8px rgba(0,0,0,0.9)",
          }}
        >
          {title} Price per Gram
        </div>

        <div className="flex items-center justify-center gap-3">
          <span
            className="font-black tabular-nums"
            style={{
              fontSize: 42,
              color: headingColor,
              fontFamily: "'Cinzel', serif",
              textShadow: isGold
                ? "0 0 18px #BF6511, 0 0 8px #DC9422, 0 2px 4px rgba(0,0,0,0.9)"
                : "0 0 14px #936C4E, 0 0 6px #CAAF95, 0 2px 4px rgba(0,0,0,0.9)",
              lineHeight: 1,
            }}
          >
            {fmt(price1g)}
          </span>

          {price1g != null && (
            <div className="flex flex-col items-start" style={{ gap: 1 }}>
              <span
                className="font-bold tabular-nums"
                style={{
                  fontSize: 14,
                  color: tickColor,
                  textShadow: `0 0 8px ${tickColor}88`,
                  lineHeight: 1,
                }}
              >
                {direction === "up" ? "▲" : "▼"} {direction === "up" ? "+" : ""}
                {Math.round(changeAbs)}
              </span>
              <span
                className="font-semibold tabular-nums"
                style={{
                  fontSize: 12,
                  color: tickColor,
                  textShadow: `0 0 8px ${tickColor}88`,
                  lineHeight: 1,
                }}
              >
                ({direction === "up" ? "+" : ""}
                {changePct.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>

        <div
          className="w-full flex items-center justify-center"
          style={{ gap: 0 }}
        >
          <svg
            width="100%"
            height="10"
            viewBox="0 0 160 10"
            preserveAspectRatio="none"
            style={{ flex: 1 }}
          >
            <polygon
              points="0,5 155,0 160,5 155,10"
              fill={dividerColor}
              style={{ filter: `drop-shadow(0 0 3px ${dividerColor})` }}
            />
          </svg>
          <div
            style={{
              width: 10,
              height: 10,
              background: dividerColor,
              transform: "rotate(45deg)",
              margin: "0 5px",
              boxShadow: `0 0 8px ${dividerColor}`,
              flexShrink: 0,
            }}
          />
          <svg
            width="100%"
            height="10"
            viewBox="0 0 160 10"
            preserveAspectRatio="none"
            style={{ flex: 1 }}
          >
            <polygon
              points="0,5 5,0 160,5 5,10"
              fill={dividerColor}
              style={{ filter: `drop-shadow(0 0 3px ${dividerColor})` }}
            />
          </svg>
        </div>

        <div className="w-full flex justify-between items-center">
          <span
            style={{
              fontSize: 15,
              color: headingColor,
              fontFamily: "'Cinzel', serif",
              letterSpacing: "0.05em",
              textShadow: "0 0 10px rgba(0,0,0,1), 0 1px 4px rgba(0,0,0,1)",
            }}
          >
            {title} 1 Savaran (8 grams):
          </span>
          <span
            className="font-bold tabular-nums"
            style={{
              fontSize: 15,
              color: headingColor,
              fontFamily: "'Cinzel', serif",
              textShadow: "0 0 10px rgba(0,0,0,1), 0 1px 4px rgba(0,0,0,1)",
            }}
          >
            {fmt(priceSavaran)}
          </span>
        </div>

        <div
          className="w-full flex items-center justify-center"
          style={{ gap: 0 }}
        >
          <svg
            width="100%"
            height="10"
            viewBox="0 0 160 10"
            preserveAspectRatio="none"
            style={{ flex: 1 }}
          >
            <polygon
              points="0,5 155,0 160,5 155,10"
              fill={dividerColor}
              style={{ filter: `drop-shadow(0 0 3px ${dividerColor})` }}
            />
          </svg>
          <div
            style={{
              width: 10,
              height: 10,
              background: dividerColor,
              transform: "rotate(45deg)",
              margin: "0 5px",
              boxShadow: `0 0 8px ${dividerColor}`,
              flexShrink: 0,
            }}
          />
          <svg
            width="100%"
            height="10"
            viewBox="0 0 160 10"
            preserveAspectRatio="none"
            style={{ flex: 1 }}
          >
            <polygon
              points="0,5 5,0 160,5 5,10"
              fill={dividerColor}
              style={{ filter: `drop-shadow(0 0 3px ${dividerColor})` }}
            />
          </svg>
        </div>

        <div className="w-full flex justify-between items-center">
          <span
            style={{
              fontSize: 15,
              color: headingColor,
              fontFamily: "'Cinzel', serif",
              letterSpacing: "0.05em",
              textShadow: "0 0 10px rgba(0,0,0,1), 0 1px 4px rgba(0,0,0,1)",
            }}
          >
            {title} 1 Moosa (10 grams):
          </span>
          <span
            className="font-bold tabular-nums"
            style={{
              fontSize: 15,
              color: headingColor,
              fontFamily: "'Cinzel', serif",
              textShadow: "0 0 10px rgba(0,0,0,1), 0 1px 4px rgba(0,0,0,1)",
            }}
          >
            {fmt(priceMoosa)}
          </span>
        </div>
      </div>
    </div>
  );
};

const MetalPricesBoard = () => {
  const { goldPrice, silverPrice } = useMetalPrices();

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&display=swap"
        rel="stylesheet"
      />

      <div
        className="min-h-screen w-full flex flex-col items-center justify-center"
        style={{
          backgroundImage: `url(${pageBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <h1
          className="font-bold tracking-[0.3em] uppercase mb-12"
          style={{
            fontSize: 36,
            fontFamily: "'Cinzel', serif",
            color: "#FFD966",
            textShadow:
              "0 0 24px rgba(255,200,50,0.5), 0 2px 4px rgba(0,0,0,0.9)",
          }}
        >
          Live Metal Prices
        </h1>

        <div className="flex flex-col md:flex-row gap-14 items-center">
          <MetalCard
            title="Gold"
            price1g={goldPrice}
            bgImage={goldBg}
            theme="gold"
          />
          <MetalCard
            title="Silver"
            price1g={silverPrice}
            bgImage={silverBg}
            theme="silver"
          />
        </div>
      </div>
    </>
  );
};

export default MetalPricesBoard;
