// Minimal game engine for MVP2
let nextId = 1

function uid() {
  return nextId++
}

export function createDeck() {
  const colors = ['red', 'yellow', 'green', 'blue']
  const deck = []

  colors.forEach((color) => {
    for (let i = 0; i <= 9; i++) {
      deck.push({ id: uid(), color, type: 'number', value: i })
      if (i !== 0) deck.push({ id: uid(), color, type: 'number', value: i })
    }
    for (let i = 0; i < 2; i++) {
      deck.push({ id: uid(), color, type: 'skip' })
      deck.push({ id: uid(), color, type: 'reverse' })
      deck.push({ id: uid(), color, type: 'draw2' })
    }
  })

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
    newPlayers.forEach((player) => {
      player.hand.push(deck.pop())
    })
  }
  return newPlayers
}

function nextIndex(game, offset = 1) {
  return (game.currentPlayerIndex + offset * game.direction + game.players.length) % game.players.length
}

export function startGame(playerNames = ['Player 1', 'Player 2']) {
  const deck = shuffle(createDeck())
  const players = playerNames.map((name, index) => ({ id: index, name, hand: [] }))
  const dealt = deal(deck, players)
  const discardTop = deck.pop()

  return {
    players: dealt,
    drawPile: deck,
    discardTop,
    currentPlayerIndex: 0,
    direction: 1,
    unoPendingPlayer: null,
    winner: null,
    lastMessage: 'Game started',
  }
}

export function isValidPlay(card, top) {
  if (!card) return false
  if (card.type === 'wild' || card.type === 'wild+4') return true

  if (top.type === 'wild' || top.type === 'wild+4') {
    return card.color === top.color || card.color === 'wild'
  }

  if (card.color === top.color) return true
  if (card.type === 'number' && top.type === 'number' && card.value === top.value) return true
  if (card.type === top.type && card.type !== 'number') return true

  return false
}

function maybeApplyUnoPenalty(game, currentPlayerIndex) {
  const pending = game.unoPendingPlayer
  if (pending === null || pending === currentPlayerIndex) return

  const player = game.players[pending]
  if (player.hand.length === 1) {
    for (let i = 0; i < 2; i++) {
      const card = game.drawPile.pop()
      if (card) player.hand.push(card)
    }
    game.lastMessage = `${player.name} missed UNO and drew 2 cards.`
  }

  game.unoPendingPlayer = null
}

function applySpecial(game, card) {
  if (card.type === 'skip') {
    game.currentPlayerIndex = nextIndex(game, 2)
    game.lastMessage = `${game.players[game.currentPlayerIndex].name} was skipped.`
    return
  }

  if (card.type === 'reverse') {
    game.direction *= -1
    game.currentPlayerIndex = nextIndex(game, 1)
    game.lastMessage = 'Direction reversed.'
    return
  }

  if (card.type === 'draw2') {
    const target = nextIndex(game, 1)
    for (let i = 0; i < 2; i++) {
      const drawn = game.drawPile.pop()
      if (drawn) game.players[target].hand.push(drawn)
    }
    game.currentPlayerIndex = nextIndex(game, 2)
    game.lastMessage = `${game.players[target].name} drew 2 cards and was skipped.`
    return
  }

  if (card.type === 'wild+4') {
    const target = nextIndex(game, 1)
    for (let i = 0; i < 4; i++) {
      const drawn = game.drawPile.pop()
      if (drawn) game.players[target].hand.push(drawn)
    }
    game.currentPlayerIndex = nextIndex(game, 2)
    game.lastMessage = `${game.players[target].name} drew 4 cards and was skipped.`
    return
  }

  game.currentPlayerIndex = nextIndex(game, 1)
}

export function callUno(game, playerIndex) {
  if (game.unoPendingPlayer !== playerIndex) {
    game.lastMessage = 'UNO cannot be called now.'
    return game
  }

  game.unoPendingPlayer = null
  game.lastMessage = `${game.players[playerIndex].name} called UNO!`
  return game
}

export function playCard(game, playerIndex, cardId, chosenColor = null) {
  if (game.winner) return game

  maybeApplyUnoPenalty(game, playerIndex)

  const player = game.players[playerIndex]
  const idx = player.hand.findIndex((card) => card.id === cardId)
  if (idx === -1) {
    game.lastMessage = 'Card not found.'
    return game
  }

  const card = player.hand.splice(idx, 1)[0]
  if (!isValidPlay(card, game.discardTop)) {
    player.hand.splice(idx, 0, card)
    game.lastMessage = 'Invalid card play.'
    return game
  }

  if (card.type === 'wild' || card.type === 'wild+4') {
    card.color = chosenColor || 'red'
  }

  game.discardTop = card
  game.unoPendingPlayer = null
  applySpecial(game, card)

  if (player.hand.length === 1) {
    game.unoPendingPlayer = playerIndex
    game.lastMessage = `${player.name} has one card. Press UNO!`
  }

  if (player.hand.length === 0) {
    game.winner = player.name
    game.lastMessage = `${player.name} wins!`
  }

  return game
}

export function drawCard(game, playerIndex) {
  if (game.winner) return game

  maybeApplyUnoPenalty(game, playerIndex)

  const player = game.players[playerIndex]
  const card = game.drawPile.pop()
  if (card) {
    player.hand.push(card)
    if (isValidPlay(card, game.discardTop)) {
      const colorChoice = card.type === 'wild' || card.type === 'wild+4' ? 'red' : null
      return playCard(game, playerIndex, card.id, colorChoice)
    }
  }

  game.currentPlayerIndex = nextIndex(game, 1)
  if (player.hand.length === 1) {
    game.unoPendingPlayer = playerIndex
    game.lastMessage = `${player.name} has one card. Press UNO!`
  }

  return game
}
