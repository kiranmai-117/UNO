import React from 'react'

export default function GameBoard({ topCard }) {
  if (!topCard) return <div className="board">No cards yet</div>
  return (
    <div className="board">
      <h3>Top Discard</h3>
      <div className={`card ${topCard.color || ''}`}>{topCard.type === 'number' ? topCard.value : topCard.type}</div>
    </div>
  )
}
