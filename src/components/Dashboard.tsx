import { useState } from 'react';
import {
  Users,
  Clock,
  DollarSign,
  CalendarDays,
  ArrowUpRight,
  UserCheck,
  Briefcase,
  TrendingUp
} from 'lucide-react';
import { Employee, ShiftType, ShiftAssignment } from '../types';
import {
  filterAssignmentsByMonth,
  calculateHours,
  calculateSalary,
  formatVND
} from '../utils/calculations';
import moment from 'moment';

interface DashboardProps {
  employees: Employee[];
  shiftTypes: ShiftType[];
  assignments: ShiftAssignment[];
  setActiveTab: (tab: string) => void;
}

export default function Dashboard({
  employees,
  shiftTypes,
  assignments,
  setActiveTab,
}: DashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  // Filter assignments for current month
  const monthAssignments = filterAssignmentsByMonth(assignments, selectedMonth);

  // Math calculations
  const totalEmployees = employees.length;
  const totalShiftsScheduled = monthAssignments.length;

  let totalHours = 0;
  let totalPayroll = 0;

  employees.forEach((emp) => {
    const hours = calculateHours(emp.id, monthAssignments, shiftTypes);
    const salary = calculateSalary(emp.id, monthAssignments, shiftTypes, emp.hourly_rate);
    totalHours += hours;
    totalPayroll += salary;
  });



  // Shift Distribution count
  const shiftBreakdown = shiftTypes.map(type => {
    const count = monthAssignments.filter(a => a.shift_type_id === type.id).length;
    return {
      ...type,
      count
    };
  });

  // Today status
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAssignments = assignments.filter(a => a.date === todayStr);

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Bảng Tổng Quan</h2>
          <p className="text-slate-500">Xem nhanh các chỉ số hoạt động, nhân sự và chi phí lương của doanh nghiệp.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600">Tháng báo cáo:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Employees */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-hover hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Tổng Nhân Viên</p>
              <h3 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">{totalEmployees}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-indigo-600 font-medium cursor-pointer hover:underline" onClick={() => setActiveTab('employees')}>
            <span>Quản lý danh sách</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
          <div className="absolute -bottom-2 -right-2 h-16 w-16 rounded-full bg-indigo-50/30 pointer-events-none" />
        </div>

        {/* Card 2: Shifts */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-hover hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Ca Đã Phân Lịch</p>
              <h3 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">{totalShiftsScheduled}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CalendarDays className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-emerald-600 font-medium cursor-pointer hover:underline" onClick={() => setActiveTab('schedule')}>
            <span>Xếp ca kéo thả</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
          <div className="absolute -bottom-2 -right-2 h-16 w-16 rounded-full bg-emerald-50/30 pointer-events-none" />
        </div>

        {/* Card 3: Total Hours */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-hover hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Tổng Giờ Công</p>
              <h3 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">{totalHours} <span className="text-sm font-normal text-slate-500">h</span></h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500 font-medium">
            Trung bình: <span className="font-bold text-slate-700">{totalEmployees > 0 ? Math.round(totalHours / totalEmployees) : 0}h</span>/nhân viên
          </p>
          <div className="absolute -bottom-2 -right-2 h-16 w-16 rounded-full bg-amber-50/30 pointer-events-none" />
        </div>

        {/* Card 4: Payroll Cost */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-hover hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Tổng Lương Tháng</p>
              <h3 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">{formatVND(totalPayroll)}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-rose-600 font-medium cursor-pointer hover:underline" onClick={() => setActiveTab('payroll')}>
            <span>Chi tiết bảng lương</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
          <div className="absolute -bottom-2 -right-2 h-16 w-16 rounded-full bg-rose-50/30 pointer-events-none" />
        </div>
      </div>

      {/* Bottom Layout */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Left: Today's Shifts */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-indigo-600" />
              <h4 className="font-bold text-slate-900">Nhân Sự Hôm Nay</h4>
            </div>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {todayAssignments.length} ca
            </span>
          </div>

          <div className="mt-4 space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {todayAssignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Briefcase className="h-10 w-10 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-400">Hôm nay không có ca trực</p>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className="mt-3 text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Xếp lịch ngay
                </button>
              </div>
            ) : (
              todayAssignments.map((assign) => {
                const emp = employees.find((e) => e.id === assign.employee_id);
                const shift = shiftTypes.find((s) => s.id === assign.shift_type_id);

                if (!emp || !shift) return null;

                // Color map matching Tailwind classes
                const colorClasses: Record<string, string> = {
                  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  sky: 'bg-sky-50 text-sky-700 border-sky-200',
                  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                  amber: 'bg-amber-50 text-amber-700 border-amber-200',
                  rose: 'bg-rose-50 text-rose-700 border-rose-200',
                };

                return (
                  <div key={assign.id} className="flex items-center justify-between rounded-xl border border-slate-150 p-3 shadow-sm">
                    <div>
                      <h5 className="text-sm font-bold text-slate-800">{emp.name}</h5>
                      <p className="text-xs text-slate-500">Lương ca: {formatVND(shift.duration_hours * emp.hourly_rate)}</p>
                    </div>
                    <span
                      className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${colorClasses[shift.color] || "bg-slate-100 border-slate-200 text-slate-700"
                        }`}
                    >
                      {shift.name} (
                      {moment(shift.start_time, "HH:mm:ss").format("HH:mm")} -{" "}
                      {moment(shift.end_time, "HH:mm:ss").format("HH:mm")})
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Shift Types Breakdown and Top Earners */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              <h4 className="font-bold text-slate-900">Phân Bổ Ca Làm Việc & Hiệu Suất Nhân Viên</h4>
            </div>
          </div>

          {/* Grid split */}
          <div className="grid gap-6 md:grid-cols-2">

            {/* Column A: Shift allocation */}
            <div>
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Tần suất phân ca</h5>
              <div className="space-y-4">
                {shiftBreakdown.map((shift) => {
                  const percentage = totalShiftsScheduled > 0
                    ? Math.round((shift.count / totalShiftsScheduled) * 100)
                    : 0;

                  const barColors: Record<string, string> = {
                    emerald: 'bg-emerald-500',
                    sky: 'bg-sky-500',
                    indigo: 'bg-indigo-500',
                    amber: 'bg-amber-500',
                    rose: 'bg-rose-500',
                  };

                  return (
                    <div key={shift.id} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>{shift.name}</span>
                        <span>{shift.count} ca ({percentage}%)</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColors[shift.color] || 'bg-slate-500'} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Column B: Top Earners & Working Hours */}
            <div>
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Giờ làm theo nhân viên</h5>
              <div className="space-y-3">
                {employees.slice(0, 5).map((emp) => {
                  const hours = calculateHours(emp.id, monthAssignments, shiftTypes);
                  const salary = calculateSalary(emp.id, monthAssignments, shiftTypes, emp.hourly_rate);
                  const maxHoursInMonth = 160; // standard work month
                  const percentage = Math.min(100, Math.round((hours / maxHoursInMonth) * 100));

                  return (
                    <div key={emp.id} className="p-2 border border-slate-100 rounded-xl bg-slate-50/50">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-bold text-slate-800">{emp.name}</span>
                        <span className="font-semibold text-slate-600">{hours} giờ / {formatVND(salary)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
