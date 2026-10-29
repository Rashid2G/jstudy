import React, { useState, useEffect, useRef } from 'react';
import { formatTime, formatDuration } from '../utils/format.js';
import { sound } from '../utils/sound.js';
import { api } from '../services/api.js';
import { Play, Pause, RotateCcw, SkipForward, CheckCircle2, BookOpen } from 'lucide-react';

interface Props {
  workMinutes: number;
  breakMinutes: number;
  activeRoomId: string | null;
  onSessionComplete?: () => void;
  onZenModeRequest?: () => void;
}

export const Timer: React.FC<Props> = ({
  workMinutes,
  breakMinutes,
  activeRoomId,
  onSessionComplete,
}) => {
  const [phase, setPhase] = useState<'work' | 'break'>('work');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(workMinutes * 60);
  const [totalSeconds, setTotalSeconds] = useState<number>(workMinutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSessionsCount, setCompletedSessionsCount] = useState<number>(0);
  const [sessionGoal, setSessionGoal] = useState<string>('');
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);

  // When room settings change and timer is not currently running, adapt
  useEffect(() => {
    if (!isRunning) {
      const dur = phase === 'work' ? workMinutes * 60 : breakMinutes * 60;
      setRemainingSeconds(dur);
      setTotalSeconds(dur);
    }
  }, [workMinutes, breakMinutes]);

  // Main countdown interval loop
  useEffect(() => {
    let interval: any = null;

    if (isRunning) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev > 1) {
            return prev - 1;
          }

          // Phase completed!
          sound.playChime();

          if (phase === 'work') {
            // Save work session to SQLite database
            const actualSeconds = totalSeconds;
            const startIso = sessionStartTime || new Date(Date.now() - actualSeconds * 1000).toISOString();
            const endIso = new Date().toISOString();

            api.createSession({
              room_id: activeRoomId,
              title: sessionGoal.trim() || 'Deep Study Session',
              category: 'Study',
              target_duration_seconds: totalSeconds,
              actual_duration_seconds: actualSeconds,
              completed: true,
              started_at: startIso,
              ended_at: endIso,
              notes: sessionNotes.trim() || null,
            }).then(() => {
              if (onSessionComplete) onSessionComplete();
            }).catch(console.error);

            setCompletedSessionsCount((c) => c + 1);

            // Switch to break phase
            setPhase('break');
            const nextTotal = breakMinutes * 60;
            setTotalSeconds(nextTotal);
            setIsRunning(false);
            setSessionStartTime(null);
            return nextTotal;
          } else {
            // Break completed, switch back to work
            setPhase('work');
            const nextTotal = workMinutes * 60;
            setTotalSeconds(nextTotal);
            setIsRunning(false);
            setSessionStartTime(null);
            return nextTotal;
          }
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, phase, totalSeconds, activeRoomId, sessionGoal, sessionNotes, sessionStartTime, breakMinutes, workMinutes, onSessionComplete]);

  const toggleTimer = () => {
    if (!isRunning && !sessionStartTime) {
      setSessionStartTime(new Date().toISOString());
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    const dur = phase === 'work' ? workMinutes * 60 : breakMinutes * 60;
    setRemainingSeconds(dur);
    setTotalSeconds(dur);
    setSessionStartTime(null);
  };

  const skipPhase = () => {
    setIsRunning(false);
    if (phase === 'work') {
      setPhase('break');
      const dur = breakMinutes * 60;
      setRemainingSeconds(dur);
      setTotalSeconds(dur);
    } else {
      setPhase('work');
      const dur = workMinutes * 60;
      setRemainingSeconds(dur);
      setTotalSeconds(dur);
    }
    setSessionStartTime(null);
  };

  // Switch presets directly
  const switchPreset = (workM: number, breakM: number) => {
    setIsRunning(false);
    setPhase('work');
    const dur = workM * 60;
    setRemainingSeconds(dur);
    setTotalSeconds(dur);
    setSessionStartTime(null);
  };

  // Calculate circular progress
  const progressPercent = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;
  const strokeDashoffset = 565 - (565 * progressPercent) / 100; // circle radius 90: circumference ~565.48

  return (
    <div className="flex flex-col items-center p-6 md:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm text-center relative overflow-hidden">
      {/* Background soft ambient breathe glow during active focus */}
      {isRunning && (
        <div className="absolute inset-0 pointer-events-none bg-[var(--accent-soft)] opacity-20 animate-breathe" />
      )}

      {/* Preset Pill Selector */}
      <div className="flex items-center gap-1.5 p-1 rounded-full bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] mb-6 z-10">
        <button
          onClick={() => switchPreset(25, 5)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            workMinutes === 25 && phase === 'work'
              ? 'bg-[var(--accent-main)] text-white shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          25 / 5m
        </button>
        <button
          onClick={() => switchPreset(50, 10)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            workMinutes === 50 && phase === 'work'
              ? 'bg-[var(--accent-main)] text-white shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          50 / 10m
        </button>
        <button
          onClick={() => switchPreset(90, 15)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            workMinutes === 90 && phase === 'work'
              ? 'bg-[var(--accent-main)] text-white shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          90 / 15m
        </button>
      </div>

      {/* Circular Progress & Clock Face */}
      <div className="relative w-64 h-64 flex items-center justify-center my-2 z-10">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="128"
            cy="128"
            r="90"
            className="stroke-[var(--bg-card-subtle)]"
            strokeWidth="6"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="128"
            cy="128"
            r="90"
            className="stroke-[var(--accent-main)] transition-all duration-1000 ease-linear"
            strokeWidth="6"
            strokeDasharray={565.48}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Inner Timer text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[11px] font-medium tracking-widest uppercase mb-1 text-[var(--accent-main)]">
            {phase === 'work' ? 'Focus Session' : 'Rest & Breathe'}
          </span>
          <span className="text-5xl font-mono tracking-tight font-medium text-[var(--text-main)]">
            {formatTime(remainingSeconds)}
          </span>
          <span className="text-xs text-[var(--text-muted)] mt-1 font-mono">
            {formatDuration(totalSeconds)} target
          </span>
        </div>
      </div>

      {/* Goal / Study Note Input */}
      <div className="w-full max-w-sm mt-3 mb-6 z-10">
        <div className="relative flex items-center">
          <BookOpen className="w-4 h-4 absolute left-3.5 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={sessionGoal}
            onChange={(e) => setSessionGoal(e.target.value)}
            placeholder="Focus goal (e.g. Chapter 4 Notes, Problem Set #2)"
            className="w-full pl-9 pr-3 py-2 text-xs text-center bg-[var(--bg-card-subtle)] text-[var(--text-main)] placeholder-[var(--text-muted)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--accent-main)]"
          />
        </div>
      </div>

      {/* Primary Control Buttons */}
      <div className="flex items-center gap-3 z-10">
        <button
          onClick={resetTimer}
          className="p-3 rounded-full bg-[var(--bg-card-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-subtle)] transition-all"
          title="Reset Timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={toggleTimer}
          className="px-8 py-3.5 rounded-full bg-[var(--accent-main)] text-white hover:bg-[var(--accent-hover)] transition-all shadow-sm active:scale-95 flex items-center gap-2 font-medium text-sm"
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>{remainingSeconds < totalSeconds ? 'Resume' : 'Start Focus'}</span>
            </>
          )}
        </button>

        <button
          onClick={skipPhase}
          className="p-3 rounded-full bg-[var(--bg-card-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-subtle)] transition-all"
          title={phase === 'work' ? 'Skip to break' : 'Skip to focus'}
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Completed indicator */}
      {completedSessionsCount > 0 && (
        <div className="flex items-center gap-1.5 mt-5 text-xs text-[var(--text-muted)] z-10">
          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-main)]" />
          <span>{completedSessionsCount} focus block{completedSessionsCount === 1 ? '' : 's'} finished this session</span>
        </div>
      )}
    </div>
  );
};
