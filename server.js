const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));

let rooms = {};

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('createRoom', ({ name }) => {
    const roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
    rooms[roomId] = {
      host: socket.id,
      players: [{ id: socket.id, name, role: null }],
      maxPlayers: 0,
      rolesConfig: [],
      gameState: 'lobby'
    };
    socket.join(roomId);
    socket.emit('roomCreated', { roomId, players: rooms[roomId].players });
  });

  socket.on('joinRoom', ({ roomId, name }) => {
    const room = rooms[roomId];
    if (!room || room.gameState !== 'lobby' || room.players.length >= room.maxPlayers) {
      socket.emit('joinError', '無法加入');
      return;
    }
    room.players.push({ id: socket.id, name, role: null });
    socket.join(roomId);
    io.to(roomId).emit('updatePlayers', room.players.map(p => ({ name: p.name })));
    socket.emit('joinedRoom', { roomId, players: room.players });
  });

  // 其他事件（設定人數、角色、開始遊戲）類似，簡化版先跑起來
  // ...（後續可擴充）

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    // 清理邏輯
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
