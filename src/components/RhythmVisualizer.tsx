import React from 'react';
import { StrumBeat } from '../curriculum';

interface RhythmVisualizerProps {
  pattern?: StrumBeat[];
  activeBeatIndex: number;
  isPlaying: boolean;
  mode?: 'strum' | 'pluck';
}

export const RhythmVisualizer: React.FC<RhythmVisualizerProps> = ({
  pattern = ['D', '-', 'D', '-'],
  activeBeatIndex,
  isPlaying,
  mode = 'strum',
}) => {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 0',
        userSelect: 'none',
      }}
    >
      {/* Mode Tag */}
      <div
        style={{
          fontFamily: 'monospace',
          fontSize: '11px',
          fontWeight: 800,
          letterSpacing: '0.12em',
          opacity: 0.75,
          textTransform: 'uppercase',
        }}
      >
        {mode === 'pluck' ? 'PLUCK ⦿' : 'STRUM ↓'}
      </div>

      {/* Rhythm Arrows Row */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        {pattern.map((beat, idx) => {
          const isActive = isPlaying && activeBeatIndex === idx;

          return (
            <div
              key={idx}
              className={`rhythm-arrow-box ${isActive ? 'active' : ''}`}
              style={{
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid currentColor',
                backgroundColor: isActive ? 'currentColor' : 'transparent',
                color: isActive ? 'var(--app-bg, #000)' : 'currentColor',
                boxShadow: isActive ? '3px 3px 0px 0px currentColor' : '2px 2px 0px 0px currentColor',
                transform: isActive ? 'scale(1.12)' : 'scale(1)',
                fontFamily: 'monospace',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'transform 0.06s ease, background-color 0.06s ease',
              }}
            >
              {beat === 'D' && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21l-8-9h5V3h6v9h5z" />
                </svg>
              )}
              {beat === 'U' && (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinejoin="miter"
                >
                  <path d="M12 3l8 9h-5v9h-6v-9H4z" />
                </svg>
              )}
              {beat === 'G' && (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="2,2"
                >
                  <path d="M12 21l-8-9h5V3h6v9h5z" />
                </svg>
              )}
              {beat === '-' && <span style={{ fontSize: '20px', lineHeight: 1 }}>·</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};
