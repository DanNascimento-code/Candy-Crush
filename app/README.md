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
- `src/game/candy.js`: modelo e invariantes de doces comuns e especiais.
- `src/game/candy.test.js`: testes unitários do modelo `Candy`.
- `src/App.jsx`: estado da interface e tradução dos gestos do usuário em jogadas.
- `src/index.css`: apresentação visual e responsividade.

Cada posição ocupada guarda um objeto imutável com o mesmo formato:

```js
{
  candyType: 'purple',
  specialType: null,
}
```

`candyType` representa a cor e `specialType` representa o comportamento especial.
Essa separação permite trocar imagens e efeitos sem alterar as regras do jogo.

## Doces especiais

- Quatro doces em uma linha criam um doce `striped-column`.
- Quatro doces em uma coluna criam um doce `striped-row`.
- Cinco ou mais doces em linha reta criam uma `color-bomb` sem cor-base.
- Nesta etapa, somente a combinação inicial causada pelo jogador cria especiais.
- A ativação dos especiais será implementada em um ciclo TDD separado.

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
