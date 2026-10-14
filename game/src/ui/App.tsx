import { useEffect, useMemo, useRef, useState } from 'react';
import { evaluateCompare, evaluateLocate, label, MIN_PARTS, type UnitFraction } from '../core/fraction';
import { hintFeedback, successFeedback, type Feedback } from '../core/feedback';
import { MISSIONS } from '../core/missions';
import { currentMissionIndex, emptyProgress, loadProgress, recordAttempt, saveProgress } from '../core/progress';
import { WorldBridge } from '../world/WorldBridge';
import { NumberLine } from './NumberLine';

interface Settings { reducedMotion: boolean; largeText: boolean; highContrast: boolean }

const SETTINGS_KEY = 'kessia-world:settings:v1';
const defaultSettings = (): Settings => {
  try {
    const s = localStorage.getItem(SETTINGS_KEY);
    if (s) return JSON.parse(s);
  } catch { /* noop */ }
  return {
    reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    largeText: false,
    highContrast: window.matchMedia?.('(prefers-contrast: more)').matches ?? false,
  };
};

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<WorldBridge | null>(null);
  const [progress, setProgress] = useState(loadProgress);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);

  const [parts, setParts] = useState(MIN_PARTS);
  const [tick, setTick] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [solved, setSolved] = useState(false);

  const idx = currentMissionIndex(progress);
  const done = idx >= MISSIONS.length;
  const mission = done ? null : MISSIONS[idx];
  const attempts = mission ? progress.attempts[mission.id] ?? 0 : 0;

  // Monta cena e reconstrói recompensas já conquistadas (sem animação).
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    let bridge: WorldBridge;
    try {
      bridge = new WorldBridge(el);
    } catch {
      setWebglFailed(true);
      return;
    }
    worldRef.current = bridge;
    for (const id of loadProgress().completed) {
      const m = MISSIONS.find((x) => x.id === id);
      if (m) bridge.reward(m.reward, false);
    }
    return () => { bridge.dispose(); worldRef.current = null; };
  }, []);

  useEffect(() => { worldRef.current?.setReducedMotion(settings.reducedMotion); }, [settings.reducedMotion]);
  useEffect(() => { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* noop */ } }, [settings]);
  useEffect(() => { saveProgress(progress); }, [progress]);

  const resetBoard = () => { setParts(MIN_PARTS); setTick(0); setFeedback(null); setSolved(false); };

  const changeParts = (n: number) => { setParts(n); setTick(0); setFeedback(null); };

  const submit = (chosen?: UnitFraction) => {
    if (!mission || solved) return;
    const result = mission.kind === 'locate'
      ? evaluateLocate(mission.target, { parts, tick })
      : evaluateCompare(mission.options[0], mission.options[1], chosen!);

    if (result.correct) {
      setFeedback(successFeedback(mission));
      setSolved(true);
      worldRef.current?.reward(mission.reward, true);
    } else {
      const counted = result.errorKind !== 'no-tick';
      setFeedback(hintFeedback(mission, result.errorKind!, attempts + (counted ? 1 : 0) || 1, { parts, tick }));
      if (!counted) return;
    }
    setProgress((p) => recordAttempt(p, mission.id, result.correct));
  };

  // Ao acertar, recordAttempt já marca concluída; mantemos a missão visível até "Continuar".
  const shownMission = solved ? MISSIONS[Math.max(0, idx - 1)] : mission;

  const rootClass = useMemo(() => [
    'app',
    settings.largeText && 'large-text',
    settings.highContrast && 'high-contrast',
    settings.reducedMotion && 'reduced-motion',
  ].filter(Boolean).join(' '), [settings]);

  const completedCount = progress.completed.length;

  return (
    <div className={rootClass}>
      <div ref={mountRef} className="world" aria-hidden="true" />
      {webglFailed && <p className="webgl-msg">O mundo 3D não pôde ser exibido neste aparelho, mas você pode jogar normalmente.</p>}

      <header className="topbar">
        <h1 className="brand">Pequeno Mundo das Frações</h1>
        <div className="progress" aria-label={`Progresso: ${completedCount} de ${MISSIONS.length} missões`}>
          {MISSIONS.map((m) => (
            <span key={m.id} className={progress.completed.includes(m.id) ? 'pip pip-on' : 'pip'} />
          ))}
        </div>
        <button id="settings-toggle" type="button" className="btn btn-ghost" aria-expanded={settingsOpen} aria-controls="settings-panel" onClick={() => setSettingsOpen((v) => !v)}>
          Opções
        </button>
      </header>

      {settingsOpen && (
        <section id="settings-panel" className="panel settings" aria-label="Opções de acessibilidade">
          {([
            ['reducedMotion', 'Reduzir movimento'],
            ['largeText', 'Texto maior'],
            ['highContrast', 'Alto contraste'],
          ] as const).map(([k, t]) => (
            <label key={k} className="switch">
              <input id={`opt-${k}`} type="checkbox" checked={settings[k]} onChange={(e) => setSettings((s) => ({ ...s, [k]: e.target.checked }))} />
              <span>{t}</span>
            </label>
          ))}
          <button id="reset-progress" type="button" className="btn btn-ghost small" onClick={() => {
            if (confirm('Recomeçar do início? O mundo voltará ao estado inicial.')) {
              setProgress(emptyProgress()); saveProgress(emptyProgress()); location.reload();
            }
          }}>Recomeçar jogo</button>
        </section>
      )}

      <main className="panel mission">
        {done && !solved ? (
          <>
            <p className="guide">Kessia</p>
            <h2 className="mission-title">Você construiu o Pequeno Mundo!</h2>
            <p className="story">Ponte, árvore, casa, flores, moinho, poço e farol: tudo no lugar certo da reta. Conte para sua professora ou professor como você descobriu onde ficava cada fração.</p>
          </>
        ) : shownMission && (
          <>
            <p className="guide">Kessia · Missão {MISSIONS.indexOf(shownMission) + 1} de {MISSIONS.length}</p>
            <h2 className="mission-title">{shownMission.title}</h2>
            <p className="story">{shownMission.story}</p>

            {shownMission.kind === 'locate' ? (
              <>
                <div className="target" aria-hidden="true">
                  <span className="frac"><span>1</span><span className="bar" /><span>{shownMission.target.den}</span></span>
                </div>
                <NumberLine parts={parts} tick={tick} onPartsChange={changeParts} onTickChange={(t) => { setTick(t); setFeedback(null); }} disabled={solved} />
              </>
            ) : (
              <div className="choices" role="group" aria-label="Escolha a fração menor">
                {shownMission.options.map((o) => (
                  <button key={o.den} id={`choice-${o.den}`} type="button" className="btn btn-choice" disabled={solved} onClick={() => submit(o)}>
                    {label(1, o.den)}
                  </button>
                ))}
              </div>
            )}

            <div className="feedback-area" aria-live="polite" role="status">
              {feedback && <p className={`feedback feedback-${feedback.tone}`}>{feedback.message}</p>}
              {solved && <p className="reward">{shownMission.rewardText}</p>}
            </div>

            <div className="actions">
              {solved ? (
                <button id="next-mission" type="button" className="btn btn-primary" onClick={resetBoard} autoFocus>
                  Continuar
                </button>
              ) : shownMission.kind === 'locate' && (
                <button id="check-answer" type="button" className="btn btn-primary" onClick={() => submit()}>
                  Conferir
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
