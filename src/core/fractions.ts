/**
 * Núcleo Matemático Determinístico (BNCC EF04MA09)
 * Mensagens curtas, visuais e acolhedoras para leitura rápida.
 */

import {
  ErrorDiagnosisType,
  MissionStation,
  PedagogicalFeedback,
  UnitDenominator,
} from './types';

export const ALLOWED_DENOMINATORS: UnitDenominator[] = [2, 3, 4, 5, 6, 8, 10];

export function getFractionValue(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.max(0, Math.min(1, numerator / denominator));
}

export function formatFractionSpoken(numerator: number, denominator: number): string {
  if (numerator === 0) return 'zero';
  if (numerator === denominator) return 'um inteiro';

  const denominatorNames: Record<number, { singular: string; plural: string }> = {
    2: { singular: 'meio', plural: 'meios' },
    3: { singular: 'terço', plural: 'terços' },
    4: { singular: 'quarto', plural: 'quartos' },
    5: { singular: 'quinto', plural: 'quintos' },
    6: { singular: 'sexto', plural: 'sextos' },
    7: { singular: 'sétimo', plural: 'sétimos' },
    8: { singular: 'oitavo', plural: 'oitavos' },
    9: { singular: 'nono', plural: 'nonos' },
    10: { singular: 'décimo', plural: 'décimos' },
  };

  const numberNames: Record<number, string> = {
    1: 'um',
    2: 'dois',
    3: 'três',
    4: 'quatro',
    5: 'cinco',
    6: 'seis',
    7: 'sete',
    8: 'oito',
    9: 'nove',
    10: 'dez',
  };

  const numWord = numberNames[numerator] || String(numerator);
  const denEntry = denominatorNames[denominator];

  if (!denEntry) {
    return `${numWord} sobre ${denominator}`;
  }

  return `${numWord} ${numerator === 1 ? denEntry.singular : denEntry.plural}`;
}

export function evaluateUnitFractionAttempt(
  mission: MissionStation,
  chosenDenominator: number,
  chosenStep: number
): PedagogicalFeedback {
  const targetD = mission.targetDenominator;
  const isDenominatorMatch = chosenDenominator === targetD;
  const isStepUnit = chosenStep === 1;

  if (isDenominatorMatch && isStepUnit) {
    return {
      isCorrect: true,
      diagnosis: 'correct',
      headline: `Acertou! 1/${targetD} (${formatFractionSpoken(1, targetD)})`,
      explanation: `1 parte de ${targetD} iguais.`,
      hint: mission.hints.successMessage,
      characterReaction: mission.hints.successMessage,
      targetDenominator: targetD,
      chosenDenominator,
      chosenStep,
    };
  }

  if (chosenStep === 0) {
    return {
      isCorrect: false,
      diagnosis: 'zero_position',
      headline: 'Você ainda está no 0!',
      explanation: `Avance 1 parte na reta.`,
      hint: `Divida em ${targetD} partes e vá para a 1ª marca.`,
      characterReaction: `Saia do 0 e avance 1 parte para achar 1/${targetD}!`,
      targetDenominator: targetD,
      chosenDenominator,
      chosenStep,
    };
  }

  if (chosenStep === chosenDenominator) {
    return {
      isCorrect: false,
      diagnosis: 'whole_unit_position',
      headline: `Aí é 1 inteiro (${chosenDenominator}/${chosenDenominator})!`,
      explanation: `1/${targetD} é só a 1ª parte.`,
      hint: `Volte para a 1ª marca logo depois do 0.`,
      characterReaction: `No 1 você pegou tudo! Marque só a 1ª parte (1/${targetD}).`,
      targetDenominator: targetD,
      chosenDenominator,
      chosenStep,
    };
  }

  if (Math.abs(chosenDenominator - targetD) === 1) {
    const diagnosis: ErrorDiagnosisType = 'tick_count_confusion';
    return {
      isCorrect: false,
      diagnosis,
      headline: `Conte os blocos da barra!`,
      explanation: `Você dividiu em ${chosenDenominator}, mas queremos ${targetD} partes.`,
      hint: mission.hints.tickCountConfusion,
      characterReaction: `Toque no botão "${targetD}" para ter ${targetD} partes iguais!`,
      targetDenominator: targetD,
      chosenDenominator,
      chosenStep,
    };
  }

  if (isDenominatorMatch && chosenStep > 1) {
    return {
      isCorrect: false,
      diagnosis: 'wrong_numerator_position',
      headline: `Você marcou ${chosenStep}/${targetD}!`,
      explanation: `Precisamos de apenas 1 parte (1/${targetD}).`,
      hint: mission.hints.wrongPosition,
      characterReaction: `As ${targetD} partes estão certas! Agora volte para 1/${targetD}.`,
      targetDenominator: targetD,
      chosenDenominator,
      chosenStep,
    };
  }

  return {
    isCorrect: false,
    diagnosis: 'wrong_denominator',
    headline: `Você marcou ${chosenStep}/${chosenDenominator} (meta: 1/${targetD})`,
    explanation: `O número de baixo pede ${targetD} partes iguais.`,
    hint: mission.hints.wrongDenominator,
    characterReaction: `Escolha "${targetD}" partes iguais para achar 1/${targetD}!`,
    targetDenominator: targetD,
    chosenDenominator,
    chosenStep,
  };
}

export function compareUnitFractions(denA: number, denB: number): string {
  if (denA === denB) {
    return `1/${denA} = 1/${denB} (mesmo tamanho!)`;
  }
  const smallerPieceDen = Math.max(denA, denB);
  const largerPieceDen = Math.min(denA, denB);
  return `1/${largerPieceDen} é maior que 1/${smallerPieceDen}! Mais divisões = pedaços menores.`;
}
