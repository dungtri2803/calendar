import { useState, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  Plus,
  X,
  Clock,
  Palette,
  Copy,
  Check,
  Info,
  HelpCircle
} from 'lucide-react';
import { Employee, ShiftType, ShiftAssignment, SalaryAdvance } from '../types';
import {
  getOfWeekDates,
  formatDateString,
  formatVND
} from '../utils/calculations';
import moment from 'moment';

interface ShiftSchedulerProps {
  employees: Employee[];
  shiftTypes: ShiftType[];
  assignments: ShiftAssignment[];
  salaryAdvances: SalaryAdvance[];
  onAddAssignment: (employeeId: string, date: string, shiftTypeId: string) => Promise<void>;
  onDeleteAssignment: (id: string) => Promise<void>;
  onApplyWeekToMonth: (sourceWeekDates: string[], targetMonthYear: string) => Promise<number>;
  onAddShiftType: (shift: Omit<ShiftType, 'id'>) => Promise<void>;
  onDeleteShiftType: (id: string) => Promise<void>;
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

// Color mapping for backgrounds and borders
const SHIFT_COLOR_MAP: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  emerald: {
    bg: 'bg-emerald-50 hover:bg-emerald-100/80',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500'
  },
  sky: {
    bg: 'bg-sky-50 hover:bg-sky-100/80',
    border: 'border-sky-200',
    text: 'text-sky-700',
    dot: 'bg-sky-500'
  },
  indigo: {
    bg: 'bg-indigo-50 hover:bg-indigo-100/80',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
    dot: 'bg-indigo-500'
  },
  amber: {
    bg: 'bg-amber-50 hover:bg-amber-100/80',
    border: 'border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-500'
  },
  rose: {
    bg: 'bg-rose-50 hover:bg-rose-100/80',
    border: 'border-rose-200',
    text: 'text-rose-700',
    dot: 'bg-rose-500'
  },
};

