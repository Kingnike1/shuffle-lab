import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { ShuffleEngine } from './services/shuffleService.js';
import { StatisticsAggregator } from './services/StatisticsAggregator.js';
import { NDJSONLogger } from './services/NDJSONLogger.js';
import { ReportPersister } from './services/ReportPersister.js';
import { SystemMonitor } from './services/SystemMonitor.js';

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

const dataPath = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

const statsAggregator = new StatisticsAggregator();
const ndjsonLogger = new NDJSONLogger(dataPath, 'shuffle_history', 100);
const reportPersister = new ReportPersister(statsAggregator, dataPath, 'relatorio.json', 5000);
const systemMonitor = new SystemMonitor(dataPath);

const shuffleEngine = new ShuffleEngine(io, statsAggregator, ndjsonLogger);

// Socket logic
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Send initial stats on connection
  socket.emit('stats-update', statsAggregator.getSummary());

  socket.on('start-shuffle', (data) => {
    const { rate, duration } = data;
    shuffleEngine.start(Number(rate), Number(duration));
    reportPersister.start();
  });

  socket.on('pause-shuffle', () => {
    shuffleEngine.pause();
    reportPersister.stop();
  });

  socket.on('stop-shuffle', () => {
    shuffleEngine.stop();
    reportPersister.stop();
    ndjsonLogger.close(); // Close the current NDJSON log file
  });

  socket.on('request-stats', () => {
    socket.emit('stats-update', statsAggregator.getSummary());
  });

  // System Metrics
  const metricsInterval = setInterval(async () => {
    const metrics = await systemMonitor.getMetrics();
    socket.emit('system-metrics', {
      memory: `${metrics.memory.heapUsed} MB (RSS: ${metrics.memory.rss} MB)`,
      cpu: metrics.cpu,
      disk: `${metrics.disk.used} / ${metrics.disk.total} (${metrics.disk.usePercentage})`,
      avgTime: (shuffleEngine.executionsPerSecond > 0 ? (1000 / shuffleEngine.executionsPerSecond).toFixed(4) : 0) + 'ms'
    });
  }, 1000);

  socket.on('disconnect', () => {
    clearInterval(metricsInterval);
    console.log('Client disconnected');
  });
});

// API Routes
app.get('/api/export/json', (req, res) => {
  // This route now exports the in-memory history, not the full NDJSON log
  const data = statsAggregator.getSummary();
  res.setHeader('Content-disposition', 'attachment; filename=historico.json');
  res.set('Content-Type', 'application/json');
  res.status(200).send(JSON.stringify(data.history, null, 2));
});

app.get('/api/export/report', (req, res) => {
  reportPersister.saveReport(); // Ensure latest report is saved
  const filePath = path.join(dataPath, 'relatorio.json');
  res.download(filePath, (err) => {
    if (err) {
      console.error('Erro ao baixar relatório:', err);
      res.status(500).send('Erro ao gerar relatório.');
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`\n================================================`);
  console.log(`  Shuffle Lab Server iniciado com sucesso!`);
  console.log(`  Acesse: http://localhost:${PORT}`);
  console.log(`================================================\n`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  shuffleEngine.stop();
  reportPersister.stop();
  ndjsonLogger.close();
  httpServer.close(() => {
    console.log('Server gracefully terminated.');
    process.exit(0);
  });
});
