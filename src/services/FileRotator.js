import fs from 'fs';
import path from 'path';

export class FileRotator {
    constructor(directory, baseFileName, maxSizeMB = 100) {
        this.directory = directory;
        this.baseFileName = baseFileName;
        this.maxSizeBytes = maxSizeMB * 1024 * 1024; // Convert MB to Bytes
        this.currentFilePath = this.getLatestFilePath();
        this.currentStream = this.createWriteStream(this.currentFilePath);
    }

    getLatestFilePath() {
        let latestFile = path.join(this.directory, `${this.baseFileName}.ndjson`);
        let counter = 0;
        while (fs.existsSync(latestFile)) {
            const stats = fs.statSync(latestFile);
            if (stats.size < this.maxSizeBytes) {
                return latestFile;
            }
            counter++;
            latestFile = path.join(this.directory, `${this.baseFileName}.${counter}.ndjson`);
        }
        return latestFile;
    }

    createWriteStream(filePath) {
        const stream = fs.createWriteStream(filePath, { flags: 'a' });
        stream.on('error', (err) => {
            console.error(`FileRotator: Erro no stream de escrita para ${filePath}:`, err);
        });
        return stream;
    }

    async write(data) {
        if (!this.currentStream) {
            this.currentStream = this.createWriteStream(this.currentFilePath);
        }

        // Check file size before writing
        if (fs.existsSync(this.currentFilePath)) {
            const stats = fs.statSync(this.currentFilePath);
            if (stats.size >= this.maxSizeBytes) {
                await this.rotateFile();
            }
        }
        
        this.currentStream.write(JSON.stringify(data) + '\n');
    }

    async rotateFile() {
        this.currentStream.end();
        this.currentStream = null;
        let counter = 0;
        let newFilePath;
        do {
            counter++;
            newFilePath = path.join(this.directory, `${this.baseFileName}.${counter}.ndjson`);
        } while (fs.existsSync(newFilePath));
        
        this.currentFilePath = newFilePath;
        this.currentStream = this.createWriteStream(this.currentFilePath);
        console.log(`FileRotator: Arquivo rotacionado para ${this.currentFilePath}`);
    }

    close() {
        if (this.currentStream) {
            this.currentStream.end();
            this.currentStream = null;
        }
    }
}
