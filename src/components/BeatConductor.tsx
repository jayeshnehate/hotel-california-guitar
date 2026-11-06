import React from 'react';
import { ChordShape, StrumBeat } from '../curriculum';

interface BeatConductorProps {
  currentChord: ChordShape;
  nextChord?: ChordShape;
  currentBeat: number; // 0 to 3
  isPlaying: boolean;
  timeLeft: number;
  bpm: number;
  measureNumber?: number;
  strumPattern?: StrumBeat[];
  mode?: 'strum' | 'pluck';
  activeStringIndex?: number;
}

const STRING_NAMES = ['Low E', 'A', 'D', 'G', 'B', 'High e'];
const SHORT_STRINGS = ['E', 'A', 'D', 'G', 'B', 'e'];

export const BeatConductor: React.FC<BeatConductorProps> = ({
  currentChord,
  nextChord,
  currentBeat,
  isPlaying,
  timeLeft,
  bpm,
  measureNumber = 1,
  strumPattern = ['D', '-', 'D', '-'],
  mode = 'strum',
  activeStringIndex,
}) => {
  // Playable strings calculation
  const playableCount = currentChord.strings.filter((s) => s !== -1).length;
  const mutedIndices = currentChord.strings
    .map((s, idx) => (s === -1 ? idx : -1))
    .filter((idx) => idx !== -1);

  let strumInstructions = 'STRUM ALL 6 STRINGS';
  if (playableCount < 6) {
    if (mutedIndices.length === 1 && mutedIndices[0] === 0) {
      strumInstructions = 'STRUM 5 STRINGS (SKIP LOW E)';
    } else if (mutedIndices.length === 2 && mutedIndices[0] === 0 && mutedIndices[1] === 1) {
      strumInstructions = 'STRUM 4 STRINGS (D TO HIGH e)';
    } else {
      strumInstructions = `STRUM ${playableCount} STRINGS`;
    }
  }

  // Seconds per beat based on BPM
  const secPerBeat = 60 / bpm;

  // Beat action generator
  const getBeatAction = (beatIdx: number) => {
    const patternSymbol = strumPattern[beatIdx % strumPattern.length] || '-';

    if (mode === 'pluck') {
      const targetStr = activeStringIndex ?? 0;
      return {
        action: `PLUCK ${SHORT_STRINGS[targetStr]}`,
        icon: '⦿',
        detail: `Pluck string ${STRING_NAMES[targetStr]}`,
      };
    }

    if (patternSymbol === 'D') {
      return {
        action: 'STRUM',
        icon: '↓',
        detail: `Strum down (${playableCount} strings)`,
      };
    }
    if (patternSymbol === 'U') {
      return {
        action: 'UP',
        icon: '↑',
        detail: 'Strum up',
      };
    }
    if (patternSymbol === 'G') {
      return {
        action: 'GHOST',
        icon: '⤓',
        detail: 'Muted strum',
      };
    }

    // Rest/hold: on Beat 4, cue next chord transition
    if (beatIdx === 3 && nextChord && nextChord.name !== currentChord.name) {
      return {
        action: `SWITCH → ${nextChord.name}`,
        icon: '→',
        detail: `Switch hand to ${nextChord.name}`,
      };
    }
    return {
      action: 'HOLD',
      icon: '·',
      detail: 'Let chord ring out',
    };
  };

  const currentAction = getBeatAction(currentBeat);

  return (
    <div className="conductor-card">
      {/* ROW 1: ACTIVE CHORD + STRUM ADVICE + MEASURE/TIMER */}
      <div className="conductor-top-row">
        <div className="now-playing-badge">
          <div className="chord-hero-tag">{currentChord.name}</div>
          <div className="strum-action-pill">
            {mode === 'pluck' ? 'ARPEGGIO PLUCK' : strumInstructions}
          </div>
        </div>

        <div className="conductor-right-status">
          {isPlaying ? (
            <div className="measure-tag">
              M{measureNumber} · {timeLeft}s
            </div>
          ) : (
            nextChord && nextChord.name !== currentChord.name && (
              <div className="next-chord-preview">
                NEXT: <span style={{ fontWeight: 900 }}>{nextChord.name}</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* ROW 2: REAL-TIME INSTRUCTION BANNER */}
      <div className={`conductor-live-banner ${isPlaying ? 'active' : ''}`}>
        {isPlaying ? (
          <div className="live-banner-content">
            <span className="live-beat-badge">BEAT {currentBeat + 1}</span>
            <span className="live-action-text">{currentAction.detail}</span>
            {nextChord && nextChord.name !== currentChord.name && currentBeat === 3 && (
              <span className="switch-warning">→ [ {nextChord.name} ] NEXT</span>
            )}
          </div>
        ) : (
          <div className="live-banner-content idle">
            <span>READY · TAP ▶ START (60s DRILL)</span>
          </div>
        )}
      </div>

      {/* ROW 3: 4-BEAT CONDUCTOR TILES */}
      <div className="beats-strip">
        {[0, 1, 2, 3].map((bIdx) => {
          const isActive = isPlaying && currentBeat === bIdx;
          const { action, icon } = getBeatAction(bIdx);
          const beatTimeOffset = (bIdx * secPerBeat).toFixed(1);

          return (
            <div
              key={bIdx}
              className={`beat-tile ${isActive ? 'active' : ''}`}
            >
              <div className="beat-tile-header">
                <span className="beat-num">B{bIdx + 1}</span>
                <span className="beat-time">{beatTimeOffset}s</span>
              </div>
              <span className="beat-action">
                {icon} {action}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
