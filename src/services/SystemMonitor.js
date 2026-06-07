import os from 'os';
import util from 'util';
import { exec } from 'child_process';

const execPromise = util.promisify(exec);

export class SystemMonitor {
    constructor(dataDirectory) {
        this.dataDirectory = dataDirectory;
        this.isWindows = os.platform() === 'win32';
    }

    getMemoryUsage() {
        const mem = process.memoryUsage();
        return {
            rss: (mem.rss / 1024 / 1024).toFixed(2),
            heapTotal: (mem.heapTotal / 1024 / 1024).toFixed(2),
            heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(2)
        };
    }

    getCPUUsage() {
        // os.loadavg() is not available on Windows
        if (this.isWindows) return "N/A";
        return os.loadavg()[0].toFixed(2);
    }

    async getDiskUsage() {
        try {
            if (this.isWindows) {
                // Windows approach using wmic
                const drive = this.dataDirectory.split(':')[0] + ':';
                const { stdout } = await execPromise(`wmic logicaldisk where "DeviceID='${drive}'" get Size,FreeSpace /value`);
                const lines = stdout.split('\n');
                let size = 0, free = 0;
                lines.forEach(line => {
                    if (line.startsWith('Size=')) size = parseInt(line.split('=')[1]);
                    if (line.startsWith('FreeSpace=')) free = parseInt(line.split('=')[1]);
                });
                if (size > 0) {
                    const used = size - free;
                    const percent = ((used / size) * 100).toFixed(0);
                    return {
                        total: (size / 1024 / 1024 / 1024).toFixed(1) + 'GB',
                        used: (used / 1024 / 1024 / 1024).toFixed(1) + 'GB',
                        available: (free / 1024 / 1024 / 1024).toFixed(1) + 'GB',
                        usePercentage: percent + '%'
                    };
                }
            } else {
                // Linux/macOS approach
                const { stdout } = await execPromise(`df -h "${this.dataDirectory}"`);
                const lines = stdout.split('\n');
                if (lines.length > 1) {
                    const parts = lines[1].split(/\s+/).filter(Boolean);
                    // Handle cases where the filesystem name is long and wraps to the next line
                    const dataRow = parts.length > 4 ? parts : lines[2].split(/\s+/).filter(Boolean);
                    return {
                        total: dataRow[1],
                        used: dataRow[2],
                        available: dataRow[3],
                        usePercentage: dataRow[4]
                    };
                }
            }
        } catch (error) {
            // Silently fail for disk usage to avoid crashing the metrics loop
        }
        return { total: 'N/A', used: 'N/A', available: 'N/A', usePercentage: 'N/A' };
    }

    async getMetrics() {
        const memory = this.getMemoryUsage();
        const cpu = this.getCPUUsage();
        const disk = await this.getDiskUsage();
        return { memory, cpu, disk };
    }
}
