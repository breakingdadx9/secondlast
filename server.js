const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;
const messagesFile = path.join(__dirname, 'messages.json');

app.use(express.static(path.join(__dirname, 'public')));

let messages = [];

// Load messages from file if exists
if (fs.existsSync(messagesFile)) {
  messages = fs.readJSONSync(messagesFile);
  // Filter messages from last 30 days
  const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;
  messages = messages.filter(msg => Date.now() - new Date(msg.timestamp).getTime() < THIRTY_DAYS);
}

io.on('connection', socket => {
  const userId = 'User#' + Math.random().toString(36).substr(2, 5).toUpperCase();
  console.log(`${userId} connected`);

  // Send existing messages to new user
  socket.emit('load messages', messages);

  socket.on('chat message', msgText => {
    const msg = {
      id: userId,
      text: msgText,
      timestamp: new Date().toISOString()
    };
    messages.push(msg);
    fs.writeJSON(messagesFile, messages); // save message
    io.emit('chat message', msg); // broadcast
  });
});

http.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
