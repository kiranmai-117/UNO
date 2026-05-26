import { Hono } from 'hono'
import { createServer } from 'node:http'
import { WebSocketServer } from 'ws'
import { startGame, playCard, drawCard, callUno } from '../src/game/engine.js'

const app = new Hono()
app.use('*', async (c, next) => {
  if (c.req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:5173',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  await next()
  const res = c.res || new Response(null, { status: 204 })
  res.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173')
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return res
})

const rooms = new Map()

function generateId(length = 6) {
  return Math.random().toString(36).slice(2, 2 + length).toUpperCase()
}

function getPublicState(room) {
  if (!room.game) {
    return {
      roomId: room.id,
      players: room.players.map((player) => ({ id: player.playerId, name: player.name, cardCount: 0 })),
      gameStarted: false,
      currentPlayerIndex: 0,
      discardTop: null,
      drawPileCount: 0,
      winner: null,
      lastMessage: 'Waiting for a second player to join.',
      unoPendingPlayer: null,
    }
  }

  return {
    roomId: room.id,
    players: room.game.players.map((player) => ({ id: player.id, name: player.name, cardCount: player.hand.length })),
    gameStarted: true,
    currentPlayerIndex: room.game.currentPlayerIndex,
    discardTop: room.game.discardTop,
    drawPileCount: room.game.drawPile.length,
    winner: room.game.winner,
    lastMessage: room.game.lastMessage,
    unoPendingPlayer: room.game.unoPendingPlayer,
  }
}

function sendToSocket(ws, type, payload) {
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({ type, payload }))
  }
}

function broadcastRoom(room) {
  room.players.forEach((player) => {
    if (!player.ws || player.ws.readyState !== 1) return
    const publicState = getPublicState(room)
    const hand = room.game ? room.game.players[player.playerId].hand : []
    sendToSocket(player.ws, 'roomState', { roomState: publicState, hand })
  })
}

function findRoomBySocket(ws) {
  for (const room of rooms.values()) {
    const player = room.players.find((p) => p.ws === ws)
    if (player) return room
  }
  return null
}

function findPlayerBySession(room, sessionId) {
  return room?.players?.find((player) => player.sessionId === sessionId)
}

app.post('/api/create-room', async (c) => {
  const { name } = await c.req.json()
  if (!name) return c.json({ error: 'Name is required' }, 400)

  const roomId = generateId(6)
  const sessionId = generateId(12)
  const room = {
    id: roomId,
    players: [{ name, sessionId, playerId: 0, ws: null }],
    game: null,
  }
  rooms.set(roomId, room)

  return c.json({ roomId, sessionId, playerId: 0 })
})

app.post('/api/join-room', async (c) => {
  const { name, roomId } = await c.req.json()
  if (!name || !roomId) return c.json({ error: 'Name and roomId are required' }, 400)
  const room = rooms.get(roomId)
  if (!room) return c.json({ error: 'Room not found' }, 404)
  if (room.players.length >= 2) return c.json({ error: 'Room is full' }, 400)

  const sessionId = generateId(12)
  const playerId = 1
  room.players.push({ name, sessionId, playerId, ws: null })
  room.game = startGame(room.players.map((player) => player.name))
  room.game.lastMessage = 'Game started. Waiting for players to connect.'

  return c.json({ roomId, sessionId, playerId })
})

app.get('/api/room/:roomId', (c) => {
  const roomId = c.req.param('roomId')
  const room = rooms.get(roomId)
  if (!room) return c.json({ error: 'Room not found' }, 404)
  return c.json({ room: getPublicState(room) })
})

app.get('/health', () => new Response('OK'))

const server = createServer((req, res) => {
  const options = {
    method: req.method,
    headers: req.headers,
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    options.body = req
    options.duplex = 'half'
  }
  app.fetch(new Request(`http://localhost:3000${req.url}`, options))
    .then(async (response) => {
      res.writeHead(response.status, response.statusText, [...response.headers])
      if (response.body) {
        const reader = response.body.getReader()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            res.write(value)
          }
        } finally {
          reader.releaseLock()
        }
      }
      res.end()
    })
    .catch((err) => {
      console.error('hono error', err)
      if (!res.headersSent) {
        res.writeHead(500)
      }
      res.end('Internal Server Error')
    })
})
const wss = new WebSocketServer({ server, path: '/ws' })

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let message
    try {
      message = JSON.parse(raw.toString())
    } catch (e) {
      return sendToSocket(ws, 'error', { message: 'Invalid JSON' })
    }

    const { type, roomId, sessionId, name, cardId, chosenColor } = message
    const room = rooms.get(roomId)

    if (type === 'join') {
      if (!room) return sendToSocket(ws, 'error', { message: 'Room not found' })
      const player = findPlayerBySession(room, sessionId)
      if (!player) return sendToSocket(ws, 'error', { message: 'Invalid session' })

      player.ws = ws
      player.name = name
      if (!room.game && room.players.length === 2) {
        room.game = startGame(room.players.map((player) => player.name))
        room.game.lastMessage = 'Game started.'
      }

      broadcastRoom(room)
      return
    }

    if (!room) return sendToSocket(ws, 'error', { message: 'Room not found' })
    const player = findPlayerBySession(room, sessionId)
    if (!player) return sendToSocket(ws, 'error', { message: 'Invalid session' })
    if (!room.game) return sendToSocket(ws, 'error', { message: 'Game has not started yet' })

    if (type === 'play-card') {
      playCard(room.game, player.playerId, cardId, chosenColor)
      broadcastRoom(room)
      return
    }

    if (type === 'draw-card') {
      drawCard(room.game, player.playerId)
      broadcastRoom(room)
      return
    }

    if (type === 'call-uno') {
      callUno(room.game, player.playerId)
      broadcastRoom(room)
      return
    }

    sendToSocket(ws, 'error', { message: 'Unknown message type' })
  })

  ws.on('close', () => {
    const room = findRoomBySocket(ws)
    if (!room) return
    const player = room.players.find((p) => p.ws === ws)
    if (player) player.ws = null
    if (room.players.every((p) => !p.ws)) {
      rooms.delete(room.id)
      return
    }
    broadcastRoom(room)
  })
})

server.listen(3000, () => {
  console.log('Hono multiplayer server listening on http://localhost:3000')
})
