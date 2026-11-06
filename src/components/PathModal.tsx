import React from 'react';
import { CURRICULUM, CurriculumNode } from '../curriculum';
import { UserProgress } from '../lib/srs';
import { Bonsai } from './Bonsai';

interface PathModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: UserProgress;
  onSelectNode: (nodeId: string) => void;
}

export const PathModal: React.FC<PathModalProps> = ({
  isOpen,
  onClose,
  progress,
  onSelectNode,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[var(--app-bg,#000)] text-current select-none overflow-hidden"
      style={{
        paddingTop: 'max(14px, env(safe-area-inset-top))',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        paddingLeft: 'max(14px, env(safe-area-inset-left))',
        paddingRight: 'max(14px, env(safe-area-inset-right))',
      }}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b-2 border-current">
        <div className="flex items-center gap-2">
          <span className="font-mono font-black text-xl tracking-wider">01 - 50</span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="w-10 h-10 border-2 border-current flex items-center justify-center font-mono font-bold text-xl active:translate-x-0.5 active:translate-y-0.5 transition-all shadow-[3px_3px_0px_0px_currentColor]"
        >
          ✕
        </button>
      </div>

      {/* Bonsai Header */}
      <div className="flex flex-col items-center justify-center pt-4 pb-3 border-b border-current/20">
        <Bonsai
          completedSessions={progress.completedSessions}
          lastCompletedTimestamp={progress.lastCompletedTimestamp}
          size={130}
        />
      </div>

      {/* 50 Nodes Scrollable List */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {CURRICULUM.map((node: CurriculumNode) => {
          const record = progress.nodes[node.id];
          const isUnlocked = record?.unlocked ?? false;
          const isActive = progress.activeNodeId === node.id;
          const mastery = record?.mastery ?? 0;

          let statusBadge = '🔒';
          if (isUnlocked) {
            if (mastery === 3) statusBadge = '◯';
            else if (mastery === 2) statusBadge = '△';
            else if (mastery === 1) statusBadge = '✕';
            else statusBadge = '·';
          }

          return (
            <div
              key={node.id}
              onClick={() => {
                if (isUnlocked) {
                  onSelectNode(node.id);
                  onClose();
                }
              }}
              className={`flex items-center justify-between p-3.5 border-2 border-current font-mono transition-all ${
                isUnlocked
                  ? 'cursor-pointer active:translate-x-0.5 active:translate-y-0.5 shadow-[3px_3px_0px_0px_currentColor]'
                  : 'opacity-40 border-dashed cursor-not-allowed shadow-[1px_1px_0px_0px_currentColor]'
              } ${isActive ? 'bg-current text-[var(--app-bg,#000)]' : 'bg-transparent text-current'}`}
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-base w-7">{node.id}</span>
                <span className="text-sm font-semibold">
                  {node.chords.map((c) => c.name).join(' ↔ ')}
                  {node.isBossGate ? ' ★' : ''}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs">{node.targetBpm} BPM</span>
                <span className="text-base font-bold w-6 text-center">{statusBadge}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
