# Shuffle Lab - Visão Geral do Projeto

O **Shuffle Lab** é um laboratório visual em tempo real para análise de algoritmos de embaralhamento. Ele permite processar milhões de embaralhamentos, monitorando estatísticas de aleatoriedade, frequência de posições e detecção de padrões.

## 🚀 Arquitetura do Sistema

O sistema foi refatorado para seguir uma arquitetura modular e eficiente, focada em alta performance e baixo consumo de recursos.

### Componentes Principais

| Componente | Descrição |
|---|---|
| **ShuffleEngine** | Motor principal que executa o algoritmo Fisher-Yates e orquestra o fluxo de dados. |
| **StatisticsAggregator** | Agregador em memória que calcula estatísticas (entropia, frequência, repetições) de forma incremental. |
| **NDJSONLogger** | Sistema de logs estruturados que persiste cada embaralhamento em arquivos rotativos. |
| **ReportPersister** | Responsável por salvar snapshots periódicos das estatísticas em JSON. |
| **SystemMonitor** | Coleta métricas de hardware (CPU, RAM, Disco) em tempo real. |

### Fluxo de Dados

1. O **Frontend** solicita o início do embaralhamento via WebSockets (Socket.io).
2. O **ShuffleEngine** gera os resultados e os envia para o **StatisticsAggregator**.
3. Os dados são persistidos via **NDJSONLogger** para auditoria.
4. O **Frontend** recebe atualizações em tempo real e renderiza o Heatmap e os gráficos de performance.

## 🛠️ Refatorações Realizadas

Durante a fase de preparação para deploy, as seguintes melhorias foram implementadas:

*   **Limpeza de Código**: Remoção de serviços duplicados (`statisticsService.js`).
*   **Correção de Bugs**: Ajuste no `NDJSONLogger` para importar corretamente o módulo `fs/promises`.
*   **Otimização de Performance**: Garantia de que todos os cálculos estatísticos sejam incrementais, evitando picos de memória.
*   **Documentação**: Criação desta visão geral e atualização dos guias técnicos.

## 🌐 Deploy

O projeto está configurado para rodar em ambientes Node.js modernos. Para colocar online:

1. Instale as dependências: `pnpm install`
2. Inicie o servidor: `pnpm start`
3. O servidor estará disponível na porta definida pela variável de ambiente `PORT` (padrão 3000).

---
*Documento gerado automaticamente durante o processo de refatoração e deploy.*
