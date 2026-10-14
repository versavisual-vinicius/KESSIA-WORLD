import React, { useRef, type KeyboardEvent } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  Sparkles,
  Check,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import {
  evaluateCompare,
  evaluateLocate,
  label,
  MIN_PARTS,
  MAX_PARTS,
  type UnitFraction,
} from './core/fraction';
import { hintFeedback, successFeedback, type Feedback } from './core/feedback';
import { MISSIONS, type Mission } from './core/missions';
import {
  currentMissionIndex,
  emptyProgress,
  recordAttempt,
  saveProgress,
  type Progress,
} from './core/progress';

interface MissionCardProps {
  progress: Progress;
  onProgressChange: (p: Progress) => void;
  onReward: (reward: string) => void;
  minimized: boolean;
  onToggleMinimize: () => void;
}

const W = 320;
const PAD = 24;
const Y = 36;

export function MissionCard({
  progress,
  onProgressChange,
  onReward,
  minimized,
  onToggleMinimize,
}: MissionCardProps) {
  const tickRefs = useRef<(SVGGElement | null)[]>([]);

  const [parts, setParts] = React.useState(2);
  const [tick, setTick] = React.useState(0);
  const [feedback, setFeedback] = React.useState<Feedback | null>(null);
  const [solved, setSolved] = React.useState(false);

  const idx = currentMissionIndex(progress);
  const allCompleted = idx >= MISSIONS.length;
  const mission: Mission | null = allCompleted ? null : MISSIONS[idx];
  const attempts = mission ? progress.attempts[mission.id] ?? 0 : 0;

  // Reseta ao mudar de missão
  const resetForNext = () => {
    setParts(2);
    setTick(0);
    setFeedback(null);
    setSolved(false);
  };

  const changeParts = (n: number) => {
    const clamped = Math.max(MIN_PARTS, Math.min(MAX_PARTS, n));
    setParts(clamped);
    setTick(0);
    setFeedback(null);
  };

  const submit = (chosen?: UnitFraction) => {
    if (!mission || solved) return;

    const result =
      mission.kind === 'locate'
        ? evaluateLocate(mission.target, { parts, tick })
        : evaluateCompare(mission.options[0], mission.options[1], chosen!);

    if (result.correct) {
      setFeedback(successFeedback(mission));
      setSolved(true);
      onReward(mission.reward);
    } else {
      const isCounted = result.errorKind !== 'no-tick';
      setFeedback(
        hintFeedback(
          mission,
          result.errorKind!,
          attempts + (isCounted ? 1 : 0) || 1,
          { parts, tick },
        ),
      );
      if (!isCounted) return;
    }
    const nextProg = recordAttempt(progress, mission.id, result.correct);
    onProgressChange(nextProg);
  };

  const xOf = (i: number) => PAD + ((W - PAD * 2) * i) / parts;
  const ticks = Array.from({ length: parts - 1 }, (_, i) => i + 1);

  const onKeyTick = (e: KeyboardEvent, i: number) => {
    let next = i;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = Math.min(parts - 1, i + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = Math.max(1, i - 1);
    else if (e.key === 'Home') next = 1;
    else if (e.key === 'End') next = parts - 1;
    else if (e.key === ' ' || e.key === 'Enter') {
      setTick(i);
      setFeedback(null);
      e.preventDefault();
      return;
    } else return;
    e.preventDefault();
    setTick(next);
    setFeedback(null);
    tickRefs.current[next]?.focus();
  };

  // Modo minimizado: pílula charmosa e discreta no topo
  if (minimized) {
    return (
      <button
        type="button"
        onClick={onToggleMinimize}
        className="absolute top-4 left-4 z-30 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#faf5ec]/95 hover:bg-[#f3ede2] text-[#2b221b] border border-[#e2d7c5] shadow-lg backdrop-blur-md text-xs font-semibold cursor-pointer transition-all active:scale-95"
        title="Abrir desafio de matemática"
      >
        <BookOpen className="w-3.5 h-3.5 text-[#4e6e3a]" />
        <span>
          {allCompleted
            ? 'Mundo Concluído! 🌟'
            : `Missão ${idx + 1}/${MISSIONS.length}: ${mission?.title}`}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-[#8c7d6b]" />
      </button>
    );
  }

  return (
    <div
      role="region"
      aria-label="Desafio de Matemática"
      className="absolute top-4 left-4 z-30 w-80 sm:w-96 max-h-[calc(100vh-2rem)] bg-[#faf5ec]/95 backdrop-blur-md rounded-2xl border border-[#e2d7c5] shadow-2xl text-[#382f27] flex flex-col overflow-hidden transition-all duration-200"
    >
      {/* Header do Card */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[#e6dccb] shrink-0 bg-[#f7f0e4]/60">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#4e6e3a]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#7a6b5a]">
            {allCompleted
              ? 'Conquista Final'
              : `Kessia • Missão ${idx + 1} de ${MISSIONS.length}`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleMinimize}
            aria-label="Minimizar missão"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#594d40] hover:bg-[#eae1d3] transition-colors cursor-pointer"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3.5 overflow-y-auto no-scrollbar">
        {allCompleted ? (
          <div className="flex flex-col gap-2 text-center py-2">
            <div className="w-10 h-10 mx-auto rounded-full bg-[#d4ebc8] border border-[#a3cf8e] flex items-center justify-center text-[#23451e]">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold font-display text-[#2b221b]">
              Pequeno Mundo Completo!
            </h2>
            <p className="text-xs text-[#594d40] leading-relaxed">
              Você localizou todas as frações unitárias na reta numérica e o seu mundo floresceu com ponte, árvores, casa, moinho, poço e farol.
            </p>
            <button
              type="button"
              onClick={() => {
                if (confirm('Recomeçar a jornada desde a primeira missão?')) {
                  const empty = emptyProgress();
                  onProgressChange(empty);
                  saveProgress(empty);
                  resetForNext();
                }
              }}
              className="mt-2 self-center flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#7a6b5a] hover:text-[#2b221b] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Jogar novamente</span>
            </button>
          </div>
        ) : (
          mission && (
            <>
              {/* Título e Enunciado */}
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-semibold font-display text-[#2b221b]">
                  {mission.title}
                </h2>
                <p className="text-xs text-[#594d40] leading-relaxed">
                  {mission.story}
                </p>
              </div>

              {/* Interação com Reta ou Comparação */}
              {mission.kind === 'locate' ? (
                <div className="flex flex-col gap-2.5 bg-[#f3ede2]/70 p-3 rounded-xl border border-[#e2d7c5]/80">
                  {/* Stepper de partes */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#6e5d4e]">
                      Dividir o caminho:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => changeParts(parts - 1)}
                        disabled={solved || parts <= MIN_PARTS}
                        aria-label="Menos partes"
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#faf5ec] hover:bg-[#eae1d3] border border-[#d6c8b4] text-[#2b221b] disabled:opacity-30 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 py-0.5 min-w-[7rem] text-center text-xs font-semibold text-[#2b221b] font-mono-tabular bg-[#faf5ec] rounded-lg border border-[#d6c8b4]">
                        {parts} partes iguais
                      </span>
                      <button
                        type="button"
                        onClick={() => changeParts(parts + 1)}
                        disabled={solved || parts >= MAX_PARTS}
                        aria-label="Mais partes"
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#faf5ec] hover:bg-[#eae1d3] border border-[#d6c8b4] text-[#2b221b] disabled:opacity-30 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* SVG da Reta Numérica */}
                  <div className="relative pt-1 pb-0.5 select-none">
                    <svg
                      viewBox={`0 0 ${W} 72`}
                      className="w-full h-auto"
                      role="radiogroup"
                      aria-label={`Reta de 0 a 1 em ${parts} partes. Escolha a marca.`}
                    >
                      {/* Segmentos coloridos indicando partes */}
                      {Array.from({ length: parts }, (_, i) => (
                        <rect
                          key={`seg-${i}`}
                          x={xOf(i) + 1.5}
                          y={Y - 7}
                          width={xOf(i + 1) - xOf(i) - 3}
                          height={14}
                          rx={3}
                          className={
                            i < tick
                              ? 'fill-[#a6cfa0]/40 transition-colors'
                              : 'fill-[#e2d7c5]/35 transition-colors'
                          }
                        />
                      ))}

                      {/* Eixo principal */}
                      <line
                        x1={PAD}
                        x2={W - PAD}
                        y1={Y}
                        y2={Y}
                        stroke="#382f27"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />

                      {/* Extremidades 0 e 1 */}
                      {[0, parts].map((i) => (
                        <g key={`end-${i}`}>
                          <line
                            x1={xOf(i)}
                            x2={xOf(i)}
                            y1={Y - 10}
                            y2={Y + 10}
                            stroke="#382f27"
                            strokeWidth="2.5"
                          />
                          <text
                            x={xOf(i)}
                            y={Y + 24}
                            textAnchor="middle"
                            className="fill-[#2b221b] font-mono text-[11px] font-bold select-none"
                          >
                            {i === 0 ? '0' : '1'}
                          </text>
                        </g>
                      ))}

                      {/* Marcas Intermediárias Clicáveis */}
                      {ticks.map((i) => {
                        const isSelected = tick === i;
                        return (
                          <g
                            key={`t-${i}`}
                            ref={(el) => {
                              tickRefs.current[i] = el;
                            }}
                            role="radio"
                            aria-checked={isSelected}
                            aria-label={`Marca ${label(i, parts)}`}
                            tabIndex={
                              solved
                                ? -1
                                : isSelected || (tick === 0 && i === 1)
                                ? 0
                                : -1
                            }
                            onClick={() => {
                              if (!solved) {
                                setTick(i);
                                setFeedback(null);
                              }
                            }}
                            onKeyDown={(e) => !solved && onKeyTick(e, i)}
                            className="cursor-pointer outline-none group"
                          >
                            {/* Hitbox generosa */}
                            <rect
                              x={xOf(i) - 16}
                              y={Y - 24}
                              width={32}
                              height={48}
                              fill="transparent"
                            />
                            <line
                              x1={xOf(i)}
                              x2={xOf(i)}
                              y1={Y - 7}
                              y2={Y + 7}
                              stroke={isSelected ? '#2e5926' : '#736150'}
                              strokeWidth={isSelected ? '2.5' : '1.5'}
                            />
                            <circle
                              cx={xOf(i)}
                              cy={Y}
                              r={isSelected ? 6 : 4}
                              className={
                                isSelected
                                  ? 'fill-[#2e5926] stroke-[#d4ebc8] stroke-2'
                                  : 'fill-[#faf5ec] stroke-[#736150] stroke-1.5 group-hover:stroke-[#2b221b]'
                              }
                            />
                            {isSelected && (
                              <text
                                x={xOf(i)}
                                y={Y + 24}
                                textAnchor="middle"
                                className="fill-[#2e5926] font-mono text-[11px] font-bold select-none"
                              >
                                {label(i, parts)}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>
              ) : (
                /* Missão de Comparação */
                <div className="flex flex-col gap-2 bg-[#f3ede2]/70 p-3 rounded-xl border border-[#e2d7c5]/80">
                  <span className="text-[11px] font-semibold text-[#6e5d4e]">
                    Toque na menor fração:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {mission.options.map((opt) => (
                      <button
                        key={opt.den}
                        type="button"
                        disabled={solved}
                        onClick={() => submit(opt)}
                        className="py-2.5 px-3 rounded-xl bg-[#faf5ec] hover:bg-[#eae1d3] border border-[#d6c8b4] text-[#2b221b] font-mono text-sm font-bold shadow-2xs transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        {label(1, opt.den)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback pedagógico */}
              {feedback && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`p-2.5 rounded-xl text-xs leading-relaxed border ${
                    feedback.tone === 'success'
                      ? 'bg-[#d4ebc8]/80 border-[#a3cf8e] text-[#1c3817]'
                      : 'bg-[#fef3c7]/90 border-[#fde68a] text-[#854d0e]'
                  }`}
                >
                  <p>{feedback.message}</p>
                  {solved && (
                    <p className="mt-1 font-semibold text-[#2e5926]">
                      ✨ {mission.rewardText}
                    </p>
                  )}
                </div>
              )}

              {/* Ações */}
              <div className="flex items-center justify-between pt-1">
                {/* Pips de progresso */}
                <div
                  className="flex items-center gap-1.5"
                  aria-label={`Progresso: ${progress.completed.length} de ${MISSIONS.length}`}
                >
                  {MISSIONS.map((m) => {
                    const isDone = progress.completed.includes(m.id);
                    return (
                      <span
                        key={m.id}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          isDone
                            ? 'bg-[#4e6e3a]'
                            : 'bg-[#d6c8b4] border border-[#c2b29d]'
                        }`}
                      />
                    );
                  })}
                </div>

                <div>
                  {solved ? (
                    <button
                      type="button"
                      onClick={resetForNext}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#382f27] text-[#fcf8f0] hover:bg-[#4d4136] transition-colors cursor-pointer shadow-xs active:scale-95"
                    >
                      <span>Continuar</span>
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    mission.kind === 'locate' && (
                      <button
                        type="button"
                        onClick={() => submit()}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#d4ebc8] hover:bg-[#c5e3b5] border border-[#a3cf8e] text-[#23451e] transition-colors cursor-pointer shadow-xs active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Conferir</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}
