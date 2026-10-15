import { beforeEach, describe, expect, it } from 'vitest';
import {
  computeEducatorDiagnostics,
  DEFAULT_ACCESSIBILITY,
  INITIAL_PROGRESS_STATE,
  loadProgressState,
  resetProgressState,
  saveProgressState,
} from './storage';
import { AttemptRecord, PlayerProgressState } from './types';

describe('storage and educator diagnostics core', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe('progress state persistence', () => {
    it('returns INITIAL_PROGRESS_STATE when storage is empty', () => {
      const state = loadProgressState();
      expect(state).toEqual(INITIAL_PROGRESS_STATE);
    });

    it('persists and reloads progress state correctly', () => {
      const customState: PlayerProgressState = {
        completedMissionIds: ['mission-half', 'mission-third'],
        unlockedRewardIds: ['reward-wooden-arch'],
        placedDecorations: [
          {
            instanceId: 'dec-1',
            rewardId: 'reward-wooden-arch',
            name: 'Arco Florido',
            category: 'bridge',
            x: 1,
            z: 1,
            rotationY: 0,
          },
        ],
        attempts: [
          {
            id: 'att-1',
            missionId: 'mission-half',
            targetFraction: '1/2',
            chosenDenominator: 2,
            chosenNumerator: 1,
            isCorrect: true,
            diagnosis: 'correct',
            timestamp: 12345678,
          },
        ],
        accessibility: {
          ...DEFAULT_ACCESSIBILITY,
          highContrast: true,
        },
        hasCompletedTour: true,
      };

      saveProgressState(customState);
      const reloaded = loadProgressState();
      expect(reloaded).toEqual(customState);
      expect(reloaded.accessibility.highContrast).toBe(true);
      expect(reloaded.completedMissionIds).toContain('mission-half');
    });

    it('recovers gracefully from corrupted JSON in localStorage', () => {
      window.localStorage.setItem('kessia_world_ef04ma09_progress_v1', '{invalid-json');
      const state = loadProgressState();
      expect(state).toEqual(INITIAL_PROGRESS_STATE);
    });

    it('resets progress state to initial', () => {
      saveProgressState({
        ...INITIAL_PROGRESS_STATE,
        completedMissionIds: ['mission-half'],
      });
      const reset = resetProgressState();
      expect(reset).toEqual(INITIAL_PROGRESS_STATE);
      expect(loadProgressState().completedMissionIds).toHaveLength(0);
    });
  });

  describe('computeEducatorDiagnostics', () => {
    it('handles zero attempts scenario with intro recommendation', () => {
      const result = computeEducatorDiagnostics([]);
      expect(result.totalAttempts).toBe(0);
      expect(result.accuracyRate).toBe(0);
      expect(result.pedagogicalRecommendations[0]).toContain('Nenhuma tentativa registrada');
    });

    it('computes accuracy and diagnoses specific learner hurdles', () => {
      const sampleAttempts: AttemptRecord[] = [
        {
          id: 'att-1',
          missionId: 'mission-half',
          targetFraction: '1/2',
          chosenDenominator: 2,
          chosenNumerator: 1,
          isCorrect: true,
          diagnosis: 'correct',
          timestamp: 1,
        },
        {
          id: 'att-2',
          missionId: 'mission-third',
          targetFraction: '1/3',
          chosenDenominator: 4,
          chosenNumerator: 1,
          isCorrect: false,
          diagnosis: 'tick_count_confusion',
          timestamp: 2,
        },
        {
          id: 'att-3',
          missionId: 'mission-fourth',
          targetFraction: '1/4',
          chosenDenominator: 8,
          chosenNumerator: 1,
          isCorrect: false,
          diagnosis: 'wrong_denominator',
          timestamp: 3,
        },
        {
          id: 'att-4',
          missionId: 'mission-sixth',
          targetFraction: '1/6',
          chosenDenominator: 6,
          chosenNumerator: 3,
          isCorrect: false,
          diagnosis: 'wrong_numerator_position',
          timestamp: 4,
        },
      ];

      const diag = computeEducatorDiagnostics(sampleAttempts);
      expect(diag.totalAttempts).toBe(4);
      expect(diag.correctAttempts).toBe(1);
      expect(diag.accuracyRate).toBe(25);
      expect(diag.tickConfusionCount).toBe(1);
      expect(diag.wrongDenominatorCount).toBe(1);
      expect(diag.wrongPositionCount).toBe(1);
      expect(diag.pedagogicalRecommendations.length).toBe(3);
    });

    it('provides positive reinforcement on high mastery', () => {
      const perfectAttempts: AttemptRecord[] = [
        {
          id: 'att-1',
          missionId: 'mission-half',
          targetFraction: '1/2',
          chosenDenominator: 2,
          chosenNumerator: 1,
          isCorrect: true,
          diagnosis: 'correct',
          timestamp: 1,
        },
        {
          id: 'att-2',
          missionId: 'mission-third',
          targetFraction: '1/3',
          chosenDenominator: 3,
          chosenNumerator: 1,
          isCorrect: true,
          diagnosis: 'correct',
          timestamp: 2,
        },
      ];

      const diag = computeEducatorDiagnostics(perfectAttempts);
      expect(diag.accuracyRate).toBe(100);
      expect(diag.pedagogicalRecommendations[0]).toContain('excelente compreensão');
    });
  });
});
