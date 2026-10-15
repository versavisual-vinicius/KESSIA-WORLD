/**
 * Painel Interativo de Construção de Peças no Mundo 3D (BNCC EF04MA09)
 * Exibido imediatamente após a estudante acertar uma fração unitária,
 * permitindo construir a recompensa diretamente no terrário através do toque no solo.
 */

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  ChevronRight,
  Hammer,
  Palette,
  Sparkles,
  X,
} from 'lucide-react';
import { MissionStation } from '../core/types';

interface RewardBuildOverlayProps {
  reward: MissionStation['rewardItem'] | null;
  justBuiltName: string | null;
  placedCount: number;
  onClose: () => void;
  onNextMission: () => void;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  bridge: '🌉',
  flora: '🌸',
  lantern: '🏮',
  fountain: '⛲',
  crystal: '🔮',
  monument: '☀️',
};

export const RewardBuildOverlay: React.FC<RewardBuildOverlayProps> = ({
  reward,
  justBuiltName,
  placedCount,
  onClose,
  onNextMission,
}) => {
  if (!reward) return null;

  const emoji = CATEGORY_EMOJIS[reward.category] || '✨';

  return (
    <div className="fixed top-14 sm:top-16 inset-x-2 sm:inset-x-0 mx-auto max-w-md z-30 pointer-events-none flex flex-col items-center">
      <AnimatePresence mode="wait">
        {justBuiltName ? (
          /* Feedback de Sucesso: Peça Construída */
          <motion.div
            key="built-success"
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -6 }}
            transition={{ duration: 0.2 }}
            className="w-full p-3 sm:p-4 rounded-3xl bg-[#FFFDF9]/96 border-2 border-emerald-400 shadow-[0_16px_40px_rgba(120,113,108,0.2)] pointer-events-auto"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 text-xl flex items-center justify-center shrink-0 shadow-2xs">
                  {emoji}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-display font-bold text-xs sm:text-sm text-stone-800 truncate">
                      {justBuiltName} Construído!
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  </div>
                  <p className="text-[11px] sm:text-xs text-stone-600 truncate">
                    +1 peça no seu mundo ({placedCount} no total). Toque para plantar mais!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onNextMission}
                  className="min-h-[48px] px-5 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all touch-manipulation"
                >
                  <span>Próxima</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-w-[48px] min-h-[48px] rounded-full bg-[#FAF6F0] hover:bg-stone-200 border border-stone-300 text-stone-800 flex items-center justify-center transition-colors touch-manipulation shadow-2xs"
                  title="Fechar modo de construção"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Chamada para Construção no Solo */
          <motion.div
            key="ready-to-build"
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -6 }}
            transition={{ duration: 0.2 }}
            className="w-full p-3 sm:p-4 rounded-3xl bg-[#FFFDF9] border-2 border-amber-500 shadow-[0_16px_40px_rgba(120,113,108,0.2)] pointer-events-auto"
            role="region"
            aria-live="polite"
          >
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-950 text-xl flex items-center justify-center shrink-0 shadow-2xs animate-pulse">
                  {emoji}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono-num text-xs font-black text-amber-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                      Recompensa da Fração
                    </span>
                  </div>
                  <div className="font-display font-bold text-xs sm:text-sm text-stone-900 truncate">
                    Construir {reward.name}
                  </div>
                  <p className="text-xs text-stone-700 font-semibold">
                    👇 Toque no caminho botânico para posicionar sua peça!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onNextMission}
                  className="min-h-[48px] px-4 py-2 rounded-full bg-[#FAF6F0] hover:bg-stone-200 active:scale-95 text-stone-900 font-bold text-xs sm:text-sm flex items-center gap-1 border border-stone-300 transition-all touch-manipulation shadow-2xs"
                >
                  <span className="hidden sm:inline">Depois</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-w-[48px] min-h-[48px] rounded-full bg-[#FAF6F0] hover:bg-stone-200 border border-stone-300 text-stone-800 flex items-center justify-center transition-colors touch-manipulation shadow-2xs"
                  title="Fechar"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
