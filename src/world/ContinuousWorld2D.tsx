/**
 * Mundo Contínuo 2D — Kessia World (BNCC EF04MA09)
 * Experiência 100% tátil, ilustrada e contínua, onde o próprio percurso do jogo
 * é a reta numérica graduada de 0 a 1.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MISSIONS } from '../core/missions';
import { MissionStation, PlacedDecoration, ProjectedStationMarker, TourStep, UnitDenominator } from '../core/types';

interface ContinuousWorld2DProps {
  activeMissionId: string;
  completedMissionIds: string[];
  placedDecorations: PlacedDecoration[];
  selectedCreativeReward: MissionStation['rewardItem'] | null;
  isBuildMode: boolean;
  isCreativeMode: boolean;
  isDialogueOpen: boolean;
  tourStep: TourStep;
  mobileMoveDir: { x: number; z: number };
  reducedStimuli: boolean;
  highContrast: boolean;
  celebrationTrigger: number;
  chosenDenominator?: UnitDenominator;
  chosenStep?: number;
  onSelectMission: (missionId: string) => void;
  onPlaceDecoration: (x: number, z: number) => void;
  onNearbyStationChange: (stationId: string | null) => void;
  onUpdateProjections: (markers: ProjectedStationMarker[]) => void;
}

// Função canônica para obter a fração exata de cada missão no percurso contínuo [0, 1]
export function getMissionPathFraction(targetDenominator: number): number {
  return 1 / targetDenominator;
}

const WORLD_WIDTH = 2600; // Largura total do percurso contínuo de 0 a 1 em pixels

export const ContinuousWorld2D: React.FC<ContinuousWorld2DProps> = ({
  activeMissionId,
  completedMissionIds,
  placedDecorations,
  selectedCreativeReward,
  isBuildMode,
  isCreativeMode,
  isDialogueOpen,
  tourStep,
  mobileMoveDir,
  reducedStimuli,
  highContrast,
  celebrationTrigger,
  chosenDenominator = 2,
  chosenStep = 0,
  onSelectMission,
  onPlaceDecoration,
  onNearbyStationChange,
  onUpdateProjections,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [playerPathProgress, setPlayerPathProgress] = useState<number>(0.25); // Posição de 0.0 a 1.0
  const [targetPathProgress, setTargetPathProgress] = useState<number>(0.25);
  const [isFacingRight, setIsFacingRight] = useState<boolean>(true);
  const [isWalking, setIsWalking] = useState<boolean>(false);
  const [celebrating, setCelebrating] = useState<boolean>(false);

  const isDraggingWorld = useRef<boolean>(false);
  const dragStartX = useRef<number>(0);
  const dragStartScroll = useRef<number>(0);

  // Efeito de celebração ao acertar missão
  useEffect(() => {
    if (celebrationTrigger > 0) {
      setCelebrating(true);
      const timer = setTimeout(() => setCelebrating(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [celebrationTrigger]);

  // Alinha o jogador à estação ativa caso selecionada externamente
  useEffect(() => {
    const targetMission = MISSIONS.find((m) => m.id === activeMissionId);
    if (targetMission) {
      const pos = getMissionPathFraction(targetMission.targetDenominator);
      if (Math.abs(playerPathProgress - pos) > 0.05) {
        setTargetPathProgress(pos);
      }
    }
  }, [activeMissionId]);

  // Sincroniza movimento contínuo da Kessia em direção ao alvo
  useEffect(() => {
    let animId = 0;
    const step = () => {
      // Movimento contínuo pelo direcional mobile D-Pad (x ou z)
      if (mobileMoveDir.x !== 0 || mobileMoveDir.z !== 0) {
        const delta = (mobileMoveDir.x || -mobileMoveDir.z) * 0.0035;
        setTargetPathProgress((prev) => {
          const next = Math.max(0, Math.min(1, prev + delta));
          setIsFacingRight(delta > 0);
          return next;
        });
      }

      setPlayerPathProgress((current) => {
        const diff = targetPathProgress - current;
        if (Math.abs(diff) < 0.001) {
          setIsWalking(false);
          return targetPathProgress;
        }
        setIsWalking(true);
        setIsFacingRight(diff > 0);
        return current + diff * 0.12;
      });

      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [targetPathProgress, mobileMoveDir]);

  // Mantém a câmera centralizada suavemente na Kessia
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const playerPixelX = playerPathProgress * (WORLD_WIDTH - 240) + 120;
    const targetScrollLeft = playerPixelX - container.clientWidth / 2;
    container.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: 'smooth',
    });
  }, [playerPathProgress]);

  // Notifica estação mais próxima da posição do jogador
  useEffect(() => {
    let closestId: string | null = null;
    let minDistance = 0.08; // Raio de proximidade

    MISSIONS.forEach((m) => {
      const pos = getMissionPathFraction(m.targetDenominator);
      const dist = Math.abs(playerPathProgress - pos);
      if (dist < minDistance) {
        closestId = m.id;
        minDistance = dist;
      }
    });

    onNearbyStationChange(closestId);
  }, [playerPathProgress, onNearbyStationChange]);

  // Toque na trilha do terreno para caminhar diretamente até aquele ponto
  const handleGroundPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left + container.scrollLeft;
    const usableWidth = WORLD_WIDTH - 240;
    const newProgress = Math.max(0, Math.min(1, (clickX - 120) / usableWidth));

    if (isBuildMode && selectedCreativeReward) {
      onPlaceDecoration(newProgress * 10 - 5, 0);
    } else {
      setTargetPathProgress(newProgress);
    }
  };

  // Suporte a arraste gestual do cenário
  const handleWorldPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    isDraggingWorld.current = true;
    dragStartX.current = e.clientX;
    const container = containerRef.current;
    if (container) {
      dragStartScroll.current = container.scrollLeft;
    }
  };

  const handleWorldPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingWorld.current || !containerRef.current) return;
    const deltaX = e.clientX - dragStartX.current;
    containerRef.current.scrollLeft = dragStartScroll.current - deltaX;
  };

  const handleWorldPointerUp = () => {
    isDraggingWorld.current = false;
  };

  const usableWidth = WORLD_WIDTH - 240;
  const playerPixelX = playerPathProgress * usableWidth + 120;

  // Subdivisões ativas desenhadas diretamente no chão
  const divisionSteps = Array.from({ length: chosenDenominator + 1 }, (_, i) => i);
  const divisionIntervals = Array.from({ length: chosenDenominator }, (_, i) => i);

  return (
    <div
      ref={containerRef}
      onPointerDown={handleWorldPointerDown}
      onPointerMove={handleWorldPointerMove}
      onPointerUp={handleWorldPointerUp}
      className="fixed inset-0 z-0 overflow-x-auto overflow-y-hidden select-none no-scrollbar touch-pan-x bg-[#FAF8F5]"
      style={{ touchAction: 'pan-x' }}
    >
      <div
        className="relative h-full flex flex-col justify-end"
        style={{ width: `${WORLD_WIDTH}px` }}
        onClick={handleGroundPointerDown}
      >
        {/* 1. CÉU E PARALAXE DE FUNDO COM ESTUFAS E COLINAS SUAVES */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F5EFE6] via-[#FAF8F5] to-[#E9F3EB] pointer-events-none">
          {/* Sol suave botânico */}
          <div className="absolute top-10 left-[800px] w-48 h-48 rounded-full bg-amber-100/60 blur-3xl" />
          <div className="absolute top-14 left-[1800px] w-64 h-64 rounded-full bg-emerald-100/40 blur-3xl" />

          {/* Silhuetas de estufas vitorianas ao fundo */}
          <svg className="absolute bottom-64 left-0 w-full h-44 opacity-25" preserveAspectRatio="none" viewBox="0 0 1200 120">
            <path d="M0,120 L80,60 L140,60 L220,120 L380,50 L440,50 L520,120 L750,40 L820,40 L900,120 L1200,120 Z" fill="#74c69d" />
          </svg>

          {/* Colinas botânicas intermediárias */}
          <svg className="absolute bottom-44 left-0 w-full h-48 opacity-45" preserveAspectRatio="none" viewBox="0 0 1200 120">
            <path d="M0,120 Q300,30 600,80 T1200,60 L1200,120 Z" fill="#95d5b2" />
          </svg>
        </div>

        {/* 2. CENÁRIO INTERMEDIÁRIO: RIACHO CRISTALINO SINUOSO */}
        <div className="absolute bottom-28 left-0 right-0 h-44 pointer-events-none">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 2600 160">
            {/* Leito do rio que passa sob a ponte no centro (1/2 = 1300px) */}
            <path
              d="M 0,140 Q 600,110 1200,130 Q 1300,145 1400,130 Q 2000,100 2600,140 L 2600,160 L 0,160 Z"
              fill="#cbe3f7"
              opacity="0.85"
            />
            <path
              d="M 0,145 Q 650,120 1250,135 Q 1300,150 1350,135 Q 2050,110 2600,145 L 2600,160 L 0,160 Z"
              fill="#99c8f0"
              opacity="0.6"
            />
          </svg>
        </div>

        {/* 3. A TRILHA DA RETA NUMÉRICA DE 0 A 1 (O CHÃO DO JOGO) */}
        <div className="relative z-10 h-48 w-full bg-gradient-to-t from-[#52b788]/20 via-[#95d5b2]/40 to-transparent flex flex-col justify-end pb-8">
          {/* Base do caminho botânico de pedras e madeira */}
          <div className="relative mx-auto w-[calc(100%-120px)] h-20 rounded-3xl bg-[#FAF6F0] border-2 border-stone-300 shadow-md flex items-center px-6">
            
            {/* Subdivisões ativas da barra fracionária desenhadas na trilha */}
            <div className="absolute inset-x-6 top-2 bottom-2 rounded-2xl overflow-hidden flex pointer-events-none opacity-95">
              {divisionIntervals.map((idx) => {
                const isSelected = idx + 1 <= chosenStep;
                return (
                  <div
                    key={idx}
                    className={`h-full border-r last:border-r-0 border-stone-400/70 transition-colors flex items-center justify-center font-mono-num font-black text-xs ${
                      isSelected
                        ? idx === 0
                          ? 'bg-emerald-300 text-emerald-950'
                          : 'bg-rose-200 text-rose-950'
                        : 'bg-white/80 text-stone-900'
                    }`}
                    style={{ width: `${100 / chosenDenominator}%` }}
                  >
                    1/{chosenDenominator}
                  </div>
                );
              })}
            </div>

            {/* Marcas de régua botânica na borda superior da trilha */}
            <div className="absolute inset-x-6 -top-5 flex justify-between pointer-events-none font-mono-num font-extrabold text-xs">
              {divisionSteps.map((stepIdx) => {
                const percent = (stepIdx / chosenDenominator) * 100;
                const isEndpoint = stepIdx === 0 || stepIdx === chosenDenominator;
                return (
                  <div
                    key={stepIdx}
                    className="absolute -translate-x-1/2 flex flex-col items-center"
                    style={{ left: `${percent}%` }}
                  >
                    <span className="w-1.5 h-3 bg-stone-700 rounded-full" />
                    <span className={`text-[11px] font-mono-num px-2 py-0.5 rounded-full bg-white border border-stone-300 shadow-2xs ${isEndpoint ? 'text-stone-950 font-black' : 'text-emerald-900 font-extrabold'}`}>
                      {stepIdx === 0 ? '0' : stepIdx === chosenDenominator ? '1' : `${stepIdx}/${chosenDenominator}`}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* A PONTE DO RIACHO EXATAMENTE EM 1/2 */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -top-10 w-44 h-24 pointer-events-none flex flex-col items-center justify-end"
            >
              {/* Arco da Ponte de Madeira */}
              <div className="w-full h-8 rounded-t-xl bg-[#c99a6b] border-2 border-[#8c5a2c] shadow-md flex items-center justify-around px-2">
                <span className="w-1.5 h-6 bg-[#8c5a2c] rounded-full" />
                <span className="w-1.5 h-6 bg-[#8c5a2c] rounded-full" />
                <span className="w-1.5 h-6 bg-[#8c5a2c] rounded-full" />
                <span className="w-1.5 h-6 bg-[#8c5a2c] rounded-full" />
                <span className="w-1.5 h-6 bg-[#8c5a2c] rounded-full" />
              </div>
              <span className="mt-1 px-3 py-1 rounded-full bg-emerald-800 text-white font-mono-num font-extrabold text-xs shadow-xs">
                Ponte (1/2)
              </span>
            </div>

            {/* ELEMENTOS DECORATIVOS E ESTAÇÕES DE MISSÃO NA TRILHA */}
            {MISSIONS.map((m) => {
              const posFraction = getMissionPathFraction(m.targetDenominator);
              const percent = posFraction * 100;
              const isCompleted = completedMissionIds.includes(m.id);
              const isActive = m.id === activeMissionId;

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMission(m.id);
                  }}
                  className={`absolute -top-16 -translate-x-1/2 min-w-[48px] min-h-[48px] flex flex-col items-center justify-center group transition-transform active:scale-95 ${
                    isActive ? 'scale-110 z-20' : 'hover:scale-105 z-10'
                  }`}
                  style={{ left: `calc(1.5rem + ${percent}% * (100% - 3rem) / 100)` }}
                  aria-label={`${m.title} - Fração 1/${m.targetDenominator}`}
                >
                  {/* Balão de Chamada da Estação */}
                  <div
                    className={`px-3 py-1.5 rounded-2xl shadow-sm text-xs font-bold whitespace-nowrap flex items-center gap-1.5 border transition-all ${
                      isActive
                        ? 'bg-emerald-800 text-white border-emerald-900 shadow-md ring-2 ring-emerald-300'
                        : isCompleted
                        ? 'bg-white text-emerald-900 border-emerald-500'
                        : 'bg-white text-stone-900 border-stone-300'
                    }`}
                  >
                    <span>{m.title}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-black/10 text-[11px] font-mono-num font-black">
                      1/{m.targetDenominator}
                    </span>
                  </div>

                  {/* Marco Visual no Solo */}
                  <div className="w-4 h-4 rounded-full bg-emerald-700 ring-4 ring-emerald-300 mt-1 shadow-sm flex items-center justify-center text-white text-[9px] font-bold">
                    {isCompleted ? '✓' : '●'}
                  </div>
                </button>
              );
            })}

            {/* PERSONAGEM KESSIA 2D VIVA E INTEGRADA AO MUNDO */}
            <div
              className="absolute -top-26 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-75 z-30"
              style={{
                left: `calc(1.5rem + ${playerPathProgress * 100}% * (100% - 3rem) / 100)`,
                transform: `translateX(-50%) ${isFacingRight ? 'scaleX(1)' : 'scaleX(-1)'}`,
              }}
            >
              {/* Balão Flutuante quando Kessia está comemorando */}
              {celebrating && (
                <div
                  className="mb-1 px-3 py-1 rounded-2xl bg-amber-300 text-stone-900 font-bold text-xs shadow-md animate-bounce"
                  style={{ transform: isFacingRight ? 'scaleX(1)' : 'scaleX(-1)' }}
                >
                  ✨ Perfeito!
                </div>
              )}

              {/* Imagem Oficial da Personagem Késsia */}
              <img
                src={
                  celebrating
                    ? '/characters/kessia/kessia_celebrating.png'
                    : isWalking
                    ? '/characters/kessia/body_side.png'
                    : '/characters/kessia/body_front.png'
                }
                alt="Guardiana Késsia"
                className={`w-20 h-28 object-contain transition-transform ${
                  isWalking ? 'animate-pulse' : ''
                }`}
                style={{
                  filter: highContrast ? 'contrast(1.2)' : 'none',
                }}
              />

              {/* Sombra Elíptica Natural no Solo */}
              <div
                className="w-12 h-3 rounded-full bg-stone-900/25 blur-[1px] -mt-1 pointer-events-none"
                style={{ transform: isFacingRight ? 'scaleX(1)' : 'scaleX(-1)' }}
              />
            </div>

            {/* OBJETOS E PLANTAS CONSTRUÍDAS PELO JOGADOR */}
            {placedDecorations.map((dec) => {
              const decPercent = ((dec.x + 5) / 10) * 100;
              return (
                <div
                  key={dec.instanceId}
                  className="absolute -top-12 -translate-x-1/2 pointer-events-none flex flex-col items-center"
                  style={{ left: `${decPercent}%` }}
                >
                  <span className="text-2xl drop-shadow-sm">🌱</span>
                  <span className="text-[9px] font-mono-num font-bold text-emerald-800 bg-white/90 px-1 rounded-full">
                    {dec.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
