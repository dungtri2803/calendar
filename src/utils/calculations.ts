import { ShiftType, ShiftAssignment } from '../types';

/**
 * Filter assignments belonging to a specific month and year (YYYY-MM)
 */
export function filterAssignmentsByMonth(
  assignments: ShiftAssignment[],
  monthYear: string // YYYY-MM
): ShiftAssignment[] {
  return assignments.filter((assign) => {
    return assign.date.startsWith(monthYear);
  });
}

/**
 * Calculate total hours worked by an employee in a specific list of assignments
 */
export function calculateHours(
  employeeId: string,
  assignments: ShiftAssignment[],
  shiftTypes: ShiftType[]
): number {
  // Get all assignments for this employee
  const empAssignments = assignments.filter((a) => a.employee_id === employeeId);
  
  // Map to shift durations
  let total = 0;
  empAssignments.forEach((assign) => {
    const shift = shiftTypes.find((s) => s.id === assign.shift_type_id);
    if (shift) {
      total += Number(shift.duration_hours);
    }
  });
  
  return total;
}

/**
 * Calculate total salary for an employee in a specific list of assignments
 */
export function calculateSalary(
  employeeId: string,
  assignments: ShiftAssignment[],
  shiftTypes: ShiftType[],
  hourlyRate: number
): number {
  const totalHours = calculateHours(employeeId, assignments, shiftTypes);
  return totalHours * hourlyRate;
}

/**
 * Format currency to Vietnamese Dong (VND)
 */
export function formatVND(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
}

/**
 * Get start and end dates of the week given a reference date
 */
export function getOfWeekDates(refDate: Date): Date[] {
  const date = new Date(refDate);
  const day = date.getDay();
  
  // Adjust for Monday start in Vietnam/Europe (0 = Sun, 1 = Mon, etc.)
  // if day is Sunday (0), we subtract 6 days to get back to Monday.
  // Otherwise we subtract (day - 1).
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  
  const monday = new Date(date.setDate(diff));
  
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(monday);
    nextDate.setDate(monday.getDate() + i);
    dates.push(nextDate);
  }
  return dates;
}

/**
 * Format Date to YYYY-MM-DD
 */
export function formatDateString(date: Date): string {
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
  return adjustedDate.toISOString().split('T')[0];
}
