const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// HTTP server banaya
const server = http.createServer(app);

// Socket.io ko server ke sath joda (CORS allow kiya taaki React connect kar sake)
const io = new Server(server, {
  cors: {
    origin: "*", // Abhi ke liye sabhi connections allow kiye hain
    methods: ["GET", "POST"]
  }
});

// Jab bhi koi naya player game open karega
io.on('connection', (socket) => {
  console.log(`Naya khiladi game mein aaya! ID: ${socket.id}`);

  // EVENT 1: Jab koi player dice ghumata hai
  socket.on('rollDice', (data) => {
    console.log(`Player ${data.color} ne ${data.value} roll kiya.`);
    // Jisne roll kiya use chhod kar, baaki sabhi ko data bhejo
    socket.broadcast.emit('diceRolled', data);
  });

  // EVENT 2: Jab koi player apni goti chalata hai
  socket.on('moveToken', (data) => {
    console.log(`Player ${data.color} ne goti ${data.tokenIndex} chali.`);
    // Dusre players ka board update karne ke liye data broadcast karo
    socket.broadcast.emit('tokenMoved', data);
  });

  // Jab player tab close kar deta hai
  socket.on('disconnect', () => {
    console.log(`Khiladi game chhod gaya: ${socket.id}`);
  });
});

// Server ko port 3001 par start karein
server.listen(3001, () => {
  console.log('🚀 Ludo Multiplayer Server 3001 par chal raha hai');
});