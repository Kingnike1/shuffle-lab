import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

import { ShuffleEngine } from './services/shuffleService.js';
import { StatisticsService } from './services/statisticsService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const statsService = new StatisticsService();
const shuffleEngine = new ShuffleEngine(io, statsService);

// Socket logic
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('start-shuffle', (data) => {
    const { rate, duration } = data;
    shuffleEngine.start(Number(rate), Number(duration));
  });

  socket.on('pause-shuffle', () => {
    shuffleEngine.pause();
  });

  socket.on('stop-shuffle', () => {
    shuffleEngine.stop();
  });

  socket.on('request-stats', () => {
    socket.emit('stats-update', statsService.getSummary());
  });

  // Stress Test metrics
  const metricsInterval = setInterval(() => {
    if (shuffleEngine.isRunning) {
      const mem = process.memoryUsage();
      const cpus = os.cpus();
      socket.emit('system-metrics', {
        memory: (mem.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
        cpu: (os.loadavg()[0]).toFixed(2),
        avgTime: (1000 / shuffleEngine.executionsPerSecond).toFixed(4) + 'ms'
      });
    }
  }, 1000);

  socket.on('disconnect', () => {
    clearInterval(metricsInterval);
  });
});

// API Routes
app.get('/api/export/json', (req, res) => {
  const data = statsService.getSummary();
  res.setHeader('Content-disposition', 'attachment; filename=historico.json');
  res.set('Content-Type', 'application/json');
  res.status(200).send(JSON.stringify(data.history));
});

app.get('/api/export/report', (req, res) => {
  const filePath = statsService.exportReport();
  res.download(filePath);
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
