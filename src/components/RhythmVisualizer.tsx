import React from 'react';
import { StrumBeat } from '../curriculum';

interface RhythmVisualizerProps {
  pattern?: StrumBeat[];
  activeBeatIndex: number; // 0-based
  isPlaying: boolean;
}

export const RhythmVisualizer: React.FC<RhythmVisualizerProps> = ({
  pattern = ['D', '-', 'D', '-'],
  activeBeatIndex,
  isPlaying,
}) => {
  return (
    <div className="w-full flex items-center justify-center gap-2 py-2 select-none">
      {pattern.map((beat, idx) => {
        const isActive = isPlaying && activeBeatIndex === idx;

        return (
          <div
            key={idx}
            className={`w-9 h-9 flex items-center justify-center border-2 border-current font-mono text-base font-bold transition-all duration-75 ${
              isActive
                ? 'bg-current text-[var(--app-bg,#000)] scale-110 shadow-[2px_2px_0px_0px_currentColor]'
                : 'bg-transparent text-current shadow-[2px_2px_0px_0px_currentColor]'
            }`}
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
            {beat === '-' && <span>·</span>}
          </div>
        );
      })}
    </div>
  );
};
