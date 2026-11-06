import { CURRICULUM } from '../curriculum';

export interface NodeRecord {
  unlocked: boolean;
  mastery: number; // 0=untested, 1=failed, 2=passable, 3=mastered
  lastPracticed: number | null;
  intervalDays: number;
  bestReps: number;
}

export interface UserProgress {
  theme: 'dark' | 'light';
  activeNodeId: string;
  completedSessions: number;
  lastCompletedTimestamp: number | null;
  nodes: Record<string, NodeRecord>;
}

const STORAGE_KEY = 'hotel_california_srs_state_v1';

export function getInitialProgress(): UserProgress {
  const initialNodes: Record<string, NodeRecord> = {};
  CURRICULUM.forEach((node, index) => {
    initialNodes[node.id] = {
      unlocked: index === 0, // only Node 01 is unlocked by default
      mastery: 0,
      lastPracticed: null,
      intervalDays: 1,
      bestReps: 0,
    };
  });

  return {
    theme: 'dark',
    activeNodeId: '01',
    completedSessions: 0,
    lastCompletedTimestamp: null,
    nodes: initialNodes,
  };
}

export function loadProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getInitialProgress();
    const parsed = JSON.parse(raw) as UserProgress;

    // ensure all 50 nodes are present in case of schema update
    const base = getInitialProgress();
    const mergedNodes: Record<string, NodeRecord> = { ...base.nodes };

    Object.keys(parsed.nodes || {}).forEach((id) => {
      if (mergedNodes[id]) {
        mergedNodes[id] = { ...mergedNodes[id], ...parsed.nodes[id] };
      }
    });

    return {
      theme: parsed.theme === 'light' ? 'light' : 'dark',
      activeNodeId: parsed.activeNodeId || '01',
      completedSessions: typeof parsed.completedSessions === 'number' ? parsed.completedSessions : 0,
      lastCompletedTimestamp: parsed.lastCompletedTimestamp || null,
      nodes: mergedNodes,
    };
  } catch {
    return getInitialProgress();
  }
}

export function saveProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (err) {
    console.error('Failed to save progress', err);
  }
}

/**
 * Step 1 Warmup selector:
 * Checks previously unlocked nodes and returns the one with the lowest mastery score
 * or oldest lastPracticed date. If on Node 01, returns Node 01.
 */
export function getWarmupNodeId(currentNodeId: string, progress: UserProgress): string {
  if (currentNodeId === '01') return '01';

  const unlockedNodes = CURRICULUM.filter(
    (n) => n.id !== currentNodeId && progress.nodes[n.id]?.unlocked
  );

  if (unlockedNodes.length === 0) return '01';

  // Sort by mastery ascending, then by lastPracticed ascending (oldest first)
  unlockedNodes.sort((a, b) => {
    const recA = progress.nodes[a.id];
    const recB = progress.nodes[b.id];
    const masteryA = recA?.mastery ?? 0;
    const masteryB = recB?.mastery ?? 0;
    if (masteryA !== masteryB) return masteryA - masteryB;

    const timeA = recA?.lastPracticed ?? 0;
    const timeB = recB?.lastPracticed ?? 0;
    return timeA - timeB;
  });

  return unlockedNodes[0].id;
}

/**
 * Handle verification completion (Step 3)
 * Grade: 'fail' (✕) | 'pass' (△) | 'mastered' (◯)
 */
export function evaluateSession(
  nodeId: string,
  grade: 'fail' | 'pass' | 'mastered',
  reps: number,
  currentProgress: UserProgress
): UserProgress {
  const next: UserProgress = {
    ...currentProgress,
    nodes: { ...currentProgress.nodes },
  };

  const currentRec = next.nodes[nodeId] || {
    unlocked: true,
    mastery: 0,
    lastPracticed: null,
    intervalDays: 1,
    bestReps: 0,
  };

  const now = Date.now();
  let mastery = 1;
  let interval = 1;

  if (grade === 'fail') {
    mastery = 1;
    interval = 1;
  } else if (grade === 'pass') {
    mastery = 2;
    interval = 2;
  } else if (grade === 'mastered') {
    mastery = 3;
    interval = Math.max(3, currentRec.intervalDays * 2);
  }

  next.nodes[nodeId] = {
    unlocked: true,
    mastery,
    lastPracticed: now,
    intervalDays: interval,
    bestReps: Math.max(currentRec.bestReps, reps),
  };

  // If passed or mastered, unlock next node and advance activeNodeId
  if (grade === 'pass' || grade === 'mastered') {
    const currentIndex = CURRICULUM.findIndex((n) => n.id === nodeId);
    if (currentIndex >= 0 && currentIndex < CURRICULUM.length - 1) {
      const nextNode = CURRICULUM[currentIndex + 1];
      if (!next.nodes[nextNode.id]?.unlocked) {
        next.nodes[nextNode.id] = {
          unlocked: true,
          mastery: 0,
          lastPracticed: null,
          intervalDays: 1,
          bestReps: 0,
        };
      }
      next.activeNodeId = nextNode.id;
    }
  }

  // Record daily practice session & growth
  next.completedSessions = (next.completedSessions || 0) + 1;
  next.lastCompletedTimestamp = now;

  saveProgress(next);
  return next;
}
