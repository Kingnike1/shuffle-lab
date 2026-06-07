const socket = io({
    reconnectionAttempts: 5,
    timeout: 10000
});

socket.on('connect', () => console.log('Conectado ao servidor Shuffle Lab'));
socket.on('connect_error', (err) => console.error('Erro de conexão:', err.message));

// DOM Elements
const rateInput = document.getElementById('rate');
const durationInput = document.getElementById('duration');
const btnStart = document.getElementById('btnStart');
const btnPause = document.getElementById('btnPause');
const btnStop = document.getElementById('btnStop');
const totalShufflesEl = document.getElementById('totalShuffles');
const uniqueOrdersEl = document.getElementById('uniqueOrders');
const repetitionsEl = document.getElementById('repetitions');
const consecutiveEl = document.getElementById('consecutive');
const timerEl = document.getElementById('timer');
const historyBody = document.getElementById('historyBody');
const heatmapContainer = document.getElementById('heatmapContainer');
const entropyBadge = document.getElementById('entropyBadge');
const pairsList = document.getElementById('pairsList');
const cpuUsageEl = document.getElementById('cpuUsage');
const memUsageEl = document.getElementById('memUsage');
const diskUsageEl = document.getElementById(\'diskUsage\');
const avgTimeEl = document.getElementById(\'avgTime\');

const cards = ["dragao", "orc", "mago", "goblin", "elfo", "troll", "arqueiro", "cavaleiro"];

// State
let lastStats = null;

// Initialize Heatmap Grid
function initHeatmap() {
    let html = '<table class="w-full text-xs border-collapse">';
    html += '<thead><tr><th class="p-1 border">Carta \\ Pos</th>';
    for (let i = 1; i <= 16; i++) html += `<th class="p-1 border">${i}</th>`;
    html += '</tr></thead><tbody>';
    
    cards.forEach(card => {
        html += `<tr><td class="p-1 border font-bold capitalize bg-gray-50">${card}</td>`;
        for (let i = 0; i < 16; i++) {
            html += `<td id="cell-${card}-${i}" class="p-1 border text-center heatmap-cell" style="background-color: rgba(79, 70, 229, 0)">0%</td>`;
        }
        html += '</tr>';
    });
    html += '</tbody></table>';
    heatmapContainer.innerHTML = html;
}

function updateHeatmap(freqMap, total) {
    if (total === 0) return;
    cards.forEach(card => {
        for (let i = 0; i < 16; i++) {
            const count = freqMap[i][card] || 0;
            const percent = ((count / total) * 100).toFixed(1);
            const cell = document.getElementById(`cell-${card}-${i}`);
            if (cell) {
                cell.innerText = `${percent}%`;
                const alpha = Math.min(count / (total / 8) * 0.8, 1); // Normalize color intensity
                cell.style.backgroundColor = `rgba(79, 70, 229, ${alpha})`;
                cell.style.color = alpha > 0.5 ? 'white' : 'black';
            }
        }
    });
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}h ${m}m ${s}s`;
}

// Socket Events
socket.on('shuffle-update', (data) => {
    totalShufflesEl.innerText = data.execution.toLocaleString();
    updateStats(data.stats);
    
    // Add to table
    const row = document.createElement('tr');
    row.innerHTML = `<td class="px-4 py-2 border-b font-mono text-indigo-600">#${data.execution}</td>
                     <td class="px-4 py-2 border-b text-gray-600 truncate">${data.order.split(',').slice(0, 3).join(', ')}...</td>`;
    historyBody.prepend(row);
    if (historyBody.children.length > 100) historyBody.lastChild.remove();
});

socket.on('stats-update', (stats) => {
    updateStats(stats);
});

socket.on('system-metrics', (metrics) => {
    cpuUsageEl.innerText = metrics.cpu;
    memUsageEl.innerText = metrics.memory;
    diskUsageEl.innerText = metrics.disk;
    avgTimeEl.innerText = metrics.avgTime;
});

function updateStats(stats) {
    lastStats = stats;
    uniqueOrdersEl.innerText = stats.uniqueOrders.toLocaleString();
    repetitionsEl.innerText = stats.repetitions.toLocaleString();
    consecutiveEl.innerText = stats.consecutiveRepetitions.toLocaleString();
    timerEl.innerText = formatTime(stats.elapsedTime);
    
    // Entropy Badge
    entropyBadge.innerText = `Entropia: ${stats.entropy}`;
    const entropyColors = { "Excelente": "bg-green-100 text-green-700", "Boa": "bg-blue-100 text-blue-700", "Ruim": "bg-red-100 text-red-700" };
    entropyBadge.className = `px-3 py-1 rounded-full text-xs font-bold ${entropyColors[stats.entropy] || 'bg-gray-100 text-gray-600'}`;

    // Heatmap
    updateHeatmap(stats.frequencyMap, stats.totalExecutions);

    // Pairs
    pairsList.innerHTML = Object.entries(stats.adjacentPairs)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([pair, count]) => `<li><span class="font-bold text-indigo-600">${pair}:</span> ${count} vezes</li>`)
        .join('') || '<li>Nenhum par detectado</li>';
}

// Controls
btnStart.onclick = () => {
    socket.emit('start-shuffle', {
        rate: rateInput.value,
        duration: durationInput.value
    });
};

btnPause.onclick = () => socket.emit('pause-shuffle');
btnStop.onclick = () => {
    socket.emit('stop-shuffle');
    historyBody.innerHTML = '';
    totalShufflesEl.innerText = '0';
    uniqueOrdersEl.innerText = '0';
    repetitionsEl.innerText = '0';
    consecutiveEl.innerText = '0';
    timerEl.innerText = '00h 00m 00s';
    initHeatmap();
};

document.getElementById('btnStress1000').onclick = () => { rateInput.value = 1000; btnStart.click(); };
document.getElementById('btnStress5000').onclick = () => { rateInput.value = 5000; btnStart.click(); };
document.getElementById('btnStress10000').onclick = () => { rateInput.value = 10000; btnStart.click(); };

document.getElementById('btnExportJson').onclick = () => window.open('/api/export/json');
document.getElementById('btnExportReport').onclick = () => window.open('/api/export/report');

// Init
initHeatmap();
setInterval(() => {
    if (btnStart.disabled) socket.emit('request-stats');
}, 5000);
