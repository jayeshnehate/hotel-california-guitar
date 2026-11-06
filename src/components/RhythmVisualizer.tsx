import React from 'react';
import { StrumBeat } from '../curriculum';

interface RhythmVisualizerProps {
  pattern?: StrumBeat[];
  activeBeatIndex: number;
  isPlaying: boolean;
}

export const RhythmVisualizer: React.FC<RhythmVisualizerProps> = ({
  pattern = ['D', '-', 'D', '-'],
  activeBeatIndex,
  isPlaying,
}) => {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '6px 0',
        userSelect: 'none',
      }}
    >
      {pattern.map((beat, idx) => {
        const isActive = isPlaying && activeBeatIndex === idx;

        return (
          <div
            key={idx}
            className={`rhythm-arrow-box ${isActive ? 'active' : ''}`}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid currentColor',
              backgroundColor: isActive ? 'currentColor' : 'transparent',
              color: isActive ? 'var(--app-bg, #000)' : 'currentColor',
              boxShadow: isActive ? '3px 3px 0px 0px currentColor' : '2px 2px 0px 0px currentColor',
              transform: isActive ? 'scale(1.1)' : 'scale(1)',
              fontFamily: 'monospace',
              fontSize: '15px',
              fontWeight: 'bold',
            }}
          >
            {beat === 'D' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21l-8-9h5V3h6v9h5z" />
              </svg>
            )}
            {beat === 'U' && (
              <svg
                width="16"
                height="16"
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
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="2,2"
              >
                <path d="M12 21l-8-9h5V3h6v9h5z" />
              </svg>
            )}
            {beat === '-' && <span>·</span>}
          </div>
        );
      })}
    </div>
  );
};
