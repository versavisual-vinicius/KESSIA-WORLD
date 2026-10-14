import { describe, expect, it } from 'vitest';
import { evaluateCompare, evaluateLocate, smallerOf, toPosition } from './fraction';
import { hintFeedback, successFeedback } from './feedback';
import { MISSIONS } from './missions';
import { currentMissionIndex, emptyProgress, loadProgress, recordAttempt } from './progress';

describe('fraction', () => {
  it('posição de 1/n', () => {
    expect(toPosition({ den: 4 })).toBe(0.25);
  });
  it('localiza corretamente', () => {
    expect(evaluateLocate({ den: 3 }, { parts: 3, tick: 1 })).toEqual({ correct: true, errorKind: null });
  });
  it('detecta divisão errada', () => {
    expect(evaluateLocate({ den: 3 }, { parts: 4, tick: 1 }).errorKind).toBe('wrong-parts');
  });
  it('detecta marca errada', () => {
    expect(evaluateLocate({ den: 4 }, { parts: 4, tick: 3 }).errorKind).toBe('wrong-tick');
  });
  it('detecta ausência de marca', () => {
    expect(evaluateLocate({ den: 4 }, { parts: 4, tick: 0 }).errorKind).toBe('no-tick');
  });
  it('comparação: mais partes = menor', () => {
    expect(smallerOf({ den: 3 }, { den: 5 }).den).toBe(5);
    expect(evaluateCompare({ den: 3 }, { den: 5 }, { den: 3 }).correct).toBe(false);
    expect(evaluateCompare({ den: 3 }, { den: 5 }, { den: 5 }).correct).toBe(true);
  });
});

describe('feedback', () => {
  const m = MISSIONS[0];
  it('pistas escalonam e mencionam denominador', () => {
    const h1 = hintFeedback(m, 'wrong-parts', 1, { parts: 3, tick: 1 });
    const h3 = hintFeedback(m, 'wrong-parts', 5);
    expect(h1.message).toContain('1/2');
    expect(h1.message).toContain('Você dividiu em 3');
    expect(h3.message).not.toBe(h1.message);
  });
  it('acerto explica relação', () => {
    expect(successFeedback(m).message).toContain('2 partes iguais');
  });
});

describe('progress', () => {
  it('erro não remove progresso', () => {
    let p = recordAttempt(emptyProgress(), 'm1-half', true);
    p = recordAttempt(p, 'm2-quarter', false);
    p = recordAttempt(p, 'm2-quarter', false);
    expect(p.completed).toEqual(['m1-half']);
    expect(p.attempts['m2-quarter']).toBe(2);
    expect(currentMissionIndex(p)).toBe(1);
  });
  it('acerto repetido não duplica', () => {
    let p = recordAttempt(emptyProgress(), 'm1-half', true);
    p = recordAttempt(p, 'm1-half', true);
    expect(p.completed).toEqual(['m1-half']);
  });
  it('dados corrompidos viram progresso vazio', () => {
    expect(loadProgress({ getItem: () => '{oops' })).toEqual(emptyProgress());
  });
  it('missões têm ids únicos', () => {
    expect(new Set(MISSIONS.map((x) => x.id)).size).toBe(MISSIONS.length);
  });
});
