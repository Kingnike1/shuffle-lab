import { FileRotator } from './FileRotator.js';
import path from 'path';

export class NDJSONLogger {
    constructor(logDirectory, baseFileName = 'shuffle_history', maxSizeMB = 100) {
        this.logDirectory = logDirectory;
        this.fileRotator = new FileRotator(logDirectory, baseFileName, maxSizeMB);
    }

    log(data) {
        this.fileRotator.write(data);
    }

    close() {
        this.fileRotator.close();
    }

    // Method to read all NDJSON files and reconstruct history
    async readAllLogs() {
        const files = await fs.promises.readdir(this.logDirectory);
        const ndjsonFiles = files.filter(file => file.endsWith('.ndjson')).sort();
        
        let allData = [];
        for (const file of ndjsonFiles) {
            const filePath = path.join(this.logDirectory, file);
            const content = await fs.promises.readFile(filePath, 'utf8');
            content.split('\n').forEach(line => {
                if (line.trim()) {
                    try {
                        allData.push(JSON.parse(line));
                    } catch (e) {
                        console.error(`Erro ao parsear linha NDJSON em ${file}:`, line, e);
                    }
                }
            });
        }
        return allData;
    }
}
