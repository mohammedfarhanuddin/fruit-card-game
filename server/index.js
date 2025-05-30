const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
app.use(cors());

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Add keep-alive endpoint
app.get('/keep-alive', (req, res) => {
  res.status(200).send('OK');
});

// Serve static files from the public directory
app.use(express.static('public'));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins in production
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// Error handling for socket.io
io.on('error', (error) => {
  console.error('Socket.IO Error:', error);
});

const rooms = new Map();
const fruits = ['apple', 'banana', 'grapes', 'watermelon'];

class Room {
  constructor(id) {
    this.id = id;
    this.players = new Map();
    this.cards = [];
    this.gameStarted = false;
    this.currentPlayer = null;
    this.showOrder = [];
    console.log(`Room ${id} created`);
  }

  initializeGame() {
    // Create 16 cards (4 of each fruit)
    this.cards = [];
    for (const fruit of fruits) {
      for (let i = 0; i < 4; i++) {
        this.cards.push({
          id: uuidv4(),
          fruit,
          isSelected: false
        });
      }
    }
    // Shuffle cards
    this.cards.sort(() => Math.random() - 0.5);
  }

  addPlayer(socket, playerId) {
    if (this.players.size >= 4) return false;
    this.players.set(playerId, {
      socket,
      cards: [],
      score: 0
    });
    return true;
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
  }

  startGame() {
    if (this.players.size !== 4) return false;
    this.initializeGame();
    this.gameStarted = true;
    this.currentPlayer = Array.from(this.players.keys())[Math.floor(Math.random() * 4)];
    this.broadcastGameState();
    return true;
  }

  selectCard(playerId, cardId) {
    if (!this.gameStarted || this.currentPlayer !== playerId) return;
    const card = this.cards.find(c => c.id === cardId);
    if (card && !card.isSelected) {
      card.isSelected = true;
      const player = this.players.get(playerId);
      player.cards.push(card);
      this.broadcastGameState();
    }
  }

  broadcastGameState() {
    const gameState = {
      cards: this.cards,
      currentPlayer: this.currentPlayer,
      started: this.gameStarted
    };
    this.players.forEach((player, id) => {
      player.socket.emit('gameState', {
        ...gameState,
        playerCards: player.cards
      });
    });
  }

  checkWinCondition() {
    this.players.forEach((player, id) => {
      const fruitCounts = {};
      player.cards.forEach(card => {
        fruitCounts[card.fruit] = (fruitCounts[card.fruit] || 0) + 1;
      });
      if (Object.values(fruitCounts).some(count => count === 4)) {
        this.showOrder.push(id);
        if (this.showOrder.length === 4) {
          this.calculateScores();
        }
      }
    });
  }

  calculateScores() {
    const scores = [400, 300, 200, 100];
    this.showOrder.forEach((playerId, index) => {
      const player = this.players.get(playerId);
      player.score += scores[index];
    });
    this.showOrder = [];
    this.broadcastGameState();
  }
}

io.on('connection', (socket) => {
  console.log('New client connected');
  let currentRoom = null;
  let playerId = uuidv4();

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  socket.on('createRoom', () => {
    try {
      const roomId = uuidv4();
      const room = new Room(roomId);
      rooms.set(roomId, room);
      currentRoom = room;
      socket.join(roomId);
      socket.emit('roomCreated', roomId);
      console.log(`Room ${roomId} created by player ${playerId}`);
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('error', 'Failed to create room');
    }
  });

  socket.on('joinRoom', (roomId) => {
    const room = rooms.get(roomId);
    if (room && room.addPlayer(socket, playerId)) {
      currentRoom = room;
      socket.join(roomId);
      socket.emit('joinedRoom', roomId);
      room.broadcastGameState();
    } else {
      socket.emit('joinError', 'Room is full or does not exist');
    }
  });

  socket.on('joinRandom', () => {
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.size < 4) {
        if (room.addPlayer(socket, playerId)) {
          currentRoom = room;
          socket.join(roomId);
          socket.emit('joinedRoom', roomId);
          room.broadcastGameState();
          return;
        }
      }
    }
    socket.emit('joinError', 'No available rooms');
  });

  socket.on('startGame', () => {
    if (currentRoom) {
      currentRoom.startGame();
    }
  });

  socket.on('selectCard', (cardId) => {
    if (currentRoom) {
      currentRoom.selectCard(playerId, cardId);
    }
  });

  socket.on('showCards', () => {
    if (currentRoom) {
      currentRoom.checkWinCondition();
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    if (currentRoom) {
      currentRoom.removePlayer(playerId);
      if (currentRoom.players.size === 0) {
        rooms.delete(currentRoom.id);
        console.log(`Room ${currentRoom.id} deleted`);
      } else {
        currentRoom.broadcastGameState();
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Server is ready to accept connections');
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
}); 