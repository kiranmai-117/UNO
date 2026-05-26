import React from "react";

export default function PlayerSummary({ players, currentPlayerIndex, selfId }) {
  return (
    <div className="player-summary">
      {players.map((player, index) => (
        <div
          key={player.id}
          className={`player-card ${index === currentPlayerIndex ? "active" : ""}`}
        >
          <div className="player-name">
            {player.id === selfId ? "You" : player.name}
          </div>
          <div>{player.cardCount ?? 0} cards</div>
        </div>
      ))}
    </div>
  );
}
