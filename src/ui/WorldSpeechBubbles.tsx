/**
 * Sistema de Balões de Fala 3D — Estética Clean Girl & Visual-First
 * Menos texto, mais exemplos gráficos (diagramas de pizza/barra nos balões)
 * e paleta clara acolhedora (creme, verde-sálvia, rosa-blush e pedra suave).
 */

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  ChevronRight,
  Compass,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { MISSIONS } from '../core/missions';
import {
  MissionStation,
  PedagogicalFeedback,
  ProjectedStationMarker,
  TourStep,
} from '../core/types';
import { CharacterAvatar } from './CharacterAvatar';

interface WorldSpeechBubblesProps {
  markers: ProjectedStationMarker[];
  activeMissionId: string;
  nearbyMissionId: string | null;
  completedMissionIds: string[];
  feedback: PedagogicalFeedback | null;
  tourStep: TourStep;
  isDockOpen: boolean;
  highContrast: boolean;
  largeText: boolean;
  reducedStimuli: boolean;
  onSelectMission: (missionId: string) => void;
  onSpeakText: (text: string) => void;
  onNextMission: () => void;
  onAdvanceTour: () => void;
  onSkipTour: () => void;
}

/**
 * Mini Pizza/Flor SVG que mostra visualmente 1 parte destacada de N partes iguais
 */
