const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

const rooms = new Map();
const words = ['dog', 'cat', 'house', 'tree', 'car', 'book', 'phone', 'computer'];

function createRoom() {
  return {
    id: uuidv4(),
    players: new Map(),
    currentDrawer: null,
    word: null,
    scores: new Map(),
    status: 'waiting'
  };
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createRoom', (playerName, callback) => {
    const room = createRoom();
    rooms.set(room.id, room);
    socket.join(room.id);
    room.players.set(socket.id, { name: playerName, score: 0 });
    callback(room.id);
  });

  socket.on('joinRoom', (roomId, playerName, callback) => {
    const room = rooms.get(roomId);
    if (!room) {
      callback({ error: 'Room not found' });
      return;
    }
    
    socket.join(roomId);
    room.players.set(socket.id, { name: playerName, score: 0 });
    callback({ success: true });
    
    if (room.players.size >= 2 && room.status === 'waiting') {
      startGame(roomId);
    }
  });

  socket.on('draw', (roomId, drawData) => {
    const room = rooms.get(roomId);
    if (room && socket.id === room.currentDrawer) {
      socket.to(roomId).emit('draw', drawData);
    }
  });

  socket.on('guess', (roomId, guess) => {
    const room = rooms.get(roomId);
    if (!room || socket.id === room.currentDrawer || !room.word) return;

    if (guess.toLowerCase() === room.word.toLowerCase()) {
      const player = room.players.get(socket.id);
      player.score += 100;
      io.to(roomId).emit('correctGuess', { 
        playerId: socket.id, 
        playerName: player.name,
        score: player.score 
      });
      
      if ([...room.players.values()].every(p => p.score > 0)) {
        nextRound(roomId);
      }
    }
  });

  socket.on('disconnect', () => {
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.has(socket.id)) {
        room.players.delete(socket.id);
        if (room.players.size === 0) {
          rooms.delete(roomId);
        } else if (socket.id === room.currentDrawer) {
          nextRound(roomId);
        }
      }
    }
  });
});

function startGame(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.status = 'playing';
  nextRound(roomId);
}

function nextRound(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  const players = [...room.players.keys()];
  const nextDrawerIndex = room.currentDrawer 
    ? (players.indexOf(room.currentDrawer) + 1) % players.length 
    : 0;
    
  room.currentDrawer = players[nextDrawerIndex];
  room.word = words[Math.floor(Math.random() * words.length)];

  io.to(roomId).emit('newRound', {
    drawer: room.currentDrawer,
    drawerName: room.players.get(room.currentDrawer).name
  });
  
  io.to(room.currentDrawer).emit('wordToGuess', room.word);
}

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});