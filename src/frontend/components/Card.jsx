import React from "react";

const symbolLabel = {
  skip: "⏭",
  reverse: "⤾",
  draw2: "+2",
  wild: "WILD",
  "wild+4": "+4",
};

export default function Card({ card, onPlay, disabled }) {
  const label =
    card.type === "number" ? card.value : symbolLabel[card.type] || card.type;
  const colorClass = card.color === "wild" ? "wild" : card.color;

  return (
    <div
      className={`card ${colorClass} ${disabled ? "card--disabled" : ""}`}
      onClick={!disabled && onPlay ? () => onPlay(card.id) : undefined}
      role={!disabled && onPlay ? "button" : undefined}
      tabIndex={!disabled && onPlay ? 0 : undefined}
    >
      <div className="corner top-left">{label}</div>
      <div className="oval">
        <div className={`number ${card.type !== "number" ? "symbol" : ""}`}>
          {label}
        </div>
      </div>
      <div className="corner bottom-right">{label}</div>
    </div>
  );
}
