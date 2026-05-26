import { isValidPlay, playCard } from './engine'

export function aiTakeTurn(game) {
  const idx = game.currentPlayerIndex
  const player = game.players[idx]
  const top = game.discardTop
  const valid = player.hand.filter((c) => isValidPlay(c, top))
  if (valid.length === 0) {
    // draw
    return drawForAi(game, idx)
  }
  // choose a random valid card
  const choice = valid[Math.floor(Math.random() * valid.length)]
  return playCard(game, idx, choice.id)
}

function drawForAi(game, idx) {
  const card = game.drawPile.pop()
  if (!card) return game
  game.players[idx].hand.push(card)
  if (isValidPlay(card, game.discardTop)) {
    return playCard(game, idx, card.id)
  }
  game.currentPlayerIndex = (game.currentPlayerIndex + game.direction + game.players.length) % game.players.length
  return game
}
