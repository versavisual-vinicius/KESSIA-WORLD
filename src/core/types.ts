/**
 * Tipos centrais do núcleo pedagógico e matemático (BNCC EF04MA09)
 * Pequeno Mundo das Frações — Kessia World
 */

export type UnitDenominator = 2 | 3 | 4 | 5 | 6 | 8 | 10;

export type ErrorDiagnosisType =
  | 'correct'
  | 'wrong_denominator'
  | 'tick_count_confusion' // Ex.: dividiu em 3 para achar 1/4 (contou traços internos em vez de partes)
  | 'wrong_numerator_position' // Ex.: dividiu certo no denominador, mas parou no 0 ou em 2/d, 3/d...
  | 'zero_position'
  | 'whole_unit_position';

export interface PedagogicalFeedback {
  isCorrect: boolean;
  diagnosis: ErrorDiagnosisType;
  headline: string;
  explanation: string;
  hint: string;
  characterReaction: string;
  targetDenominator: UnitDenominator;
  chosenDenominator: number;
  chosenStep: number; // Índice na reta de 0 até chosenDenominator
}

export type CharacterAvatarId =
  | 'kessia'
  | 'lino'
  | 'milo'
  | 'nora'
  | 'geoda'
  | 'solis';

export interface MissionStation {
  id: string;
  order: number;
  title: string;
  biomeZone: string;
  characterName: string;
  characterRole: string;
  avatarId: CharacterAvatarId;
  shortCallout: string; // Frase curta exibida no balão flutuante 3D sobre o personagem
  greetingDialogue: string; // Saudação viva do personagem ao iniciar a conversa
  storyPrompt: string;
  pedagogicalGoal: string;
  targetDenominator: UnitDenominator;
  targetNumerator: 1; // EF04MA09 foca em frações unitárias (1/d)
  position3D: [number, number, number];
  npcOffset3D: [number, number, number];
  accentColor: string;
  rewardItem: {
    id: string;
    name: string;
    description: string;
    category: 'bridge' | 'crystal' | 'flora' | 'lantern' | 'fountain' | 'monument';
  };
  hints: {
    wrongDenominator: string;
    tickCountConfusion: string;
    wrongPosition: string;
    successMessage: string;
  };
}

export interface ProjectedStationMarker {
  missionId: string;
  x: number;
  y: number;
  visible: boolean;
  distanceToPlayer: number;
}

export interface AttemptRecord {
  id: string;
  missionId: string;
  targetFraction: string; // ex: "1/4"
  chosenDenominator: number;
  chosenNumerator: number;
  isCorrect: boolean;
  diagnosis: ErrorDiagnosisType;
  timestamp: number;
}

export interface PlacedDecoration {
  instanceId: string;
  rewardId: string;
  name: string;
  category: 'bridge' | 'crystal' | 'flora' | 'lantern' | 'fountain' | 'monument';
  x: number;
  z: number;
  rotationY: number;
}

export interface AccessibilitySettings {
  reducedStimuli: boolean;
  highContrast: boolean;
  largeText: boolean;
  voiceEnabled: boolean;
  soundEnabled: boolean;
}

export interface PlayerProgressState {
  completedMissionIds: string[];
  unlockedRewardIds: string[];
  placedDecorations: PlacedDecoration[];
  attempts: AttemptRecord[];
  accessibility: AccessibilitySettings;
  hasCompletedTour: boolean;
}

export type TourStep = 0 | 1 | 2 | 3;
export type GameScreenMode = 'title' | 'playing' | 'paused' | 'educator';
export type DockTabMode = 'mission' | 'review' | 'creative' | 'accessibility';
export type DialogueStage = 'exploring' | 'question' | 'celebrating';
