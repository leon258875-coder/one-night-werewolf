const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));

let rooms = {}; // 儲存所有房間

io.on('connection', (socket) => {
  console.log('玩家連線:', socket.id);

  // 開房
  socket.on('createRoom', ({ name }) => {
    const roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
    rooms[roomId] = {
      host: socket.id,
      players: [{ id: socket.id, name, role: null }]
    };
    socket.join(roomId);
    socket.emit('roomCreated', { roomId });
    io.to(roomId).emit('updatePlayers', rooms[roomId].players.map(p => ({ id: p.id, name: p.name })));
  });

  // 加入房
  socket.on('joinRoom', ({ roomId, name }) => {
    const room = rooms[roomId];
    if (!room || room.players.length >= 10) { // 最多10人
      socket.emit('joinError', '房間滿了或不存在');
      return;
    }
    room.players.push({ id: socket.id, name, role: null });
    socket.join(roomId);
    io.to(roomId).emit('updatePlayers', room.players.map(p => ({ id: p.id, name: p.name })));
    socket.emit('joinedRoom', { roomId });
  });

  socket.on('disconnect', () => {
    console.log('玩家斷線:', socket.id);
    // 簡單清理（可擴充）
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log('伺服器啟動');
});
