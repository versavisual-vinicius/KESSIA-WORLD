/**
 * Núcleo matemático — fonte única de verdade sobre correção de respostas.
 * Nenhuma regra pedagógica deve viver na UI ou na cena 3D.
 */

export const MIN_PARTS = 2;
export const MAX_PARTS = 8;

/** Fração unitária 1/den. */
export interface UnitFraction {
  den: number;
}

export function isValidDenominator(den: number): boolean {
  return Number.isInteger(den) && den >= MIN_PARTS && den <= MAX_PARTS;
}

/** Posição (0..1) da fração na reta numérica. */
export function toPosition(f: UnitFraction): number {
  return 1 / f.den;
}

export function label(numerator: number, den: number): string {
  return `${numerator}/${den}`;
}

/** Resposta de localização: em quantas partes dividiu e qual marca escolheu (1..parts-1). */
export interface LocateAnswer {
  parts: number;
  tick: number;
}

export type ErrorKind = 'wrong-parts' | 'wrong-tick' | 'wrong-compare' | 'no-tick';

export interface Result {
  correct: boolean;
  errorKind: ErrorKind | null;
}

export function evaluateLocate(target: UnitFraction, answer: LocateAnswer): Result {
  if (answer.parts !== target.den) return { correct: false, errorKind: 'wrong-parts' };
  if (answer.tick < 1 || answer.tick >= answer.parts) return { correct: false, errorKind: 'no-tick' };
  if (answer.tick !== 1) return { correct: false, errorKind: 'wrong-tick' };
  return { correct: true, errorKind: null };
}

/** Comparação de frações unitárias: qual é a menor? */
export function smallerOf(a: UnitFraction, b: UnitFraction): UnitFraction {
  return toPosition(a) <= toPosition(b) ? a : b;
}

export function evaluateCompare(a: UnitFraction, b: UnitFraction, chosen: UnitFraction): Result {
  const ok = smallerOf(a, b).den === chosen.den;
  return ok ? { correct: true, errorKind: null } : { correct: false, errorKind: 'wrong-compare' };
}
