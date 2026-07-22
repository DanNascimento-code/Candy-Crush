# Sweet Mayhem

Protótipo de um jogo match-3 dark construído com React e Vite.

## Comandos

```bash
npm run dev
npm test
npm run lint
npm run build
```

## Arquitetura atual

- `src/game/board.js`: regras puras do tabuleiro. Não depende de React nem de imagens.
- `src/game/board.test.js`: exemplos executáveis das regras e dos casos de borda.
- `src/App.jsx`: estado da interface e tradução dos gestos do usuário em jogadas.
- `src/index.css`: apresentação visual e responsividade.

O tabuleiro guarda identificadores como `purple` e `blue`, em vez de URLs de
imagens. Essa separação permite trocar o tema visual sem alterar a lógica.

## Fluxo de uma jogada

1. A interface informa os dois índices escolhidos.
2. `trySwap` verifica se eles são realmente vizinhos.
3. Uma cópia do tabuleiro recebe a troca.
4. A engine aceita a jogada somente se uma das peças formar um match.
5. Os matches são removidos, as peças caem e novos doces são criados.
6. O processo se repete até não haver novas cascatas.
7. A engine devolve o novo tabuleiro, a pontuação e a quantidade de cascatas.

Todas as transformações retornam novos arrays. O estado recebido nunca é
alterado diretamente, seguindo o princípio de imutabilidade usado pelo React.
