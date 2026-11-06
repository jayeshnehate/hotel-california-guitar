import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CURRICULUM, CurriculumNode, ChordShape } from './curriculum';
import {
  loadProgress,
  saveProgress,
  getWarmupNodeId,
  evaluateSession,
  UserProgress,
} from './lib/srs';
import { metronome } from './lib/audio';
import { Fretboard } from './components/Fretboard';
import { BeatConductor } from './components/BeatConductor';
import { Bonsai } from './components/Bonsai';
import { PathModal } from './components/PathModal';
import { VerificationModal } from './components/VerificationModal';

export const App: React.FC = () => {
  const [progress, setProgress] = useState<UserProgress>(loadProgress);
  const [activeStep, setActiveStep] = useState<0 | 1 | 2>(0); // 0=Warmup, 1=Core Drill, 2=Verification
  const [isPathOpen, setIsPathOpen] = useState(false);
  const [bpm, setBpm] = useState<number>(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [activeChordIndex, setActiveChordIndex] = useState<number>(0);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [currentMeasure, setCurrentMeasure] = useState<number>(1);
  const totalBeatsRef = useRef<number>(0);
  const [isVerificationOpen, setIsVerificationOpen] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const activeNode: CurriculumNode = useMemo(() => {
    return CURRICULUM.find((n) => n.id === progress.activeNodeId) || CURRICULUM[0];
  }, [progress.activeNodeId]);

  const displayNode: CurriculumNode = useMemo(() => {
    if (activeStep === 0) {
      const warmupId = getWarmupNodeId(activeNode.id, progress);
      return CURRICULUM.find((n) => n.id === warmupId) || activeNode;
    }
    return activeNode;
  }, [activeStep, activeNode, progress]);

  useEffect(() => {
    setBpm(displayNode.targetBpm);
  }, [displayNode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', progress.theme);
  }, [progress.theme]);

  const toggleTheme = useCallback(() => {
    setProgress((prev) => {
      const nextTheme: 'dark' | 'light' = prev.theme === 'dark' ? 'light' : 'dark';
      const updated: UserProgress = { ...prev, theme: nextTheme };
      saveProgress(updated);
      return updated;
    });
  }, []);

  // Metronome tick handler
  const handleBeat = useCallback(
    (beat: number) => {
      setCurrentBeat(beat);

      if (viewportRef.current) {
        viewportRef.current.classList.remove('beat-pulse-active');
        void viewportRef.current.offsetWidth;
        viewportRef.current.classList.add('beat-pulse-active');
      }

      // Calculate measure and auto-chord transition
      const curBeatIndex = totalBeatsRef.current;
      const measureIndex = Math.floor(curBeatIndex / 4);
      setCurrentMeasure(measureIndex + 1);

      if (displayNode.chords.length > 1) {
        const chordIndex = measureIndex % displayNode.chords.length;
        setActiveChordIndex(chordIndex);
      }

      totalBeatsRef.current += 1;
    },
    [displayNode]
  );

  useEffect(() => {
    metronome.setOnBeat(handleBeat);
    return () => metronome.setOnBeat(null);
  }, [handleBeat]);

  const stopDrill = useCallback(() => {
    metronome.stop();
    setIsPlaying(false);
    totalBeatsRef.current = 0;
    setCurrentMeasure(1);
    setCurrentBeat(0);
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleTimerComplete = useCallback(() => {
    stopDrill();
    if (activeStep === 0) {
      setActiveStep(1);
      setTimeLeft(60);
      setActiveChordIndex(0);
    } else if (activeStep === 1) {
      setActiveStep(2);
      setIsVerificationOpen(true);
    }
  }, [activeStep, stopDrill]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stopDrill();
    } else {
      totalBeatsRef.current = activeChordIndex * 4;
      setCurrentMeasure(activeChordIndex + 1);
      metronome.start(bpm);
      setIsPlaying(true);

      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [isPlaying, bpm, activeChordIndex, stopDrill, handleTimerComplete]);

  useEffect(() => {
    return () => {
      stopDrill();
    };
  }, [stopDrill]);

  const handleGrade = useCallback(
    (grade: 'fail' | 'pass' | 'mastered', reps: number) => {
      setIsVerificationOpen(false);
      const updated = evaluateSession(activeNode.id, grade, reps, progress);
      setProgress(updated);

      setActiveStep(0);
      setTimeLeft(60);
      setActiveChordIndex(0);
    },
    [activeNode.id, progress]
  );

  const switchStep = useCallback(
    (step: 0 | 1 | 2) => {
      stopDrill();
      setActiveStep(step);
      setTimeLeft(60);
      setActiveChordIndex(0);
      if (step === 2) {
        setIsVerificationOpen(true);
      }
    },
    [stopDrill]
  );

  const currentChord: ChordShape =
    displayNode.chords[activeChordIndex % displayNode.chords.length] || displayNode.chords[0];

  const nextChord: ChordShape | undefined =
    displayNode.chords.length > 1
      ? displayNode.chords[(activeChordIndex + 1) % displayNode.chords.length]
      : undefined;

  const timerRadius = 38;
  const timerCircumference = 2 * Math.PI * timerRadius;
  const timerStrokeDashoffset = timerCircumference - (timeLeft / 60) * timerCircumference;

  return (
    <div ref={viewportRef} className="app-viewport">
      {/* 1. TOP HEADER */}
      <header className="app-header">
        {/* Left: 4-square Grid Button */}
        <button
          onClick={() => {
            stopDrill();
            setIsPathOpen(true);
          }}
          aria-label="Path Map"
          className="brutal-btn brutal-btn-icon"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </button>

        {/* Center: Node Number & Chord Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '15px' }}>
            {displayNode.id}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {displayNode.chords.map((chord, idx) => {
              const isActive = activeChordIndex === idx;
              return (
                <button
                  key={`${chord.name}-${idx}`}
                  onClick={() => setActiveChordIndex(idx)}
                  className={`brutal-btn`}
                  style={{
                    minWidth: '38px',
                    height: '34px',
                    padding: '0 8px',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    fontWeight: 900,
                    borderRadius: '5px',
                    backgroundColor: isActive ? 'var(--pill-active-bg)' : 'var(--card-bg)',
                    color: isActive ? 'var(--pill-active-text)' : 'var(--text-main)',
                    borderColor: isActive ? 'var(--border-active)' : 'var(--border-main)',
                  }}
                >
                  {chord.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Invert Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Invert Theme"
          className="brutal-btn brutal-btn-icon"
        >
          <svg width="22" height="22" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="8" />
            <path d="M50,6 A44,44 0 0,1 50,94 Z" fill="currentColor" />
          </svg>
        </button>
      </header>

      {/* 2. CENTER: BEAT CONDUCTOR TIMELINE + SVG FRETBOARD */}
      <main className="app-main">
        {/* BEAT & STRUM CONDUCTOR HIGHWAY */}
        <BeatConductor
          currentChord={currentChord}
          nextChord={nextChord}
          currentBeat={currentBeat}
          isPlaying={isPlaying}
          timeLeft={timeLeft}
          bpm={bpm}
          measureNumber={currentMeasure}
          strumPattern={displayNode.strumPattern}
          mode={displayNode.type === 'arpeggio' ? 'pluck' : 'strum'}
          activeStringIndex={
            displayNode.type === 'arpeggio' && displayNode.arpeggioPattern
              ? displayNode.arpeggioPattern[currentBeat % displayNode.arpeggioPattern.length]?.stringIndex
              : undefined
          }
        />

        {/* FRETBOARD CARD */}
        <div className="fretboard-card">
          <Fretboard
            chord={currentChord}
            anchorFinger={displayNode.anchorFinger}
            anchorString={displayNode.anchorString}
            anchorFret={displayNode.anchorFret}
            mode={displayNode.type === 'arpeggio' ? 'horizontal' : 'vertical'}
            activeArpeggioStep={
              displayNode.type === 'arpeggio' && displayNode.arpeggioPattern
                ? displayNode.arpeggioPattern[currentBeat % displayNode.arpeggioPattern.length]
                : null
            }
          />
        </div>
      </main>

      {/* 3. BOTTOM CONTROLS */}
      <footer className="app-footer">
        {/* BPM Stepper & Value */}
        <div className="bpm-row">
          <button
            onClick={() => {
              const next = Math.max(30, bpm - 5);
              setBpm(next);
              metronome.setBpm(next);
            }}
            className="brutal-btn brutal-btn-bpm"
          >
            -
          </button>

          <div className="bpm-value-display">
            <span className="bpm-value">{bpm}</span>
            <span className="bpm-label">BPM</span>
          </div>

          <button
            onClick={() => {
              const next = Math.min(240, bpm + 5);
              setBpm(next);
              metronome.setBpm(next);
            }}
            className="brutal-btn brutal-btn-bpm"
          >
            +
          </button>
        </div>

        {/* Play / 60-Second Radial Countdown Button */}
        <div className="play-timer-container">
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Start'}
            className="play-timer-btn"
          >
            {isPlaying ? (
              <svg width="84" height="84" viewBox="0 0 88 88" style={{ overflow: 'visible' }}>
                <circle
                  cx="44"
                  cy="44"
                  r={timerRadius}
                  fill="none"
                  stroke="var(--border-subtle)"
                  strokeWidth="3.5"
                  opacity="0.3"
                />
                <circle
                  cx="44"
                  cy="44"
                  r={timerRadius}
                  fill="none"
                  stroke="var(--text-main)"
                  strokeWidth="4.5"
                  strokeDasharray={timerCircumference}
                  strokeDashoffset={timerStrokeDashoffset}
                  strokeLinecap="round"
                  transform="rotate(-90 44 44)"
                  style={{ transition: 'stroke-dashoffset 0.95s linear' }}
                />
                <text
                  x="44"
                  y="49"
                  dominantBaseline="central"
                  fill="var(--text-main)"
                  fontSize="20"
                  fontWeight="900"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {timeLeft}s
                </text>
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6,3 20,12 6,21" />
              </svg>
            )}
          </button>
        </div>

        {/* 3 Step Interactive Navigation: 1 Warmup, 2 Core Drill, 3 Gate */}
        <div className="step-dots-row">
          <button
            onClick={() => switchStep(0)}
            aria-label="Step 1 Warmup"
            className={`step-dot-btn ${activeStep === 0 ? 'active' : ''}`}
          >
            <span>1</span> WARMUP
          </button>
          <button
            onClick={() => switchStep(1)}
            aria-label="Step 2 Core Drill"
            className={`step-dot-btn ${activeStep === 1 ? 'active' : ''}`}
          >
            <span>2</span> DRILL (60s)
          </button>
          <button
            onClick={() => switchStep(2)}
            aria-label="Step 3 Gate"
            className={`step-dot-btn ${activeStep === 2 ? 'active' : ''}`}
          >
            <span>3</span> GATE
          </button>
        </div>

        {/* Subtle Bonsai Emblem */}
        <div
          onClick={() => {
            stopDrill();
            setIsPathOpen(true);
          }}
          style={{ cursor: 'pointer', opacity: 0.75, paddingTop: '1px' }}
          title="Silent Bonsai"
        >
          <Bonsai
            completedSessions={progress.completedSessions}
            lastCompletedTimestamp={progress.lastCompletedTimestamp}
            size={26}
            showPot={false}
          />
        </div>
      </footer>

      {/* 4. PATH OVERLAY MODAL */}
      <PathModal
        isOpen={isPathOpen}
        onClose={() => setIsPathOpen(false)}
        progress={progress}
        onSelectNode={(nodeId) => {
          stopDrill();
          setProgress((prev) => {
            const next: UserProgress = { ...prev, activeNodeId: nodeId };
            saveProgress(next);
            return next;
          });
          setActiveStep(0);
          setTimeLeft(60);
          setActiveChordIndex(0);
        }}
      />

      {/* 5. VERIFICATION GATE MODAL */}
      <VerificationModal
        isOpen={isVerificationOpen}
        targetReps={activeNode.targetReps}
        onGrade={handleGrade}
      />
    </div>
  );
};

export default App;
