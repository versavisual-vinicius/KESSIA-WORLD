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

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={onNextMission}
                  className="min-h-[38px] px-3.5 sm:px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all touch-manipulation"
                >
                  <span>Próxima</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-[#FAF6F0] hover:bg-stone-200/80 text-stone-500 flex items-center justify-center transition-colors touch-manipulation"
                  title="Fechar modo de construção"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4" />
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
            className="w-full p-3 sm:p-3.5 rounded-3xl bg-[#FFFDF9]/96 border-2 border-amber-400 shadow-[0_16px_40px_rgba(120,113,108,0.2)] pointer-events-auto"
            role="region"
            aria-live="polite"
          >
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 text-xl flex items-center justify-center shrink-0 shadow-2xs animate-pulse">
                  {emoji}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono-num text-[11px] font-bold text-amber-600 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Recompensa da Fração
                    </span>
                  </div>
                  <div className="font-display font-bold text-xs sm:text-sm text-stone-800 truncate">
                    Construir {reward.name}
                  </div>
                  <p className="text-[11px] text-stone-600 font-medium">
                    👇 Toque na grama 3D para posicionar sua peça!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={onNextMission}
                  className="min-h-[36px] px-3 py-1 rounded-full bg-[#FAF6F0] hover:bg-stone-200/80 active:scale-95 text-stone-700 font-bold text-xs flex items-center gap-1 border border-stone-200 transition-all touch-manipulation"
                >
                  <span className="hidden sm:inline">Depois</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-[#FAF6F0] hover:bg-stone-200/80 text-stone-500 flex items-center justify-center transition-colors touch-manipulation"
                  title="Fechar"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
