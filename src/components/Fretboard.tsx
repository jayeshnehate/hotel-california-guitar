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

  // Geometry: 290px wide gives 44px between strings so finger dots & anchor rings breathe
  const width = 290;
  const height = 350;
  const startX = 35;
  const endX = 255;
  const stringSpacing = (endX - startX) / 5; // exactly 44px
  const startY = 78;
  const endY = 338;
  const fretSpacing = (endY - startY) / numFrets; // 52px per fret

  const getStringX = (index: number) => startX + index * stringSpacing;
  const getFretY = (fretIndex: number) => startY + fretIndex * fretSpacing;
  const getNoteY = (fret: number) => {
    const relFret = fret - baseFret + 1;
    return startY + (relFret - 0.5) * fretSpacing;
  };

  // High contrast string thicknesses: low E thickest to high e thinnest
  const stringThicknesses = [3.8, 3.2, 2.6, 2.0, 1.5, 1.1];

  // Calculate playable strum range (from lowest non-muted string to highest non-muted string)
  const playableStrings = chord.strings
    .map((val, idx) => (val !== -1 ? idx : -1))
    .filter((idx) => idx !== -1);
  const firstPlayableString = playableStrings.length > 0 ? Math.min(...playableStrings) : 0;
  const lastPlayableString = playableStrings.length > 0 ? Math.max(...playableStrings) : 5;

  if (mode === 'horizontal' && activeArpeggioStep) {
    const hWidth = 320;
    const hHeight = 220;
    const hStartX = 50;
    const hEndX = 300;
    const hStartY = 35;
    const hEndY = 185;
    const hStringSpacing = (hEndY - hStartY) / 5;

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          filter: hasShadow ? 'drop-shadow(3px 3px 0px currentColor)' : undefined,
          willChange: 'filter',
        }}
      >
        <svg
          width={hWidth}
          height={hHeight}
          viewBox={`0 0 ${hWidth} ${hHeight}`}
          shapeRendering="geometricPrecision"
          textRendering="geometricPrecision"
          style={{ overflow: 'visible', userSelect: 'none' }}
        >
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
                  strokeWidth={fret === 1 ? 4 : 1.5}
                />
                <text
                  x={fx + 25}
                  y={hStartY - 10}
                  fill="currentColor"
                  fontSize="13"
                  fontWeight="bold"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {baseFret + fret - 1}
                </text>
              </g>
            );
          })}
          <line
            x1={hStartX + 5 * 50}
            y1={hStartY}
            x2={hStartX + 5 * 50}
            y2={hEndY}
            stroke="currentColor"
            strokeWidth="1.5"
          />

          {STRING_NAMES.map((name, i) => {
            const sy = hStartY + (5 - i) * hStringSpacing;
            const isTarget = activeArpeggioStep.stringIndex === i;
            return (
              <g key={`hstr-${i}`}>
                <text
                  x={hStartX - 16}
                  y={sy + 4}
                  fill="currentColor"
                  fontSize="13"
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
                  opacity={isTarget ? 1 : 0.45}
                />
              </g>
            );
          })}

          {(() => {
            const stringIdx = activeArpeggioStep.stringIndex;
            const fret = activeArpeggioStep.fret;
            const sy = hStartY + (5 - stringIdx) * hStringSpacing;
            if (fret === 0) {
              return (
                <circle
                  cx={hStartX - 32}
                  cy={sy}
                  r="7.5"
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
                <circle cx={fx} cy={sy} r="14.5" fill="currentColor" />
                <circle cx={fx} cy={sy} r="18.5" fill="none" stroke="currentColor" strokeWidth="2" />
                <text
                  x={fx}
                  y={sy}
                  dominantBaseline="central"
                  fill="var(--app-bg, #000)"
                  fontSize="13"
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
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        filter: hasShadow ? 'drop-shadow(3px 3px 0px currentColor)' : undefined,
        willChange: 'filter',
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        shapeRendering="geometricPrecision"
        textRendering="geometricPrecision"
        style={{ overflow: 'visible', userSelect: 'none' }}
      >
        {/* String names above nut: E A D G B E */}
        {STRING_NAMES.map((name, i) => {
          const isAnchorStr = anchorString === i;
          const x = getStringX(i);
          return (
            <g key={`str-name-${i}`}>
              {isAnchorStr ? (
                <g>
                  <rect
                    x={x - 11}
                    y="2"
                    width="22"
                    height="20"
                    fill="currentColor"
                    rx="2"
                  />
                  <text
                    x={x}
                    y="13"
                    dominantBaseline="central"
                    fill="var(--app-bg, #000)"
                    fontSize="13"
                    fontWeight="900"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {name}
                  </text>
                </g>
              ) : (
                <text
                  x={x}
                  y="13"
                  dominantBaseline="central"
                  fill="currentColor"
                  fontSize="14"
                  fontWeight="900"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {name}
                </text>
              )}
            </g>
          );
        })}

        {/* Open (O) / Muted (X) indicators */}
        {chord.strings.map((strVal, i) => {
          const x = getStringX(i);
          const y = 38;
          if (strVal === -1) {
            // Muted string (✕)
            return (
              <g key={`mute-${i}`} stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                <line x1={x - 6.5} y1={y - 6.5} x2={x + 6.5} y2={y + 6.5} />
                <line x1={x + 6.5} y1={y - 6.5} x2={x - 6.5} y2={y + 6.5} />
              </g>
            );
          }
          if (strVal === 0) {
            // Open string (O)
            return (
              <circle
                key={`open-${i}`}
                cx={x}
                cy={y}
                r="7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
              />
            );
          }
          return null;
        })}

        {/* VISUAL STRUM SPAN BRACKET: Shows exactly which strings to strum */}
        {playableStrings.length > 0 && (
          <g>
            {/* Horizontal bracket spanning from first to last playable string */}
            <path
              d={`M ${getStringX(firstPlayableString)} 64 L ${getStringX(firstPlayableString)} 68 L ${getStringX(lastPlayableString)} 68 L ${getStringX(lastPlayableString)} 64`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            {/* Small downward strum arrow at the center of the strum bracket */}
            <path
              d={`M ${(getStringX(firstPlayableString) + getStringX(lastPlayableString)) / 2 - 4} 60 L ${(getStringX(firstPlayableString) + getStringX(lastPlayableString)) / 2} 66 L ${(getStringX(firstPlayableString) + getStringX(lastPlayableString)) / 2 + 4} 60`}
              fill="currentColor"
            />
          </g>
        )}

        {/* Nut Line (heavy top bar) if baseFret === 1, or fret line with position tag */}
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
              y={startY + fretSpacing / 2}
              dominantBaseline="central"
              fill="currentColor"
              fontSize="13"
              fontWeight="900"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {baseFret}fr
            </text>
          </g>
        )}

        {/* 5 Horizontal Fret Lines */}
        {Array.from({ length: numFrets }).map((_, i) => (
          <line
            key={`fret-${i + 1}`}
            x1={startX}
            y1={getFretY(i + 1)}
            x2={endX}
            y2={getFretY(i + 1)}
            stroke="currentColor"
            strokeWidth="1.6"
          />
        ))}

        {/* 6 Vertical String Lines */}
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

        {/* Barre Chord Continuous Pill */}
        {chord.barre && (
          <g>
            {(() => {
              const b = chord.barre;
              const x1 = getStringX(b.fromString);
              const x2 = getStringX(b.toString);
              const y = getNoteY(b.fret);
              const pillWidth = Math.abs(x2 - x1) + 26;
              const pillX = Math.min(x1, x2) - 13;

              return (
                <g>
                  <rect
                    x={pillX}
                    y={y - 13}
                    width={pillWidth}
                    height="26"
                    rx="13"
                    ry="13"
                    fill="currentColor"
                  />
                  <text
                    x={(x1 + x2) / 2}
                    y={y}
                    dominantBaseline="central"
                    fill="var(--app-bg, #000)"
                    fontSize="14"
                    fontWeight="900"
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
          if (fret <= 0) return null;

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
                  r="18.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                />
              )}
              {/* Solid finger dot */}
              <circle cx={x} cy={y} r="13.5" fill="currentColor" />
              {/* High-legibility inverted finger number */}
              {finger !== null && (
                <text
                  x={x}
                  y={y}
                  dominantBaseline="central"
                  fill="var(--app-bg, #000)"
                  fontSize="14"
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
