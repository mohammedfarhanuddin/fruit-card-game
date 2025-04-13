# Fruit Card Game

A multiplayer card game where players collect sets of fruit cards and compete to be the first to show their complete set.

## Features

- Create or join game rooms
- Support for 4 players per room
- Real-time multiplayer gameplay
- Card selection and trading mechanics
- Score tracking system

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
2. Install dependencies for both client and server:

```bash
# Install client dependencies
npm install

# Install server dependencies
cd server
npm install
```

### Running the Game

1. Start the server:
```bash
cd server
npm start
```

2. Start the client:
```bash
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

## How to Play

1. Create a room or join an existing one
2. Wait for 4 players to join
3. Once all players are ready, the game will start
4. Each player selects 4 cards from the center
5. Players take turns passing cards to their right
6. When a player has 4 cards of the same fruit, they can click "Show"
7. Other players must click "Show" as quickly as possible
8. Points are awarded based on the order of showing:
   - First to show: 400 points
   - Second: 300 points
   - Third: 200 points
   - Fourth: 100 points
9. The game continues for 5 rounds
10. The player with the highest total score wins

## Technologies Used

- React
- TypeScript
- Socket.io
- Express
- Styled Components 