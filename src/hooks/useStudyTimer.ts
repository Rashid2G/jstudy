import { useState, useEffect, useRef, useCallback } from 'react';
import { createInitialTimerState, tickTimer, TimerState, clampMinutes } from '../utils/timer.js';
import { sound } from '../utils/sound.js';
import { api } from '../services/api.js';

interface UseStudyTimerOptions {
  initialWorkMinutes: number;
  initialBreakMinutes: number;
  initialBreaksEnabled: boolean;
  activeRoomId: string | null;
  onSessionSaved?: () => void;
}

export function useStudyTimer({
  initialWorkMinutes,
  initialBreakMinutes,
  initialBreaksEnabled,
  activeRoomId,
  onSessionSaved,
}: UseStudyTimerOptions) {
  const [timerState, setTimerState] = useState<TimerState>(() =>
    createInitialTimerState({
      workMinutes: initialWorkMinutes,
      breakMinutes: initialBreakMinutes,
      breaksEnabled: initialBreaksEnabled,
    })
  );
  const [sessionGoal, setSessionGoal] = useState<string>('');
  const sessionStartRef = useRef<string | null>(null);
  const stateRef = useRef<TimerState>(timerState);
  stateRef.current = timerState;

  const goalRef = useRef(sessionGoal);
  goalRef.current = sessionGoal;

  const roomIdRef = useRef(activeRoomId);
  roomIdRef.current = activeRoomId;

  const onSessionSavedRef = useRef(onSessionSaved);
  onSessionSavedRef.current = onSessionSaved;

  // Sync when room changes (only if timer isn't actively counting down)
  useEffect(() => {
    setTimerState((prev) => {
      if (prev.isRunning) return prev;
      return createInitialTimerState({
        workMinutes: initialWorkMinutes,
        breakMinutes: initialBreakMinutes,
        breaksEnabled: initialBreaksEnabled,
      });
    });
    sessionStartRef.current = null;
  }, [activeRoomId, initialWorkMinutes, initialBreakMinutes, initialBreaksEnabled]);

  // StrictMode-safe 1-second interval: side effects happen outside state updater
  useEffect(() => {
    if (!timerState.isRunning) return;

    const interval = window.setInterval(() => {
      const current = stateRef.current;
      if (!current.isRunning) return;

      const completedDuration = current.totalDurationSeconds;
      const { nextState, didCompletePhase, completedWorkPhase } = tickTimer(current);

      setTimerState(nextState);

      if (didCompletePhase) {
        sound.playChime();

        if (completedWorkPhase) {
          const endIso = new Date().toISOString();
          const startIso =
            sessionStartRef.current ||
            new Date(Date.now() - completedDuration * 1000).toISOString();
          sessionStartRef.current = null;

          api
            .createSession({
              room_id: roomIdRef.current,
              title: goalRef.current.trim() || 'Focused Study Session',
              category: 'Study',
              target_duration_seconds: completedDuration,
              actual_duration_seconds: completedDuration,
              completed: true,
              started_at: startIso,
              ended_at: endIso,
              notes: null,
            })
            .then(() => {
              onSessionSavedRef.current?.();
            })
            .catch(console.error);
        } else {
          sessionStartRef.current = null;
        }
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timerState.isRunning]);

  const toggleTimer = useCallback(() => {
    setTimerState((prev) => {
      const nextRunning = !prev.isRunning;
      if (nextRunning && prev.phase === 'work' && !sessionStartRef.current) {
        sessionStartRef.current = new Date().toISOString();
      }
      return { ...prev, isRunning: nextRunning };
    });
  }, []);

  const resetTimer = useCallback(() => {
    sessionStartRef.current = null;
    setTimerState((prev) => {
      const dur =
        prev.phase === 'work'
          ? Math.max(1, prev.workMinutes) * 60
          : Math.max(1, prev.breakMinutes || 5) * 60;
      return {
        ...prev,
        isRunning: false,
        totalDurationSeconds: dur,
        remainingSeconds: dur,
      };
    });
  }, []);

  const skipPhase = useCallback(() => {
    sessionStartRef.current = null;
    setTimerState((prev) => {
      if (!prev.breaksEnabled) {
        const dur = Math.max(1, prev.workMinutes) * 60;
        return {
          ...prev,
          phase: 'work',
          isRunning: false,
          totalDurationSeconds: dur,
          remainingSeconds: dur,
        };
      }
      const nextPhase = prev.phase === 'work' ? 'break' : 'work';
      const dur =
        nextPhase === 'work'
          ? Math.max(1, prev.workMinutes) * 60
          : Math.max(1, prev.breakMinutes || 5) * 60;
      return {
        ...prev,
        phase: nextPhase,
        isRunning: false,
        totalDurationSeconds: dur,
        remainingSeconds: dur,
      };
    });
  }, []);

  const configureCustomTimer = useCallback(
    (updates: { workMinutes?: number; breakMinutes?: number; breaksEnabled?: boolean }) => {
      sessionStartRef.current = null;
      setTimerState((prev) => {
        const nextWork =
          updates.workMinutes !== undefined
            ? clampMinutes(updates.workMinutes, 1, 240, prev.workMinutes)
            : prev.workMinutes;
        const nextBreaksEnabled =
          updates.breaksEnabled !== undefined ? updates.breaksEnabled : prev.breaksEnabled;
        const rawBreak =
          updates.breakMinutes !== undefined
            ? updates.breakMinutes
            : nextBreaksEnabled && prev.breakMinutes === 0
              ? 5
              : prev.breakMinutes;
        const nextBreak = nextBreaksEnabled
          ? clampMinutes(rawBreak, 1, 90, 5)
          : clampMinutes(rawBreak, 0, 90, 0);

        const nextPhase = !nextBreaksEnabled ? 'work' : prev.phase;
        const dur = (nextPhase === 'work' ? nextWork : Math.max(1, nextBreak)) * 60;

        return {
          ...prev,
          phase: nextPhase,
          isRunning: false,
          workMinutes: nextWork,
          breakMinutes: nextBreak,
          breaksEnabled: nextBreaksEnabled,
          totalDurationSeconds: dur,
          remainingSeconds: dur,
        };
      });
    },
    []
  );

  return {
    timerState,
    sessionGoal,
    setSessionGoal,
    toggleTimer,
    resetTimer,
    skipPhase,
    configureCustomTimer,
  };
}
