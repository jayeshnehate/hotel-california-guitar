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

  // Active curriculum node
  const activeNode: CurriculumNode = useMemo(() => {
    return CURRICULUM.find((n) => n.id === progress.activeNodeId) || CURRICULUM[0];
  }, [progress.activeNodeId]);

  // If in Step 0 (Warmup), determine review node
  const displayNode: CurriculumNode = useMemo(() => {
    if (activeStep === 0) {
      const warmupId = getWarmupNodeId(activeNode.id, progress);
      return CURRICULUM.find((n) => n.id === warmupId) || activeNode;
    }
    return activeNode;
  }, [activeStep, activeNode, progress]);

  // Sync BPM with node target when node changes
  useEffect(() => {
    setBpm(displayNode.targetBpm);
  }, [displayNode]);

  // Sync theme attribute on document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', progress.theme);
  }, [progress.theme]);

  // Toggle Dark / Light Theme
  const toggleTheme = useCallback(() => {
    setProgress((prev) => {
      const nextTheme: 'dark' | 'light' = prev.theme === 'dark' ? 'light' : 'dark';
      const updated: UserProgress = { ...prev, theme: nextTheme };
      saveProgress(updated);
      return updated;
    });
  }, []);

  // Metronome tick callback
  const handleBeat = useCallback(
    (beat: number) => {
      setCurrentBeat(beat);
      setIsPulseActive(true);
      window.setTimeout(() => setIsPulseActive(false), 90);

      // Auto chord alternation during timed drill (every 4 beats)
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

  // Stop metronome & timer
  const stopDrill = useCallback(() => {
    metronome.stop();
    setIsPlaying(false);
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Finish 60s drill
  const handleTimerComplete = useCallback(() => {
    stopDrill();
    if (activeStep === 0) {
      // Warmup complete -> advance to Step 1 (Core Drill)
      setActiveStep(1);
      setTimeLeft(60);
      setActiveChordIndex(0);
    } else if (activeStep === 1) {
      // Core Drill complete -> advance to Step 2 (Verification Gate)
      setActiveStep(2);
      setIsVerificationOpen(true);
    }
  }, [activeStep, stopDrill]);

  // Start / Toggle 60-second drill
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

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      stopDrill();
    };
  }, [stopDrill]);

  // Evaluate self-grade
  const handleGrade = useCallback(
    (grade: 'fail' | 'pass' | 'mastered', reps: number) => {
      setIsVerificationOpen(false);
      const updated = evaluateSession(activeNode.id, grade, reps, progress);
      setProgress(updated);

      // If passed/mastered, move to next unlocked node, else repeat
      if (grade === 'pass' || grade === 'mastered') {
        const currIdx = CURRICULUM.findIndex((n) => n.id === activeNode.id);
        if (currIdx < CURRICULUM.length - 1) {
          setProgress((p) => {
            const nextNode = CURRICULUM[currIdx + 1];
            const up = { ...p, activeNodeId: nextNode.id };
            saveProgress(up);
            return up;
          });
        }
      }

      // Reset to Step 0 (Warmup) for next session
      setActiveStep(0);
      setTimeLeft(60);
      setActiveChordIndex(0);
    },
    [activeNode.id, progress]
  );

  const currentChord: ChordShape =
    displayNode.chords[activeChordIndex % displayNode.chords.length] || displayNode.chords[0];

  const timerRadius = 42;
  const timerCircumference = 2 * Math.PI * timerRadius;
  const timerStrokeDashoffset = timerCircumference - (timeLeft / 60) * timerCircumference;

  return (
    <div
      className={`relative w-full h-[100dvh] max-h-[100dvh] flex flex-col justify-between items-center p-4 bg-[var(--app-bg,#000)] text-[var(--app-fg,#fff)] select-none transition-colors duration-150 ${
        isPulseActive ? 'beat-pulse-active' : ''
      }`}
    >
      {/* 1. TOP HEADER */}
      <header className="w-full max-w-sm flex items-center justify-between pt-2 px-1">
        {/* Left: 4-square Grid Button (Path view) */}
        <button
          onClick={() => setIsPathOpen(true)}
          aria-label="Path Map"
          className="w-10 h-10 border-2 border-current flex items-center justify-center p-2 brutal-shadow brutal-btn-active bg-[var(--app-bg,#000)]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
        </button>

        {/* Center: Node Number & Chord Selectors */}
        <div className="flex flex-col items-center">
          {/* Node Number */}
          <span className="font-mono text-xs tracking-widest font-black opacity-80">
            {displayNode.id}
          </span>

          {/* Anchor Indicator symbol (⊥) */}
          <span className="font-mono text-[10px] leading-tight font-black">⊥</span>

          {/* Chord Toggle Buttons */}
          <div className="flex items-center gap-1.5 mt-0.5">
            {displayNode.chords.map((chord, idx) => {
              const isActive = activeChordIndex === idx;
              return (
                <button
                  key={`${chord.name}-${idx}`}
                  onClick={() => setActiveChordIndex(idx)}
                  className={`min-w-9 h-9 px-2 border-2 border-current font-mono text-sm font-black transition-all brutal-shadow-sm brutal-btn-active flex items-center justify-center ${
                    isActive
                      ? 'bg-current text-[var(--app-bg,#000)]'
                      : 'bg-[var(--app-bg,#000)] text-current'
                  }`}
                >
                  {chord.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Invert Toggle (◐) */}
        <button
          onClick={toggleTheme}
          aria-label="Invert Theme"
          className="w-10 h-10 border-2 border-current flex items-center justify-center brutal-shadow brutal-btn-active bg-[var(--app-bg,#000)]"
        >
          <svg width="22" height="22" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="8" />
            <path d="M50,6 A44,44 0 0,1 50,94 Z" fill="currentColor" />
          </svg>
        </button>
      </header>

      {/* 2. CENTER: SVG FRETBOARD & RHYTHM VISUALIZER */}
      <main className="w-full max-w-sm flex-1 flex flex-col items-center justify-center py-1">
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

        {/* Rhythm & Strumming Visualizer */}
        <RhythmVisualizer
          pattern={displayNode.strumPattern}
          activeBeatIndex={currentBeat}
          isPlaying={isPlaying}
        />
      </main>

      {/* 3. BOTTOM CONTROLS */}
      <footer className="w-full max-w-sm flex flex-col items-center gap-4 pb-4">
        {/* BPM Stepper */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              const next = Math.max(30, bpm - 5);
              setBpm(next);
              metronome.setBpm(next);
            }}
            className="w-11 h-11 border-2 border-current flex items-center justify-center font-mono text-2xl font-black brutal-shadow brutal-btn-active bg-[var(--app-bg,#000)]"
          >
            -
          </button>

          <span className="font-mono text-2xl font-black tracking-wider w-16 text-center">
            {bpm}
          </span>

          <button
            onClick={() => {
              const next = Math.min(240, bpm + 5);
              setBpm(next);
              metronome.setBpm(next);
            }}
            className="w-11 h-11 border-2 border-current flex items-center justify-center font-mono text-2xl font-black brutal-shadow brutal-btn-active bg-[var(--app-bg,#000)]"
          >
            +
          </button>
        </div>

        {/* Play / 60-Second Radial Countdown Button */}
        <div className="relative flex items-center justify-center">
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Start'}
            className="relative w-24 h-24 rounded-full border-4 border-current flex items-center justify-center brutal-shadow-lg brutal-btn-active bg-[var(--app-bg,#000)]"
          >
            {/* SVG Countdown Ring */}
            {isPlaying && (
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                <circle
                  cx="48"
                  cy="48"
                  r={timerRadius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeDasharray={timerCircumference}
                  strokeDashoffset={timerStrokeDashoffset}
                  className="transition-all duration-300"
                />
              </svg>
            )}

            {isPlaying ? (
              <span className="font-mono text-xl font-black">{timeLeft}s</span>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6,3 20,12 6,21" />
              </svg>
            )}
          </button>
        </div>

        {/* 3 Step Indicator Dots: Step 1 (Warmup), Step 2 (Core Drill), Step 3 (Gate) */}
        <div className="flex items-center gap-3 mt-1">
          <span
            className={`w-3 h-3 rounded-full border-2 border-current transition-all ${
              activeStep === 0 ? 'bg-current' : 'bg-transparent'
            }`}
          />
          <span
            className={`w-3 h-3 rounded-full border-2 border-current transition-all ${
              activeStep === 1 ? 'bg-current' : 'bg-transparent'
            }`}
          />
          <span
            className={`w-3 h-3 rounded-full border-2 border-current transition-all ${
              activeStep === 2 ? 'bg-current' : 'bg-transparent'
            }`}
          />
        </div>

        {/* Tiny 32px Silent Bonsai Emblem */}
        <div
          onClick={() => setIsPathOpen(true)}
          className="cursor-pointer opacity-70 hover:opacity-100 transition-opacity pt-1"
          title="Silent Bonsai"
        >
          <Bonsai
            completedSessions={progress.completedSessions}
            lastCompletedTimestamp={progress.lastCompletedTimestamp}
            size={32}
            showPot={false}
          />
        </div>
      </footer>

      {/* 4. PATH OVERLAY MODAL (50 Nodes + Silent Bonsai) */}
      <PathModal
        isOpen={isPathOpen}
        onClose={() => setIsPathOpen(false)}
        progress={progress}
        onSelectNode={(nodeId) => {
          setProgress((prev) => {
            const next = { ...prev, activeNodeId: nodeId };
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
