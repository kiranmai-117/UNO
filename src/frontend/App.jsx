import React, { useEffect, useState } from 'react'
import { startGame, playCard, drawCard } from '../game/engine'
import { aiTakeTurn } from '../game/ai'
import PlayerHand from './components/PlayerHand'
import GameBoard from './components/GameBoard'
import { saveGame, loadGame } from '../utils/storage'

export default function App() {
  const [game, setGame] = useState(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const saved = loadGame()
    if (saved) {
      setGame(saved)
      setStatus('Resumed saved game')
    } else {
      const g = startGame(['You', 'CPU'])
      setGame(g)
      setStatus('New game started')
    }
  }, [])

  useEffect(() => {
    if (!game) return
    // If it's AI's turn, schedule AI move
    const cur = game.currentPlayerIndex
    if (game.players[cur].name === 'CPU') {
      setStatus("CPU thinking...")
      const t = setTimeout(() => {
        const next = aiTakeTurn(game)
        setGame({ ...next })
        setStatus('')
      }, 700)
      return () => clearTimeout(t)
    }
  }, [game])

  function handlePlay(cardId) {
    const next = playCard(game, 0, cardId)
    setGame({ ...next })
    saveGame(next)
  }

  function handleDraw() {
    const next = drawCard(game, 0)
    setGame({ ...next })
    saveGame(next)
  }

  if (!game) return <div>Loading...</div>

  return (
    <div className="app">
      <h1>UNO — MVP1 (You vs CPU)</h1>
      <p>{status}</p>
      <GameBoard topCard={game.discardTop} />
      <div className="controls">
        <button onClick={handleDraw}>Draw</button>
      </div>
      <PlayerHand hand={game.players[0].hand} onPlay={handlePlay} />
    </div>
  )
}
