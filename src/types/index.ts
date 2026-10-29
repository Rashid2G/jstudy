export type CalmTheme = 'sage' | 'sand' | 'slate' | 'dusk' | 'nordic';

export type TimerMode = 'pomodoro' | 'custom' | 'stopwatch';

export type AmbientSoundType = 'none' | 'rain' | 'fireplace' | 'cafe' | 'waves' | 'whitenoise';

export type StreamType = 'audio' | 'youtube' | 'ambient';

export interface Room {
  id: string;
  name: string;
  description: string;
  theme: CalmTheme;
  timer_work_minutes: number;
  timer_break_minutes: number;
  timer_mode: TimerMode;
  default_radio_id: string | null;
  ambient_sound: AmbientSoundType;
  ambient_volume: number;
  radio_volume: number;
  created_at: string;
  updated_at: string;
}

export interface RadioStation {
  id: string;
  name: string;
  description: string;
  url: string;
  stream_type: StreamType;
  genre: string;
  is_curated: number; // 1 or 0
  created_at: string;
}

export interface StudySession {
  id: string;
  room_id: string | null;
  title: string;
  category: string;
  target_duration_seconds: number;
  actual_duration_seconds: number;
  completed: number; // 1 or 0
  started_at: string;
  ended_at: string;
  notes: string | null;
}

export interface PlayHistoryItem {
  id: string;
  radio_id: string;
  radio_name: string;
  room_id: string | null;
  session_id: string | null;
  duration_seconds: number;
  started_at: string;
  ended_at: string | null;
}

export interface DashboardStats {
  totalFocusSeconds: number;
  completedSessionsCount: number;
  activeStreakDays: number;
  todayFocusSeconds: number;
}
