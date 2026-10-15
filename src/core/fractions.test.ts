import { describe, expect, it } from 'vitest';
import {
  ALLOWED_DENOMINATORS,
  compareUnitFractions,
  evaluateUnitFractionAttempt,
  formatFractionSpoken,
  getFractionValue,
} from './fractions';
import { MISSIONS } from './missions';

describe('fractions core arithmetic (BNCC EF04MA09)', () => {
  it('allowed denominators are standard unit fractions', () => {
    expect(ALLOWED_DENOMINATORS).toEqual([2, 3, 4, 5, 6, 8, 10]);
  });

  describe('getFractionValue', () => {
    it('returns 0 when denominator is <= 0', () => {
      expect(getFractionValue(1, 0)).toBe(0);
      expect(getFractionValue(1, -2)).toBe(0);
    });

    it('calculates normalized values correctly', () => {
      expect(getFractionValue(1, 2)).toBe(0.5);
      expect(getFractionValue(1, 4)).toBe(0.25);
      expect(getFractionValue(3, 4)).toBe(0.75);
    });

    it('clamps values between 0 and 1', () => {
      expect(getFractionValue(-1, 2)).toBe(0);
      expect(getFractionValue(5, 2)).toBe(1);
    });
  });

  describe('formatFractionSpoken', () => {
    it('handles special values 0 and whole unit', () => {
      expect(formatFractionSpoken(0, 4)).toBe('zero');
      expect(formatFractionSpoken(4, 4)).toBe('um inteiro');
    });

    it('formats singular and plural unit fractions correctly in PT-BR', () => {
      expect(formatFractionSpoken(1, 2)).toBe('um meio');
      expect(formatFractionSpoken(1, 3)).toBe('um terço');
      expect(formatFractionSpoken(2, 3)).toBe('dois terços');
      expect(formatFractionSpoken(1, 4)).toBe('um quarto');
      expect(formatFractionSpoken(3, 4)).toBe('três quartos');
      expect(formatFractionSpoken(1, 8)).toBe('um oitavo');
      expect(formatFractionSpoken(5, 8)).toBe('cinco oitavos');
      expect(formatFractionSpoken(1, 10)).toBe('um décimo');
    });

    it('handles fallback for non-catalogued denominators', () => {
      expect(formatFractionSpoken(1, 12)).toBe('um sobre 12');
    });
  });

  describe('evaluateUnitFractionAttempt', () => {
    const halfMission = MISSIONS.find((m) => m.targetDenominator === 2)!;

    it('diagnoses correct answer when denominator and unit step match', () => {
      const feedback = evaluateUnitFractionAttempt(halfMission, 2, 1);
      expect(feedback.isCorrect).toBe(true);
      expect(feedback.diagnosis).toBe('correct');
      expect(feedback.headline).toContain('Acertou! 1/2');
    });

    it('diagnoses zero position when chosenStep is 0', () => {
      const feedback = evaluateUnitFractionAttempt(halfMission, 2, 0);
      expect(feedback.isCorrect).toBe(false);
      expect(feedback.diagnosis).toBe('zero_position');
      expect(feedback.headline).toContain('Você ainda está no 0!');
    });

    it('diagnoses whole unit when chosenStep equals denominator', () => {
      const feedback = evaluateUnitFractionAttempt(halfMission, 2, 2);
      expect(feedback.isCorrect).toBe(false);
      expect(feedback.diagnosis).toBe('whole_unit_position');
      expect(feedback.headline).toContain('1 inteiro');
    });

    it('diagnoses tick count confusion when denominator is off by 1', () => {
      const feedback = evaluateUnitFractionAttempt(halfMission, 3, 1);
      expect(feedback.isCorrect).toBe(false);
      expect(feedback.diagnosis).toBe('tick_count_confusion');
      expect(feedback.headline).toContain('Conte os blocos da barra!');
    });

    it('diagnoses wrong numerator when denominator is right but step > 1', () => {
      const quarterMission = MISSIONS.find((m) => m.targetDenominator === 4)!;
      const feedback = evaluateUnitFractionAttempt(quarterMission, 4, 3);
      expect(feedback.isCorrect).toBe(false);
      expect(feedback.diagnosis).toBe('wrong_numerator_position');
      expect(feedback.headline).toContain('Você marcou 3/4!');
    });

    it('diagnoses wrong denominator when difference is greater than 1', () => {
      const eighthMission = MISSIONS.find((m) => m.targetDenominator === 8)!;
      const feedback = evaluateUnitFractionAttempt(eighthMission, 2, 1);
      expect(feedback.isCorrect).toBe(false);
      expect(feedback.diagnosis).toBe('wrong_denominator');
    });
  });

  describe('compareUnitFractions', () => {
    it('reports equality when denominators are equal', () => {
      expect(compareUnitFractions(4, 4)).toContain('1/4 = 1/4');
    });

    it('explains that larger denominator results in smaller pieces', () => {
      const comparison = compareUnitFractions(2, 8);
      expect(comparison).toContain('1/2 é maior que 1/8');
      expect(comparison).toContain('Mais divisões = pedaços menores');
    });
  });
});
