// server.js - Main server for the real-time chat app
// Uses Express to serve static files and Socket.IO for real-time events

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// In-memory store of connected users: socketId -> { id, name, gender }
const users = new Map();

// Optional in-memory conversation store (runtime only)
// Key format: "minId_maxId" -> [{ fromId, toId, text, ts }]
const conversations = new Map();

// Helper to build a deterministic conversation key
function convoKey(a, b){
  if (!a || !b) return null;
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // Handle a user joining with either a string name (legacy) or { name, gender }
  socket.on('join', (payload) => {
    try {
      let name = 'Anonymous';
      let gender = 'unspecified';

      if (payload && typeof payload === 'object'){
        name = String(payload.name || 'Anonymous').trim().slice(0,50) || 'Anonymous';
        gender = String(payload.gender || 'unspecified').trim().slice(0,30) || 'unspecified';
      } else if (typeof payload === 'string'){
        name = payload.trim().slice(0,50) || 'Anonymous';
      }

      const user = { id: socket.id, name, gender };
      users.set(socket.id, user);

      // Broadcast system notification to others
      socket.broadcast.emit('system', {
        type: 'join',
        message: `${name} joined the chat`,
        ts: Date.now()
      });

      // Publish updated user list to everyone (array of user objects)
      io.emit('users', Array.from(users.values()));

      console.log(`${name} joined (${socket.id})`);
    } catch (err) {
      console.error('Error in join handler:', err);
      socket.emit('error', 'Unable to join chat');
    }
  });

  // Handle private messages: { to: socketId, text }
  socket.on('private message', (data) => {
    try {
      if (!data || typeof data !== 'object') return;
      const to = String(data.to || '');
      const text = String(data.text || '').trim();
      if (!to || !text) return;

      const from = users.get(socket.id);
      const target = users.get(to);
      if (!from) return socket.emit('error', 'Sender not registered');
      if (!target) return socket.emit('error', 'Target user not found or offline');

      const payload = { fromId: socket.id, fromName: from.name, text, ts: Date.now() };

      // Save in-memory conversation history
      const key = convoKey(socket.id, to);
      if (key) {
        const list = conversations.get(key) || [];
        list.push({ fromId: socket.id, toId: to, text, ts: Date.now() });
        conversations.set(key, list);
      }

      // Forward to recipient
      io.to(to).emit('private message', payload);
      // Echo to sender as well (allows clients to show delivered messages)
      socket.emit('private message', payload);
    } catch (err) {
      console.error('Error in private message handler:', err);
      socket.emit('error', 'Unable to deliver private message');
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    try {
      const user = users.get(socket.id);
      if (user) {
        users.delete(socket.id);

        // Notify others that user left
        socket.broadcast.emit('system', {
          type: 'leave',
          message: `${user.name} left the chat`,
          ts: Date.now()
        });

        // Update user list
        io.emit('users', Array.from(users.values()));
        console.log(`${user.name} disconnected (${socket.id})`);
      }
    } catch (err) {
      console.error('Error during disconnect:', err);
    }
  });

  // Generic socket error logging
  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });
});

// Basic health endpoint
app.get('/health', (req, res) => res.send({ status: 'ok' }));

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
