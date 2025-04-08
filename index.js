import { app, httpServer } from './src/app.js';
import { Server } from 'socket.io';
import { winston } from './src/lib.js';

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  winston.info('WebSocket client connected');
  socket.on('webrtc-offer', (data) => {
    socket.to(data.receiverId).emit('webrtc-offer', data);
  });
  socket.on('webrtc-answer', (data) => {
    socket.to(data.callerId).emit('webrtc-answer', data);
  });
  socket.on('webrtc-ice-candidate', (data) => {
    socket.to(data.targetId).emit('webrtc-ice-candidate', data);
  });
  socket.on('disconnect', () => winston.info('WebSocket client disconnected'));
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => winston.info(`Server running on port ${PORT}, GraphQL at /graphql, Swagger at /api-docs`));