/**
 * Painel do Educador — Estética Clean Girl (BNCC EF04MA09)
 * Relatório visual limpo em tons creme, sálvia e pedra suave.
 */

import React from 'react';
import { BookOpen, CheckCircle2, Download, RotateCcw, X } from 'lucide-react';
import { MISSIONS } from '../core/missions';
import { computeEducatorDiagnostics } from '../core/storage';
import { PlayerProgressState } from '../core/types';
import { MiniFractionPie } from './WorldSpeechBubbles';

interface EducatorModalProps {
  progress: PlayerProgressState;
  onClose: () => void;
  onResetProgress: () => void;
}

export const EducatorModal: React.FC<EducatorModalProps> = ({
  progress,
  onClose,
  onResetProgress,
}) => {
  const diagnostics = computeEducatorDiagnostics(progress.attempts);

  const handleExportReport = () => {
    const reportData = {
      habilidadeBNCC: 'EF04MA09',
      geradoEm: new Date().toISOString(),
      missoesConcluidas: progress.completedMissionIds.length,
      totalMissoes: MISSIONS.length,
      metricas: diagnostics,
      historicoTentativas: progress.attempts,
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio-pequeno-mundo-fracoes-ef04ma09.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/35"
      role="dialog"
      aria-modal="true"
      aria-labelledby="educator-modal-title"
    >
      <div className="w-full max-w-3xl max-h-[86vh] flex flex-col rounded-3xl bg-[#FFFDF9] border border-stone-200 text-stone-800 shadow-2xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-[#FAF6F0]">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-emerald-800" />
            <div>
              <h2 id="educator-modal-title" className="text-base sm:text-lg font-bold text-stone-900">
                Painel do Educador · BNCC EF04MA09
              </h2>
              <p className="text-xs text-stone-700 font-semibold">
                Frações unitárias (1/2 a 1/10) na reta numérica.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-w-[48px] min-h-[48px] rounded-full bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 flex items-center justify-center transition-colors shadow-2xs"
            aria-label="Fechar Painel do Educador"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo rolável */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Barra de Progresso Geral BNCC */}
          <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-stone-300 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-stone-900">Progresso Geral na Trilha (BNCC EF04MA09)</span>
              <span className="font-mono-num text-emerald-950 font-black">
                {Math.round((progress.completedMissionIds.length / MISSIONS.length) * 100)}%
              </span>
            </div>
            <div
              className="w-full h-3.5 rounded-full bg-stone-300 overflow-hidden"
              role="progressbar"
              aria-valuenow={progress.completedMissionIds.length}
              aria-valuemin={0}
              aria-valuemax={MISSIONS.length}
            >
              <div
                className="h-full bg-emerald-800 rounded-full transition-all duration-300"
                style={{
                  width: `${(progress.completedMissionIds.length / MISSIONS.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Resumo Quantitativo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-stone-300">
              <div className="text-xs text-stone-700 font-bold">Concluídas</div>
              <div className="mt-1 text-xl font-black font-mono-num text-emerald-900">
                {progress.completedMissionIds.length} / {MISSIONS.length}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-stone-300">
              <div className="text-xs text-stone-700 font-bold">Tentativas</div>
              <div className="mt-1 text-xl font-black font-mono-num text-stone-900">
                {diagnostics.totalAttempts}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-stone-300">
              <div className="text-xs text-stone-700 font-bold">Taxa de Acerto</div>
              <div className="mt-1 text-xl font-black font-mono-num text-rose-800">
                {diagnostics.accuracyRate}%
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-stone-300">
              <div className="text-xs text-stone-700 font-bold">Traços vs. Partes</div>
              <div className="mt-1 text-xl font-black font-mono-num text-amber-800">
                {diagnostics.tickConfusionCount}
              </div>
            </div>
          </div>

          {/* Domínio Visual por Fração */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {MISSIONS.map((m) => {
              const isDone = progress.completedMissionIds.includes(m.id);
              const missionAttempts = progress.attempts.filter(
                (a) => a.missionId === m.id
              );
              return (
                <div
                  key={m.id}
                  className="p-3 rounded-2xl bg-[#FAF6F0] border border-stone-200/80 flex items-center gap-2.5"
                >
                  <MiniFractionPie
                    denominator={m.targetDenominator}
                    numerator={1}
                    color={m.accentColor}
                    size={32}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono-num font-bold text-xs text-stone-800">
                        1/{m.targetDenominator}
                      </span>
                      {isDone && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-stone-500 truncate">
                      {missionAttempts.length} tent.
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recomendações Pedagógicas */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Dicas de Mediação
            </h3>
            <ul className="space-y-1.5 text-xs text-stone-700 leading-relaxed">
              {diagnostics.pedagogicalRecommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-mono-num text-emerald-600 font-bold">
                    •
                  </span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-stone-200 bg-[#FAF6F0]">
          <button
            type="button"
            onClick={onResetProgress}
            className="min-h-[48px] px-4 py-2.5 rounded-full bg-white hover:bg-rose-50 border border-stone-300 text-stone-800 hover:text-rose-900 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors shadow-2xs"
          >
            <RotateCcw className="w-4 h-4 text-rose-700" />
            <span>Reiniciar Progresso</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportReport}
              className="min-h-[48px] px-4 py-2.5 rounded-full bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors shadow-2xs"
            >
              <Download className="w-4 h-4 text-emerald-800" />
              <span>Exportar JSON</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] px-6 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-bold transition-colors shadow-xs"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
