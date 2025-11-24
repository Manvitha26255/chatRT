// const express  = require('express');
// const cors = require('cors')
// const app = express();
// const authRouter = require('./controllers/authController');
// const userRouter = require('./controllers/userController');
// const chatRouter = require('./controllers/chatController');
// const messageRouter = require('./controllers/messageController');

// let onlineUser = []; // changed to let (not const) so we can reassign

// // use auth controller routers
// app.use(cors());
// app.use(express.json({ limit: '50mb' }));

// const server = require('http').createServer(app);

// const io = require('socket.io')(server, {
//   cors: {
//     origin: 'http://localhost:3000',
//     methods: ['GET', 'POST']
//   }
// });

// app.use('/api/auth', authRouter);
// app.use('/api/user', userRouter);
// app.use('/api/chat', chatRouter);

// app.use('/api/message', messageRouter);

// // test connection from client 
// io.on('connection', (socket) => {

//   socket.on('join-room', (userid) => {
//     socket.join(userid);
//   });

//   socket.on('send-message', (message) => {
//     io.to(message.members[0])
//       .to(message.members[1])
//       .emit('receive-message', message)

//       io.to(message.members[0])
//       .to(message.members[1])
//       .emit('set-message-count', message);
//   });

//   socket.on('clear-unread-messages', (data) => {
//     io.to(data.members[0])
//       .to(data.members[1])
//       .emit('message-count-cleared', data);
//   });

//   socket.on('user-typing', (data) => {
//     io.to(data.members[0])
//       .to(data.members[1])
//       .emit('started-typing', data);
//   });

//   socket.on('user-login', (userId) => {
//     if (!onlineUser.includes(userId)) {
//       onlineUser.push(userId);
//     }
//     socket.emit('online-users', onlineUser);
//   });

//   socket.on('user-offline', (userId) => {
//     onlineUser = onlineUser.filter((user) => user !== userId);
//     //onlineUser = onlineUser.splice(onlineUser.indexOf(userId),1)
//     io.emit('online-users-updated', onlineUser);
//   });

// });

// module.exports = server;
// server/app.js
const express = require("express");
const cors = require("cors");
const app = express();

const authRouter = require("./controllers/authController");
const userRouter = require("./controllers/userController");
const chatRouter = require("./controllers/chatController");
const messageRouter = require("./controllers/messageController");

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);

// create server & socket.io in this file and export the server (you're already doing this in server.js)
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

let onlineUsers = new Set();

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);

  // client should emit 'join-room' with their userId after connecting
  socket.on("join-room", (userId) => {
    if (!userId) return;
    socket.join(userId);
    onlineUsers.add(userId);
    // notify the joining client of current online users
    socket.emit("online-users", Array.from(onlineUsers));
    // notify everyone that online users list changed
    io.emit("online-users-updated", Array.from(onlineUsers));
    console.log(`User ${userId} joined room ${userId}`);
  });

  socket.on("send-message", (message) => {
    try {
      // message.members is expected to be an array of userIds [userA, userB]
      if (!Array.isArray(message.members)) return;

      // emit to both members' rooms (if they joined)
      message.members.forEach((memberId) => {
        io.to(memberId).emit("receive-message", message);
        io.to(memberId).emit("set-message-count", message);
      });
    } catch (err) {
      console.error("send-message error:", err);
    }
  });

  socket.on("clear-unread-messages", (data) => {
    try {
      if (!Array.isArray(data.members)) return;
      data.members.forEach((memberId) => {
        io.to(memberId).emit("message-count-cleared", data);
      });
    } catch (err) {
      console.error("clear-unread-messages error:", err);
    }
  });

  socket.on("user-typing", (data) => {
    try {
      if (!Array.isArray(data.members)) return;
      data.members.forEach((memberId) => {
        io.to(memberId).emit("started-typing", data);
      });
    } catch (err) {
      console.error("user-typing error:", err);
    }
  });

  socket.on("user-offline", (userId) => {
    if (userId) {
      onlineUsers.delete(userId);
      io.emit("online-users-updated", Array.from(onlineUsers));
    }
  });

  socket.on("disconnect", () => {
    // optional: you could remove socket.id mapping here if you track multiple sockets per user
    console.log("socket disconnected:", socket.id);
  });
});

module.exports = server;
