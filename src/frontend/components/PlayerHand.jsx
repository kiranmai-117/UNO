import React from "react";
import Card from "./Card";

export default function PlayerHand({ hand, onPlay }) {
  return (
    <div>
      <h3>Your Hand</h3>
      <div className="hand">
        {hand.map((c) => (
          <Card key={c.id} card={c} onPlay={onPlay} />
        ))}
      </div>
    </div>
  );
}
