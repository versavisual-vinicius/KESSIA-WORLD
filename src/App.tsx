/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pequeno Mundo das Frações (Kessia World — BNCC EF04MA09)
 * Camadas simplificadas com estética Clean Girl (creme/marfim, verde-sálvia e rosa-blush),
 * menos texto e mais exemplos visuais interativos.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Compass,
  Eye,
  MessageCircle,
  Palette,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { soundController } from './core/audio';
import {
  evaluateUnitFractionAttempt,
} from './core/fractions';
import { MISSIONS } from './core/missions';
import {
  loadProgressState,
  resetProgressState,
  saveProgressState,
} from './core/storage';
import {
  AccessibilitySettings,
  AttemptRecord,
  DockTabMode,
  GameScreenMode,
  MissionStation,
  PedagogicalFeedback,
  PlayerProgressState,
  ProjectedStationMarker,
  TourStep,
  UnitDenominator,
} from './core/types';
import { CharacterAvatar } from './ui/CharacterAvatar';
import { EducatorModal } from './ui/EducatorModal';
import { NumberLineVisualizer } from './ui/NumberLineVisualizer';
import { RewardBuildOverlay } from './ui/RewardBuildOverlay';
import { TitleScreenOverlay } from './ui/TitleScreenOverlay';
import {
  MiniFractionPie,
  TOUR_SCRIPT,
  WorldSpeechBubbles,
} from './ui/WorldSpeechBubbles';

const TerrariumCanvas = React.lazy(() =>
  import('./world/TerrariumCanvas').then((mod) => ({ default: mod.TerrariumCanvas }))
);