export default function ShiftScheduler({
  employees,
  shiftTypes,
  assignments,
  salaryAdvances,
  onAddAssignment,
  onDeleteAssignment,
  onApplyWeekToMonth,
  onAddShiftType,
  onDeleteShiftType,
}: ShiftSchedulerProps) {
  // Scheduling date states
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);

  // UI states
  const [draggedShiftTypeId, setDraggedShiftTypeId] = useState<string | null>(null);
  const [isDraggingOverCell, setIsDraggingOverCell] = useState<string | null>(null); // employeeId_dateStr
  const [activeTab, setActiveTab] = useState<'grid' | 'shifts'>('grid');

  // Apply Month states
  const [isApplying, setIsApplying] = useState(false);
  const [appliedCount, setAppliedCount] = useState<number | null>(null);

  // Shift manager states
  const [newShiftName, setNewShiftName] = useState('');
  const [newShiftStart, setNewShiftStart] = useState('09:00');
  const [newShiftEnd, setNewShiftEnd] = useState('17:00');
  const [newShiftDuration, setNewShiftDuration] = useState(8);
  const [newShiftColor, setNewShiftColor] = useState('indigo');

  // Quick-assign popup (mobile support)
  const [mobilePopupCell, setMobilePopupCell] = useState<{ employeeId: string; dateStr: string } | null>(null);

  // Update weekly dates when reference date shifts
  useEffect(() => {
    setWeekDates(getOfWeekDates(referenceDate));
  }, [referenceDate]);

  // Date navigation helpers
  const handlePrevWeek = () => {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - 7);
    setReferenceDate(d);
    setAppliedCount(null);
  };

  const handleNextWeek = () => {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() + 7);
    setReferenceDate(d);
    setAppliedCount(null);
  };

  const handleToday = () => {
    setReferenceDate(new Date());
    setAppliedCount(null);
  };

  // Drag and Drop handlers
  const handleDragStart = (shiftTypeId: string) => {
    setDraggedShiftTypeId(shiftTypeId);
  };

  const handleDragEnd = () => {
    setDraggedShiftTypeId(null);
  };

  const handleCellDragOver = (e: React.DragEvent, employeeId: string, dateStr: string) => {
    e.preventDefault();
    setIsDraggingOverCell(`${employeeId}_${dateStr}`);
  };

  const handleCellDragLeave = () => {
    setIsDraggingOverCell(null);
  };

  const handleDrop = async (employeeId: string, dateStr: string, e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverCell(null);

    const shiftTypeId = draggedShiftTypeId || e.dataTransfer.getData('shift_type_id');
    if (!shiftTypeId) return;

    // Avoid double assigning the exact same shift on the exact same day
    const isAssigned = assignments.some(
      (a) => a.employee_id === employeeId && a.date === dateStr && a.shift_type_id === shiftTypeId
    );

    if (isAssigned) return;

    await onAddAssignment(employeeId, dateStr, shiftTypeId);
  };

  // Quick assign handler (non-drag & drop / click cell)
  const handleCellClick = (employeeId: string, dateStr: string) => {
    setMobilePopupCell({ employeeId, dateStr });
  };

  const handleQuickAssign = async (shiftTypeId: string) => {
    if (!mobilePopupCell) return;
    const { employeeId, dateStr } = mobilePopupCell;

    const isAssigned = assignments.some(
      (a) => a.employee_id === employeeId && a.date === dateStr && a.shift_type_id === shiftTypeId
    );

    if (!isAssigned) {
      await onAddAssignment(employeeId, dateStr, shiftTypeId);
    }
    setMobilePopupCell(null);
  };

  // Apply Week to Month
  const handleApplyWeekToMonth = async () => {
    if (weekDates.length === 0) return;

    setIsApplying(true);
    setAppliedCount(null);

    // Get string representations of current week dates
    const sourceWeekDates = weekDates.map(d => formatDateString(d));

    // Target month in format YYYY-MM
    const refMonth = String(referenceDate.getMonth() + 1).padStart(2, '0');
    const targetMonthYear = `${referenceDate.getFullYear()}-${refMonth}`;

    try {
      const createdCount = await onApplyWeekToMonth(sourceWeekDates, targetMonthYear);
      setAppliedCount(createdCount);
    } catch (error) {
      alert('Lỗi khi áp dụng lịch tháng');
    } finally {
      setIsApplying(false);
    }
  };

  // Create customized shift type
  const handleCreateShiftType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShiftName.trim()) return;

    try {
      await onAddShiftType({
        name: newShiftName.trim(),
        start_time: newShiftStart,
        end_time: newShiftEnd,
        duration_hours: Number(newShiftDuration),
        color: newShiftColor,
      });
      setNewShiftName('');
    } catch (e) {
      alert('Lỗi khi tạo loại ca.');
    }
  };

  const escapeCsvValue = (value: string | number) => {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  };

  const handleExportWeeklyExcel = () => {
    if (weekDates.length === 0) return;

    const weekDateStrings = weekDates.map((date) => formatDateString(date));
    const headers = [
      'Họ và tên',
      ...weekDates.map((date) => {
        const dayName = DAY_NAMES_VN[date.getDay()];
        return `${dayName} ${formatDateString(date).split('-').reverse().join('/')}`;
      }),
      'Ứng lương trong tuần',
    ];

    const rows = employees.map((employee) => {
      const scheduleCells = weekDateStrings.map((dateStr) => {
        const dayAssignments = assignments.filter(
          (assignment) => assignment.employee_id === employee.id && assignment.date === dateStr
        );

        if (dayAssignments.length === 0) return 'Nghỉ';

        return dayAssignments
          .map((assignment) => {
            const shift = shiftTypes.find((item) => item.id === assignment.shift_type_id);
            if (!shift) return 'Ca không xác định';
            return `${shift.name}: ${shift.start_time} - ${shift.end_time} (${shift.duration_hours}h)`;
          })
          .join('\n');
      });

      const advanceNotes = salaryAdvances
        .filter((advance) => advance.employee_id === employee.id && weekDateStrings.includes(advance.date))
        .map((advance) => `${advance.date.split('-').reverse().join('/')}: ${formatVND(advance.amount)}`)
        .join('\n') || 'Không có';

      return [employee.name, ...scheduleCells, advanceNotes];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers, ...rows]
        .map((row) => row.map(escapeCsvValue).join(','))
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    const startDate = weekDateStrings[0];
    const endDate = weekDateStrings[weekDateStrings.length - 1];
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StaffFlow_LichLamViec_${startDate}_den_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const monthLabel = referenceDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">

      {/* Top Heading */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Lập Ca Làm Việc</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500 sm:text-base">Xếp lịch trực quan bằng cách kéo thả các loại ca từ danh mục vào ô tương ứng của nhân viên.</p>
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 md:flex md:items-center md:gap-2">
          <button
            onClick={() => setActiveTab('grid')}
            className={`rounded-lg px-3 py-2 text-xs font-bold transition-all md:px-4 md:py-1.5 ${activeTab === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
          >
            Bản Phân Ca Tuần
          </button>
          <button
            onClick={() => setActiveTab('shifts')}
            className={`rounded-lg px-3 py-2 text-xs font-bold transition-all md:px-4 md:py-1.5 ${activeTab === 'shifts' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
          >
            Tùy Chỉnh Ca Trực ({shiftTypes.length})
          </button>
        </div>
      </div>

      {activeTab === 'grid' ? (
        <div className="grid gap-6 lg:grid-cols-4 items-start">

          {/* Left Column (Grid View - 3 cols) */}
          <div className="lg:col-span-3 space-y-4">

            {/* Weekly Nav controls */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 md:flex-row md:flex-wrap md:items-center md:justify-between">
              <div className="flex items-center justify-between gap-1 sm:justify-start">
                <button
                  onClick={handlePrevWeek}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-slate-200"
                  title="Tuần trước"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={handleToday}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Tuần này
                </button>
                <button
                  onClick={handleNextWeek}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-slate-200"
                  title="Tuần tiếp theo"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-800">
                <Calendar className="h-4.5 w-4.5 text-indigo-500" />
                <span className="capitalize">{monthLabel}</span>
                {weekDates.length > 0 && (
                  <span className="text-xs text-slate-400 font-medium">
                    ({weekDates[0].getDate()}/{weekDates[0].getMonth() + 1} - {weekDates[6].getDate()}/{weekDates[6].getMonth() + 1})
                  </span>
                )}
              </div>

              {/* Fast copy actions */}
              <div className="grid w-full gap-2 min-[430px]:grid-cols-2 md:w-auto">
                <button
                  onClick={handleExportWeeklyExcel}
                  disabled={employees.length === 0}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition-all hover:bg-emerald-100 disabled:opacity-50"
                  title="Xuất Excel lịch làm việc và ứng lương của tuần đang xem"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Xuất Excel tuần</span>
                </button>
                <button
                  onClick={handleApplyWeekToMonth}
                  disabled={isApplying || employees.length === 0}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 transition-all hover:bg-indigo-100 disabled:opacity-50"
                  title="Sao chép toàn bộ phân lịch tuần này áp dụng cho tất cả các tuần còn lại của tháng hiện tại"
                >
                  {isApplying ? (
                    <span>Đang xử lý...</span>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Áp dụng cả tháng</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Notifications of calendar status */}
            {appliedCount !== null && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 animate-fade-in">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Đã sao chép và xếp lịch tự động thành công! Tổng cộng <strong>{appliedCount} ca làm việc</strong> đã được tạo cho toàn bộ tháng này.</span>
                </div>
                <button onClick={() => setAppliedCount(null)} className="text-emerald-500 hover:text-emerald-800">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Drag & Drop instructions */}
            <div className="hidden items-center gap-2 rounded-xl border border-slate-150 bg-slate-50 px-4 py-2.5 text-xs text-slate-600 md:flex">
              <Info className="h-4 w-4 text-slate-500 shrink-0" />
              <span>
                <strong>Mẹo kéo thả:</strong> Chọn 1 loại ca từ thanh bên phải, kéo trực tiếp vào ô của nhân viên mong muốn. Bạn cũng có thể click thẳng vào ô để thêm nhanh hoặc click dấu <strong>×</strong> để xóa ca.
              </span>
            </div>

            {/* Dynamic Weekly Scheduling Grid */}
            {employees.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                <HelpCircle className="h-12 w-12 text-slate-300" />
                <h4 className="mt-4 text-lg font-bold text-slate-900">Chưa có nhân viên nào</h4>
                <p className="mt-1 text-sm text-slate-500">Vui lòng sang mục "Nhân viên" để tạo nhân sự trước khi sắp xếp ca trực.</p>
              </div>
            ) : (
              <>
                <div className="grid gap-3 md:hidden">
                  {employees.map((emp) => (
                    <div key={emp.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-bold text-slate-900">{emp.name}</h3>
                          <p className="text-xs text-slate-500">Lương: {formatVND(emp.hourly_rate)}/h</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {weekDates.map((date, idx) => {
                          const dateStr = formatDateString(date);
                          const isToday = dateStr === new Date().toISOString().split('T')[0];
                          const dayName = DAY_NAMES_VN[date.getDay()];
                          const dayAssignments = assignments.filter(
                            (a) => a.employee_id === emp.id && a.date === dateStr
                          );

                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleCellClick(emp.id, dateStr)}
                              className={`w-full rounded-xl border p-3 text-left transition-colors ${isToday ? 'border-indigo-200 bg-indigo-50/60' : 'border-slate-200 bg-slate-50/50'
                                }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{dayName}</div>
                                  <div className="text-sm font-black text-slate-800">{date.getDate()}/{date.getMonth() + 1}</div>
                                </div>
                                {dayAssignments.length === 0 && (
                                  <span className="rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-[11px] font-bold text-slate-400">
                                    + Phân ca
                                  </span>
                                )}
                              </div>

                              {dayAssignments.length > 0 && (
                                <div className="mt-3 space-y-1.5">
                                  {dayAssignments.map((assign) => {
                                    const shift = shiftTypes.find((s) => s.id === assign.shift_type_id);
                                    if (!shift) return null;
                                    const details = SHIFT_COLOR_MAP[shift.color] || {
                                      bg: 'bg-slate-50',
                                      border: 'border-slate-200',
                                      text: 'text-slate-700',
                                      dot: 'bg-slate-500'
                                    };

                                    return (
                                      <div
                                        key={assign.id}
                                        className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-xs font-bold ${details.bg} ${details.border} ${details.text}`}
                                        onClick={(event) => event.stopPropagation()}
                                      >
                                        <span className="min-w-0 truncate">
                                          {shift.name} ·{" "}
                                          {moment(shift.start_time, "HH:mm:ss").format("HH:mm")}-
                                          {moment(shift.end_time, "HH:mm:ss").format("HH:mm")}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={async (event) => {
                                            event.stopPropagation();
                                            await onDeleteAssignment(assign.id);
                                          }}
                                          className="shrink-0 rounded-md p-1 text-slate-500 hover:bg-white/80 hover:text-rose-600"
                                          title="Xóa ca"
                                        >
                                          <X className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left table-fixed min-w-[850px]">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/55">
                          {/* Employee Column */}
                          <th className="w-[180px] px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider sticky left-0 bg-slate-50 z-10">
                            Nhân viên
                          </th>
                          {/* Days of the week Columns */}
                          {weekDates.map((date, idx) => {
                            const dateStr = formatDateString(date);
                            const isToday = dateStr === new Date().toISOString().split('T')[0];
                            const dayName = DAY_NAMES_VN[date.getDay()];

                            return (
                              <th
                                key={idx}
                                className={`px-2 py-3 text-center border-l border-slate-150 z-0 ${isToday ? 'bg-indigo-50/30' : ''
                                  }`}
                              >
                                <div className="text-xs font-bold text-slate-400 uppercase">{dayName}</div>
                                <div className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold mt-1 ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-800'
                                  }`}>
                                  {date.getDate()}
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-medium">
                        {employees.map((emp) => {
                          return (
                            <tr key={emp.id} className="hover:bg-slate-50/20">
                              {/* Employee Info Name Card (Sticky Column) */}
                              <td className="px-4 py-4 font-bold text-slate-800 sticky left-0 bg-white border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-10">
                                <div className="truncate">{emp.name}</div>
                                <div className="text-[10px] font-normal text-slate-400 truncate">
                                  Lương: {formatVND(emp.hourly_rate)}/h
                                </div>
                              </td>

                              {/* Weekdays Cells */}
                              {weekDates.map((date, idx) => {
                                const dateStr = formatDateString(date);
                                const cellId = `${emp.id}_${dateStr}`;
                                const isOver = isDraggingOverCell === cellId;

                                // Get assigned shifts for this employee on this date
                                const cellAssignments = assignments.filter(
                                  (a) => a.employee_id === emp.id && a.date === dateStr
                                );

                                return (
                                  <td
                                    key={idx}
                                    onDragOver={(e) => handleCellDragOver(e, emp.id, dateStr)}
                                    onDragLeave={handleCellDragLeave}
                                    onDrop={(e) => handleDrop(emp.id, dateStr, e)}
                                    onClick={() => handleCellClick(emp.id, dateStr)}
                                    className={`p-2 border-l border-slate-100 text-center align-top min-h-[80px] cursor-pointer transition-all relative ${isOver ? 'bg-indigo-50 border-2 border-dashed border-indigo-400' : ''
                                      } ${cellAssignments.length === 0 ? 'hover:bg-slate-50/50' : ''}`}
                                  >
                                    <div className="space-y-1.5 min-h-[50px]">
                                      {cellAssignments.map((assign) => {
                                        const shift = shiftTypes.find((s) => s.id === assign.shift_type_id);
                                        if (!shift) return null;

                                        const details = SHIFT_COLOR_MAP[shift.color] || {
                                          bg: 'bg-slate-50',
                                          border: 'border-slate-200',
                                          text: 'text-slate-700',
                                          dot: 'bg-slate-500'
                                        };

                                        return (
                                          <div
                                            key={assign.id}
                                            onClick={(e) => {
                                              // Prevent triggering mobile popup
                                              e.stopPropagation();
                                            }}
                                            className={`group flex items-center justify-between rounded-lg border p-1.5 text-[10px] font-bold transition-all shadow-2xs ${details.bg} ${details.border} ${details.text}`}
                                            title={`${shift.name}: ${shift.start_time} - ${shift.end_time} (${shift.duration_hours} giờ)`}
                                          >
                                            <span className="truncate max-w-[80%] flex items-center gap-1">
                                              <span className={`h-1.5 w-1.5 rounded-full ${details.dot}`} />
                                              {shift.name}
                                            </span>
                                            <button
                                              onClick={async (e) => {
                                                e.stopPropagation();
                                                await onDeleteAssignment(assign.id);
                                              }}
                                              className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-slate-200/60 text-slate-500 hover:text-rose-600 transition-opacity"
                                              title="Xóa ca"
                                            >
                                              <X className="h-3 w-3" />
                                            </button>
                                          </div>
                                        );
                                      })}
                                      {cellAssignments.length === 0 && (
                                        <div className="text-[10px] text-slate-300 py-4 font-normal opacity-0 hover:opacity-100 transition-opacity select-none">
                                          + Phân ca
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Column (Shift Templates Sidebar - 1 col) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4 sm:p-5">
              <div>
                <h3 className="font-bold text-slate-900">Danh Mục Ca Trực</h3>
                <p className="text-xs text-slate-500 mt-0.5">Kéo các thẻ dưới đây vào ô nhân viên để phân lịch nhanh.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {shiftTypes.map((shift) => {
                  const details = SHIFT_COLOR_MAP[shift.color] || {
                    bg: 'bg-slate-50 hover:bg-slate-100',
                    border: 'border-slate-200',
                    text: 'text-slate-700',
                    dot: 'bg-slate-500'
                  };

                  return (
                    <div
                      key={shift.id}
                      draggable
                      onDragStart={(e) => {
                        handleDragStart(shift.id);
                        e.dataTransfer.setData('shift_type_id', shift.id);
                      }}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center justify-between rounded-xl border p-3 cursor-grab active:cursor-grabbing transition-all shadow-2xs hover:shadow-xs border-l-4 ${shift.color === 'emerald' ? 'border-l-emerald-500' :
                        shift.color === 'sky' ? 'border-l-sky-500' :
                          shift.color === 'indigo' ? 'border-l-indigo-500' :
                            shift.color === 'amber' ? 'border-l-amber-500' : 'border-l-rose-500'
                        } ${details.bg} ${details.border} ${details.text}`}
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-xs flex items-center gap-1">
                          <span className={`h-2 w-2 rounded-full ${details.dot}`} />
                          {shift.name}
                        </div>
                        <div className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {moment(shift.start_time, "HH:mm:ss").format("HH:mm")} -{" "}
                            {moment(shift.end_time, "HH:mm:ss").format("HH:mm")} (
                            {shift.duration_hours}h)
                          </span>
                        </div>
                      </div>
                      <div className="rounded-md bg-white/60 px-1.5 py-0.5 text-[9px] font-bold tracking-wider border border-slate-200/50 text-slate-500 uppercase">
                        <span className="hidden sm:inline">Kéo đi</span>
                        <span className="sm:hidden">Chọn</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-slate-100 pt-4">
                <button
                  onClick={() => setActiveTab('shifts')}
                  className="w-full text-center rounded-xl border border-dashed border-slate-300 py-2 text-xs font-bold text-slate-500 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
                >
                  + Tạo hoặc chỉnh sửa loại ca
                </button>
              </div>
            </div>
          </div>

        </div>
      ) : (

        /* Tab 2: Shifts configuration manager */
        <div className="grid gap-6 md:grid-cols-3 items-start">
          {/* Left: Shift Form (1 col) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4 sm:p-6">
            <div>
              <h3 className="font-bold text-slate-950">Tạo Ca Trực Mới</h3>
              <p className="text-xs text-slate-500">Tạo các ca đặc trưng của công ty để phục vụ phân lịch.</p>
            </div>

            <form onSubmit={handleCreateShiftType} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tên ca làm việc</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Ca Sáng Thứ 7"
                  value={newShiftName}
                  onChange={(e) => setNewShiftName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid gap-3 min-[420px]:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Giờ bắt đầu</label>
                  <input
                    type="time"
                    value={newShiftStart}
                    onChange={(e) => setNewShiftStart(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none sm:py-2"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Giờ kết thúc</label>
                  <input
                    type="time"
                    value={newShiftEnd}
                    onChange={(e) => setNewShiftEnd(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none sm:py-2"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tổng số giờ công thực tế</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={newShiftDuration}
                  onChange={(e) => setNewShiftDuration(Number(e.target.value))}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Color Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <Palette className="h-3.5 w-3.5" />
                  Màu hiển thị trên lịch
                </label>
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  {Object.keys(SHIFT_COLOR_MAP).map((colorName) => {
                    const color = SHIFT_COLOR_MAP[colorName];
                    return (
                      <button
                        key={colorName}
                        type="button"
                        onClick={() => setNewShiftColor(colorName)}
                        className={`h-7 w-7 rounded-full ${color.dot} border-2 transition-all ${newShiftColor === colorName ? 'border-slate-950 ring-2 ring-indigo-100 scale-110 shadow-xs' : 'border-transparent'
                          }`}
                        title={colorName}
                      />
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                <Plus className="h-4 w-4" />
                Lưu ca trực mới
              </button>
            </form>
          </div>

          {/* Right: Shift Types List (2 cols) */}
          <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h3 className="font-bold text-slate-900 mb-4">Cấu Hình Ca Trực Hiện Có</h3>

            <div className="grid gap-4 lg:grid-cols-2">
              {shiftTypes.map((shift) => {
                const details = SHIFT_COLOR_MAP[shift.color] || {
                  bg: 'bg-slate-50',
                  border: 'border-slate-200',
                  text: 'text-slate-700',
                  dot: 'bg-slate-500'
                };

                // Count how many times this shift is used
                const isUsed = assignments.some(a => a.shift_type_id === shift.id);

                return (
                  <div
                    key={shift.id}
                    className={`rounded-xl border p-4 space-y-3 shadow-2xs transition-hover hover:shadow-xs ${details.bg} ${details.border} ${details.text}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm flex items-center gap-1.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${details.dot}`} />
                        {shift.name}
                      </span>
                      <button
                        onClick={() => {
                          if (isUsed) {
                            const conf = window.confirm(
                              `Cảnh báo: Ca này đã được phân cho nhân viên. Xóa ca này sẽ xóa toàn bộ lịch phân ca liên quan trong hệ thống. Bạn vẫn muốn tiếp tục?`
                            );
                            if (!conf) return;
                          }
                          onDeleteShiftType(shift.id);
                        }}
                        className="rounded-lg p-1 hover:bg-white/80 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Xóa cấu hình ca"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-white/50 p-2.5 rounded-lg border border-slate-200/30">
                      <div>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase">Giờ bắt đầu</div>
                        <div className="font-bold">{shift.start_time}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase">Giờ kết thúc</div>
                        <div className="font-bold">{shift.end_time}</div>
                      </div>
                      <div className="col-span-2 border-t border-slate-200/40 pt-1.5 mt-1.5 flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">Tổng số giờ</span>
                        <span className="font-bold text-slate-800">{shift.duration_hours} giờ công</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Action Sheet Popup for Quick Assigning shifts */}
      {mobilePopupCell && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md overflow-hidden rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white shadow-xl animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900">Phân ca nhanh</h3>
                <p className="text-xs text-slate-500">
                  Nhân viên: <span className="font-bold text-indigo-600">
                    {employees.find(e => e.id === mobilePopupCell.employeeId)?.name}
                  </span>
                </p>
                <p className="text-[10px] text-slate-400">Ngày: {mobilePopupCell.dateStr.split('-').reverse().join('/')}</p>
              </div>
              <button
                onClick={() => setMobilePopupCell(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-500 font-semibold">Chọn loại ca trực để phân lịch:</p>

              <div className="grid gap-2">
                {shiftTypes.map((shift) => {
                  const details = SHIFT_COLOR_MAP[shift.color] || {
                    bg: 'bg-slate-50',
                    border: 'border-slate-200',
                    text: 'text-slate-700',
                    dot: 'bg-slate-500'
                  };
                  return (
                    <button
                      key={shift.id}
                      onClick={() => handleQuickAssign(shift.id)}
                      className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition-all hover:scale-[1.01] ${details.bg} ${details.border} ${details.text}`}
                    >
                      <span className="font-bold text-xs flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${details.dot}`} />
                        {shift.name}
                      </span>
                      <span className="text-xs font-bold">
                        {shift.start_time} - {shift.end_time} ({shift.duration_hours}h)
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 flex justify-end border-t border-slate-100">
              <button
                onClick={() => setMobilePopupCell(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
