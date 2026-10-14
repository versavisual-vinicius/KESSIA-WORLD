import * as THREE from 'three';
import { PocketWorldController } from './three/PocketWorldScene';
import type { WorldState } from './types/world';
import type { RewardKind } from '../core/missions';

const INITIAL_STATE: WorldState = {
  planetName: 'Pequeno Mundo',
  population: 4,
  happiness: 90,
  dayCount: 1,
  activeTool: 'tree',
  activeView: 'orb',
  timeMode: 'day',
  timeOfDay: 0.24,
  tourActive: false,
  tourElapsed: 0,
  tourPhase: '',
  objectCounts: { houses: 0, trees: 0, windmills: 0, lighthouses: 0, villagers: 0, sheep: 0, clouds: 0, flowers: 0, boats: 0 },
};

/** Direções fixas por recompensa, perto da vila, para o mundo crescer de forma previsível. */
const SPOTS: Record<RewardKind, [number, number, number]> = {
  bridge: [-0.05, 0.3, 0.95],
  oak: [-0.3, 0.18, 0.94],
  house: [-0.02, 0.12, 0.99],
  flower: [-0.24, 0.32, 0.92],
  windmill: [0.1, 0.26, 0.96],
  well: [-0.12, 0.05, 0.99],
  lighthouse: [0.2, 0.1, 0.97],
};

/**
 * Fachada fina sobre a cena do terrário.
 * Apenas REAGE a resultados já decididos pelo núcleo matemático.
 */
export class WorldBridge {
  private controller: PocketWorldController;
  private reducedMotion = false;

  constructor(container: HTMLElement) {
    this.controller = new PocketWorldController(container, () => {});
    this.controller.setTimeMode('day');
  }

  reward(kind: RewardKind, animate = true) {
    const dir = new THREE.Vector3(...SPOTS[kind]).normalize();
    const type = kind === 'oak' ? 'oak' : kind;
    const sparkle = animate && !this.reducedMotion;
    this.controller.placeStaticObject(type as never, dir, 0, false, sparkle);
    if (sparkle) this.controller.emitSparklesAtDir(dir, '#ffe57f');
  }

  setReducedMotion(v: boolean) {
    this.reducedMotion = v;
    if (v) this.controller.stopTour();
  }

  dispose() {
    this.controller.dispose();
  }
}

export { INITIAL_STATE };
