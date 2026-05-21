import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Sparkles,
  BadgeCheck
} from 'lucide-react';
import { Employee, ShiftType, ShiftAssignment } from '../types';
import { 
  getOfWeekDates, 
  formatDateString, 
  calculateHours, 
  calculateSalary, 
  formatVND,
  filterAssignmentsByMonth
} from '../utils/calculations';

interface UserViewProps {
  employee: Employee;
  shiftTypes: ShiftType[];
  assignments: ShiftAssignment[];
}

const DAY_NAMES_VN = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
];

const SHIFT_COLOR_MAP: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  sky: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', dot: 'bg-sky-500' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500' },
};

export default function UserView({
  employee,
  shiftTypes,
  assignments,
}: UserViewProps) {
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);

  // Get dates of current week
  useEffect(() => {
    setWeekDates(getOfWeekDates(referenceDate));
  }, [referenceDate]);

  const handlePrevWeek = () => {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - 7);
    setReferenceDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() + 7);
    setReferenceDate(d);
  };

  const handleToday = () => {
    setReferenceDate(new Date());
  };

  // Month string for totals
  const now = new Date();
  const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthAssignments = filterAssignmentsByMonth(assignments, currentMonthYear);

  // Monthly personal stats
  const totalHoursMonth = calculateHours(employee.id, currentMonthAssignments, shiftTypes);
  const totalSalaryMonth = calculateSalary(employee.id, currentMonthAssignments, shiftTypes, employee.hourly_rate);
  const totalShiftsMonth = currentMonthAssignments.filter(a => a.employee_id === employee.id).length;

  const weekLabel = referenceDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-700 p-6 text-white shadow-md">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur-md">
            <BadgeCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Không gian làm việc nhân viên</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Xin chào, {employee.name}!</h2>
          <p className="text-indigo-100 text-xs sm:text-sm font-medium max-w-lg leading-relaxed">
            Chào mừng bạn quay trở lại. Xem chi tiết lịch phân ca của bạn cho tuần này và theo dõi tổng hợp ngày công & tiền lương tạm tính.
          </p>
        </div>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute bottom-0 right-12 -mb-20 h-64 w-64 rounded-full bg-white/5" />
      </div>

      {/* Monthly Summary Widget Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Card A: Hours */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Công làm tháng này</p>
            <h4 className="text-xl font-black text-slate-800 mt-0.5">{totalHoursMonth} <span className="text-xs font-normal text-slate-400">giờ</span></h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Ước tính qua {totalShiftsMonth} ca trực</p>
          </div>
        </div>

        {/* Card B: Rate */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mức lương theo giờ</p>
            <h4 className="text-xl font-black text-slate-800 mt-0.5">{formatVND(employee.hourly_rate)}</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Được cấu hình cố định</p>
          </div>
        </div>

        {/* Card C: Salary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lương tạm tính tháng</p>
            <h4 className="text-xl font-black text-rose-600 mt-0.5">{formatVND(totalSalaryMonth)}</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Tổng giờ nhân mức lương/giờ</p>
          </div>
        </div>
      </div>

      {/* Grid layout: Calendar & Information details */}
      <div className="grid gap-6 md:grid-cols-3 items-start">
        
        {/* Left panel: Weekly Schedule (2 cols) */}
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            
            {/* Nav calendar header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevWeek}
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-50 border border-slate-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleToday}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Hôm nay
                </button>
                <button
                  onClick={handleNextWeek}
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-50 border border-slate-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-indigo-600" />
                <span className="capitalize">{weekLabel}</span>
              </div>
            </div>

            {/* Grid representing Mon - Sun for this single employee */}
            <div className="grid gap-3 sm:grid-cols-7">
              {weekDates.map((date, idx) => {
                const dateStr = formatDateString(date);
                const isToday = dateStr === new Date().toISOString().split('T')[0];
                const dayName = DAY_NAMES_VN[date.getDay()];
                
                // Get shifts assigned to THIS employee on THIS day
                const dayShifts = assignments.filter(
                  (a) => a.employee_id === employee.id && a.date === dateStr
                );

                return (
                  <div 
                    key={idx} 
                    className={`rounded-xl border p-3 flex flex-col justify-between min-h-[110px] shadow-2xs transition-all ${
                      isToday 
                        ? 'bg-indigo-50/40 border-indigo-300 scale-102 ring-1 ring-indigo-200' 
                        : 'bg-slate-50/40 border-slate-150 hover:bg-slate-50'
                    }`}
                  >
                    <div className="border-b border-slate-100 pb-1.5 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{dayName}</span>
                      <span className={`text-xs font-extrabold rounded-full h-5 w-5 flex items-center justify-center ${
                        isToday ? 'bg-indigo-600 text-white' : 'text-slate-700'
                      }`}>
                        {date.getDate()}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1 flex-1 flex flex-col justify-center">
                      {dayShifts.length === 0 ? (
                        <span className="text-[9px] text-slate-400 font-medium italic text-center py-3">Nghỉ ca</span>
                      ) : (
                        dayShifts.map((assign) => {
                          const shift = shiftTypes.find((s) => s.id === assign.shift_type_id);
                          if (!shift) return null;
                          const details = SHIFT_COLOR_MAP[shift.color] || {
                            bg: 'bg-slate-100',
                            border: 'border-slate-200',
                            text: 'text-slate-700',
                            dot: 'bg-slate-500'
                          };
                          return (
                            <div 
                              key={assign.id} 
                              className={`rounded-lg border px-1.5 py-1 text-[9px] font-bold text-center ${details.bg} ${details.border} ${details.text}`}
                              title={`${shift.name}: ${shift.start_time} - ${shift.end_time}`}
                            >
                              <div className="truncate">{shift.name}</div>
                              <div className="text-[8px] font-semibold opacity-80">{shift.start_time}-{shift.end_time}</div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* Right panel: Profile details (1 col) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
          <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-1.5 text-xs uppercase tracking-wider">
            <User className="h-4.5 w-4.5 text-indigo-600" />
            Thông tin cá nhân
          </h3>

          <div className="space-y-3.5 text-xs">
            <div>
              <span className="text-slate-400 font-semibold uppercase block text-[10px]">Họ và tên</span>
              <span className="text-sm font-bold text-slate-800 block mt-0.5">{employee.name}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold uppercase block text-[10px]">Ngày sinh</span>
              <span className="text-sm font-semibold text-slate-800 block mt-0.5">
                {employee.dob.split('-').reverse().join('/')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold uppercase block text-[10px]">Mã định danh</span>
              <span className="text-[10px] font-mono text-slate-500 block mt-0.5">{employee.id}</span>
            </div>
          </div>

          <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-xs leading-relaxed text-indigo-700 flex gap-2 items-start">
            <Sparkles className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Chính sách tiền lương</span>
              Lương được thanh toán tự động theo số giờ thực nhận. Nếu có bất kỳ sự sai lệch nào trong việc phân ca trực, vui lòng báo lại với quản trị viên (Admin) để được cập nhật chính xác.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
