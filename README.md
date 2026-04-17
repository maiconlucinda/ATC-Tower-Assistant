# ATC Tower Assistant

Ferramenta web para operações em tempo real em torre de controle de tráfego aéreo. Dois módulos lado a lado: resolução de SIDs por fixo de transição e fraseologia ATC com acesso rápido.

## Funcionalidades

- **Departure Resolver** — digita o fixo de transição (ex: EPDEP) e vê as SIDs disponíveis por pista, com destaque de direção (N/S) e prioridade
- **Phraseology Helper** — frases ATC organizadas por fase operacional (Autorização, Pushback, Taxi, Decolagem, Pouso, Pós-pouso) com exibição simultânea pt-BR/en
- **Variáveis globais** — aeroporto, pistas, vento, QNH e frequência preenchidos uma vez e substituídos automaticamente em todas as frases
- **Relógio UTC** — referência visual em tempo real na barra superior
- **Editor de SIDs** — cria e edita procedimentos de saída por nome, definindo pista, direção e fixos atendidos
- **Import/Export** — backup e compartilhamento de configuração via JSON
- **100% offline** — dados armazenados no localStorage do browser, sem dependência de rede
- **Painel redimensionável** — arraste o divisor entre os painéis para ajustar o layout

## Stack

- Next.js (App Router, static export)
- TypeScript
- Zustand (state management)
- Tailwind CSS (dark mode)
- Vitest + fast-check (testes)

## Uso

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`, importe o arquivo `sbgr-data.json` para carregar os dados de SBGR, e ative o Edit Mode para personalizar.

## Deploy

Pronto para Vercel — basta conectar o repositório. O build gera um site estático.

```bash
npm run build
```

## Licença

MIT
