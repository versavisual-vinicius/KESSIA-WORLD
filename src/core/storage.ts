/**
 * Persistência local do estudante e relatórios para o Painel do Educador
 * Salvo localmente no navegador (localStorage) sem necessidade de servidor externo.
 */

import { AccessibilitySettings, AttemptRecord, PlacedDecoration, PlayerProgressState } from './types';

const STORAGE_KEY = 'kessia_world_ef04ma09_progress_v1';

export const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  reducedStimuli: false,
  highContrast: false,
  largeText: false,
  voiceEnabled: true,
  soundEnabled: true,
};

export const INITIAL_PROGRESS_STATE: PlayerProgressState = {
  completedMissionIds: [],
  unlockedRewardIds: [],
  placedDecorations: [],
  attempts: [],
  accessibility: DEFAULT_ACCESSIBILITY,
  hasCompletedTour: false,
};

export function loadProgressState(): PlayerProgressState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_PROGRESS_STATE;
    const parsed = JSON.parse(raw) as Partial<PlayerProgressState>;
    return {
      completedMissionIds: Array.isArray(parsed.completedMissionIds)
        ? parsed.completedMissionIds
        : [],
      unlockedRewardIds: Array.isArray(parsed.unlockedRewardIds)
        ? parsed.unlockedRewardIds
        : [],
      placedDecorations: Array.isArray(parsed.placedDecorations)
        ? parsed.placedDecorations
        : [],
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
      accessibility: {
        ...DEFAULT_ACCESSIBILITY,
        ...(parsed.accessibility || {}),
      },
      hasCompletedTour: Boolean(parsed.hasCompletedTour),
    };
  } catch {
    return INITIAL_PROGRESS_STATE;
  }
}

export function saveProgressState(state: PlayerProgressState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Fallback silencioso se o navegador estiver em modo restrito de armazenamento
  }
}

export function resetProgressState(): PlayerProgressState {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignorar erro
  }
  return INITIAL_PROGRESS_STATE;
}

/**
 * Gera estatísticas diagnósticas para o Painel do Educador (BNCC EF04MA09)
 */
export function computeEducatorDiagnostics(attempts: AttemptRecord[]) {
  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((a) => a.isCorrect).length;
  const accuracyRate = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  const wrongDenominatorCount = attempts.filter(
    (a) => a.diagnosis === 'wrong_denominator'
  ).length;
  const tickConfusionCount = attempts.filter(
    (a) => a.diagnosis === 'tick_count_confusion'
  ).length;
  const wrongPositionCount = attempts.filter(
    (a) =>
      a.diagnosis === 'wrong_numerator_position' ||
      a.diagnosis === 'zero_position' ||
      a.diagnosis === 'whole_unit_position'
  ).length;

  const pedagogicalRecommendations: string[] = [];

  if (tickConfusionCount > 0) {
    pedagogicalRecommendations.push(
      'O estudante apresentou confusão entre o número de traços divisórios e o número de intervalos iguais. Sugestão de mediação: peça que ele pinte ou conte com o dedo os espaços retangulares da barra de fração acima da reta antes de olhar os traços.'
    );
  }
  if (wrongDenominatorCount > 0) {
    pedagogicalRecommendations.push(
      'Houve tentativas em que o denominador escolhido não correspondia à fração solicitada. Sugestão de mediação: pergunte "O que o número de baixo da fração nos conta sobre a régua de 0 a 1?".'
    );
  }
  if (wrongPositionCount > 0) {
    pedagogicalRecommendations.push(
      'O estudante dividiu a unidade corretamente no denominador, mas posicionou o marcador em mais de uma parte (ex.: 2/4 em vez de 1/4) ou nos extremos (0 ou 1). Sugestão de mediação: reforce que a fração unitária 1/d corresponde ao tamanho de apenas 1 salto a partir do zero.'
    );
  }
  if (pedagogicalRecommendations.length === 0 && totalAttempts > 0) {
    pedagogicalRecommendations.push(
      'O estudante demonstrou excelente compreensão da relação entre a divisão da unidade em partes iguais e a posição das frações unitárias na reta numérica. Sugestão: proponha no Modo Livre de Revisão comparar por que 1/4 é menor que 1/2.'
    );
  }
  if (totalAttempts === 0) {
    pedagogicalRecommendations.push(
      'Nenhuma tentativa registrada ainda. Acompanhe o estudante na primeira missão (Ponte do Riacho — 1/2) observando como ele relaciona a barra superior com a reta numérica.'
    );
  }

  return {
    totalAttempts,
    correctAttempts,
    accuracyRate,
    wrongDenominatorCount,
    tickConfusionCount,
    wrongPositionCount,
    pedagogicalRecommendations,
  };
}
