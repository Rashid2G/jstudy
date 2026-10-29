import { useState, useEffect, useRef, useCallback } from 'react';
import { createInitialTimerState, tickTimer, TimerState, clampMinutes } from '../utils/timer.js';
import { sound } from '../utils/sound.js';
import { api } from '../services/api.js';

interface UseStudyTimerOptions {
  initialWorkMinutes?: number;
  initialBreakMinutes?: number;
  initialBreaksEnabled?: boolean;
  onSessionSaved?: () => void;
}

const STORAGE_KEY = 'studinty_persisted_timer_v4';

interface PersistedTimerState {
  workMinutes: number;
  breakMinutes: number;
  breaksEnabled: boolean;
  phase: 'work' | 'break';
  remainingSeconds: number;
  totalDurationSeconds: number;
  isRunning: boolean;
  completedCycles: number;
  sessionGoal: string;
  sessionStartedAt: string | null;
  savedAt: number;
}

function loadPersistedState(defaultWork = 25, defaultBreak = 5, defaultBreaksEnabled = true) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (typeof data.remainingSeconds === 'number' && typeof data.totalDurationSeconds === 'number') {
          const workMinutes = clampMinutes(data.workMinutes, 1, 240, defaultWork);
          const breaksEnabled = data.breaksEnabled ?? defaultBreaksEnabled;
          const breakMinutes = breaksEnabled
            ? clampMinutes(data.breakMinutes, 1, 90, defaultBreak)
            : clampMinutes(data.breakMinutes, 0, 90, 0);

          return {
            timerState: {
              phase: data.phase === 'break' ? ('break' as const) : ('work' as const),
              remainingSeconds: Math.max(0, data.remainingSeconds),
              totalDurationSeconds: Math.max(1, data.totalDurationSeconds),
              isRunning: Boolean(data.isRunning),
              completedCycles: typeof data.completedCycles === 'number' ? data.completedCycles : 0,
              breaksEnabled,
              workMinutes,
              breakMinutes,
            },
            sessionGoal: typeof data.sessionGoal === 'string' ? data.sessionGoal : '',
            sessionStartedAt: (data.sessionStartedAt as string | null) || null,
          };
        }
      }
    }
  } catch (err) {
    console.warn('Could not load persisted timer state:', err);
  }

  const initial = createInitialTimerState({
    workMinutes: defaultWork,
    breakMinutes: defaultBreak,
    breaksEnabled: defaultBreaksEnabled,
  });

  return {
    timerState: initial,
    sessionGoal: '',
    sessionStartedAt: null,
  };
}

function savePersistedState(state: TimerState, goal: string, sessionStartedAt: string | null) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const payload: PersistedTimerState = {
        workMinutes: state.workMinutes,
        breakMinutes: state.breakMinutes,
        breaksEnabled: state.breaksEnabled,
        phase: state.phase,
        remainingSeconds: state.remainingSeconds,
        totalDurationSeconds: state.totalDurationSeconds,
        isRunning: state.isRunning,
        completedCycles: state.completedCycles,
        sessionGoal: goal,
        sessionStartedAt,
        savedAt: Date.now(),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }
  } catch (err) {
    console.warn('Could not save persisted timer state:', err);
  }
}

export function useStudyTimer({
  initialWorkMinutes = 25,
  initialBreakMinutes = 5,
  initialBreaksEnabled = true,
  onSessionSaved,
}: UseStudyTimerOptions = {}) {
  const [initialData] = useState(() =>
    loadPersistedState(initialWorkMinutes, initialBreakMinutes, initialBreaksEnabled)
  );

  const [timerState, setTimerState] = useState<TimerState>(initialData.timerState);
  const [sessionGoal, setSessionGoalInternal] = useState<string>(initialData.sessionGoal);

  const sessionStartRef = useRef<string | null>(initialData.sessionStartedAt);
  const stateRef = useRef<TimerState>(timerState);
  stateRef.current = timerState;

  const goalRef = useRef(sessionGoal);
  goalRef.current = sessionGoal;

  const onSessionSavedRef = useRef(onSessionSaved);
  onSessionSavedRef.current = onSessionSaved;

  const setSessionGoal = useCallback((newGoal: string) => {
    setSessionGoalInternal(newGoal);
    goalRef.current = newGoal;
    savePersistedState(stateRef.current, newGoal, sessionStartRef.current);
  }, []);

  // Save state on unload/beforeunload so page reload captures exact moment
  useEffect(() => {
    const handleBeforeUnload = () => {
      savePersistedState(stateRef.current, goalRef.current, sessionStartRef.current);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, []);

  // StrictMode-safe 1-second interval
  useEffect(() => {
    if (!timerState.isRunning) {
      savePersistedState(timerState, goalRef.current, sessionStartRef.current);
      return;
    }

    const interval = window.setInterval(() => {
      const current = stateRef.current;
      if (!current.isRunning) return;

      const completedDuration = current.totalDurationSeconds;
      const { nextState, didCompletePhase, completedWorkPhase } = tickTimer(current);

      setTimerState(nextState);
      savePersistedState(nextState, goalRef.current, sessionStartRef.current);

      if (didCompletePhase) {
        sound.playTimerEnd();

        if (completedWorkPhase) {
          const endIso = new Date().toISOString();
          const startIso =
            sessionStartRef.current ||
            new Date(Date.now() - completedDuration * 1000).toISOString();
          sessionStartRef.current = null;

          api
            .createSession({
              room_id: null,
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
      if (nextRunning) {
        sound.playTimerStart();
        if (prev.phase === 'work' && !sessionStartRef.current) {
          sessionStartRef.current = new Date().toISOString();
        }
      }
      const updated = { ...prev, isRunning: nextRunning };
      savePersistedState(updated, goalRef.current, sessionStartRef.current);
      return updated;
    });
  }, []);

  const resetTimer = useCallback(() => {
    sessionStartRef.current = null;
    setTimerState((prev) => {
      const dur =
        prev.phase === 'work'
          ? Math.max(1, prev.workMinutes) * 60
          : Math.max(1, prev.breakMinutes || 5) * 60;
      const updated = {
        ...prev,
        isRunning: false,
        totalDurationSeconds: dur,
        remainingSeconds: dur,
      };
      savePersistedState(updated, goalRef.current, null);
      return updated;
    });
  }, []);

  const skipPhase = useCallback(() => {
    sessionStartRef.current = null;
    setTimerState((prev) => {
      if (!prev.breaksEnabled) {
        const dur = Math.max(1, prev.workMinutes) * 60;
        const updated: TimerState = {
          ...prev,
          phase: 'work',
          isRunning: false,
          totalDurationSeconds: dur,
          remainingSeconds: dur,
        };
        savePersistedState(updated, goalRef.current, null);
        return updated;
      }
      const nextPhase = prev.phase === 'work' ? 'break' : 'work';
      const dur =
        nextPhase === 'work'
          ? Math.max(1, prev.workMinutes) * 60
          : Math.max(1, prev.breakMinutes || 5) * 60;
      const updated: TimerState = {
        ...prev,
        phase: nextPhase,
        isRunning: false,
        totalDurationSeconds: dur,
        remainingSeconds: dur,
      };
      savePersistedState(updated, goalRef.current, null);
      return updated;
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

        const updated: TimerState = {
          ...prev,
          phase: nextPhase,
          isRunning: false,
          workMinutes: nextWork,
          breakMinutes: nextBreak,
          breaksEnabled: nextBreaksEnabled,
          totalDurationSeconds: dur,
          remainingSeconds: dur,
        };
        savePersistedState(updated, goalRef.current, null);
        return updated;
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
