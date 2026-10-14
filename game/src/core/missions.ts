import type { UnitFraction } from './fraction';

export type RewardKind = 'bridge' | 'oak' | 'house' | 'windmill' | 'flower' | 'lighthouse' | 'well';

interface BaseMission {
  id: string;
  title: string;
  story: string;
  reward: RewardKind;
  rewardText: string;
}

export interface LocateMission extends BaseMission {
  kind: 'locate';
  target: UnitFraction;
}

export interface CompareMission extends BaseMission {
  kind: 'compare';
  options: [UnitFraction, UnitFraction];
}

export type Mission = LocateMission | CompareMission;

export const MISSIONS: Mission[] = [
  {
    id: 'm1-half', kind: 'locate', target: { den: 2 }, reward: 'bridge',
    title: 'A ponte do rio',
    story: 'A ponte fica na metade do caminho entre 0 e 1. Divida o caminho em partes iguais e marque 1/2.',
    rewardText: 'A ponte apareceu! Agora a vila consegue atravessar o rio.',
  },
  {
    id: 'm2-quarter', kind: 'locate', target: { den: 4 }, reward: 'oak',
    title: 'A primeira árvore',
    story: 'Vamos plantar uma árvore em 1/4 do caminho. Divida o caminho e marque 1/4.',
    rewardText: 'Uma árvore nasceu no pequeno mundo!',
  },
  {
    id: 'm3-third', kind: 'locate', target: { den: 3 }, reward: 'house',
    title: 'Uma casa nova',
    story: 'A família Coelho quer morar em 1/3 do caminho. Marque 1/3 na reta.',
    rewardText: 'A casa ficou pronta. Bem-vindos, vizinhos!',
  },
  {
    id: 'm4-eighth', kind: 'locate', target: { den: 8 }, reward: 'flower',
    title: 'Canteiro de flores',
    story: 'As sementes vão em 1/8 do caminho. Divida com cuidado e marque 1/8.',
    rewardText: 'Flores coloridas brotaram!',
  },
  {
    id: 'm5-sixth', kind: 'locate', target: { den: 6 }, reward: 'windmill',
    title: 'O moinho',
    story: 'O moinho precisa ficar em 1/6 do caminho. Marque 1/6.',
    rewardText: 'O moinho começou a girar com o vento.',
  },
  {
    id: 'm6-fifth', kind: 'locate', target: { den: 5 }, reward: 'well',
    title: 'O poço',
    story: 'Cave o poço em 1/5 do caminho. Marque 1/5.',
    rewardText: 'Água fresquinha para toda a vila!',
  },
  {
    id: 'm7-compare', kind: 'compare', options: [{ den: 3 }, { den: 5 }], reward: 'lighthouse',
    title: 'O farol',
    story: 'O farol fica no ponto mais perto do 0. Qual é menor: 1/3 ou 1/5?',
    rewardText: 'O farol acendeu e ilumina o mar!',
  },
];

export function getMission(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id);
}
