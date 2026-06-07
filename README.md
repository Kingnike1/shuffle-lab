# Shuffle Lab

Laboratório visual para testar, monitorar e analisar algoritmos de embaralhamento em tempo real.

## Objetivo

Criar uma aplicação Node.js para gerar milhões de embaralhamentos (Fisher-Yates) e exibir estatísticas em um dashboard web dinâmico.

## Funcionalidades

- **Controle de Fluxo**: Iniciar, Pausar e Parar embaralhamentos.
- **Stress Test**: Modos de alta performance (1k a 10k embaralhamentos por segundo).
- **Análise em Tempo Real**:
  - Total de embaralhamentos e ordens únicas.
  - Detecção de repetições (normais e consecutivas).
  - Heatmap de distribuição de cartas por posição.
  - Frequência de pares adjacentes.
  - Cálculo de Entropia.
- **Monitoramento de Sistema**: Uso de CPU e Memória durante testes de estresse.
- **Exportação**: Download de histórico em JSON e relatório estatístico completo.

## Stack

- **Backend**: Node.js, Express, Socket.IO.
- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript.
- **Persistência**: NDJSON (Arquivos locais).

## Como rodar

1. Instale as dependências:
   ```bash
   pnpm install
   ```

2. Inicie o servidor:
   ```bash
   pnpm start
   ```

3. Acesse no navegador:
   `http://localhost:3000`
