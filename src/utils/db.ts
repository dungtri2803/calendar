import { createClient } from '@supabase/supabase-js';
import { Employee, ShiftType, ShiftAssignment, SupabaseConfig, SalaryAdvance } from '../types';

const supabaseUrl = "https://erwngfytlufpzmzdiejl.supabase.co";
const supabaseKey = "sb_publishable_12As9c9rqbB10Byyh-S9AA_RbA98pBU";

// Initialize Supabase Client directly
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to get Supabase configuration (always enabled now)
export function getSupabaseConfig(): SupabaseConfig {
  return {
    url: supabaseUrl,
    anonKey: supabaseKey,
    isEnabled: true
  };
}

export function saveSupabaseConfig(_config: SupabaseConfig) {
  // Config is hardcoded and always active. No-op to avoid breaking component callers.
}

// SQL generation for manual execution in Supabase
export const SQL_SCHEMA = `-- SCRIPT KHỞI TẠO DATABASE CHO HỆ THỐNG QUẢN LÝ NHÂN VIÊN & LỊCH LÀM VIỆC

-- 1. Bảng nhân viên
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    dob DATE NOT NULL,
    hourly_rate NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 2. Bảng cấu hình ca làm việc
CREATE TABLE shift_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_hours NUMERIC(5, 2) NOT NULL,
    color TEXT NOT NULL DEFAULT 'indigo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 3. Bảng phân lịch làm việc (phân ca)
CREATE TABLE shift_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    shift_type_id UUID REFERENCES shift_types(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(employee_id, date, shift_type_id)
);

-- 4. Bảng ứng lương (salary_advances)
CREATE TABLE salary_advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Thêm chỉ mục (index) để tối ưu truy vấn lịch
CREATE INDEX idx_shift_assignments_date ON shift_assignments(date);
CREATE INDEX idx_shift_assignments_emp ON shift_assignments(employee_id);
CREATE INDEX idx_salary_advances_date ON salary_advances(date);
CREATE INDEX idx_salary_advances_emp ON salary_advances(employee_id);

-- Cấu hình Row-Level Security (RLS)
-- Tắt RLS để ứng dụng client có thể đọc/ghi dữ liệu trực tiếp bằng anon key
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE shift_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE salary_advances DISABLE ROW LEVEL SECURITY;

-- Thêm dữ liệu mẫu mặc định
INSERT INTO employees (name, dob, hourly_rate) VALUES
('Nguyễn Văn A', '1995-05-12', 35000),
('Trần Thị B', '1998-08-24', 40000),
('Lê Hoàng C', '1993-11-02', 38000),
('Phạm Minh D', '1997-03-15', 35000),
('Vũ Phương E', '2000-01-20', 45000);

INSERT INTO shift_types (name, start_time, end_time, duration_hours, color) VALUES
('Ca Sáng', '08:00:00', '12:00:00', 4.0, 'emerald'),
('Ca Chiều', '13:00:00', '17:00:00', 4.0, 'sky'),
('Ca Tối', '18:00:00', '22:00:00', 4.0, 'indigo'),
('Ca Hành Chính', '08:00:00', '17:00:00', 8.0, 'amber'),
('Ca Đêm', '22:00:00', '06:00:00', 8.0, 'rose');
`;

