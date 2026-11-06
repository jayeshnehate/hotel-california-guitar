import React from 'react';
import { ChordShape, ArpeggioStep } from '../curriculum';

interface FretboardProps {
  chord: ChordShape;
  anchorFinger?: number;
  anchorString?: number;
  anchorFret?: number;
  activeArpeggioStep?: ArpeggioStep | null;
  mode?: 'vertical' | 'horizontal';
}

const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'E'];

export const Fretboard: React.FC<FretboardProps> = ({
  chord,
  anchorFinger,
  anchorString,
  anchorFret,
  activeArpeggioStep,
  mode = 'vertical',
}) => {
  const baseFret = chord.baseFret || 1;
  const numFrets = 5;

  const width = 290;
  const height = 345;
  const startX = 35;
  const endX = 255;
  const stringSpacing = (endX - startX) / 5; // 44px
  const startY = 82;
  const endY = 338;
  const fretSpacing = (endY - startY) / numFrets; // 51.2px

  const getStringX = (index: number) => startX + index * stringSpacing;
  const getFretY = (fretIndex: number) => startY + fretIndex * fretSpacing;
  const getNoteY = (fret: number) => {
    const relFret = fret - baseFret + 1;
    return startY + (relFret - 0.5) * fretSpacing;
  };

  const stringThicknesses = [3.8, 3.2, 2.6, 2.0, 1.5, 1.1];

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
          width: '100%',
        }}
      >
        <svg
          viewBox={`0 0 ${hWidth} ${hHeight}`}
          style={{
            width: '100%',
            maxWidth: '320px',
            maxHeight: '40dvh',
            overflow: 'visible',
            userSelect: 'none',
          }}
          shapeRendering="geometricPrecision"
          textRendering="geometricPrecision"
        >
          {/* Fretboard background */}
          <rect
            x={hStartX}
            y={hStartY}
            width={hEndX - hStartX}
            height={hEndY - hStartY}
            fill="var(--card-subtle)"
            opacity="0.4"
          />

          {[1, 2, 3, 4, 5].map((fret) => {
            const fx = hStartX + (fret - 1) * 50;
            return (
              <g key={`hf-${fret}`}>
                <line
                  x1={fx}
                  y1={hStartY}
                  x2={fx}
                  y2={hEndY}
                  stroke="var(--border-subtle)"
                  strokeWidth={fret === 1 ? 4 : 1.5}
                />
                <text
                  x={fx + 25}
                  y={hStartY - 10}
                  fill="var(--text-sub)"
                  fontSize="12"
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
            stroke="var(--border-subtle)"
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
                  fill={isTarget ? 'var(--text-main)' : 'var(--text-dim)'}
                  fontSize="13"
                  fontWeight={isTarget ? 900 : 600}
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
                  stroke={isTarget ? 'var(--text-main)' : 'var(--border-subtle)'}
                  strokeWidth={stringThicknesses[i]}
                  opacity={isTarget ? 1 : 0.4}
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
                  r="8"
                  fill="none"
                  stroke="var(--text-main)"
                  strokeWidth="2.5"
                />
              );
            }
            const relFret = fret - baseFret + 1;
            const fx = hStartX + (relFret - 0.5) * 50;
            return (
              <g>
                <circle cx={fx} cy={sy} r="15" fill="var(--text-main)" />
                <circle cx={fx} cy={sy} r="19" fill="none" stroke="var(--text-main)" strokeWidth="2" />
                <text
                  x={fx}
                  y={sy}
                  dominantBaseline="central"
                  fill="var(--app-bg)"
                  fontSize="14"
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
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{
          width: '100%',
          maxWidth: '290px',
          maxHeight: '43dvh',
          overflow: 'visible',
          userSelect: 'none',
        }}
        shapeRendering="geometricPrecision"
        textRendering="geometricPrecision"
      >
        {/* ROW 1: String names E A D G B E */}
        {STRING_NAMES.map((name, i) => {
          const isAnchorStr = anchorString === i;
          const isMuted = chord.strings[i] === -1;
          const x = getStringX(i);

          return (
            <g key={`str-name-${i}`}>
              {isAnchorStr ? (
                <g>
                  <rect
                    x={x - 12}
                    y="3"
                    width="24"
                    height="20"
                    fill="var(--pill-active-bg)"
                    rx="3"
                  />
                  <text
                    x={x}
                    y="13"
                    dominantBaseline="central"
                    fill="var(--pill-active-text)"
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
                  fill={isMuted ? 'var(--text-dim)' : 'var(--text-main)'}
                  fontSize="14"
                  fontWeight={isMuted ? 600 : 900}
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {name}
                </text>
              )}
            </g>
          );
        })}

        {/* ROW 2: Open (O) / Muted (✕) indicators */}
        {chord.strings.map((strVal, i) => {
          const x = getStringX(i);
          const y = 38;

          if (strVal === -1) {
            // Muted string (✕) in dimmed gray box
            return (
              <g key={`mute-${i}`}>
                <rect
                  x={x - 9}
                  y={y - 9}
                  width="18"
                  height="18"
                  fill="var(--card-subtle)"
                  stroke="var(--border-subtle)"
                  strokeWidth="1.2"
                  rx="3"
                />
                <line x1={x - 4} y1={y - 4} x2={x + 4} y2={y + 4} stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" />
                <line x1={x + 4} y1={y - 4} x2={x - 4} y2={y + 4} stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" />
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
                r="7.5"
                fill="none"
                stroke="var(--text-main)"
                strokeWidth="2.2"
              />
            );
          }
          return null;
        })}

        {/* ROW 3: BOLD STRUM GUIDE BRACKET SPANNING ONLY PLAYABLE STRINGS */}
        {playableStrings.length > 0 && (
          <g>
            {/* Horizontal span bracket */}
            <path
              d={`M ${getStringX(firstPlayableString)} 66 L ${getStringX(firstPlayableString)} 72 L ${getStringX(lastPlayableString)} 72 L ${getStringX(lastPlayableString)} 66`}
              fill="none"
              stroke="var(--text-main)"
              strokeWidth="2.2"
            />
            {/* Strum instruction text and arrow */}
            {(() => {
              const midX = (getStringX(firstPlayableString) + getStringX(lastPlayableString)) / 2;
              return (
                <g>
                  <text
                    x={midX}
                    y="50"
                    dominantBaseline="central"
                    fill="var(--text-sub)"
                    fontSize="9.5"
                    fontWeight="900"
                    fontFamily="monospace"
                    letterSpacing="0.06em"
                    textAnchor="middle"
                  >
                    STRUM {playableStrings.length === 6 ? 'ALL 6 STRINGS' : `${playableStrings.length} STRINGS`}
                  </text>
                  <line x1={midX} y1="56" x2={midX} y2="70" stroke="var(--text-main)" strokeWidth="2.2" />
                  <polygon
                    points={`${midX - 5},64 ${midX},72 ${midX + 5},64`}
                    fill="var(--text-main)"
                  />
                </g>
              );
            })()}
          </g>
        )}

        {/* Fretboard subtle wood/graphite tone background */}
        <rect
          x={startX}
          y={startY}
          width={endX - startX}
          height={endY - startY}
          fill="var(--card-subtle)"
          opacity="0.35"
          rx="2"
        />

        {/* Fret Inlay Marker (Pearl Dot on Fret 3 / 5) */}
        {baseFret <= 3 && baseFret + 4 >= 3 && (
          <circle
            cx={(startX + endX) / 2}
            cy={getNoteY(3)}
            r="4.5"
            fill="var(--border-subtle)"
            opacity="0.6"
          />
        )}
        {baseFret <= 5 && baseFret + 4 >= 5 && (
          <circle
            cx={(startX + endX) / 2}
            cy={getNoteY(5)}
            r="4.5"
            fill="var(--border-subtle)"
            opacity="0.6"
          />
        )}

        {/* Left Side Fret Numbers */}
        {Array.from({ length: numFrets }).map((_, idx) => {
          const fretNum = baseFret + idx;
          return (
            <text
              key={`fret-num-${idx}`}
              x={startX - 14}
              y={getNoteY(fretNum)}
              dominantBaseline="central"
              fill="var(--text-dim)"
              fontSize="11"
              fontWeight="800"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {fretNum}
            </text>
          );
        })}

        {/* Heavy Nut Line if baseFret === 1, or fret wire with position tag */}
        {baseFret === 1 ? (
          <line
            x1={startX - 1}
            y1={startY}
            x2={endX + 1}
            y2={startY}
            stroke="var(--text-main)"
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
              stroke="var(--border-subtle)"
              strokeWidth="2.5"
            />
            <text
              x={startX - 18}
              y={startY + fretSpacing / 2}
              dominantBaseline="central"
              fill="var(--text-main)"
              fontSize="14"
              fontWeight="900"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {baseFret}fr
            </text>
          </g>
        )}

        {/* 5 Horizontal Fret Wires in Nickel Gray */}
        {Array.from({ length: numFrets }).map((_, i) => (
          <line
            key={`fret-${i + 1}`}
            x1={startX}
            y1={getFretY(i + 1)}
            x2={endX}
            y2={getFretY(i + 1)}
            stroke="var(--border-subtle)"
            strokeWidth="1.5"
          />
        ))}

        {/* 6 Vertical Strings: Active strings high contrast, Muted strings dimmed */}
        {Array.from({ length: 6 }).map((_, i) => {
          const isMuted = chord.strings[i] === -1;
          return (
            <line
              key={`string-${i}`}
              x1={getStringX(i)}
              y1={startY}
              x2={getStringX(i)}
              y2={endY}
              stroke={isMuted ? 'var(--border-subtle)' : 'var(--text-main)'}
              strokeWidth={stringThicknesses[i]}
              strokeDasharray={isMuted ? '3,3' : undefined}
              opacity={isMuted ? 0.4 : 1}
            />
          );
        })}

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
                    fill="var(--text-main)"
                    stroke="var(--card-bg)"
                    strokeWidth="1.5"
                  />
                  <text
                    x={(x1 + x2) / 2}
                    y={y}
                    dominantBaseline="central"
                    fill="var(--app-bg)"
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
            anchorString !== undefined
              ? stringIdx === anchorString && (anchorFret === undefined || anchorFret === fret)
              : anchorFinger !== undefined && finger === anchorFinger;

          return (
            <g key={`note-${stringIdx}-${fret}`}>
              {/* Double ring for anchor finger (◎) */}
              {isAnchor && (
                <circle
                  cx={x}
                  cy={y}
                  r="19"
                  fill="none"
                  stroke="var(--text-main)"
                  strokeWidth="2.2"
                />
              )}
              {/* Solid finger dot */}
              <circle
                cx={x}
                cy={y}
                r="14"
                fill="var(--text-main)"
                stroke="var(--card-bg)"
                strokeWidth="1.5"
              />
              {/* High-legibility inverted finger number */}
              {finger !== null && (
                <text
                  x={x}
                  y={y}
                  dominantBaseline="central"
                  fill="var(--app-bg)"
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
