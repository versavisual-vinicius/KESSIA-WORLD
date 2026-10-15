# TODO — Pequeno Mundo das Frações (Kessia World)

## Status Atual
- [x] Arquitetura base React 19 + Three.js + Tailwind v4 operando com build verde.
- [x] Sistema de missões pedagógicas BNCC EF04MA09 (1/2, 1/3, 1/4, 1/6, 1/8).
- [x] Reta numérica interativa com divisões e verificação geométrica.
- [x] Personagem 2.5D Kessia e balões de fala contextuais.
- [x] Otimização de WebGL: desabilitação de shader debug e ativação de `KHR_parallel_shader_compile`.
- [x] `AGENTS.md` canônico criado no workspace para engenharia de contexto persistente.

- [x] Otimização de chunking no Vite/Rolldown: `vendor-react` (210kB), `vendor-motion` (121kB), `vendor-icons` (12kB), `vendor-three` lazy (575kB) e bundle principal reduzido de 404kB para 72kB.
- [x] Testes unitários para a lógica pura em `src/core/fractions.ts` e `src/core/storage.ts` (22 testes cobrindo aritmética BNCC EF04MA09, persistência e diagnósticos do educador via Vitest).

- [x] Experiência 100% tátil (touch-first) para mobile: D-pad ergonômico de polegar (44px), tap-to-move no solo 3D, fatias com toque suave e scrubbing contínuo do slider com `setPointerCapture`; teclado restrito a fallback secundário invisível em background.

## Próximos Passos & Melhorias
- [ ] PWA offline support e manifest para instalação direta em tablets e smartphones escolares.

