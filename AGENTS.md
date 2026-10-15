# Diretrizes Canônicas do Projeto — Pequeno Mundo das Frações (Kessia World)

## 1. Visão Geral & Escopo Pedagógico
- **Objetivo**: Jogo educativo single-player 3D/2.5D para terrário vivo e aprendizado de frações unitárias na reta numérica (BNCC EF04MA09).
- **Público-alvo**: Ensino Fundamental (4º e 5º ano), educadores e crianças em dispositivos móveis e desktop.
- **Identidade Estética**: Estética limpa ("Clean Girl" / terrário acolhedor), paleta suave (`#FAF8F5`, tons terrosos, verde esmeralda, âmbar), tipografia `Fredoka`, `Plus Jakarta Sans` e `JetBrains Mono`.

## 2. Stack Tecnológica & Comandos
- **Framework**: React 19 + TypeScript + Vite 8
- **3D & Renderização**: Three.js (`three` 0.186), shaders nativos com `KHR_parallel_shader_compile`
- **Estilização**: Tailwind CSS v4 (`@tailwindcss/vite`) + CSS Variables para Safe Areas (`env(safe-area-inset-*)`)
- **Animação & Ícones**: Motion (`motion`), Lucide React (`lucide-react`)
- **Áudio**: Web Audio API procedural (`audio.ts`), síntese FM sem assets pesados

### Comandos Canônicos
```bash
# Desenvolvimento local
pnpm run dev

# Checagem estrita de tipos
pnpm tsc --noEmit

# Build de produção
pnpm run build

# Limpeza de artefatos
pnpm run clean
```

## 3. Arquitetura de Módulos
```
src/
├── core/                  # Regras de negócio puras (sem dependências de DOM/Three)
│   ├── fractions.ts       # Aritmética de frações, subdivisões e tolerâncias
│   ├── missions.ts        # Fases, objetivos pedagógicos e diálogos
│   ├── storage.ts         # Persistência em LocalStorage com versionamento
│   ├── audio.ts           # Motor de síntese procedural via Web Audio API
│   └── types.ts           # Contratos TypeScript de estado e entidades
├── world/                 # Renderização 3D e cena Three.js
│   ├── TerrariumCanvas.tsx# Canvas Three.js isolado, loop RAF, redimensionamento
│   └── proceduralModels.ts# Geometrias procedurais (terrário, plantas, itens)
├── ui/                    # Componentes de interface e overlays
│   ├── NumberLineVisualizer.tsx # Reta numérica interativa e régua fracionária
│   ├── WorldSpeechBubbles.tsx   # Diálogos no espaço de tela
│   ├── EducatorModal.tsx        # Painel pedagógico e métricas da BNCC
│   ├── CharacterAvatar.tsx      # Guardiana Kessia em 2.5D
│   ├── RewardBuildOverlay.tsx   # Feedback de construção/conquista
│   └── TitleScreenOverlay.tsx   # Tela de início e boas-vindas
├── App.tsx                # Orquestrador de estado do jogo e fluxos
├── main.tsx               # Entrypoint React
└── index.css              # Setup base Tailwind v4 e utilitários
```

## 4. Regras e Convenções de Código
1. **Padrão de Componentes**:
   - Componentes funcionais com TypeScript estrito.
   - Props tipadas explicitamente com interfaces ou types de `src/core/types.ts`.
   - Named exports preferenciais em módulos de utilidade.

2. **Gestão de Recursos Three.js**:
   - Toda malha (`Mesh`), geometria (`BufferGeometry`) e material (`Material`) criados proceduralmente devem ser descartados (`dispose()`) no desmonte do componente.
   - Cancelar explicitamente o loop `requestAnimationFrame` em `useEffect` de limpeza.

3. **Design 100% Tátil (Touch-First Mobile Game)**:
   - Toda a interação primária é orientada a toque e polegares: tap-to-move no solo 3D, D-pad de polegar, rotação por arraste gestual, fatiamento direto por toque e scrubbing contínuo do marcador na reta numérica.
   - O suporte a teclado (WASD / setas) opera exclusivamente como camada secundária invisível em background para tecnologias assistivas (acessibilidade) e testes automatizados, sem exibir atalhos de desktop ou exigir digitação.
   - Suporte mandatório a safe areas (`var(--sat)`, `var(--sab)`).
   - `touch-action: manipulation` e prevenção de scroll/bounce indesejado (`overflow: hidden`).
   - Alvos de toque mínimos de 44×44px em botões e manipuladores da reta numérica.

4. **Áudio Procedural**:
   - `AudioContext` deve ser inicializado/resumido apenas após interação do usuário (clique/toque) para evitar bloqueio de autoplay nos navegadores móveis.

5. **Paridade Matemática (Gabarito BNCC EF04MA09)**:
   - Validação da reta numérica com tolerância estrita baseada na subdivisão ativa (ex.: 1/2, 1/3, 1/4, 1/6, 1/8).
   - Sem números mágicos: valores de fração normalizados entre 0.0 e 1.0.
