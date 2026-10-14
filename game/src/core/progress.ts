import { MISSIONS } from './missions';

export interface Progress {
  completed: string[];
  attempts: Record<string, number>;
}

export const STORAGE_KEY = 'kessia-world:progress:v1';

export const emptyProgress = (): Progress => ({ completed: [], attempts: {} });

/** Erros só incrementam tentativas — nunca removem conquistas. */
export function recordAttempt(p: Progress, missionId: string, correct: boolean): Progress {
  const attempts = { ...p.attempts, [missionId]: (p.attempts[missionId] ?? 0) + (correct ? 0 : 1) };
  const completed = correct && !p.completed.includes(missionId) ? [...p.completed, missionId] : p.completed;
  return { completed, attempts };
}

export function currentMissionIndex(p: Progress): number {
  const idx = MISSIONS.findIndex((m) => !p.completed.includes(m.id));
  return idx === -1 ? MISSIONS.length : idx;
}

export function loadProgress(storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): Progress {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const data = JSON.parse(raw);
    if (!Array.isArray(data.completed) || typeof data.attempts !== 'object') return emptyProgress();
    return { completed: data.completed.filter((x: unknown) => typeof x === 'string'), attempts: data.attempts };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(p: Progress, storage: Pick<Storage, 'setItem'> | undefined = globalThis.localStorage) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* armazenamento indisponível: jogo segue em memória */
  }
}
