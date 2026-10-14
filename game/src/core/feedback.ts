import { label, type ErrorKind, type LocateAnswer } from './fraction';
import type { Mission } from './missions';

export interface Feedback {
  tone: 'success' | 'hint';
  message: string;
}

/** Texto de acerto: conecta unidade, denominador e parte escolhida. */
export function successFeedback(mission: Mission): Feedback {
  if (mission.kind === 'compare') {
    const [a, b] = mission.options;
    const small = a.den > b.den ? a : b;
    const big = small === a ? b : a;
    return {
      tone: 'success',
      message: `Isso! Dividir em ${small.den} partes deixa cada parte menor do que dividir em ${big.den}. Por isso ${label(1, small.den)} é menor que ${label(1, big.den)}.`,
    };
  }
  const n = mission.target.den;
  return {
    tone: 'success',
    message: `Muito bem! Você dividiu o caminho de 0 a 1 em ${n} partes iguais. Uma dessas partes é ${label(1, n)}.`,
  };
}

/**
 * Pista escalonada: attempt 1 = pista leve, 2 = mais direta, 3+ = demonstração.
 * Nunca remove progresso; só orienta.
 */
export function hintFeedback(
  mission: Mission,
  errorKind: ErrorKind,
  attempt: number,
  answer?: LocateAnswer,
): Feedback {
  const level = Math.min(Math.max(attempt, 1), 3);

  if (mission.kind === 'compare') {
    const msgs = [
      'Quase! Pense: quanto mais pedaços iguais, maior ou menor fica cada pedaço?',
      'Imagine uma pizza dividida em 3 e outra em 5. Em qual delas cada fatia é menor?',
      `Quando dividimos em mais partes, cada parte fica menor. Escolha a fração com o número de baixo maior.`,
    ];
    return { tone: 'hint', message: msgs[level - 1] };
  }

  const n = mission.target.den;
  if (errorKind === 'wrong-parts') {
    const got = answer ? ` Você dividiu em ${answer.parts}.` : '';
    const msgs = [
      `Olhe o número de baixo de ${label(1, n)}. Ele conta em quantas partes iguais o caminho foi dividido.${got}`,
      `O número de baixo é ${n}. Use os botões para dividir o caminho de 0 a 1 em ${n} partes iguais.${got}`,
      `Divida em ${n} partes: aperte os botões até ver ${n} pedaços iguais entre 0 e 1.`,
    ];
    return { tone: 'hint', message: msgs[level - 1] };
  }
  if (errorKind === 'no-tick') {
    return { tone: 'hint', message: 'Agora toque em uma das marcas da reta para escolher um ponto.' };
  }
  // wrong-tick
  const picked = answer ? ` Você marcou ${label(answer.tick, n)}, que são ${answer.tick} partes.` : '';
  const msgs = [
    `A divisão está certa! O número de cima de ${label(1, n)} é 1: queremos só uma parte.${picked}`,
    `Comece no 0 e ande só uma parte. Onde você para?${picked}`,
    `${label(1, n)} é a primeira marca depois do 0. Toque nela.`,
  ];
  return { tone: 'hint', message: msgs[level - 1] };
}
