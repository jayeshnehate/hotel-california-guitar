import React, { useMemo } from 'react';

interface BonsaiProps {
  completedSessions: number;
  lastCompletedTimestamp: number | null;
  size?: number; // default 120 (for path), or 32 (for drill emblem)
  showPot?: boolean;
}

interface Branch {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  depth: number;
  isLeaf: boolean;
}

export const Bonsai: React.FC<BonsaiProps> = ({
  completedSessions,
  lastCompletedTimestamp,
  size = 120,
  showPot = true,
}) => {
  // Check dormancy: > 48 hours elapsed
  const isDormant = useMemo(() => {
    if (!lastCompletedTimestamp || completedSessions === 0) return false;
    const hoursElapsed = (Date.now() - lastCompletedTimestamp) / (1000 * 60 * 60);
    return hoursElapsed > 48;
  }, [completedSessions, lastCompletedTimestamp]);

  // Deterministic procedural generation of tree branches
  const branches = useMemo(() => {
    const list: Branch[] = [];
    let currentId = 0;

    // Base trunk
    list.push({
      id: currentId++,
      x1: 50,
      y1: 90,
      x2: 50,
      y2: 70,
      depth: 0,
      isLeaf: completedSessions === 0,
    });

    if (completedSessions === 0) {
      // Small sprout leaves
      list.push({ id: currentId++, x1: 50, y1: 70, x2: 44, y2: 64, depth: 1, isLeaf: true });
      list.push({ id: currentId++, x1: 50, y1: 70, x2: 56, y2: 64, depth: 1, isLeaf: true });
      return list;
    }

    // Deterministic branching up to completedSessions
    const queue: { x: number; y: number; angle: number; length: number; depth: number }[] = [
      { x: 50, y: 70, angle: -Math.PI / 2, length: 14, depth: 1 },
    ];

    let count = 0;
    const maxNodes = Math.min(completedSessions, 55);

    while (queue.length > 0 && count < maxNodes) {
      const parent = queue.shift()!;
      count++;

      // Branching angle spread
      const splitAngles = [
        parent.angle - 0.38 + ((count % 3) * 0.05),
        parent.angle + 0.38 - ((count % 2) * 0.06),
      ];

      for (let i = 0; i < splitAngles.length; i++) {
        if (count >= maxNodes) break;
        const ang = splitAngles[i];
        const len = Math.max(5, parent.length * 0.78);
        const nx = parent.x + Math.cos(ang) * len;
        const ny = parent.y + Math.sin(ang) * len;

        const isLeaf = count >= maxNodes - 4 || parent.depth >= 5;
        list.push({
          id: currentId++,
          x1: parent.x,
          y1: parent.y,
          x2: nx,
          y2: ny,
          depth: parent.depth + 1,
          isLeaf,
        });

        if (parent.depth < 5) {
          queue.push({ x: nx, y: ny, angle: ang, length: len, depth: parent.depth + 1 });
        }
      }
    }

    return list;
  }, [completedSessions]);

  const totalBranches = branches.length;
  const dormantCutoff = Math.floor(totalBranches * 0.8);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="overflow-visible select-none"
      style={{ display: 'inline-block' }}
    >
      {/* Minimalist bonsai pot / dish */}
      {showPot && (
        <g stroke="currentColor" fill="none" strokeWidth="1.5">
          <line x1="30" y1="92" x2="70" y2="92" />
          <line x1="33" y1="92" x2="37" y2="97" />
          <line x1="67" y1="92" x2="63" y2="97" />
          <line x1="35" y1="97" x2="65" y2="97" />
        </g>
      )}

      {/* Trunk and branches */}
      <g stroke="currentColor" fill="none" strokeLinecap="round">
        {branches.map((b, index) => {
          const isOuter = index >= dormantCutoff;
          const strokeDashed = isDormant && isOuter;
          const strokeWidth = Math.max(1, 2.5 - b.depth * 0.35);

          return (
            <g key={b.id}>
              <line
                x1={b.x1}
                y1={b.y1}
                x2={b.x2}
                y2={b.y2}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDashed ? '2,2' : undefined}
              />
              {b.isLeaf && (
                <circle
                  cx={b.x2}
                  cy={b.y2}
                  r={strokeDashed ? 1.5 : 1.8}
                  fill={strokeDashed ? 'none' : 'currentColor'}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray={strokeDashed ? '1,1' : undefined}
                />
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
};
