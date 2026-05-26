// Minimal game engine for MVP1
let nextId = 1

function uid() { return nextId++ }

export function createDeck() {
  const colors = ['red', 'yellow', 'green', 'blue']
  const deck = []
  colors.forEach((color) => {
    for (let i = 0; i <= 9; i++) {
      deck.push({ id: uid(), color, type: 'number', value: i })
      if (i !== 0) deck.push({ id: uid(), color, type: 'number', value: i })
    }
    // add action cards: skip, reverse, draw2 (2 each)
    for (let i = 0; i < 2; i++) {
      deck.push({ id: uid(), color, type: 'skip' })
      deck.push({ id: uid(), color, type: 'reverse' })
      deck.push({ id: uid(), color, type: 'draw2' })
    }
  })
  // wilds
  for (let i = 0; i < 4; i++) deck.push({ id: uid(), color: 'wild', type: 'wild' })
  for (let i = 0; i < 4; i++) deck.push({ id: uid(), color: 'wild', type: 'wild+4' })
  return deck
}

export function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

export function deal(deck, players, handSize = 7) {
  const newPlayers = players.map((p) => ({ ...p, hand: [] }))
  for (let i = 0; i < handSize; i++) {
    for (let p of newPlayers) {
      p.hand.push(deck.pop())
    }
  }
  return newPlayers
}

export function startGame(playerNames = ['You', 'CPU']) {
  const deck = shuffle(createDeck())
  const players = playerNames.map((n, i) => ({ id: i, name: n, hand: [] }))
  const dealt = deal(deck, players)
  const discardTop = deck.pop()
  return {
    players: dealt,
    drawPile: deck,
    discardTop,
    currentPlayerIndex: 0,
    direction: 1,
    pendingDraw: 0
  }
}

export function isValidPlay(card, top) {
  if (!card) return false
  if (card.type === 'wild' || card.type === 'wild+4') return true
  if (top.type === 'wild' || top.type === 'wild+4') return card.color === top.color || card.color === 'wild'
  if (card.color === top.color) return true
  if (card.type === 'number' && top.type === 'number' && card.value === top.value) return true
  if (card.type === top.type && card.type !== 'number') return true
  return false
}

function applySpecial(game, card) {
  if (card.type === 'skip') {
    game.currentPlayerIndex = (game.currentPlayerIndex + game.direction + game.players.length) % game.players.length
  }
  if (card.type === 'reverse') {
    game.direction = -game.direction
  }
  if (card.type === 'draw2') {
    game.pendingDraw += 2
  }
  if (card.type === 'wild+4') {
    game.pendingDraw += 4
  }
}

export function playCard(game, playerIndex, cardId, chosenColor = null) {
  const player = game.players[playerIndex]
  const idx = player.hand.findIndex((c) => c.id === cardId)
  if (idx === -1) return game
  const card = player.hand.splice(idx, 1)[0]
  // handle wild color choice
  if (card.type === 'wild' || card.type === 'wild+4') {
    card.color = chosenColor || 'red'
  }
  game.discardTop = card
  applySpecial(game, card)
  // advance to next player
  game.currentPlayerIndex = (game.currentPlayerIndex + game.direction + game.players.length) % game.players.length
  // handle pending draws immediately on next player turn
  if (game.pendingDraw > 0) {
    const next = game.players[game.currentPlayerIndex]
    for (let i = 0; i < game.pendingDraw; i++) {
      next.hand.push(game.drawPile.pop() || null)
    }
    game.pendingDraw = 0
    // skip that player's play after drawing
    game.currentPlayerIndex = (game.currentPlayerIndex + game.direction + game.players.length) % game.players.length
  }
  return game
}

export function drawCard(game, playerIndex, count = 1) {
  const player = game.players[playerIndex]
  const card = game.drawPile.pop()
  if (card) player.hand.push(card)
  // if drawn card is playable, auto-play
  const top = game.discardTop
  if (isValidPlay(card, top)) {
    return playCard(game, playerIndex, card.id)
  }
  // advance to next player
  game.currentPlayerIndex = (game.currentPlayerIndex + game.direction + game.players.length) % game.players.length
  return game
}
