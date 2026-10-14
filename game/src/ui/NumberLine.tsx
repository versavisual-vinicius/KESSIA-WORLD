import { useRef, type KeyboardEvent } from 'react';
import { MAX_PARTS, MIN_PARTS, label } from '../core/fraction';

interface Props {
  parts: number;
  tick: number; // 0 = nenhuma marca escolhida
  onPartsChange: (n: number) => void;
  onTickChange: (t: number) => void;
  disabled?: boolean;
}

const W = 640;
const PAD = 40;
const Y = 70;

/** Reta numérica 0–1 acessível: stepper de partes + grupo de rádio para marcas. */
export function NumberLine({ parts, tick, onPartsChange, onTickChange, disabled }: Props) {
  const tickRefs = useRef<(SVGGElement | null)[]>([]);
  const xOf = (i: number) => PAD + ((W - PAD * 2) * i) / parts;
  const ticks = Array.from({ length: parts - 1 }, (_, i) => i + 1);

  const onKey = (e: KeyboardEvent, i: number) => {
    let next = i;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = Math.min(parts - 1, i + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = Math.max(1, i - 1);
    else if (e.key === 'Home') next = 1;
    else if (e.key === 'End') next = parts - 1;
    else if (e.key === ' ' || e.key === 'Enter') { onTickChange(i); e.preventDefault(); return; }
    else return;
    e.preventDefault();
    onTickChange(next);
    tickRefs.current[next]?.focus();
  };

  return (
    <div className="numberline">
      <div className="stepper" role="group" aria-label="Em quantas partes iguais dividir">
        <button
          id="parts-minus"
          type="button"
          className="btn btn-round"
          onClick={() => onPartsChange(parts - 1)}
          disabled={disabled || parts <= MIN_PARTS}
          aria-label="Menos partes"
        >−</button>
        <output id="parts-value" className="stepper-value" aria-live="polite">
          {parts} partes iguais
        </output>
        <button
          id="parts-plus"
          type="button"
          className="btn btn-round"
          onClick={() => onPartsChange(parts + 1)}
          disabled={disabled || parts >= MAX_PARTS}
          aria-label="Mais partes"
        >+</button>
      </div>

      <svg viewBox={`0 0 ${W} 130`} className="numberline-svg" role="radiogroup" aria-label={`Reta de 0 a 1 dividida em ${parts} partes. Escolha uma marca.`}>
        {/* segmentos coloridos: mostram as partes iguais */}
        {Array.from({ length: parts }, (_, i) => (
          <rect
            key={`seg-${i}`}
            x={xOf(i) + 2}
            y={Y - 9}
            width={xOf(i + 1) - xOf(i) - 4}
            height={18}
            rx={6}
            className={i < tick ? 'seg seg-on' : 'seg'}
          />
        ))}
        <line x1={PAD} x2={W - PAD} y1={Y} y2={Y} className="axis" />
        {[0, parts].map((i) => (
          <g key={`end-${i}`}>
            <line x1={xOf(i)} x2={xOf(i)} y1={Y - 22} y2={Y + 22} className="axis-end" />
            <text x={xOf(i)} y={Y + 48} className="axis-label">{i === 0 ? '0' : '1'}</text>
          </g>
        ))}
        {ticks.map((i) => {
          const selected = tick === i;
          return (
            <g
              key={`t-${i}`}
              id={`tick-${i}`}
              ref={(el) => { tickRefs.current[i] = el; }}
              role="radio"
              aria-checked={selected}
              aria-label={`Marca ${label(i, parts)}`}
              tabIndex={disabled ? -1 : selected || (tick === 0 && i === 1) ? 0 : -1}
              className={selected ? 'tick tick-on' : 'tick'}
              onClick={() => !disabled && onTickChange(i)}
              onKeyDown={(e) => !disabled && onKey(e, i)}
            >
              {/* área de toque generosa (≥44px) */}
              <rect x={xOf(i) - 24} y={Y - 34} width={48} height={92} fill="transparent" />
              <line x1={xOf(i)} x2={xOf(i)} y1={Y - 16} y2={Y + 16} className="tick-line" />
              <circle cx={xOf(i)} cy={Y} r={selected ? 11 : 7} className="tick-dot" />
              {selected && <text x={xOf(i)} y={Y + 48} className="tick-label">{label(i, parts)}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
