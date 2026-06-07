export const initialDeck = [
  "dragao", "dragao",
  "orc", "orc",
  "mago", "mago",
  "goblin", "goblin",
  "elfo", "elfo",
  "troll", "troll",
  "arqueiro", "arqueiro",
  "cavaleiro", "cavaleiro"
];

export function fisherYatesShuffle(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export class ShuffleEngine {
  constructor(io, statsAggregator, ndjsonLogger) {
    this.io = io;
    this.statsAggregator = statsAggregator;
    this.ndjsonLogger = ndjsonLogger;
    this.isRunning = false;
    this.interval = null;
    this.executionsPerSecond = 1;
    this.duration = 0; // in seconds, 0 for infinite
    this.startTime = null;
    this.totalShuffles = 0;
  }

  start(rate, duration) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.executionsPerSecond = rate;
    this.duration = duration;
    this.startTime = Date.now();
    this.statsAggregator.reset(); // Reset stats on new start
    
    const intervalMs = 1000 / this.executionsPerSecond;
    
    this.interval = setInterval(() => {
      this.tick();
      if (this.duration > 0 && (Date.now() - this.startTime) / 1000 >= this.duration) {
        this.stop();
      }
    }, intervalMs);
  }

  tick() {
    const shuffled = fisherYatesShuffle(initialDeck);
    this.totalShuffles++;
    this.statsAggregator.addShuffle(shuffled);
    this.ndjsonLogger.log({ timestamp: Date.now(), shuffle: shuffled });
    
    this.io.emit(\'shuffle-update\', {
      execution: this.totalShuffles,
      order: shuffled.join(\'\'),
      stats: this.statsAggregator.getSummary()
    });
  }

  pause() {
    this.isRunning = false;
    clearInterval(this.interval);
  }

  stop() {
    this.pause();
    this.totalShuffles = 0;
    this.statsAggregator.reset();
    this.io.emit(\'shuffle-stopped\');
  }
}