// Database Engine Interface
export const db = {
  // EMPLOYEES API
  async getEmployees(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async upsertEmployee(employee: Omit<Employee, 'id'> & { id?: string }): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .upsert({
        id: employee.id || undefined,
        name: employee.name,
        dob: employee.dob,
        hourly_rate: Number(employee.hourly_rate),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteEmployee(id: string): Promise<boolean> {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // SHIFT TYPES API
  async getShiftTypes(): Promise<ShiftType[]> {
    const { data, error } = await supabase
      .from('shift_types')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async upsertShiftType(shift: Omit<ShiftType, 'id'> & { id?: string }): Promise<ShiftType> {
    const { data, error } = await supabase
      .from('shift_types')
      .upsert({
        id: shift.id || undefined,
        name: shift.name,
        start_time: shift.start_time,
        end_time: shift.end_time,
        duration_hours: Number(shift.duration_hours),
        color: shift.color,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteShiftType(id: string): Promise<boolean> {
    const { error } = await supabase.from('shift_types').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // ASSIGNMENTS API
  async getAssignments(startDate: string, endDate: string): Promise<ShiftAssignment[]> {
    const { data, error } = await supabase
      .from('shift_assignments')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);
    if (error) throw error;
    return data || [];
  },

  async addAssignment(employeeId: string, date: string, shiftTypeId: string): Promise<ShiftAssignment> {
    const { data, error } = await supabase
      .from('shift_assignments')
      .insert({
        employee_id: employeeId,
        date: date,
        shift_type_id: shiftTypeId,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteAssignment(id: string): Promise<boolean> {
    const { error } = await supabase.from('shift_assignments').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // Batch apply weeks to months
  async applyWeekToMonth(sourceWeekDates: string[], targetMonthYear: string): Promise<{ count: number }> {
    // sourceWeekDates is an array of 7 dates [Mon, Tue, Wed, Thu, Fri, Sat, Sun] in YYYY-MM-DD format.
    // targetMonthYear is "YYYY-MM" format

    // Step 1: Read all assignments in source week
    const { data: sourceAssignments, error } = await supabase
      .from('shift_assignments')
      .select('*')
      .gte('date', sourceWeekDates[0])
      .lte('date', sourceWeekDates[6]);
    if (error) throw error;

    if (!sourceAssignments || sourceAssignments.length === 0) {
      return { count: 0 };
    }

    // Parse target month
    const [yearStr, monthStr] = targetMonthYear.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // JS Month is 0-indexed

    // Calculate all dates in the target month
    const totalDays = new Date(year, month + 1, 0).getDate();
    const newAssignments: Omit<ShiftAssignment, 'id'>[] = [];

    // Create a mapping of source assignment Day of Week (0 = Sun, 1 = Mon, ... 6 = Sat)
    const assignmentsByDayOfWeek: { [day: number]: ShiftAssignment[] } = {
      0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
    };

    sourceAssignments.forEach(assign => {
      const dayVal = new Date(assign.date).getDay();
      assignmentsByDayOfWeek[dayVal].push(assign);
    });

    // For each date in target month, assign the same shifts as the matching Day of Week
    for (let d = 1; d <= totalDays; d++) {
      const curDate = new Date(year, month, d);
      const curDateStr = curDate.toISOString().split('T')[0];

      // If this date is in the source week, skip it to avoid duplicate inserts or conflicts
      if (sourceWeekDates.includes(curDateStr)) {
        continue;
      }

      const dayOfWeek = curDate.getDay();
      const matchingShifts = assignmentsByDayOfWeek[dayOfWeek];

      matchingShifts.forEach(ms => {
        newAssignments.push({
          employee_id: ms.employee_id,
          date: curDateStr,
          shift_type_id: ms.shift_type_id,
        });
      });
    }

    if (newAssignments.length === 0) {
      return { count: 0 };
    }

    const targetDates = newAssignments.map(n => n.date);
    // Delete existing assignments in the target month (excluding the source week) to replace them cleanly
    const { error: delErr } = await supabase
      .from('shift_assignments')
      .delete()
      .in('date', targetDates);

    if (delErr) throw delErr;

    const { data: insData, error: insErr } = await supabase
      .from('shift_assignments')
      .insert(newAssignments)
      .select();

    if (insErr) throw insErr;
    const count = insData ? insData.length : 0;

    return { count };
  },

  // SALARY ADVANCES API
  async getSalaryAdvances(startDate: string, endDate: string): Promise<SalaryAdvance[]> {
    const { data, error } = await supabase
      .from('salary_advances')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addSalaryAdvance(advance: Omit<SalaryAdvance, 'id'>): Promise<SalaryAdvance> {
    const { data, error } = await supabase
      .from('salary_advances')
      .insert({
        employee_id: advance.employee_id,
        date: advance.date,
        amount: Number(advance.amount),
        notes: advance.notes || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteSalaryAdvance(id: string): Promise<boolean> {
    const { error } = await supabase.from('salary_advances').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};
