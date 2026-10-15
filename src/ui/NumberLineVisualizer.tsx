/**
 * Visualizador Interativo Clean Girl & Visual-First (BNCC EF04MA09)
 * Otimizado especificamente para mobile (Motorola Moto G34 5G — viewport ~360x800):
 * - Grid responsivo de 7 denominadores com alvos de toque >= 44px
 * - Etiquetas da régua sem colisão de texto em denominadores 6, 8 e 10
 * - Barra de fatias clicáveis com toque suave
 * - Reta numérica [0, 1] com touch-action: none e arco visual de salto
 */

import React, { useRef } from 'react';
import { Volume2 } from 'lucide-react';
import {
  ALLOWED_DENOMINATORS,
  compareUnitFractions,
  formatFractionSpoken,
} from '../core/fractions';
import { TourStep, UnitDenominator } from '../core/types';
import { MiniFractionPie } from './WorldSpeechBubbles';

interface NumberLineVisualizerProps {
  chosenDenominator: UnitDenominator;
  chosenStep: number;
  compareDenominator?: UnitDenominator;
  isReviewMode: boolean;
  highContrast: boolean;
  largeText: boolean;
  highlightedTourStep?: TourStep;
  onChangeDenominator: (den: UnitDenominator) => void;
  onChangeStep: (step: number) => void;
  onChangeCompareDenominator?: (den: UnitDenominator) => void;
  onSpeakText: (text: string) => void;
}

