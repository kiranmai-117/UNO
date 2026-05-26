import React from "react";
import Card from "./Card";

export default function PlayerHand({ hand, onPlay, disabled }) {
  return (
    <div className={disabled ? "hand-panel disabled" : "hand-panel"}>
      <h3>Your Hand</h3>
      <div className="hand">
        {hand.map((c) => (
          <Card
            key={c.id}
            card={c}
            onPlay={disabled ? undefined : onPlay}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}
