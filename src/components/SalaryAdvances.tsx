import { useState } from 'react';
import { 
  Coins, 
  Trash2, 
  Search, 
  PlusCircle, 
  Calendar, 
  User, 
  DollarSign, 
  AlertCircle, 
  FileText,
  TrendingDown
} from 'lucide-react';
import { Employee, SalaryAdvance } from '../types';
import { formatVND } from '../utils/calculations';

interface SalaryAdvancesProps {
  employees: Employee[];
  salaryAdvances: SalaryAdvance[];
  onAddAdvance: (advance: Omit<SalaryAdvance, 'id'>) => Promise<void>;
  onDeleteAdvance: (id: string) => Promise<void>;
}

export default function SalaryAdvances({
  employees,
  salaryAdvances,
  onAddAdvance,
  onDeleteAdvance,
}: SalaryAdvancesProps) {
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  // Form State
  const [employeeId, setEmployeeId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Filter advances by month
  const monthAdvances = salaryAdvances.filter(adv => adv.date.startsWith(selectedMonth));

  // Filter advances by search term (employee name)
  const filteredAdvances = monthAdvances.filter(adv => {
    const emp = employees.find(e => e.id === adv.employee_id);
    if (!emp) return false;
    return emp.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Statistics
  const totalAdvanceAmount = monthAdvances.reduce((sum, adv) => sum + Number(adv.amount), 0);
  const totalCount = monthAdvances.length;

  // Find employee with highest advance amount
  const advancesByEmployee = monthAdvances.reduce((acc, adv) => {
    acc[adv.employee_id] = (acc[adv.employee_id] || 0) + Number(adv.amount);
    return acc;
  }, {} as Record<string, number>);

  let topBorrowerName = 'Chưa có';
  let topBorrowerAmount = 0;

  const topBorrowerId = Object.keys(advancesByEmployee).sort((a, b) => advancesByEmployee[b] - advancesByEmployee[a])[0];
  if (topBorrowerId) {
    const emp = employees.find(e => e.id === topBorrowerId);
    if (emp) {
      topBorrowerName = emp.name;
      topBorrowerAmount = advancesByEmployee[topBorrowerId];
    }
  }

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!employeeId) {
      setFormError('Vui lòng chọn nhân viên.');
      return;
    }

    const numAmount = Number(amount.replace(/[^0-9]/g, ''));
    if (!numAmount || numAmount <= 0) {
      setFormError('Vui lòng nhập số tiền ứng hợp lệ.');
      return;
    }

    if (!date) {
      setFormError('Vui lòng chọn ngày ứng lương.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddAdvance({
        employee_id: employeeId,
        amount: numAmount,
        date,
        notes: notes.trim(),
      });
      // Reset form
      setAmount('');
      setNotes('');
      // Keep employee selected or reset? Resetting is cleaner.
      setEmployeeId('');
    } catch (err: any) {
      setFormError(err.message || 'Lỗi ghi nhận ứng lương.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for typing formatted currency in input
  const handleAmountChange = (val: string) => {
    // Keep only numbers
    const cleanVal = val.replace(/[^0-9]/g, '');
    if (cleanVal === '') {
      setAmount('');
      return;
    }
    const num = parseInt(cleanVal, 10);
    setAmount(num.toLocaleString('vi-VN'));
  };

  const [yearStr, monthStr] = selectedMonth.split('-');

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Quản Lý Ứng Lương Nhân Viên</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500 sm:text-base">
          Ghi nhận và quản lý các khoản tạm ứng lương trong tháng của nhân viên. Các khoản này sẽ tự động khấu trừ vào bảng lương thực nhận.
        </p>
      </div>

      {/* Grid Layout: Left form, Right Stats & List */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Form: Add Advance */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4 h-fit sm:p-5">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-indigo-500" />
            Ghi Nhận Ứng Lương Mới
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs font-semibold text-rose-800">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Select Employee */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-400" />
                Nhân viên ứng lương *
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-3 text-sm focus:border-indigo-500 focus:outline-none sm:py-2"
              >
                <option value="">-- Chọn nhân viên --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} (Lương: {formatVND(emp.hourly_rate)}/h)
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                Số tiền ứng trước (VND) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ví dụ: 500,000"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-3 pr-10 py-3 text-sm font-bold text-slate-800 focus:border-indigo-500 focus:outline-none sm:py-2"
                />
                <span className="absolute right-3 top-2.5 text-xs font-extrabold text-slate-400">VND</span>
              </div>
            </div>

            {/* Date */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Ngày ứng tiền *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-3 text-sm font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none sm:py-2"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                Ghi chú lý do ứng
              </label>
              <textarea
                placeholder="Lý do ứng lương (ví dụ: chi tiêu cá nhân, đóng tiền học...)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-3 text-sm focus:border-indigo-500 focus:outline-none resize-none sm:py-2"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 shadow-md transition-colors sm:py-2"
            >
              {isSubmitting ? 'Đang ghi nhận...' : 'Xác Nhận Ứng Lương'}
            </button>
          </form>
        </div>

        {/* Right side: Stats & List (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Widgets */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Total Month advance */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Coins className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng tiền ứng trước</p>
                <h4 className="text-lg font-extrabold text-slate-900 mt-0.5">{formatVND(totalAdvanceAmount)}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Tháng {monthStr}/{yearStr}</p>
              </div>
            </div>

            {/* Total Count */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Số lượt ứng tiền</p>
                <h4 className="text-lg font-extrabold text-slate-900 mt-0.5">{totalCount} lượt</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Đã ghi nhận trong tháng</p>
              </div>
            </div>

            {/* Top Borrower */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <TrendingDown className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ứng nhiều nhất tháng</p>
                <h4 className="text-sm font-bold text-slate-800 mt-1 truncate">
                  {topBorrowerAmount > 0 ? (
                    <>
                      {topBorrowerName} <span className="text-xs text-slate-500">({formatVND(topBorrowerAmount)})</span>
                    </>
                  ) : (
                    'Chưa có số liệu'
                  )}
                </h4>
                <p className="text-[10px] text-slate-500">Người có tổng tiền ứng lớn nhất</p>
              </div>
            </div>
          </div>

          {/* List and Search Panel */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4 sm:p-5">
            {/* Filter bar */}
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-sm md:flex-1">
                <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên nhân viên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2 text-sm focus:border-indigo-500 focus:outline-none bg-slate-50/50"
                />
              </div>

              <div className="flex w-full flex-col gap-1.5 min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-2 md:w-auto">
                <span className="text-sm font-semibold text-slate-600">Tháng:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none min-[420px]:w-auto min-[420px]:py-1.5"
                />
              </div>
            </div>

            {/* List Table */}
            {filteredAdvances.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Coins className="h-12 w-12 text-slate-300" />
                <h4 className="mt-4 text-sm font-bold text-slate-900">Không tìm thấy khoản ứng lương nào</h4>
                <p className="mt-1 text-xs text-slate-500">Thử thay đổi bộ lọc tìm kiếm hoặc ghi nhận khoản ứng đầu tiên.</p>
              </div>
            ) : (
              <>
              <div className="grid gap-3 md:hidden">
                {filteredAdvances.map((adv) => {
                  const emp = employees.find(e => e.id === adv.employee_id);
                  return (
                    <div key={adv.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-bold text-slate-900">{emp?.name || 'Không xác định'}</div>
                          <div className="mt-0.5 text-xs text-slate-400">Mã NV: {adv.employee_id.substring(0, 8)}</div>
                          <div className="mt-1 text-xs font-semibold text-slate-500">{adv.date.split('-').reverse().join('/')}</div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-sm font-black text-rose-600">{formatVND(adv.amount)}</div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tạm ứng</div>
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-medium leading-5 text-slate-600">
                        {adv.notes || <span className="italic text-slate-400">Không có ghi chú</span>}
                      </div>

                      <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
                        <button
                          onClick={() => {
                            if (confirm(`Bạn có chắc chắn muốn xóa khoản ứng lương ${formatVND(adv.amount)} của ${emp?.name || 'nhân viên này'}?`)) {
                              onDeleteAdvance(adv.id);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-100 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                          title="Xóa khoản ứng lương"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Xóa
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                      <th className="px-4 py-3">Nhân viên</th>
                      <th className="px-4 py-3">Ngày ứng</th>
                      <th className="px-4 py-3 text-right">Số tiền ứng</th>
                      <th className="px-4 py-3">Lý do / Ghi chú</th>
                      <th className="px-4 py-3 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredAdvances.map((adv) => {
                      const emp = employees.find(e => e.id === adv.employee_id);
                      return (
                        <tr key={adv.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900">{emp?.name || 'Không xác định'}</div>
                            <div className="text-[10px] text-slate-400">Mã NV: {adv.employee_id.substring(0, 8)}</div>
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-slate-600">
                            {adv.date.split('-').reverse().join('/')}
                          </td>
                          <td className="px-4 py-3.5 text-right font-extrabold text-rose-600">
                            {formatVND(adv.amount)}
                          </td>
                          <td className="px-4 py-3.5 max-w-[200px] truncate text-slate-500 font-medium" title={adv.notes}>
                            {adv.notes || <span className="text-slate-300 italic">Không có ghi chú</span>}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <button
                              onClick={() => {
                                if (confirm(`Bạn có chắc chắn muốn xóa khoản ứng lương ${formatVND(adv.amount)} của ${emp?.name || 'nhân viên này'}?`)) {
                                  onDeleteAdvance(adv.id);
                                }
                              }}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                              title="Xóa khoản ứng lương"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
