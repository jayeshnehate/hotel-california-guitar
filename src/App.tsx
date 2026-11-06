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
import { RhythmVisualizer } from './components/RhythmVisualizer';
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
  const [isPulseActive, setIsPulseActive] = useState<boolean>(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);

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

  const handleBeat = useCallback(
    (beat: number) => {
      setCurrentBeat(beat);
      setIsPulseActive(true);
      window.setTimeout(() => setIsPulseActive(false), 90);

      if (displayNode.chords.length > 1 && beat === 0) {
        setActiveChordIndex((prev) => (prev + 1) % displayNode.chords.length);
      }
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
  }, [isPlaying, bpm, stopDrill, handleTimerComplete]);

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

      if (grade === 'pass' || grade === 'mastered') {
        const currIdx = CURRICULUM.findIndex((n) => n.id === activeNode.id);
        if (currIdx < CURRICULUM.length - 1) {
          setProgress((p) => {
            const nextNode = CURRICULUM[currIdx + 1];
            const up: UserProgress = { ...p, activeNodeId: nextNode.id };
            saveProgress(up);
            return up;
          });
        }
      }

      setActiveStep(0);
      setTimeLeft(60);
      setActiveChordIndex(0);
    },
    [activeNode.id, progress]
  );

  const currentChord: ChordShape =
    displayNode.chords[activeChordIndex % displayNode.chords.length] || displayNode.chords[0];

  // Radial progress calculations
  const timerRadius = 38;
  const timerCircumference = 2 * Math.PI * timerRadius;
  const timerStrokeDashoffset = timerCircumference - (timeLeft / 60) * timerCircumference;

  return (
    <div className={`app-viewport ${isPulseActive ? 'beat-pulse-active' : ''}`}>
      {/* 1. TOP HEADER */}
      <header className="app-header">
        {/* Left: 4-square Grid Button */}
        <button
          onClick={() => setIsPathOpen(true)}
          aria-label="Path Map"
          className="brutal-btn brutal-btn-icon"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
        </button>

        {/* Center: Node Number & Chord Selectors */}
        <div className="header-center">
          <span className="node-number">{displayNode.id}</span>
          <span className="anchor-symbol">⊥</span>

          <div className="chord-buttons-row">
            {displayNode.chords.map((chord, idx) => {
              const isActive = activeChordIndex === idx;
              return (
                <button
                  key={`${chord.name}-${idx}`}
                  onClick={() => setActiveChordIndex(idx)}
                  className={`brutal-btn brutal-btn-chord ${isActive ? 'active' : ''}`}
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

      {/* 2. CENTER: SVG FRETBOARD & RHYTHM VISUALIZER */}
      <main className="app-main">
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
          hasShadow={true}
        />

        <RhythmVisualizer
          pattern={displayNode.strumPattern}
          activeBeatIndex={currentBeat}
          isPlaying={isPlaying}
        />
      </main>

      {/* 3. BOTTOM CONTROLS */}
      <footer className="app-footer">
        {/* BPM Stepper */}
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

          <span className="bpm-value">{bpm}</span>

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
              <svg width="88" height="88" viewBox="0 0 88 88" style={{ overflow: 'visible' }}>
                {/* Background track circle */}
                <circle
                  cx="44"
                  cy="44"
                  r={timerRadius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  opacity="0.25"
                />
                {/* Progress countdown arc */}
                <circle
                  cx="44"
                  cy="44"
                  r={timerRadius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray={timerCircumference}
                  strokeDashoffset={timerStrokeDashoffset}
                  strokeLinecap="round"
                  transform="rotate(-90 44 44)"
                  style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                />
                <text
                  x="44"
                  y="49"
                  fill="currentColor"
                  fontSize="18"
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

        {/* 3 Step Indicator Dots: Step 1 (Warmup), Step 2 (Core Drill), Step 3 (Gate) */}
        <div className="step-dots-row">
          <span className={`step-dot ${activeStep === 0 ? 'active' : ''}`} />
          <span className={`step-dot ${activeStep === 1 ? 'active' : ''}`} />
          <span className={`step-dot ${activeStep === 2 ? 'active' : ''}`} />
        </div>

        {/* Subtle Bonsai Emblem */}
        <div
          onClick={() => setIsPathOpen(true)}
          style={{ cursor: 'pointer', opacity: 0.8, paddingTop: '2px' }}
          title="Silent Bonsai"
        >
          <Bonsai
            completedSessions={progress.completedSessions}
            lastCompletedTimestamp={progress.lastCompletedTimestamp}
            size={28}
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
          setProgress((prev) => {
            const next: UserProgress = { ...prev, activeNodeId: nodeId };
            saveProgress(next);
            return next;
          });
          setActiveStep(0);
          setTimeLeft(60);
          setActiveChordIndex(0);
          stopDrill();
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
