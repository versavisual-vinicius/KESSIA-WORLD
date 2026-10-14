# Kessia World

Repositório de referência para a criação de um jogo educativo single-player que combina exploração de um mundo 3D, matemática visual e progressão gamificada.

> **Status:** a experiência educativa descrita aqui é uma proposta. As pastas existentes são projetos de referência; o jogo de matemática ainda precisa ser implementado.

## Visão do Projeto

**Pequeno Mundo das Frações** é um nome provisório para um jogo em que o estudante explora e ajuda a desenvolver um pequeno mundo. Desafios matemáticos são apresentados por meio de elementos visuais do cenário, com feedback explicativo e recompensas que representam o avanço do mundo.

O objetivo é apoiar a compreensão de conceitos matemáticos, não apenas premiar respostas rápidas. O jogo será single-player e não dependerá de partidas competitivas ou de conexão com outros jogadores.

## Projetos de Referência

| Pasta | O que oferece como referência | Uso previsto |
| --- | --- | --- |
| [`pocket-world-terrarium/`](pocket-world-terrarium/README.md) | Cena 3D em Three.js, mundo interativo, controles React e organização em módulos. | Principal referência técnica e visual para o mundo explorável. A cena e a interface precisarão ser adaptadas aos objetivos pedagógicos. |
| [`3d-cozy-snow-plow-game/`](3d-cozy-snow-plow-game/README.md) | HUD de jogo, feedback visual e sonoro, desafios, progressão e elementos de apresentação. | Referência de ritmo e feedback. A arquitetura multiplayer e o combate não fazem parte do escopo inicial. |

Os projetos são independentes. Esta documentação descreve a direção do novo jogo e não afirma que suas mecânicas educativas já existam nas pastas acima.

## Proposta Pedagógica

O primeiro protótipo deve focar na habilidade **EF04MA09**, do 4º ano: reconhecer frações unitárias usuais como medidas menores que uma unidade e usar a reta numérica para representá-las.

O estudante poderá, por exemplo, dividir visualmente o intervalo entre 0 e 1 em partes iguais e localizar `1/2`, `1/3` ou `1/4`. A atividade deve conectar a imagem, a posição na reta e a escrita da fração, ajudando a perceber que o denominador indica em quantas partes iguais a unidade foi dividida.

### Ciclo de Jogo

1. O estudante recebe uma missão curta apresentada por um personagem ou elemento do mundo.
2. Manipula uma representação visual, como uma reta numérica ou uma área dividida em partes iguais.
3. Escolhe ou posiciona a fração solicitada.
4. Recebe feedback imediato que explica a relação entre a unidade, o denominador e a parte selecionada.
5. Ao concluir, vê uma mudança no cenário e pode avançar para outro desafio.

Uma resposta incorreta deve oferecer pistas e permitir novas tentativas, sem retirar progresso já conquistado.

### Progressão de Conteúdo

- **Primeiro protótipo — EF04MA09:** frações unitárias na reta numérica.
- **Expansão — EF05MA03:** frações menores e maiores que a unidade, relacionadas à divisão e à ideia de parte-todo.
- **Expansão — EF05MA04:** identificação e representação de frações equivalentes.
- **Possível módulo geométrico — EF03MA21:** comparação visual de áreas, inclusive por sobreposição de figuras.

Essas etapas são uma proposta de escopo, não uma sequência curricular já validada ou implementada.

## Princípios de Design e Inclusão

- Priorizar representações visuais claras e conectá-las gradualmente à notação matemática.
- Usar instruções curtas, objetivos previsíveis e feedback que explique o raciocínio.
- Não exigir rapidez: cronômetros devem ser opcionais, nunca condição para aprender ou avançar.
- Evitar penalidades que transformem o erro em perda de progresso; usar o erro como oportunidade de revisão.
- Planejar contraste adequado, texto legível, controles por toque e teclado, além de opções para reduzir estímulos visuais e sonoros.
- Tratar recursos de acessibilidade como parte da experiência principal, e não como adaptações posteriores.
- Usar o jogo como apoio à mediação docente; a atividade digital, sozinha, não substitui a discussão das estratégias matemáticas.

## Direção Técnica

O terrário é a base técnica recomendada por já separar a interface React da cena Three.js. A adaptação deve manter responsabilidades claras entre:

- apresentação e acessibilidade da interface;
- interação com o cenário 3D;
- desafios e representações matemáticas;
- feedback, progresso e recompensas.

O núcleo matemático deve determinar se uma resposta está correta; animações e efeitos do cenário devem refletir esse resultado, sem serem a fonte da regra pedagógica. A primeira versão pode funcionar localmente, sem servidor multiplayer.

## Estrutura Atual do Repositório

```text
.
├── game/                     # Protótipo jogável: Pequeno Mundo das Frações (EF04MA09)
├── 3d-cozy-snow-plow-game/   # Referência de HUD, feedback e progressão de jogo
├── pocket-world-terrarium/   # Referência de mundo 3D e interação com Three.js
└── README.md                 # Visão e proposta pedagógica do repositório
```

Para executar ou entender cada projeto de referência, consulte o README da respectiva pasta. Os comandos e requisitos podem diferir entre elas.

## Executar o Protótipo

```bash
cd game
pnpm install
pnpm dev      # http://localhost:3000
pnpm test     # testes do núcleo matemático
```

Organização em `game/src/`: `core/` (regras de fração, missões, feedback e progresso — fonte única de correção), `world/` (cena do terrário + `WorldBridge`, que só reage a resultados) e `ui/` (reta numérica acessível, painel de missão, opções de acessibilidade). Progresso salvo localmente no navegador; sem servidor.


## Critérios para o Primeiro Protótipo

O primeiro protótipo estará pronto para avaliação quando permitir que o estudante:

1. compreenda a missão sem depender de explicações externas para operar a interface;
2. represente e localize frações unitárias no intervalo de 0 a 1;
3. receba feedback compreensível tanto em acertos quanto em erros;
4. complete desafios sem limite de tempo obrigatório;
5. use os controles essenciais por toque e teclado, com texto legível e contraste suficiente.

O conteúdo, a linguagem e a dificuldade devem ser avaliados com educadores e estudantes antes de ampliar a sequência de habilidades.