export const MiniFractionPie: React.FC<{
  denominator: number;
  numerator?: number;
  color?: string;
  size?: number;
}> = ({ denominator, numerator = 1, color = '#10b981', size = 38 }) => {
  const r = 15;
  const cx = 19;
  const cy = 19;

  const slices = Array.from({ length: denominator }, (_, i) => {
    const startAngle = (i * 2 * Math.PI) / denominator - Math.PI / 2;
    const endAngle = ((i + 1) * 2 * Math.PI) / denominator - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = 2 * Math.PI / denominator > Math.PI ? 1 : 0;
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    const isFilled = i < numerator;
    return { d, isFilled, key: i };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 38 38"
      className="shrink-0"
      aria-hidden="true"
    >
      <circle cx={cx} cy={cy} r={r + 1.5} fill="#FAF6F0" stroke="#E7E5E4" strokeWidth="1.2" />
      {slices.map((s) => (
        <path
          key={s.key}
          d={s.d}
          fill={s.isFilled ? color : '#F5F2EB'}
          stroke="#78716C"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
};

export const TOUR_SCRIPT: Record<
  1 | 2 | 3,
  {
    badge: string;
    title: string;
    text: string;
    ctaLabel: string;
  }
> = {
  1: {
    badge: 'Tour · 1/3',
    title: 'Explore o Caminho 2D',
    text: 'Deslize a tela horizontalmente e toque na trilha para caminhar de 0 a 1.',
    ctaLabel: 'Próximo ▶',
  },
  2: {
    badge: 'Tour · 2/3',
    title: '1. Divida em Partes Iguais',
    text: 'Toque no número de partes para dividir a barra inteira.',
    ctaLabel: 'Próximo ▶',
  },
  3: {
    badge: 'Tour · 3/3',
    title: '2. Deslize na Reta (0 a 1)',
    text: 'Arraste a bolinha até a 1ª marca depois do 0 e toque em Responder!',
    ctaLabel: 'Começar! ✓',
  },
};

export const WorldSpeechBubbles: React.FC<WorldSpeechBubblesProps> = ({
  markers,
  activeMissionId,
  nearbyMissionId,
  completedMissionIds,
  feedback,
  tourStep,
  isDockOpen,
  highContrast,
  largeText,
  reducedStimuli,
  onSelectMission,
  onSpeakText,
  onNextMission,
  onAdvanceTour,
  onSkipTour,
}) => {
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;

  const maxBubbleBottomY = isDockOpen
    ? Math.max(195, viewportH * 0.45)
    : viewportH - 110;

  return (
    <div
      className="fixed inset-0 z-15 pointer-events-none overflow-hidden"
      aria-label="Balões de fala dos personagens no mundo 3D"
    >
      {markers.map((marker) => {
        if (!marker.visible) return null;
        const mission: MissionStation | undefined = MISSIONS.find(
          (m) => m.id === marker.missionId
        );
        if (!mission) return null;

        const isActive = mission.id === activeMissionId;
        const isNearby = mission.id === nearbyMissionId || marker.distanceToPlayer < 2.8;
        const isCompleted = completedMissionIds.includes(mission.id);

        if (tourStep > 0 && !isActive) {
          return null;
        }

        if (!isActive && isDockOpen && marker.y > maxBubbleBottomY) {
          return null;
        }

        const halfBubbleWidth = isActive ? Math.min(150, viewportW * 0.44) : 65;
        const clampedX = Math.max(
          halfBubbleWidth + 8,
          Math.min(viewportW - halfBubbleWidth - 8, marker.x)
        );
        const clampedY = Math.max(
          isActive ? 150 : 78,
          Math.min(maxBubbleBottomY, marker.y)
        );

        const tailOffsetX = Math.max(
          -70,
          Math.min(70, marker.x - clampedX)
        );

        const mood =
          tourStep > 0
            ? 'happy'
            : isActive && feedback
            ? feedback.isCorrect
              ? 'happy'
              : 'hint'
            : 'neutral';

        const currentTour =
          tourStep === 1 || tourStep === 2 || tourStep === 3
            ? TOUR_SCRIPT[tourStep]
            : null;

        return (
          <div
            key={mission.id}
            style={{
              transform: `translate3d(${clampedX}px, ${clampedY}px, 0) translate(-50%, -100%)`,
              transition: reducedStimuli
                ? 'none'
                : 'transform 140ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className={`absolute left-0 top-0 pointer-events-auto ${
              isActive ? 'z-30' : isNearby ? 'z-20' : 'z-10'
            }`}
          >
            <AnimatePresence mode="wait">
              {isActive && currentTour ? (
                /* BALÃO VISUAL DE TOUR GUIADO (Clean Girl Light Style) */
                <motion.div
                  key={`tour-bubble-step-${tourStep}`}
                  initial={
                    reducedStimuli
                      ? { opacity: 1 }
                      : { opacity: 0, scale: 0.9, y: 10 }
                  }
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={
                    reducedStimuli
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.94, y: -6 }
                  }
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className={`relative w-[min(310px,calc(100vw-20px))] sm:w-[375px] p-3 sm:p-3.5 rounded-3xl border-2 shadow-[0_14px_34px_rgba(120,113,108,0.16)] ${
                    highContrast
                      ? 'bg-white border-stone-900 text-stone-950'
                      : 'bg-[#FFFDF9]/96 border-rose-300 text-stone-800'
                  }`}
                  role="dialog"
                  aria-live="polite"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <CharacterAvatar
                        avatarId={mission.avatarId}
                        mood="happy"
                        size="sm"
                      />
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1 font-mono-num text-[11px] font-bold text-rose-500">
                          <Compass className="w-3.5 h-3.5" />
                          {currentTour.badge}
                        </span>
                        <div className="font-display font-bold text-sm text-stone-800 truncate">
                          {currentTour.title}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onSpeakText(`${currentTour.title}. ${currentTour.text}`)
                      }
                      className="w-9 h-9 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors shrink-0"
                      title="Ouvir"
                      aria-label="Ouvir dica do tour"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Exemplo Visual Ilustrado de cada passo do Tour */}
                  <div className="mb-2.5 p-2 rounded-2xl bg-[#FAF6F0] border border-stone-200/80 flex items-center gap-3">
                    {tourStep === 1 && (
                      <div className="flex items-center gap-2 px-2 py-1 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-700 shrink-0">
                        <span>🔄 360°</span>
                        <span className="text-stone-300">|</span>
                        <span>👆 Toque</span>
                      </div>
                    )}
                    {tourStep === 2 && (
                      <div className="flex items-center gap-1 shrink-0">
                        <div className="w-7 h-6 rounded-l-md bg-emerald-400 border border-emerald-600 flex items-center justify-center font-mono-num text-[10px] font-bold text-white">
                          1/2
                        </div>
                        <div className="w-7 h-6 rounded-r-md bg-stone-100 border border-stone-300 flex items-center justify-center font-mono-num text-[10px] text-stone-500">
                          1/2
                        </div>
                      </div>
                    )}
                    {tourStep === 3 && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white border border-emerald-300 font-mono-num text-xs font-bold text-emerald-700 shrink-0">
                        <span>0</span>
                        <span>──●──</span>
                        <span>1</span>
                      </div>
                    )}
                    <p
                      className={`leading-snug text-stone-700 ${
                        largeText ? 'text-sm' : 'text-xs'
                      }`}
                    >
                      {currentTour.text}
                    </p>
                  </div>

                  {/* Rodapé enxuto do Tour */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1" aria-hidden="true">
                        {[1, 2, 3].map((s) => (
                          <span
                            key={s}
                            className={`h-1.5 rounded-full transition-all ${
                              tourStep === s
                                ? 'w-5 bg-rose-400'
                                : s < tourStep
                                ? 'w-2 bg-emerald-400'
                                : 'w-2 bg-stone-300'
                            }`}
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={onSkipTour}
                        className="text-[11px] text-stone-400 hover:text-stone-600 underline px-1"
                      >
                        Pular
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={onAdvanceTour}
                      className="min-h-[36px] px-4 py-1.5 rounded-full bg-rose-400 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                    >
                      <span>{currentTour.ctaLabel}</span>
                    </button>
                  </div>

                  <div
                    style={{ transform: `translateX(${tailOffsetX}px)` }}
                    className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 bg-[#FFFDF9] border-r-2 border-b-2 border-rose-300"
                    aria-hidden="true"
                  />
                </motion.div>
              ) : isActive ? (
                /* BALÃO DO PERSONAGEM ATIVO: Exemplo Visual + Frase Curta */
                <motion.div
                  key={`active-bubble-${mission.id}-${
                    feedback ? (feedback.isCorrect ? 'ok' : 'hint') : 'quest'
                  }`}
                  initial={
                    reducedStimuli
                      ? { opacity: 1 }
                      : { opacity: 0, scale: 0.9, y: 8 }
                  }
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={
                    reducedStimuli
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.94, y: 4 }
                  }
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className={`relative w-[min(310px,calc(100vw-20px))] sm:w-[365px] p-2.5 sm:p-3 rounded-3xl border-2 shadow-[0_14px_32px_rgba(120,113,108,0.15)] ${
                    feedback
                      ? feedback.isCorrect
                        ? 'bg-[#FFFDF9]/96 border-emerald-400 text-stone-800'
                        : 'bg-[#FFFDF9]/96 border-amber-300 text-stone-800'
                      : highContrast
                      ? 'bg-white border-stone-900 text-stone-950'
                      : 'bg-[#FFFDF9]/96 border-stone-200/95 text-stone-800'
                  }`}
                  role="region"
                  aria-live="polite"
                >
                  <div className="flex items-center gap-2.5">
                    <CharacterAvatar
                      avatarId={mission.avatarId}
                      mood={mood}
                      size="sm"
                    />

                    {/* Exemplo Visual de Pizza/Fatia direto no Balão */}
                    <MiniFractionPie
                      denominator={mission.targetDenominator}
                      numerator={1}
                      color={mission.accentColor}
                      size={40}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-display font-bold text-xs text-stone-500 truncate">
                          {mission.characterName}
                        </span>
                        <span
                          className="font-mono-num text-xs font-extrabold px-2 py-0.5 rounded-full text-white shadow-xs"
                          style={{ backgroundColor: mission.accentColor }}
                        >
                          1/{mission.targetDenominator}
                        </span>
                        {isCompleted && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                      </div>

                      <p
                        className={`font-semibold text-stone-800 leading-snug mt-0.5 ${
                          largeText ? 'text-sm' : 'text-xs sm:text-[13px]'
                        }`}
                      >
                        {feedback
                          ? feedback.characterReaction
                          : mission.storyPrompt}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onSpeakText(
                          feedback
                            ? `${feedback.headline}. ${feedback.characterReaction}`
                            : `${mission.characterName}: ${mission.storyPrompt}`
                        )
                      }
                      className="w-9 h-9 rounded-full bg-[#FAF6F0] hover:bg-stone-200/70 text-stone-600 flex items-center justify-center transition-colors shrink-0"
                      title="Ouvir personagem"
                      aria-label="Ouvir fala do personagem"
                    >
                      <Volume2 className="w-4 h-4 text-emerald-600" />
                    </button>
                  </div>

                  {/* Quando acerta: botão rápido para próximo personagem */}
                  {feedback && feedback.isCorrect && (
                    <div className="mt-2 pt-2 border-t border-stone-200/70 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>+{mission.rewardItem.name}</span>
                      </span>
                      <button
                        type="button"
                        onClick={onNextMission}
                        className="px-3 py-1 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-transform active:scale-95"
                      >
                        <span>Próximo</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Cauda do Balão */}
                  <div
                    style={{ transform: `translateX(${tailOffsetX}px)` }}
                    className={`absolute left-1/2 -bottom-2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 bg-[#FFFDF9] border-r-2 border-b-2 ${
                      feedback
                        ? feedback.isCorrect
                          ? 'border-emerald-400'
                          : 'border-amber-300'
                        : 'border-stone-200/95'
                    }`}
                    aria-hidden="true"
                  />
                </motion.div>
              ) : (
                /* PÍLULA COMPACTA CLEAN GIRL ACIMA DOS DEMAIS GUARDIÕES */
                <motion.button
                  key={`compact-bubble-${mission.id}`}
                  type="button"
                  onClick={() => onSelectMission(mission.id)}
                  initial={
                    reducedStimuli ? { opacity: 1 } : { opacity: 0, scale: 0.88 }
                  }
                  animate={{ opacity: 1, scale: 1 }}
                  exit={
                    reducedStimuli ? { opacity: 0 } : { opacity: 0, scale: 0.88 }
                  }
                  transition={{ duration: 0.16 }}
                  className={`group relative px-2.5 py-1.5 rounded-full border shadow-md flex items-center gap-1.5 transition-transform active:scale-95 ${
                    isCompleted
                      ? 'bg-[#FFFDF9]/95 border-emerald-300 text-stone-700'
                      : isNearby
                      ? 'bg-[#FFFDF9] border-rose-300 text-stone-800 scale-105'
                      : 'bg-[#FFFDF9]/90 border-stone-200/90 text-stone-700 hover:border-stone-300'
                  }`}
                  aria-label={`Conversar com ${mission.characterName}: fração 1 sobre ${mission.targetDenominator}`}
                >
                  <MiniFractionPie
                    denominator={mission.targetDenominator}
                    numerator={1}
                    color={mission.accentColor}
                    size={22}
                  />
                  <span className="font-display font-bold text-xs text-stone-800">
                    {mission.characterName}
                  </span>
                  <span
                    className="font-mono-num text-[11px] font-bold px-1.5 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: mission.accentColor }}
                  >
                    1/{mission.targetDenominator}
                  </span>
                  {isCompleted && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  )}

                  <span
                    className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-[#FFFDF9] border-r border-b border-stone-200"
                    aria-hidden="true"
                  />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
