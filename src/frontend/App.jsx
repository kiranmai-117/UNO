import React, { useEffect, useRef, useState } from "react";
import PlayerHand from "./components/PlayerHand";
import GameBoard from "./components/GameBoard";
import PlayerSummary from "./components/PlayerSummary";

const API_BASE = "http://localhost:3000/api";
const WS_URL = "ws://localhost:3000/ws";

export default function App() {
  const [playerName, setPlayerName] = useState("Player");
  const [roomId, setRoomId] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [roomState, setRoomState] = useState(null);
  const [hand, setHand] = useState([]);
  const [status, setStatus] = useState(
    "Enter a name to create or join a room.",
  );
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(""), 2000);
    return () => clearTimeout(timer);
  }, [status]);

  const connectSocket = (roomIdValue, sessionIdValue, name) => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      setStatus("Connected to server. Joining room...");
      socket.send(
        JSON.stringify({
          type: "join",
          roomId: roomIdValue,
          sessionId: sessionIdValue,
          name,
        }),
      );
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "roomState") {
        const { roomState: newState, hand: newHand } = message.payload;
        setRoomState(newState);
        setHand(newHand);
        setStatus(newState.lastMessage || "Room updated.");
      }
      if (message.type === "error") {
        setStatus(message.payload.message);
      }
    };

    socket.onclose = () => {
      setConnected(false);
      setStatus("Disconnected from server.");
    };

    socket.onerror = () => {
      setStatus("WebSocket error occurred.");
    };
  };

  const createRoom = async () => {
    if (!playerName.trim()) {
      setStatus("Please enter your name.");
      return;
    }
    const response = await fetch(`${API_BASE}/create-room`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: playerName }),
    });
    const data = await response.json();
    if (!response.ok || data.error) {
      setStatus(data.error || "Failed to create room.");
      return;
    }
    setRoomCode(data.roomId);
    setSessionId(data.sessionId);
    setPlayerId(data.playerId);
    connectSocket(data.roomId, data.sessionId, playerName);
    setStatus("Room created. Waiting for another player...");
  };

  const joinRoom = async () => {
    if (!playerName.trim() || !roomId.trim()) {
      setStatus("Please enter both your name and a room code.");
      return;
    }
    const response = await fetch(`${API_BASE}/join-room`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: playerName,
        roomId: roomId.trim().toUpperCase(),
      }),
    });
    const data = await response.json();
    if (!response.ok || data.error) {
      setStatus(data.error || "Failed to join room.");
      return;
    }
    setRoomCode(data.roomId);
    setSessionId(data.sessionId);
    setPlayerId(data.playerId);
    connectSocket(data.roomId, data.sessionId, playerName);
    setStatus("Joined room. Connecting to game...");
  };

  const sendAction = (action) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setStatus("WebSocket is not connected yet.");
      return;
    }
    socketRef.current.send(JSON.stringify(action));
  };

  const handlePlay = (cardId, cardType) => {
    if (cardType === "wild" || cardType === "wild+4") {
      const color = window.prompt(
        "Choose wild color: red, yellow, green, blue",
        "red",
      );
      if (
        !color ||
        !["red", "yellow", "green", "blue"].includes(color.toLowerCase())
      ) {
        setStatus("Invalid color selected.");
        return;
      }
      sendAction({
        type: "play-card",
        roomId: roomCode,
        sessionId,
        cardId,
        chosenColor: color.toLowerCase(),
      });
      return;
    }
    sendAction({ type: "play-card", roomId: roomCode, sessionId, cardId });
  };

  const handleDraw = () => {
    sendAction({ type: "draw-card", roomId: roomCode, sessionId });
  };

  const handleUno = () => {
    sendAction({ type: "call-uno", roomId: roomCode, sessionId });
  };

  const isGameReady = roomState?.gameStarted;
  const currentPlayer = roomState?.players?.[roomState.currentPlayerIndex];
  const isPlayerTurn = isGameReady && currentPlayer?.id === playerId;
  const showUno =
    isGameReady && roomState.unoPendingPlayer === playerId && hand.length === 1;

  return (
    <div className="app">
      {status ? <div className="notification-banner">{status}</div> : null}

      {!roomCode ? (
        <div className="lobby-form">
          <div>
            <label>
              Name
              <input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </label>
          </div>
          <div className="lobby-actions">
            <button onClick={createRoom}>Create Room</button>
          </div>
          <div>
            <label>
              Room Code
              <input
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              />
            </label>
          </div>
          <div className="lobby-actions">
            <button onClick={joinRoom}>Join Room</button>
          </div>
        </div>
      ) : (
        <>
          <div className="room-info">
            <div className="room-code-label">
              Room Code:
              <input
                className="room-code-input"
                value={roomCode}
                readOnly
                onFocus={(e) => e.target.select()}
                onClick={(e) => e.target.select()}
              />
            </div>
          </div>

          <div className="game-page">
            <div className="players">
              <PlayerSummary
                players={roomState?.players || []}
                currentPlayerIndex={roomState?.currentPlayerIndex || 0}
                selfId={playerId}
              />
            </div>

            <div className="center-area">
              <div className="pile">
                <GameBoard topCard={roomState?.discardTop} />
              </div>
              <div
                className={`deck ${isGameReady && isPlayerTurn ? "deck--active" : "deck--disabled"}`}
                onClick={isGameReady && isPlayerTurn ? handleDraw : undefined}
                role={isGameReady && isPlayerTurn ? "button" : undefined}
                tabIndex={isGameReady && isPlayerTurn ? 0 : undefined}
              >
                <div className="deck-label">UNO</div>
              </div>
            </div>

            <div
              className={`bottom-area ${!isPlayerTurn ? "hand-disabled" : ""}`}
            >
              {isGameReady ? (
                <>
                  <PlayerHand
                    hand={hand}
                    disabled={!isPlayerTurn}
                    onPlay={(cardId) => {
                      const card = hand.find((c) => c.id === cardId);
                      handlePlay(cardId, card?.type);
                    }}
                  />
                  <button
                    className="uno-btn"
                    onClick={handleUno}
                    disabled={!showUno}
                  >
                    UNO
                  </button>
                </>
              ) : (
                <div className="waiting-pane">
                  Waiting for second player to join...
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
