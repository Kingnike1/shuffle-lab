import fs from 'fs';
import path from 'path';

export class ReportPersister {
    constructor(statsAggregator, dataDirectory, fileName = 'relatorio.json', intervalMs = 60000) {
        this.statsAggregator = statsAggregator;
        this.dataDirectory = dataDirectory;
        this.filePath = path.join(this.dataDirectory, fileName);
        this.intervalMs = intervalMs;
        this.intervalId = null;

        if (!fs.existsSync(this.dataDirectory)) {
            fs.mkdirSync(this.dataDirectory, { recursive: true });
        }
    }

    start() {
        if (this.intervalId) return;
        this.intervalId = setInterval(() => this.saveReport(), this.intervalMs);
        console.log(`ReportPersister: Iniciado salvamento periódico a cada ${this.intervalMs / 1000} segundos.`);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('ReportPersister: Parado.');
        }
    }

    saveReport() {
        const report = this.statsAggregator.getSummary();
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(report, null, 2));
            // console.log(`ReportPersister: Relatório salvo em ${this.filePath}`);
        } catch (error) {
            console.error(`ReportPersister: Erro ao salvar relatório em ${this.filePath}:`, error);
        }
    }

    loadReport() {
        if (fs.existsSync(this.filePath)) {
            try {
                const report = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
                // Here you would typically re-hydrate the statsAggregator if needed
                // For this project, we'll just load the last saved report for display if available
                return report;
            } catch (error) {
                console.error(`ReportPersister: Erro ao carregar relatório de ${this.filePath}:`, error);
                return null;
            }
        }
        return null;
    }
}
