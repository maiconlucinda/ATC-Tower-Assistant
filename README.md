# ATC Tower Assistant

Ferramenta web para operações em tempo real em torre de controle de tráfego aéreo. Interface dividida em dois painéis lado a lado: resolução de SIDs por fixo de transição e fraseologia ATC com acesso rápido. Funciona 100% offline com dados armazenados no localStorage do navegador.

## Visão Geral

O ATC Tower Assistant foi projetado para auxiliar controladores de tráfego aéreo em posição de torre. A interface apresenta dois módulos principais que podem ser redimensionados arrastando o divisor central:

- Painel esquerdo: Departure Resolver (resolução de saídas)
- Painel direito: Phraseology Helper (fraseologia operacional)

Na barra superior ficam as variáveis globais, o relógio UTC e os controles de importação/exportação.

---

## Funcionalidades

### Barra de Variáveis Globais

Barra fixa no topo da tela com campos editáveis para valores usados em toda a operação:

- Aeroporto, pista em uso, direção do vento, QNH, frequências, etc.
- Os valores preenchidos aqui são substituídos automaticamente nas frases do Phraseology Helper através de tokens como `{aeroporto}`, `{pista_decolagem}`, etc.
- Clicar no nome de uma variável (ex: AEROPORTO, PISTA DE DECOLAGEM) copia a tag pronta para o clipboard (ex: `{aeroporto}`), facilitando a criação de novas frases. Um feedback "✓ copiado" aparece por ~1 segundo.
- No modo de edição, é possível adicionar e remover variáveis.

### Relógio UTC

Relógio em tempo real no canto esquerdo da barra de variáveis, exibindo o horário UTC no formato `HH:MM:SSZ`. Atualiza a cada segundo.

### Departure Resolver (Painel Esquerdo)

Módulo para resolver rapidamente qual SID usar para uma determinada saída:

1. Digite o nome do fixo de transição (ex: EPDEP, PULUV, ILKUS) no campo de busca
2. O sistema faz busca por substring e exibe sugestões em um dropdown com navegação por teclado (setas + Enter)
3. Ao selecionar um fixo, a tabela de resultados mostra:
   - Nome do fixo e sua direção (NORTH, SOUTH ou MIXED) com cores distintas
   - Botões de navegação rápida por pista (11L, 11R, 29L, 29R)
   - Pistas destacadas em azul conforme a direção do fixo (NORTH → 11L/29R, SOUTH → 11R/29L)
   - Lista de SIDs disponíveis por pista, ordenadas por prioridade
   - Cada SID mostra sua direção individual (N/S) com cor correspondente
4. Clicar em uma SID copia automaticamente a rota completa (ex: `ESBU6A.EPDEP11L`) para o clipboard, com feedback visual "✓"
5. Se o fixo digitado não existir, o sistema usa o fallback OMNI (quando disponível) e exibe um banner de aviso

### Phraseology Helper (Painel Direito)

Módulo de fraseologia ATC organizado por fases operacionais:

1. Categorias exibidas como botões na parte superior: Autorização, Pushback e Acionamento, Taxi, Decolagem, Pouso, Pós-pouso
   - Os botões fazem wrap automático em telas menores (sem barra de rolagem horizontal)
   - A fonte reduz em telas pequenas para melhor aproveitamento do espaço
2. Campo de busca por texto livre que filtra frases em todas as categorias simultaneamente (busca em título, conteúdo pt-BR, conteúdo en e notas)
3. Cada frase exibe:
   - Título descritivo (quando disponível)
   - Versão em português (🇧🇷) com borda verde à esquerda
   - Versão em inglês (🇺🇸) com borda azul à esquerda
   - Botão "Copy" em cada versão para copiar o texto com variáveis já substituídas
   - Notas adicionais em itálico (quando disponíveis)
4. Sistema de tokens nas frases:
   - `{nome_variavel}` — substituído pelo valor da variável global correspondente (exibido em verde)
   - Variáveis sem valor preenchido aparecem destacadas em laranja
   - Placeholders dinâmicos (tokens não mapeados a variáveis globais) aparecem em ciano
   - `___` (3+ underscores) — renderizado como campo em branco para preenchimento manual

### Modo de Edição

Ativado pelo toggle "Edit" na barra de ferramentas. Quando ativo, libera:

- Editor de SIDs: criar, editar e excluir procedimentos de saída (nome, pista, direção, fixos atendidos, prioridade)
- Editor de Categorias: criar, renomear e excluir categorias de frases
- Editor de Frases: criar, editar e excluir entradas de fraseologia (título, conteúdo pt-BR/en, notas, categoria, ordem)
- Gerenciamento de variáveis globais: adicionar e remover variáveis

### Import/Export

- Export: baixa um arquivo JSON com toda a configuração (SIDs, fixos, categorias, frases, variáveis globais) nomeado com a data atual
- Import: carrega um arquivo JSON previamente exportado, restaurando toda a configuração

### Painel Redimensionável

O divisor entre os painéis esquerdo e direito pode ser arrastado para ajustar a proporção de cada lado (entre 15% e 85% da largura).

---

## Stack Técnica

- Next.js (App Router, static export)
- TypeScript
- Zustand (gerenciamento de estado)
- Tailwind CSS (dark mode)
- Vitest + fast-check (testes)

## Uso

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`. Na pasta `data/` estão os arquivos de configuração inicial para cada aeroporto:

| Arquivo | Aeroporto |
|---------|-----------|
| `data/SBGR.json` | Guarulhos (SBGR) |
| `data/SBBR.json` | Brasília (SBBR) |

Para começar, clique em "Import" no app e selecione o arquivo do aeroporto desejado. Após importar, os dados de SIDs, fixos, categorias de frases e variáveis globais serão carregados automaticamente. Ative o Edit Mode para personalizar.

## Deploy

Pronto para Vercel — basta conectar o repositório. O build gera um site estático.

```bash
npm run build
```

## Licença

MIT
