/**
 * Tela de Título — Estética Clean Girl & Visual-First
 * Superfícies creme/marfim suaves, exemplos visuais de frações (1/2, 1/3, 1/4)
 * e leitura mínima.
 */

import React, { useEffect } from 'react';
import { BookOpen, Play, Sparkles, Volume2 } from 'lucide-react';
import { AccessibilitySettings } from '../core/types';
import { MiniFractionPie } from './WorldSpeechBubbles';

interface TitleScreenOverlayProps {
  completedCount: number;
  totalMissions: number;
  accessibility: AccessibilitySettings;
  onStartGame: () => void;
  onOpenEducator: () => void;
  onToggleSetting: (key: keyof AccessibilitySettings) => void;
}

export const TitleScreenOverlay: React.FC<TitleScreenOverlayProps> = ({
  completedCount,
  totalMissions,
  accessibility,
  onStartGame,
  onOpenEducator,
  onToggleSetting,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-between p-5 md:p-8 pointer-events-none">
      {/* Topo Clean Girl */}
      <div className="flex items-center justify-between gap-3 pointer-events-auto">
        <div className="px-3.5 py-2 rounded-full bg-[#FFFDF9] border border-stone-300 shadow-xs text-xs text-stone-800 flex items-center gap-2">
          <span className="font-extrabold text-emerald-950">Kessia World</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-num font-extrabold text-stone-900">EF04MA09</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleSetting('voiceEnabled')}
            className={`min-h-[48px] px-4 py-2 rounded-full border text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs ${
              accessibility.voiceEnabled
                ? 'bg-white border-emerald-700 text-emerald-950 ring-2 ring-emerald-200'
                : 'bg-[#FFFDF9] border-stone-300 text-stone-900'
            }`}
          >
            <Volume2 className="w-4 h-4 text-emerald-800" />
            <span>Voz: {accessibility.voiceEnabled ? 'Sim' : 'Não'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenEducator}
            className="min-h-[48px] px-4 py-2 rounded-full bg-[#FFFDF9] hover:bg-white border border-stone-300 text-xs font-bold text-stone-900 flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <BookOpen className="w-4 h-4 text-rose-800" />
            <span>Educador</span>
          </button>
        </div>
      </div>

      {/* Card Central Clean Girl com Exemplo Visual */}
      <div className="my-auto mx-auto max-w-md w-full text-center p-6 sm:p-7 rounded-3xl bg-[#FFFDF9] border border-stone-300 shadow-[0_20px_50px_rgba(120,113,108,0.16)] pointer-events-auto space-y-4">
        {/* Retrato Oficial da Guardiã Késsia */}
        <div className="flex flex-col items-center justify-center -mt-1">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-emerald-600 shadow-md overflow-hidden bg-gradient-to-b from-emerald-100 to-amber-50">
            <img
              src="/characters/kessia/portrait.png"
              alt="Késsia - Exploradora das Frações"
              className="w-full h-full object-cover object-top scale-110"
            />
          </div>
          <span className="mt-1.5 px-3 py-1 rounded-full bg-emerald-800 text-white font-bold text-xs shadow-xs tracking-wide">
            Guardiã Késsia
          </span>
        </div>

        {/* Exemplos Visuais de Frações Unitárias */}
        <div className="flex items-center justify-center gap-2.5">
          {[
            { den: 2, color: '#047857' },
            { den: 3, color: '#e11d48' },
            { den: 4, color: '#d97706' },
          ].map((item) => (
            <div
              key={item.den}
              className="px-3.5 py-2 rounded-2xl bg-[#FAF6F0] border border-stone-300 flex flex-col items-center gap-1"
            >
              <MiniFractionPie
                denominator={item.den}
                numerator={1}
                color={item.color}
                size={36}
              />
              <span className="font-mono-num text-xs font-black text-stone-900">
                1/{item.den}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <h1
            className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight"
            style={{ textWrap: 'balance' }}
          >
            Pequeno Mundo das Frações
          </h1>
          <p className="text-sm text-stone-700 max-w-xs mx-auto leading-relaxed">
            Explore a trilha botânica, divida em partes iguais e descubra as frações na reta de 0 a 1.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onStartGame}
            className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-base flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>
              {completedCount > 0
                ? `Continuar (${completedCount}/${totalMissions})`
                : 'Começar a Jogar'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onToggleSetting('reducedStimuli')}
            className={`w-full sm:w-auto min-h-[48px] px-5 py-2.5 rounded-full border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
              accessibility.reducedStimuli
                ? 'bg-rose-50 border-rose-400 text-rose-900'
                : 'bg-[#FAF6F0] border-stone-300 text-stone-800 hover:bg-stone-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-rose-600" />
            <span>Modo Calmo: {accessibility.reducedStimuli ? 'Sim' : 'Não'}</span>
          </button>
        </div>
      </div>

      {/* Dica visual mínima no rodapé */}
      <div className="mx-auto px-5 py-2 rounded-full bg-[#FFFDF9] border border-stone-300 text-xs text-stone-700 font-semibold pointer-events-auto shadow-2xs">
        👆 Toque na trilha botânica para andar · Deslize para explorar de 0 a 1
      </div>
    </div>
  );
};
