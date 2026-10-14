# TODO — Kessia World

## Concluído
- [x] 2026-10-14 — Rebase completo sobre o terrário original em `game/`: HUD, ferramentas, visual acolhedor e controles 3D preservados na íntegra.
- [x] 2026-10-14 — `MissionCard` integrado como card flutuante compacto e minimizável sobre a cena 3D (planeta sempre visível).
- [x] 2026-10-14 — Núcleo matemático puro em `src/core/` (12 testes vitest passando, validação monotônica, pistas escalonadas e persistência local).
- [x] 2026-10-14 — `tsc --noEmit` e `vite build` 100% livres de erros.

## Pendente
- [ ] Teste visual/interativo no navegador (toque, teclado, mobile 390×844, Lighthouse a11y).
- [ ] Ajustar posições das recompensas no planeta (`world/WorldBridge.ts` → `SPOTS`) após inspeção visual.
- [ ] Validar linguagem das pistas com educadores e estudantes.
- [ ] Narração opcional (Web Speech API pt-BR).
- [ ] Code-split do Three.js (bundle ~914 kB).
- [ ] Expansões: EF05MA03, EF05MA04, EF03MA21.
