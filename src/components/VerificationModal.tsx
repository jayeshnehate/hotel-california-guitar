import React, { useState } from 'react';

interface VerificationModalProps {
  isOpen: boolean;
  targetReps: number;
  onGrade: (grade: 'fail' | 'pass' | 'mastered', reps: number) => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  targetReps,
  onGrade,
}) => {
  const [reps, setReps] = useState(targetReps);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-none p-4 select-none">
      <div className="w-full max-w-xs border-2 border-current bg-[var(--app-bg,#000)] text-current p-6 shadow-[6px_6px_0px_0px_currentColor] flex flex-col items-center gap-6">
        {/* Target vs Clean Reps Stepper */}
        <div className="w-full flex items-center justify-between border-2 border-current p-3 shadow-[3px_3px_0px_0px_currentColor]">
          <button
            onClick={() => setReps((r) => Math.max(0, r - 1))}
            className="w-10 h-10 border-2 border-current flex items-center justify-center font-mono text-xl font-bold active:translate-x-0.5 active:translate-y-0.5 shadow-[2px_2px_0px_0px_currentColor]"
          >
            -
          </button>
          <div className="flex flex-col items-center">
            <span className="font-mono text-2xl font-black">{reps}</span>
            <span className="font-mono text-[10px] opacity-70">/ {targetReps}</span>
          </div>
          <button
            onClick={() => setReps((r) => r + 1)}
            className="w-10 h-10 border-2 border-current flex items-center justify-center font-mono text-xl font-bold active:translate-x-0.5 active:translate-y-0.5 shadow-[2px_2px_0px_0px_currentColor]"
          >
            +
          </button>
        </div>

        {/* 3 Strict Evaluation Buttons */}
        <div className="w-full grid grid-cols-3 gap-3">
          <button
            onClick={() => onGrade('fail', reps)}
            className="h-16 border-2 border-current flex items-center justify-center font-mono text-2xl font-black active:translate-x-0.5 active:translate-y-0.5 transition-all shadow-[3px_3px_0px_0px_currentColor] hover:bg-current hover:text-[var(--app-bg,#000)]"
          >
            ✕
          </button>
          <button
            onClick={() => onGrade('pass', reps)}
            className="h-16 border-2 border-current flex items-center justify-center font-mono text-2xl font-black active:translate-x-0.5 active:translate-y-0.5 transition-all shadow-[3px_3px_0px_0px_currentColor] hover:bg-current hover:text-[var(--app-bg,#000)]"
          >
            △
          </button>
          <button
            onClick={() => onGrade('mastered', reps)}
            className="h-16 border-2 border-current flex items-center justify-center font-mono text-2xl font-black active:translate-x-0.5 active:translate-y-0.5 transition-all shadow-[3px_3px_0px_0px_currentColor] hover:bg-current hover:text-[var(--app-bg,#000)]"
          >
            ◯
          </button>
        </div>
      </div>
    </div>
  );
};
