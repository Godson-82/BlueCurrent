import 'dotenv/config';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { api } from './api.js';
import { Simulator } from './simulator.js';

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', api);

// Simple root so hitting the server in a browser isn't an error page.
app.get('/', (_req, res) => res.json({ service: 'BlueCurrent backend', status: 'running' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }, // dev-friendly; tighten in production
});

const simulator = new Simulator(io);
simulator.start();

io.on('connection', (socket) => {
  console.log('[socket] client connected', socket.id);
  socket.on('disconnect', () => console.log('[socket] client disconnected', socket.id));
});

server.listen(PORT, () => {
  console.log(`BlueCurrent backend listening on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