export default function App() {
  const [progress, setProgress] = useState<PlayerProgressState>(() =>
    loadProgressState()
  );
  const [screenMode, setScreenMode] = useState<GameScreenMode>('title');
  const [dockTab, setDockTab] = useState<DockTabMode>('mission');
  const [isDialogueOpen, setIsDialogueOpen] = useState<boolean>(true);
  const [tourStep, setTourStep] = useState<TourStep>(0);

  // Estados de Construção de Peças no Mundo ao Acertar Questões
  const [buildModeReward, setBuildModeReward] = useState<MissionStation['rewardItem'] | null>(null);
  const [justBuiltName, setJustBuiltName] = useState<string | null>(null);

  const [activeMissionId, setActiveMissionId] = useState<string>(MISSIONS[0].id);
  const [nearbyMissionId, setNearbyMissionId] = useState<string | null>(null);
  const [projectedMarkers, setProjectedMarkers] = useState<ProjectedStationMarker[]>([]);
  const [mobileMoveDir, setMobileMoveDir] = useState<{ x: number; z: number }>({
    x: 0,
    z: 0,
  });

  const [chosenDenominator, setChosenDenominator] = useState<UnitDenominator>(2);
  const [chosenStep, setChosenStep] = useState<number>(0);
  const [compareDenominator, setCompareDenominator] = useState<UnitDenominator>(4);
  const [feedback, setFeedback] = useState<PedagogicalFeedback | null>(null);
  const [celebrationTrigger, setCelebrationTrigger] = useState<number>(0);
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);

  const activeMission = useMemo(
    () => MISSIONS.find((m) => m.id === activeMissionId) || MISSIONS[0],
    [activeMissionId]
  );

  const nearbyMission = useMemo(
    () => MISSIONS.find((m) => m.id === nearbyMissionId) || null,
    [nearbyMissionId]
  );

  useEffect(() => {
    saveProgressState(progress);
    soundController.configure({
      soundEnabled: progress.accessibility.soundEnabled,
      voiceEnabled: progress.accessibility.voiceEnabled,
      reducedStimuli: progress.accessibility.reducedStimuli,
    });
  }, [progress]);

  const handleStartGame = useCallback(() => {
    setScreenMode('playing');
    if (!progress.hasCompletedTour) {
      setActiveMissionId(MISSIONS[0].id);
      setFeedback(null);
      setTourStep(1);
      setIsDialogueOpen(false);
      soundController.playTick(0.5);
      soundController.speak(
        `${TOUR_SCRIPT[1].title}. ${TOUR_SCRIPT[1].text}`
      );
    }
  }, [progress.hasCompletedTour]);

  const handleStartTourManually = useCallback(() => {
    setActiveMissionId(MISSIONS[0].id);
    setFeedback(null);
    setTourStep(1);
    setIsDialogueOpen(false);
    soundController.playTick(0.5);
    soundController.speak(`${TOUR_SCRIPT[1].title}. ${TOUR_SCRIPT[1].text}`);
  }, []);

  const handleAdvanceTour = useCallback(() => {
    soundController.playTick(0.65);
    if (tourStep === 1) {
      setTourStep(2);
      setDockTab('mission');
      setIsDialogueOpen(true);
      soundController.speak(`${TOUR_SCRIPT[2].title}. ${TOUR_SCRIPT[2].text}`);
    } else if (tourStep === 2) {
      setTourStep(3);
      setDockTab('mission');
      setIsDialogueOpen(true);
      soundController.speak(`${TOUR_SCRIPT[3].title}. ${TOUR_SCRIPT[3].text}`);
    } else {
      setTourStep(0);
      setIsDialogueOpen(true);
      setProgress((prev) => ({
        ...prev,
        hasCompletedTour: true,
      }));
      soundController.playSuccessChord();
      soundController.speak(
        `${activeMission.characterName}: ${activeMission.storyPrompt}`
      );
    }
  }, [tourStep, activeMission]);

  const handleSkipTour = useCallback(() => {
    setTourStep(0);
    setIsDialogueOpen(true);
    setProgress((prev) => ({
      ...prev,
      hasCompletedTour: true,
    }));
    soundController.playTick(0.4);
  }, []);

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (screenMode !== 'playing') return;
      if (e.key === 'h' || e.key === 'H') {
        setIsDialogueOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setScreenMode('title');
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [screenMode]);

  const handleSelectMission = useCallback((missionId: string) => {
    const mission = MISSIONS.find((m) => m.id === missionId);
    setActiveMissionId(missionId);
    setFeedback(null);
    setChosenStep(0);
    setDockTab('mission');
    setIsDialogueOpen(true);
    setBuildModeReward(null);
    setJustBuiltName(null);
    soundController.playTick(0.45);
    if (mission) {
      soundController.speak(
        `${mission.characterName}: ${mission.storyPrompt}`
      );
    }
  }, []);

  const handleChangeDenominator = useCallback(
    (den: UnitDenominator) => {
      setChosenDenominator(den);
      setChosenStep((prev) => Math.min(prev, den));
      setFeedback(null);
      soundController.playTick(den / 10);
      if (tourStep === 2) {
        setTourStep(3);
        soundController.speak(`${TOUR_SCRIPT[3].title}. ${TOUR_SCRIPT[3].text}`);
      }
    },
    [tourStep]
  );

  const handleChangeStep = useCallback(
    (step: number) => {
      setChosenStep(step);
      setFeedback(null);
      soundController.playTick(step / Math.max(1, chosenDenominator));
    },
    [chosenDenominator]
  );

  const handleVerifyAnswer = () => {
    if (tourStep > 0) {
      setTourStep(0);
      setProgress((prev) => ({
        ...prev,
        hasCompletedTour: true,
      }));
    }

    const result = evaluateUnitFractionAttempt(
      activeMission,
      chosenDenominator,
      chosenStep
    );
    setFeedback(result);

    const newAttempt: AttemptRecord = {
      id: `att-${Date.now()}`,
      missionId: activeMission.id,
      targetFraction: `1/${activeMission.targetDenominator}`,
      chosenDenominator,
      chosenNumerator: chosenStep,
      isCorrect: result.isCorrect,
      diagnosis: result.diagnosis,
      timestamp: Date.now(),
    };

    if (result.isCorrect) {
      soundController.playSuccessChord();
      soundController.speak(`${result.headline}. ${result.characterReaction}`);
      setCelebrationTrigger((c) => c + 1);

      // Ativa o modo de construção da peça conquistada no terrário 3D
      setBuildModeReward(activeMission.rewardItem);
      setJustBuiltName(null);
      setIsDialogueOpen(false);

      setProgress((prev) => {
        const completed = prev.completedMissionIds.includes(activeMission.id)
          ? prev.completedMissionIds
          : [...prev.completedMissionIds, activeMission.id];
        const unlocked = prev.unlockedRewardIds.includes(
          activeMission.rewardItem.id
        )
          ? prev.unlockedRewardIds
          : [...prev.unlockedRewardIds, activeMission.rewardItem.id];

        return {
          ...prev,
          completedMissionIds: completed,
          unlockedRewardIds: unlocked,
          attempts: [...prev.attempts, newAttempt],
        };
      });
    } else {
      soundController.playGentleHintTone();
      soundController.speak(`${result.headline}. ${result.characterReaction}`);
      setProgress((prev) => ({
        ...prev,
        attempts: [...prev.attempts, newAttempt],
      }));
    }
  };

  const handleNextMission = useCallback(() => {
    setBuildModeReward(null);
    setJustBuiltName(null);
    const currentIndex = MISSIONS.findIndex((m) => m.id === activeMission.id);
    const nextMission = MISSIONS[(currentIndex + 1) % MISSIONS.length];
    handleSelectMission(nextMission.id);
  }, [activeMission.id, handleSelectMission]);

  const handleToggleAccessibility = (key: keyof AccessibilitySettings) => {
    setProgress((prev) => ({
      ...prev,
      accessibility: {
        ...prev.accessibility,
        [key]: !prev.accessibility[key],
      },
    }));
  };

  const unlockedRewards = useMemo(
    () =>
      MISSIONS.map((m) => m.rewardItem).filter((r) =>
        progress.unlockedRewardIds.includes(r.id)
      ),
    [progress.unlockedRewardIds]
  );

  const selectedCreativeReward = useMemo(() => {
    if (!selectedRewardId && unlockedRewards.length > 0) {
      return unlockedRewards[0];
    }
    return unlockedRewards.find((r) => r.id === selectedRewardId) || null;
  }, [selectedRewardId, unlockedRewards]);

  const handlePlaceDecoration = useCallback(
    (x: number, z: number) => {
      const activeReward = buildModeReward || selectedCreativeReward;
      if (!activeReward) return;
      soundController.playPlaceDecoration();
      soundController.triggerHaptic('success');
      setCelebrationTrigger((c) => c + 1);
      setJustBuiltName(activeReward.name);

      setProgress((prev) => ({
        ...prev,
        placedDecorations: [
          ...prev.placedDecorations,
          {
            instanceId: `dec-${Date.now()}`,
            rewardId: activeReward.id,
            name: activeReward.name,
            category: activeReward.category,
            x,
            z,
            rotationY: (prev.placedDecorations.length * 0.9) % (Math.PI * 2),
          },
        ],
      }));
    },
    [buildModeReward, selectedCreativeReward]
  );

  const handleClearDecorations = () => {
    setProgress((prev) => ({
      ...prev,
      placedDecorations: [],
    }));
  };

  const handleResetProgress = () => {
    const fresh = resetProgressState();
    setProgress(fresh);
    setFeedback(null);
    setChosenStep(0);
    setBuildModeReward(null);
    setJustBuiltName(null);
  };

  const { highContrast, largeText, reducedStimuli } = progress.accessibility;

  return (
    <div
      className={`relative w-full h-[100dvh] min-h-[100dvh] overflow-hidden select-none touch-manipulation ${
        highContrast ? 'bg-white text-stone-950' : 'bg-[#FAF8F5] text-stone-800'
      }`}
    >
      {/* 1. MUNDO 3D INTERATIVO (100vw x 100vh com carregamento assíncrono para FCP/LCP instantâneo) */}
      <React.Suspense fallback={<div className="fixed inset-0 bg-[#FAF8F5] z-0 pointer-events-none" />}>
        <TerrariumCanvas
          activeMissionId={activeMission.id}
          completedMissionIds={progress.completedMissionIds}
          placedDecorations={progress.placedDecorations}
          selectedCreativeReward={buildModeReward || selectedCreativeReward}
          isBuildMode={Boolean(buildModeReward)}
          isCreativeMode={Boolean(buildModeReward) || (dockTab === 'creative' && isDialogueOpen)}
          isDialogueOpen={isDialogueOpen}
          tourStep={tourStep}
          mobileMoveDir={mobileMoveDir}
          reducedStimuli={reducedStimuli}
          highContrast={highContrast}
          celebrationTrigger={celebrationTrigger}
          onSelectMission={handleSelectMission}
          onPlaceDecoration={handlePlaceDecoration}
          onNearbyStationChange={setNearbyMissionId}
          onUpdateProjections={setProjectedMarkers}
        />
      </React.Suspense>

      {/* 1.1 OVERLAY DE CONSTRUÇÃO DE RECOMPENSA (Ao Acertar Questão) */}
      {screenMode === 'playing' && buildModeReward && (
        <RewardBuildOverlay
          reward={buildModeReward}
          justBuiltName={justBuiltName}
          placedCount={progress.placedDecorations.length}
          onClose={() => {
            setBuildModeReward(null);
            setJustBuiltName(null);
            setIsDialogueOpen(true);
          }}
          onNextMission={handleNextMission}
        />
      )}

      {/* 2. BALÕES DE FALA 3D FLUTUANTES ACIMA DOS PERSONAGENS */}
      {screenMode === 'playing' && (
        <WorldSpeechBubbles
          markers={projectedMarkers}
          activeMissionId={activeMission.id}
          nearbyMissionId={nearbyMissionId}
          completedMissionIds={progress.completedMissionIds}
          feedback={feedback}
          tourStep={tourStep}
          isDockOpen={isDialogueOpen}
          highContrast={highContrast}
          largeText={largeText}
          reducedStimuli={reducedStimuli}
          onSelectMission={handleSelectMission}
          onSpeakText={(txt) => soundController.speak(txt)}
          onNextMission={handleNextMission}
          onAdvanceTour={handleAdvanceTour}
          onSkipTour={handleSkipTour}
        />
      )}

      {/* 3. TELA DE TÍTULO */}
      {screenMode === 'title' && (
        <TitleScreenOverlay
          completedCount={progress.completedMissionIds.length}
          totalMissions={MISSIONS.length}
          accessibility={progress.accessibility}
          onStartGame={handleStartGame}
          onOpenEducator={() => setScreenMode('educator')}
          onToggleSetting={handleToggleAccessibility}
        />
      )}

      {/* 4. CAMADA SUPERIOR OTIMIZADA PARA MOBILE (360px Moto G34 5G) */}
      {screenMode !== 'title' && (
        <header className="fixed top-0 left-0 right-0 z-20 pt-[max(0.4rem,env(safe-area-inset-top))] px-2 pb-1 flex items-center justify-between gap-1.5 pointer-events-none">
          {/* Seletor Visual de Estações (Carrossel Horizontal com Toque Suave) */}
          <div className="px-1.5 py-1 rounded-full bg-[#FFFDF9]/94 border border-stone-200/90 shadow-xs flex items-center gap-1 pointer-events-auto overflow-x-auto no-scrollbar max-w-[calc(100vw-115px)] sm:max-w-none">
            {MISSIONS.map((m) => {
              const isDone = progress.completedMissionIds.includes(m.id);
              const isCurrent = m.id === activeMission.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelectMission(m.id)}
                  className={`min-h-[34px] px-2.5 py-1 rounded-full font-mono-num text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 touch-manipulation ${
                    isCurrent
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : isDone
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-[#FAF6F0] text-stone-600 hover:bg-stone-100'
                  }`}
                  title={`${m.characterName}: 1/${m.targetDenominator}`}
                >
                  <MiniFractionPie
                    denominator={m.targetDenominator}
                    numerator={1}
                    color={isCurrent ? '#10b981' : m.accentColor}
                    size={18}
                  />
                  <span>1/{m.targetDenominator}</span>
                </button>
              );
            })}
          </div>

          {/* Ações Rápidas Compactas */}
          <div className="flex items-center gap-1 pointer-events-auto">
            <button
              type="button"
              onClick={handleStartTourManually}
              className={`w-8.5 h-8.5 sm:w-auto min-h-[34px] sm:px-3 sm:py-1.5 rounded-full border text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-colors touch-manipulation ${
                tourStep > 0
                  ? 'bg-rose-400 border-rose-400 text-white'
                  : 'bg-[#FFFDF9]/94 hover:bg-white border-stone-200 text-stone-700'
              }`}
              title="Ver Tour Guiado"
              aria-label="Abrir Tour Guiado"
            >
              <Compass className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">Tour</span>
            </button>

            <button
              type="button"
              onClick={() => handleToggleAccessibility('voiceEnabled')}
              className={`w-8.5 h-8.5 min-h-[34px] p-1.5 rounded-full border flex items-center justify-center shadow-xs transition-colors touch-manipulation ${
                progress.accessibility.voiceEnabled
                  ? 'bg-[#FFFDF9]/94 border-emerald-300 text-emerald-600'
                  : 'bg-[#FFFDF9]/94 border-stone-200 text-stone-400'
              }`}
              title="Ligar/Desligar Voz"
              aria-label="Alternar narração por voz"
            >
              {progress.accessibility.voiceEnabled ? (
                <Volume2 className="w-3.5 h-3.5" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setScreenMode('educator')}
              className="w-8.5 h-8.5 sm:w-auto min-h-[34px] sm:px-3 sm:py-1.5 rounded-full bg-[#FFFDF9]/94 hover:bg-white border border-stone-200 text-xs font-semibold text-stone-700 flex items-center justify-center gap-1 shadow-xs transition-colors touch-manipulation"
              title="Painel do Educador"
              aria-label="Abrir Painel do Educador"
            >
              <BookOpen className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Educador</span>
            </button>
          </div>
        </header>
      )}

      {/* 5. CONTROLE MOBILE QUANDO O PAINEL ESTÁ RECOLHIDO (D-Pad Touch-First 44px) */}
      {screenMode === 'playing' && !isDialogueOpen && (
        <div className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-2.5 right-2.5 z-20 flex items-end justify-between gap-2.5 pointer-events-none">
          {/* D-Pad Tátil Ergonômico de Polegar com Alvos >= 44px e Haptic Feedback */}
          <div
            className="p-1.5 rounded-3xl bg-[#FFFDF9]/94 border border-stone-200/90 shadow-lg grid grid-cols-3 gap-1 pointer-events-auto touch-none"
            aria-label="Controle direcional de caminhada"
          >
            <div />
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                soundController.triggerHaptic('light');
                setMobileMoveDir({ x: 0, z: -1 });
              }}
              onPointerUp={() => setMobileMoveDir({ x: 0, z: 0 })}
              onPointerLeave={() => setMobileMoveDir({ x: 0, z: 0 })}
              className="w-11 h-11 rounded-xl bg-[#FAF6F0] active:bg-emerald-500 active:text-white text-stone-700 flex items-center justify-center touch-manipulation select-none"
              aria-label="Andar para frente"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <div />
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                soundController.triggerHaptic('light');
                setMobileMoveDir({ x: -1, z: 0 });
              }}
              onPointerUp={() => setMobileMoveDir({ x: 0, z: 0 })}
              onPointerLeave={() => setMobileMoveDir({ x: 0, z: 0 })}
              className="w-11 h-11 rounded-xl bg-[#FAF6F0] active:bg-emerald-500 active:text-white text-stone-700 flex items-center justify-center touch-manipulation select-none"
              aria-label="Andar para a esquerda"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                soundController.triggerHaptic('light');
                setMobileMoveDir({ x: 0, z: 1 });
              }}
              onPointerUp={() => setMobileMoveDir({ x: 0, z: 0 })}
              onPointerLeave={() => setMobileMoveDir({ x: 0, z: 0 })}
              className="w-11 h-11 rounded-xl bg-[#FAF6F0] active:bg-emerald-500 active:text-white text-stone-700 flex items-center justify-center touch-manipulation select-none"
              aria-label="Andar para trás"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                soundController.triggerHaptic('light');
                setMobileMoveDir({ x: 1, z: 0 });
              }}
              onPointerUp={() => setMobileMoveDir({ x: 0, z: 0 })}
              onPointerLeave={() => setMobileMoveDir({ x: 0, z: 0 })}
              className="w-11 h-11 rounded-xl bg-[#FAF6F0] active:bg-emerald-500 active:text-white text-stone-700 flex items-center justify-center touch-manipulation select-none"
              aria-label="Andar para a direita"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Botão Flutuante Abrir Reta Numérica (Touch >= 48px) */}
          <button
            type="button"
            onClick={() => {
              soundController.triggerHaptic('light');
              if (nearbyMission) {
                handleSelectMission(nearbyMission.id);
              } else {
                setIsDialogueOpen(true);
              }
            }}
            className="min-h-[48px] px-4 py-2 rounded-full bg-[#FFFDF9] hover:bg-white text-stone-800 border-2 border-emerald-400 font-bold text-xs sm:text-sm shadow-lg flex items-center gap-2 pointer-events-auto transition-transform active:scale-95 touch-manipulation"
          >
            <CharacterAvatar
              avatarId={(nearbyMission || activeMission).avatarId}
              mood="happy"
              size="sm"
            />
            <span className="font-display">
              Reta 1/{(nearbyMission || activeMission).targetDenominator}
            </span>
          </button>
        </div>
      )}

      {/* 6. PAINEL INFERIOR ÚNICO E SIMPLIFICADO (Clean Girl Mobile Sheet) */}
      {screenMode === 'playing' && isDialogueOpen && (
        <section
          aria-label="Ferramenta Visual de Frações"
          className="fixed bottom-0 left-0 right-0 z-20 flex flex-col items-center px-1 sm:px-3 pb-[max(0.25rem,env(safe-area-inset-bottom))] pointer-events-none"
        >
          <div
            className={`w-full max-w-4xl rounded-t-3xl sm:rounded-3xl border border-b-0 sm:border-b shadow-[0_16px_44px_rgba(120,113,108,0.18)] pointer-events-auto overflow-hidden ${
              highContrast
                ? 'bg-white border-stone-900'
                : 'bg-[#FFFDF9]/96 border-stone-200/95'
            }`}
          >
            {/* Barra de Abas Enxuta + Botão Responder Integrado para 360px */}
            <div className="flex items-center justify-between gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 border-b border-stone-200/80 bg-[#FAF6F0]/80">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={dockTab === 'mission'}
                  onClick={() => {
                    soundController.triggerHaptic('light');
                    setDockTab('mission');
                  }}
                  className={`min-h-[34px] px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-colors shrink-0 touch-manipulation ${
                    dockTab === 'mission'
                      ? 'bg-emerald-500 text-white shadow-2xs'
                      : 'text-stone-600 hover:bg-stone-200/60'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Reta 1/{activeMission.targetDenominator}</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={dockTab === 'review'}
                  onClick={() => {
                    soundController.triggerHaptic('light');
                    setDockTab('review');
                  }}
                  className={`min-h-[34px] px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-colors shrink-0 touch-manipulation ${
                    dockTab === 'review'
                      ? 'bg-rose-400 text-white shadow-2xs'
                      : 'text-stone-600 hover:bg-stone-200/60'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Comparar</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={dockTab === 'creative'}
                  onClick={() => {
                    soundController.triggerHaptic('light');
                    setDockTab('creative');
                  }}
                  className={`min-h-[34px] px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-colors shrink-0 touch-manipulation ${
                    dockTab === 'creative'
                      ? 'bg-amber-400 text-stone-950 shadow-2xs'
                      : 'text-stone-600 hover:bg-stone-200/60'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Decorar</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={dockTab === 'accessibility'}
                  onClick={() => {
                    soundController.triggerHaptic('light');
                    setDockTab('accessibility');
                  }}
                  className={`min-h-[34px] px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-colors shrink-0 touch-manipulation ${
                    dockTab === 'accessibility'
                      ? 'bg-stone-800 text-white'
                      : 'text-stone-600 hover:bg-stone-200/60'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {(dockTab === 'mission' || dockTab === 'review') && (
                  <button
                    type="button"
                    onClick={handleVerifyAnswer}
                    className="min-h-[36px] px-3.5 sm:px-5 py-1 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center gap-1 shadow-sm transition-transform active:scale-95 touch-manipulation"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Responder</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    soundController.triggerHaptic('light');
                    setIsDialogueOpen(false);
                  }}
                  className="w-8 h-8 sm:w-auto min-h-[34px] p-1 sm:px-2 rounded-full bg-white hover:bg-stone-100 border border-stone-200 text-stone-600 text-xs font-medium flex items-center justify-center gap-0.5 touch-manipulation"
                  title="Recolher Painel (H)"
                  aria-label="Minimizar painel de frações"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Conteúdo Principal Enxuto (max-h-48dvh no mobile para não cobrir o terrário 3D) */}
            <div className="p-2 sm:p-3.5 max-h-[48dvh] sm:max-h-[46vh] overflow-y-auto overscroll-contain">
              {(dockTab === 'mission' || dockTab === 'review') && (
                <NumberLineVisualizer
                  chosenDenominator={chosenDenominator}
                  chosenStep={chosenStep}
                  compareDenominator={compareDenominator}
                  isReviewMode={dockTab === 'review'}
                  highContrast={highContrast}
                  largeText={largeText}
                  highlightedTourStep={tourStep}
                  onChangeDenominator={handleChangeDenominator}
                  onChangeStep={handleChangeStep}
                  onChangeCompareDenominator={(den) =>
                    setCompareDenominator(den)
                  }
                  onSpeakText={(txt) => soundController.speak(txt)}
                />
              )}

              {dockTab === 'creative' && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-2">
                  {unlockedRewards.length === 0 ? (
                    <p className="text-xs text-stone-500">
                      Acerte os desafios dos personagens para ganhar flores, pontes e cristais para decorar o jardim!
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-stone-600">
                          Toque na grama 3D para plantar:
                        </span>
                        {unlockedRewards.map((reward) => {
                          const isSelected =
                            selectedCreativeReward?.id === reward.id;
                          return (
                            <button
                              key={reward.id}
                              type="button"
                              onClick={() => setSelectedRewardId(reward.id)}
                              className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                isSelected
                                  ? 'bg-amber-400 border-amber-500 text-stone-950 shadow-xs'
                                  : 'bg-[#FAF6F0] border-stone-200 text-stone-700 hover:bg-stone-100'
                              }`}
                            >
                              ✨ {reward.name}
                            </button>
                          );
                        })}
                      </div>

                      {progress.placedDecorations.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearDecorations}
                          className="px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Limpar ({progress.placedDecorations.length})</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              {dockTab === 'accessibility' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1">
                  {[
                    {
                      key: 'voiceEnabled' as const,
                      label: 'Narração por Voz',
                    },
                    {
                      key: 'soundEnabled' as const,
                      label: 'Sons Suaves',
                    },
                    {
                      key: 'reducedStimuli' as const,
                      label: 'Modo Calmo',
                    },
                    {
                      key: 'largeText' as const,
                      label: 'Texto Maior',
                    },
                  ].map((item) => {
                    const active = progress.accessibility[item.key];
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleToggleAccessibility(item.key)}
                        className={`p-3 rounded-2xl border text-left transition-colors flex items-center justify-between ${
                          active
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'bg-[#FAF6F0] border-stone-200 text-stone-600'
                        }`}
                      >
                        <span className="text-xs font-bold">{item.label}</span>
                        <span className="font-mono-num text-[11px] font-bold">
                          {active ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 7. MODAL DO EDUCADOR */}
      {screenMode === 'educator' && (
        <EducatorModal
          progress={progress}
          onClose={() => setScreenMode('playing')}
          onResetProgress={handleResetProgress}
        />
      )}
    </div>
  );
}
