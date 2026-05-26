import React from "react";
import Card from "./Card";

export default function GameBoard({ topCard }) {
  if (!topCard) return <div className="board">No cards yet</div>;
  return (
    <div className="board">
      <h3>Top Discard</h3>
      <Card card={topCard} />
    </div>
  );
}
