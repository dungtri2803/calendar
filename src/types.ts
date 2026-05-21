export interface Employee {
  id: string;
  name: string;
  dob: string;
  hourly_rate: number;
  created_at?: string;
}

export interface ShiftType {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  color: string; // CSS hex or Tailwind color class prefix
}

export interface ShiftAssignment {
  id: string;
  employee_id: string;
  date: string; // YYYY-MM-DD
  shift_type_id: string;
  created_at?: string;
}

export type UserRole = 'admin' | 'employee';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isEnabled: boolean;
}

export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}
