# 🃏 UNO Game (Simplified Version)

A simple, user-friendly UNO game built with **React (Frontend)** and **JavaScript + Hono (Backend)**.  
Designed to support **infinite players (scalable multiplayer)** with strict turn-based gameplay.

---

## 🚀 Tech Stack

### Frontend
- React
- JSON-based card image assets
- Simple UI (Play / Draw / UNO buttons)

### Backend
- JavaScript
- Hono HTTP Server
- In-memory state management (initial version)

---

## 🎮 Game Overview

- Multiplayer card game (scalable to infinite players)
- Strict sequential turn system
- First player to finish all cards wins
- Save & resume game support

---

## ✨ Features

### Core Gameplay
- Infinite player support (scalable architecture)
- Sequential turn-based system
- Deck generation & shuffle
- Initial card distribution (7 cards per player)
- Draw pile & discard pile
- Card matching rules:
  - Color
  - Number
  - Symbol

---

### Special Cards
- **Skip** → skips next player's turn
- **Reverse** → reverses play direction
- **Draw Two (+2)** → next player draws 2 cards
- **Wild** → player chooses color manually
- **Wild Draw Four (+4)** → draw 4 + choose color

---

### UNO Mechanics
- Manual **UNO button**
- Must be pressed when player has 1 card
- Missing UNO call:
  - Penalty → draw 2 cards

---

### Turn System
- Player actions:
  - Play a valid card
  - Draw a card if no valid move
- Drawn card:
  - Auto-played if valid
- Turn automatically moves to next player

---

### Game State
- Stored in memory (initial version)
- Save game support
- Resume game support

---

### UI Features
- Visual card rendering using images
- Player hand display
- Top card on discard pile
- Current player indicator
- Action buttons:
  - Play Card
  - Draw Card
  - UNO

---

### AI Support (Basic)
- Bot players supported
- Plays valid cards automatically
- Random color selection for wild cards

---

## 🧠 Game Rules (Simplified)

1. Each player starts with 7 cards  
2. Match cards by color, number, or type  
3. If no playable card → draw one  
4. Player must press UNO when 1 card remains  
5. Missing UNO → draw 2 penalty  
6. First player to finish all cards wins  

---

## 🔌 API Contract (Hono Backend)

### Base URL