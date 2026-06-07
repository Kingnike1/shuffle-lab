import os from 'os';
import util from 'util';
import { exec } from 'child_process';

const execPromise = util.promisify(exec);

export class SystemMonitor {
    constructor(dataDirectory) {
        this.dataDirectory = dataDirectory;
    }

    getMemoryUsage() {
        const mem = process.memoryUsage();
        return {
            rss: (mem.rss / 1024 / 1024).toFixed(2), // Resident Set Size
            heapTotal: (mem.heapTotal / 1024 / 1024).toFixed(2), // Total heap allocated
            heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(2) // Actual heap used
        };
    }

    getCPUUsage() {
        // os.loadavg() returns a 1, 5, and 15 minute load average
        return os.loadavg()[0].toFixed(2); // 1-minute load average
    }

    async getDiskUsage() {
        try {
            // This command works on Linux/macOS. For Windows, a different approach would be needed.
            const { stdout } = await execPromise(`df -h ${this.dataDirectory}`);
            const lines = stdout.split('\n');
            if (lines.length > 1) {
                const parts = lines[1].split(/\s+/).filter(Boolean);
                return {
                    total: parts[1],
                    used: parts[2],
                    available: parts[3],
                    usePercentage: parts[4]
                };
            }
        } catch (error) {
            console.error("Erro ao obter uso de disco:", error);
        }
        return { total: 'N/A', used: 'N/A', available: 'N/A', usePercentage: 'N/A' };
    }

    async getMetrics() {
        const memory = this.getMemoryUsage();
        const cpu = this.getCPUUsage();
        const disk = await this.getDiskUsage();
        return {
            memory, // detailed memory usage
            cpu,    // 1-minute load average
            disk    // disk usage for the data directory
        };
    }
}
