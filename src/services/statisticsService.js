import fs from 'fs';
import path from 'path';

export class StatisticsService {
  constructor() {
    this.reset();
    this.dataPath = path.join(process.cwd(), 'src', 'data');
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
  }

  reset() {
    this.totalExecutions = 0;
    this.uniqueOrders = new Set();
    this.repetitions = 0;
    this.consecutiveRepetitions = 0;
    this.lastOrder = null;
    this.startTime = null;
    this.endTime = null;
    
    // Frequency: position -> card -> count
    this.frequencyMap = Array.from({ length: 16 }, () => ({}));
    
    // Adjacent pairs: card-card -> count
    this.adjacentPairs = {};
    
    // History for table (last 100)
    this.history = [];
  }

  addResult(order) {
    if (!this.startTime) this.startTime = Date.now();
    this.totalExecutions++;
    
    const orderStr = order.join(',');
    
    // Uniqueness and repetitions
    if (this.uniqueOrders.has(orderStr)) {
      this.repetitions++;
    } else {
      this.uniqueOrders.add(orderStr);
    }

    // Consecutive repetitions
    if (this.lastOrder === orderStr) {
      this.consecutiveRepetitions++;
    }
    this.lastOrder = orderStr;

    // Position Frequency
    order.forEach((card, index) => {
      this.frequencyMap[index][card] = (this.frequencyMap[index][card] || 0) + 1;
    });

    // Adjacent Pairs
    for (let i = 0; i < order.length - 1; i++) {
      if (order[i] === order[i+1]) {
        const pair = `${order[i]}-${order[i+1]}`;
        this.adjacentPairs[pair] = (this.adjacentPairs[pair] || 0) + 1;
      }
    }

    // Update history
    this.history.unshift({ execution: this.totalExecutions, order: orderStr });
    if (this.history.length > 100) this.history.pop();
    
    this.endTime = Date.now();
  }

  getEntropy() {
    if (this.totalExecutions < 10) return "Aguardando dados...";
    // Simple entropy heuristic based on uniqueness ratio
    const ratio = this.uniqueOrders.size / this.totalExecutions;
    if (ratio > 0.99) return "Excelente";
    if (ratio > 0.90) return "Boa";
    return "Ruim";
  }

  getSummary() {
    const elapsed = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
    
    return {
      totalExecutions: this.totalExecutions,
      uniqueOrders: this.uniqueOrders.size,
      repetitions: this.repetitions,
      consecutiveRepetitions: this.consecutiveRepetitions,
      elapsedTime: elapsed,
      entropy: this.getEntropy(),
      history: this.history,
      frequencyMap: this.frequencyMap,
      adjacentPairs: this.adjacentPairs
    };
  }

  exportReport() {
    const report = {
      totalExecutions: this.totalExecutions,
      uniqueOrders: this.uniqueOrders.size,
      repetitions: this.repetitions,
      consecutiveRepetitions: this.consecutiveRepetitions,
      frequencyPorPosicao: this.frequencyMap,
      paresAdjacentes: this.adjacentPairs,
      timestampInicio: this.startTime,
      timestampFim: this.endTime
    };
    
    const filePath = path.join(this.dataPath, 'relatorio.json');
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
    return filePath;
  }
}
