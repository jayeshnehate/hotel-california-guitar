import React from 'react';
import { ChordShape, ArpeggioStep } from '../curriculum';

interface FretboardProps {
  chord: ChordShape;
  anchorFinger?: number;
  anchorString?: number;
  anchorFret?: number;
  activeArpeggioStep?: ArpeggioStep | null;
  mode?: 'vertical' | 'horizontal';
  hasShadow?: boolean;
}

const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'E'];

export const Fretboard: React.FC<FretboardProps> = ({
  chord,
  anchorFinger,
  anchorString,
  anchorFret,
  activeArpeggioStep,
  mode = 'vertical',
  hasShadow = true,
}) => {
  const baseFret = chord.baseFret || 1;
  const numFrets = 5;

  // Vertical layout dimensions
  const width = 280;
  const height = 340;
  const startX = 40;
  const endX = 240;
  const stringSpacing = (endX - startX) / 5; // 40px between strings
  const startY = 70;
  const endY = 320;
  const fretSpacing = (endY - startY) / numFrets; // 50px between frets

  // Low E is index 0 (left), High e is index 5 (right)
  const getStringX = (index: number) => startX + index * stringSpacing;
  const getFretY = (fretIndex: number) => startY + fretIndex * fretSpacing;
  const getNoteY = (fret: number) => {
    const relFret = fret - baseFret + 1;
    return startY + (relFret - 0.5) * fretSpacing;
  };

  // String thicknesses (low E thickest to high E thinnest)
  const stringThicknesses = [3.8, 3.2, 2.6, 2.0, 1.5, 1.2];

  if (mode === 'horizontal' && activeArpeggioStep) {
    // Horizontal arpeggio view for Phase V string-skipping
    const hWidth = 320;
    const hHeight = 220;
    const hStartX = 50;
    const hEndX = 300;
    const hStartY = 35;
    const hEndY = 185;
    const hStringSpacing = (hEndY - hStartY) / 5;

    return (
      <div
        className="w-full flex justify-center items-center py-2 transition-all duration-150"
        style={{
          filter: hasShadow ? 'drop-shadow(3px 3px 0px currentColor)' : undefined,
        }}
      >
        <svg
          width={hWidth}
          height={hHeight}
          viewBox={`0 0 ${hWidth} ${hHeight}`}
          className="select-none overflow-visible"
        >
          {/* Fret vertical bars */}
          {[1, 2, 3, 4, 5].map((fret) => {
            const fx = hStartX + (fret - 1) * 50;
            return (
              <g key={`hf-${fret}`}>
                <line
                  x1={fx}
                  y1={hStartY}
                  x2={fx}
                  y2={hEndY}
                  stroke="currentColor"
                  strokeWidth={fret === 1 ? 4 : 1.2}
                />
                <text
                  x={fx + 25}
                  y={hStartY - 10}
                  fill="currentColor"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {baseFret + fret - 1}
                </text>
              </g>
            );
          })}
          {/* Last fret line */}
          <line
            x1={hStartX + 5 * 50}
            y1={hStartY}
            x2={hStartX + 5 * 50}
            y2={hEndY}
            stroke="currentColor"
            strokeWidth="1.2"
          />

          {/* 6 horizontal strings */}
          {STRING_NAMES.map((name, i) => {
            const sy = hStartY + (5 - i) * hStringSpacing; // low E at bottom, high e at top
            const isTargetString = activeArpeggioStep.stringIndex === i;
            return (
              <g key={`hstr-${i}`}>
                <text
                  x={hStartX - 16}
                  y={sy + 4}
                  fill="currentColor"
                  fontSize="12"
                  fontWeight="bold"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {name}
                </text>
                <line
                  x1={hStartX}
                  y1={sy}
                  x2={hEndX}
                  y2={sy}
                  stroke="currentColor"
                  strokeWidth={stringThicknesses[i]}
                  strokeDasharray={isTargetString ? undefined : undefined}
                  opacity={isTargetString ? 1 : 0.4}
                />
              </g>
            );
          })}

          {/* Active plucked note */}
          {(() => {
            const stringIdx = activeArpeggioStep.stringIndex;
            const fret = activeArpeggioStep.fret;
            const sy = hStartY + (5 - stringIdx) * hStringSpacing;
            if (fret === 0) {
              // Open string pluck
              return (
                <circle
                  cx={hStartX - 32}
                  cy={sy}
                  r="7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />
              );
            }
            const relFret = fret - baseFret + 1;
            const fx = hStartX + (relFret - 0.5) * 50;
            return (
              <g>
                <circle cx={fx} cy={sy} r="15" fill="currentColor" />
                <circle cx={fx} cy={sy} r="18" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <text
                  x={fx}
                  y={sy + 5}
                  fill="var(--app-bg, #000)"
                  fontSize="12"
                  fontWeight="bold"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {activeArpeggioStep.finger || fret}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>
    );
  }

  return (
    <div
      className="w-full flex justify-center items-center py-1 transition-all duration-150"
      style={{
        filter: hasShadow ? 'drop-shadow(3px 3px 0px currentColor)' : undefined,
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="select-none overflow-visible"
      >
        {/* String names above nut: E A D G B E */}
        {STRING_NAMES.map((name, i) => (
          <text
            key={`str-name-${i}`}
            x={getStringX(i)}
            y={24}
            fill="currentColor"
            fontSize="14"
            fontWeight="900"
            fontFamily="monospace"
            textAnchor="middle"
          >
            {name}
          </text>
        ))}

        {/* Open (O) / Muted (X) indicators above the nut line */}
        {chord.strings.map((strVal, i) => {
          const x = getStringX(i);
          const y = 48;
          if (strVal === -1) {
            // Muted X
            return (
              <g key={`mute-${i}`} stroke="currentColor" strokeWidth="2.4" strokeLinecap="square">
                <line x1={x - 6} y1={y - 6} x2={x + 6} y2={y + 6} />
                <line x1={x + 6} y1={y - 6} x2={x - 6} y2={y + 6} />
              </g>
            );
          }
          if (strVal === 0) {
            // Open string O
            return (
              <circle
                key={`open-${i}`}
                cx={x}
                cy={y}
                r="6.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              />
            );
          }
          return null;
        })}

        {/* Nut Line (heavy top bar) if baseFret === 1, or standard fret line with position tag */}
        {baseFret === 1 ? (
          <line
            x1={startX - 1}
            y1={startY}
            x2={endX + 1}
            y2={startY}
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="square"
          />
        ) : (
          <g>
            <line
              x1={startX}
              y1={startY}
              x2={endX}
              y2={startY}
              stroke="currentColor"
              strokeWidth="2.5"
            />
            {/* Position indicator, e.g. 2fr */}
            <text
              x={startX - 18}
              y={startY + fretSpacing / 2 + 5}
              fill="currentColor"
              fontSize="12"
              fontWeight="bold"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {baseFret}fr
            </text>
          </g>
        )}

        {/* Horizontal Fret Lines */}
        {Array.from({ length: numFrets }).map((_, i) => (
          <line
            key={`fret-${i + 1}`}
            x1={startX}
            y1={getFretY(i + 1)}
            x2={endX}
            y2={getFretY(i + 1)}
            stroke="currentColor"
            strokeWidth="1.5"
          />
        ))}

        {/* Vertical String Lines */}
        {Array.from({ length: 6 }).map((_, i) => (
          <line
            key={`string-${i}`}
            x1={getStringX(i)}
            y1={startY}
            x2={getStringX(i)}
            y2={endY}
            stroke="currentColor"
            strokeWidth={stringThicknesses[i]}
          />
        ))}

        {/* Barre Chord Pill */}
        {chord.barre && (
          <g>
            {(() => {
              const b = chord.barre;
              const x1 = getStringX(b.fromString);
              const x2 = getStringX(b.toString);
              const y = getNoteY(b.fret);
              const pillWidth = Math.abs(x2 - x1) + 24;
              const pillX = Math.min(x1, x2) - 12;

              return (
                <g>
                  <rect
                    x={pillX}
                    y={y - 12}
                    width={pillWidth}
                    height="24"
                    rx="12"
                    ry="12"
                    fill="currentColor"
                  />
                  <text
                    x={(x1 + x2) / 2}
                    y={y + 5}
                    fill="var(--app-bg, #000)"
                    fontSize="13"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {b.finger}
                  </text>
                </g>
              );
            })()}
          </g>
        )}

        {/* Finger Dots */}
        {chord.strings.map((fret, stringIdx) => {
          if (fret <= 0) return null; // open or muted

          // If covered by barre chord, don't double render if it's the barre finger
          if (
            chord.barre &&
            fret === chord.barre.fret &&
            stringIdx >= chord.barre.fromString &&
            stringIdx <= chord.barre.toString &&
            chord.fingers[stringIdx] === chord.barre.finger
          ) {
            return null;
          }

          const x = getStringX(stringIdx);
          const y = getNoteY(fret);
          const finger = chord.fingers[stringIdx];

          // Check if this note is an anchor finger
          const isAnchor =
            (anchorFinger && finger === anchorFinger) ||
            (anchorString !== undefined &&
              anchorString === stringIdx &&
              (anchorFret === undefined || anchorFret === fret));

          return (
            <g key={`note-${stringIdx}-${fret}`}>
              {/* Double ring for anchor finger (◎) */}
              {isAnchor && (
                <circle
                  cx={x}
                  cy={y}
                  r="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                />
              )}
              {/* Solid finger dot */}
              <circle cx={x} cy={y} r="13" fill="currentColor" />
              {/* Inverted finger number inside dot */}
              {finger !== null && (
                <text
                  x={x}
                  y={y + 4.5}
                  fill="var(--app-bg, #000)"
                  fontSize="13"
                  fontWeight="900"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {finger}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