export const NumberLineVisualizer: React.FC<NumberLineVisualizerProps> = ({
  chosenDenominator,
  chosenStep,
  compareDenominator = 4,
  isReviewMode,
  highContrast,
  largeText,
  highlightedTourStep = 0,
  onChangeDenominator,
  onChangeStep,
  onChangeCompareDenominator,
  onSpeakText,
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const parts = Array.from({ length: chosenDenominator }, (_, i) => i);
  const ticks = Array.from({ length: chosenDenominator + 1 }, (_, i) => i);

  const handleKeyDownRuler = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      onChangeStep(Math.min(chosenDenominator, chosenStep + 1));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onChangeStep(Math.max(0, chosenStep - 1));
    }
  };

  const updateStepFromPointer = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const nearestStep = Math.round(ratio * chosenDenominator);
    if (nearestStep !== chosenStep) {
      onChangeStep(nearestStep);
    }
  };

  const handlePointerDownTrack = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    updateStepFromPointer(e.clientX);
  };

  const handlePointerMoveTrack = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    updateStepFromPointer(e.clientX);
  };

  const handlePointerUpTrack = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignora se já liberado
    }
  };

  const currentSpoken = formatFractionSpoken(chosenStep, chosenDenominator);
  const markerPercent = (chosenStep / chosenDenominator) * 100;

  return (
    <div className="space-y-2 sm:space-y-2.5">
      {/* PASSO 1: Botões Visuais de Divisão da Unidade com Mini Pizza SVG */}
      <div
        className={`p-2 sm:p-2.5 rounded-2xl transition-all space-y-1.5 ${
          highlightedTourStep === 2
            ? 'ring-2 ring-rose-400 bg-rose-50/70'
            : 'bg-[#FAF6F0]/90 border border-stone-200/80'
        }`}
      >
        <div className="flex items-center justify-between gap-1.5 px-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-950 font-mono-num text-xs font-extrabold flex items-center justify-center shrink-0">
              1
            </span>
            <span
              className={`font-bold ${
                highContrast ? 'text-stone-950' : 'text-stone-900'
              } ${largeText ? 'text-base' : 'text-xs sm:text-sm'}`}
            >
              Dividir em partes iguais:
            </span>
          </div>

          {/* Crachá visual compacto da fração atual + Ouvir */}
          <div className="flex items-center gap-1.5">
            <div className="px-2.5 py-1 rounded-xl bg-white border border-stone-300 flex items-center gap-1.5 shadow-2xs">
              <MiniFractionPie
                denominator={chosenDenominator}
                numerator={chosenStep}
                color={chosenStep === 1 ? '#047857' : '#be185d'}
                size={22}
              />
              <span className="font-mono-num font-black text-emerald-900 text-sm sm:text-base">
                {chosenStep === 0 ? '0' : `${chosenStep}/${chosenDenominator}`}
              </span>
              <span className="text-xs text-stone-700 hidden md:inline font-semibold">
                ({currentSpoken})
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                onSpeakText(
                  `${chosenDenominator} partes iguais. Marcador em ${
                    chosenStep === 0
                      ? 'zero'
                      : `${chosenStep} sobre ${chosenDenominator}, ${currentSpoken}`
                  }.`
                )
              }
              className="min-w-[48px] min-h-[48px] rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 flex items-center justify-center transition-colors shrink-0 shadow-2xs"
              title="Ouvir fração"
              aria-label="Ouvir leitura da fração"
            >
              <Volume2 className="w-5 h-5 text-emerald-800" />
            </button>
          </div>
        </div>

        {/* Grade de 7 botões perfeita para 360px (Moto G34 5G) com altura >= 48px */}
        <div
          className="grid grid-cols-7 gap-1 sm:gap-1.5 w-full"
          role="group"
          aria-label="Escolher em quantas partes iguais dividir"
        >
          {ALLOWED_DENOMINATORS.map((den) => {
            const isSelected = chosenDenominator === den;
            return (
              <button
                key={den}
                type="button"
                onClick={() => onChangeDenominator(den)}
                className={`min-h-[48px] py-1 px-0.5 rounded-xl font-mono-num font-bold transition-all flex flex-col items-center justify-center gap-0.5 border touch-manipulation ${
                  isSelected
                    ? 'bg-white border-emerald-800 text-emerald-950 ring-2 ring-emerald-300 shadow-xs scale-[1.02]'
                    : 'bg-[#FFFDF9] border-stone-300 text-stone-900 hover:bg-white active:bg-stone-100'
                }`}
                aria-pressed={isSelected}
              >
                <MiniFractionPie
                  denominator={den}
                  numerator={1}
                  color={isSelected ? '#047857' : '#be185d'}
                  size={18}
                />
                <span className="text-xs sm:text-sm font-black leading-none">{den}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* BARRA VISUAL DE FATIAS + RETA NUMÉRICA SINCRONIZADA */}
      <div
        className={`p-2 sm:p-2.5 rounded-2xl transition-all space-y-2 ${
          highlightedTourStep === 3
            ? 'ring-2 ring-emerald-400 bg-emerald-50/50'
            : 'bg-[#FAF6F0]/90 border border-stone-200/80'
        }`}
      >
        {/* Barra de fatias clicáveis (altura mínima 48px para toque acessível) */}
        <div
          className="grid w-full h-12 min-h-[48px] rounded-xl overflow-hidden border border-stone-300 bg-white shadow-2xs"
          style={{
            gridTemplateColumns: `repeat(${chosenDenominator}, minmax(0, 1fr))`,
          }}
        >
          {parts.map((partIdx) => {
            const stepNumber = partIdx + 1;
            const isFilled = stepNumber <= chosenStep;
            const isFirstUnitPart = stepNumber === 1;
            return (
              <button
                key={partIdx}
                type="button"
                onClick={() => onChangeStep(stepNumber)}
                className={`h-full min-h-[48px] flex items-center justify-center border-r last:border-r-0 border-stone-300 font-mono-num text-xs sm:text-sm font-bold transition-colors touch-manipulation ${
                  isFilled
                    ? isFirstUnitPart
                    ? 'bg-emerald-800 text-white font-extrabold'
                    : 'bg-rose-800 text-white font-extrabold'
                    : 'bg-[#FFFDF9] text-stone-800 hover:bg-stone-100 active:bg-stone-200'
                }`}
                aria-label={`Parte ${stepNumber} de ${chosenDenominator}`}
              >
                1/{chosenDenominator}
              </button>
            );
          })}
        </div>

        {/* Segunda barra visual no modo Comparar */}
        {isReviewMode && onChangeCompareDenominator && (
          <div className="space-y-1.5 pt-0.5">
            <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-rose-800 font-black text-xs sm:text-sm">
                  Comparar:
                </span>
                {ALLOWED_DENOMINATORS.map((den) => (
                  <button
                    key={den}
                    type="button"
                    onClick={() => onChangeCompareDenominator(den)}
                    className={`min-h-[48px] px-3.5 py-1.5 rounded-full font-mono-num text-xs sm:text-sm font-bold transition-colors border touch-manipulation ${
                      compareDenominator === den
                        ? 'bg-rose-800 border-rose-900 text-white shadow-xs'
                        : 'bg-white border-stone-300 text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    1/{den}
                  </button>
                ))}
              </div>
              <span className="text-stone-800 text-xs sm:text-sm font-bold leading-tight">
                {compareUnitFractions(chosenDenominator, compareDenominator)}
              </span>
            </div>

            <div
              className="grid w-full h-10 min-h-[40px] rounded-lg overflow-hidden border border-stone-300 bg-white"
              style={{
                gridTemplateColumns: `repeat(${compareDenominator}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: compareDenominator }, (_, idx) => (
                <div
                  key={idx}
                  className={`h-full flex items-center justify-center border-r last:border-r-0 border-stone-300 font-mono-num text-xs font-bold ${
                    idx === 0
                      ? 'bg-rose-800 text-white font-extrabold'
                      : 'bg-[#FFFDF9] text-stone-800'
                  }`}
                >
                  1/{compareDenominator}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PASSO 2: Reta Numérica [0, 1] com Arco Visual de Salto */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs px-0.5">
            <span className="inline-flex items-center gap-1.5 font-bold text-stone-900 text-xs sm:text-sm">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-950 font-mono-num text-xs font-black flex items-center justify-center">
                2
              </span>
              Arraste na reta:
            </span>
            <span className="font-mono-num text-emerald-900 font-black text-xs sm:text-sm">
              1ª marca = 1/{chosenDenominator}
            </span>
          </div>

          <div
            ref={trackRef}
            role="slider"
            tabIndex={0}
            aria-label="Reta numérica de 0 a 1"
            aria-valuemin={0}
            aria-valuemax={chosenDenominator}
            aria-valuenow={chosenStep}
            aria-valuetext={currentSpoken}
            onKeyDown={handleKeyDownRuler}
            onPointerDown={handlePointerDownTrack}
            onPointerMove={handlePointerMoveTrack}
            onPointerUp={handlePointerUpTrack}
            onPointerCancel={handlePointerUpTrack}
            className="relative min-h-[72px] h-18 sm:h-20 px-4 sm:px-6 rounded-2xl bg-white border border-stone-300 select-none flex items-center touch-none cursor-pointer"
          >
            {/* Arco SVG de Salto mostrando o intervalo a partir do 0 */}
            {chosenStep > 0 && (
              <svg
                className="absolute inset-x-4 sm:inset-x-6 top-0.5 h-6 w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] overflow-visible pointer-events-none"
                viewBox="0 0 100 24"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d={`M 0 22 Q ${markerPercent / 2} 2 ${markerPercent} 22`}
                  fill="none"
                  stroke={chosenStep === 1 ? '#047857' : '#be185d'}
                  strokeWidth="2.5"
                  strokeDasharray="3 2"
                />
              </svg>
            )}

            {/* Eixo Principal [0, 1] */}
            <div className="relative w-full h-2.5 rounded-full bg-stone-300">
              <div
                className={`absolute left-0 top-0 bottom-0 rounded-full transition-all duration-150 ${
                  chosenStep === 1 ? 'bg-emerald-800' : 'bg-rose-800'
                }`}
                style={{ width: `${markerPercent}%` }}
              />

              {/* Marcas da Reta com Prevenção de Colisão no Moto G34 e Touch >= 48px */}
              {ticks.map((tickIdx) => {
                const leftPercent = (tickIdx / chosenDenominator) * 100;
                const isSelected = tickIdx === chosenStep;
                const isUnitTarget = tickIdx === 1;
                const isEndpoint = tickIdx === 0 || tickIdx === chosenDenominator;

                // Em telas mobile, se o denominador for 6, 8 ou 10, exibe rótulo de texto apenas nos pontos-chave para não colidir
                const shouldShowLabel =
                  chosenDenominator <= 4 ||
                  isEndpoint ||
                  isUnitTarget ||
                  isSelected;

                return (
                  <button
                    key={tickIdx}
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onChangeStep(tickIdx);
                    }}
                    style={{ left: `${leftPercent}%` }}
                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[44px] sm:min-w-[48px] min-h-[48px] h-14 flex flex-col items-center justify-center group focus:outline-none touch-manipulation"
                    aria-label={
                      tickIdx === 0
                        ? 'Zero'
                        : tickIdx === chosenDenominator
                        ? 'Um inteiro'
                        : `${tickIdx} sobre ${chosenDenominator}`
                    }
                  >
                    <span
                      className={`rounded-full transition-all ${
                        isEndpoint
                          ? 'h-6 w-1.5 bg-stone-950'
                          : isUnitTarget
                          ? 'h-5 w-1.5 bg-emerald-800'
                          : 'h-3.5 w-1 bg-stone-500'
                      }`}
                    />

                    {/* Bolinha do Marcador */}
                    <span
                      className={`mt-0.5 rounded-full transition-all flex items-center justify-center font-mono-num font-bold ${
                        isSelected
                          ? 'w-6 h-6 bg-emerald-800 text-white ring-4 ring-emerald-300 shadow-sm text-xs font-black'
                          : 'w-2.5 h-2.5 bg-stone-400 group-hover:bg-stone-600'
                      }`}
                    >
                      {isSelected ? '●' : ''}
                    </span>

                    {/* Rótulo numérico inteligente sem sobreposição no mobile */}
                    {shouldShowLabel ? (
                      <span
                        className={`mt-0.5 font-mono-num leading-none whitespace-nowrap ${
                          isEndpoint
                            ? 'text-xs font-black text-stone-950 bg-white px-1 rounded shadow-2xs'
                            : isSelected || isUnitTarget
                            ? 'text-[11px] sm:text-xs font-black text-emerald-950 bg-emerald-100 px-1 py-0.5 rounded border border-emerald-300 shadow-2xs'
                            : 'text-[10px] font-bold text-stone-700 bg-white/90 px-0.5 rounded'
                        }`}
                      >
                        {tickIdx === 0
                          ? '0'
                          : tickIdx === chosenDenominator
                          ? '1'
                          : `${tickIdx}/${chosenDenominator}`}
                      </span>
                    ) : (
                      <span className="h-2.5" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
