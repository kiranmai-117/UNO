import React from 'react'

function Card({ c, onPlay }) {
  const label = c.type === 'number' ? c.value : c.type
  return (
    <div className={`card ${c.color || ''}`} onClick={() => onPlay(c.id)}>
      <div>{label}</div>
      <div style={{ fontSize: 10 }}>{c.color}</div>
    </div>
  )
}

export default function PlayerHand({ hand, onPlay }) {
  return (
    <div>
      <h3>Your Hand</h3>
      <div className="hand">
        {hand.map((c) => (
          <Card key={c.id} c={c} onPlay={onPlay} />
        ))}
      </div>
    </div>
  )
}
