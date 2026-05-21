import { useState } from 'react';
import { 
  Download, 
  Printer, 
  Search, 
  TrendingUp, 
  Clock, 
  DollarSign,
  FileText
} from 'lucide-react';
import { Employee, ShiftType, ShiftAssignment } from '../types';
import { 
  calculateHours, 
  calculateSalary, 
  formatVND, 
  filterAssignmentsByMonth 
} from '../utils/calculations';

interface PayrollReportsProps {
  employees: Employee[];
  shiftTypes: ShiftType[];
  assignments: ShiftAssignment[];
}

export default function PayrollReports({
  employees,
  shiftTypes,
  assignments,
}: PayrollReportsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  // Filter assignments by month
  const monthAssignments = filterAssignmentsByMonth(assignments, selectedMonth);

  // Build payroll rows
  const payrollData = employees.map((emp) => {
    const hours = calculateHours(emp.id, monthAssignments, shiftTypes);
    const salary = calculateSalary(emp.id, monthAssignments, shiftTypes, emp.hourly_rate);
    return {
      ...emp,
      hours,
      salary,
    };
  });

  // Apply search filter
  const filteredPayroll = payrollData.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics
  const totalHours = payrollData.reduce((sum, p) => sum + p.hours, 0);
  const totalSalary = payrollData.reduce((sum, p) => sum + p.salary, 0);
  
  // Find highest paid and hardest working
  const topEarner = payrollData.length > 0
    ? [...payrollData].sort((a, b) => b.salary - a.salary)[0]
    : null;

  const topWorker = payrollData.length > 0
    ? [...payrollData].sort((a, b) => b.hours - a.hours)[0]
    : null;

  // Export CSV
  const handleExportCSV = () => {
    const [year, month] = selectedMonth.split('-');
    const headers = ['Mã NV', 'Họ và tên', 'Ngày sinh', 'Mức lương/Giờ (VND)', 'Tổng giờ làm', `Lương tháng ${month}/${year} (VND)`];
    
    const rows = payrollData.map((p) => [
      p.id,
      p.name,
      p.dob,
      p.hourly_rate,
      p.hours,
      p.salary,
    ]);

    const csvContent = 
      'data:text/csv;charset=utf-8,\uFEFF' + // Add BOM for Vietnamese characters support in Excel
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StaffFlow_BangLuong_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Page
  const handlePrint = () => {
    window.print();
  };

  const [yearStr, monthStr] = selectedMonth.split('-');

  return (
    <div className="space-y-6 print:space-y-4 print:bg-white">
      {/* Heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tính Toán & Tổng Hợp Lương</h2>
          <p className="text-slate-500">
            Hệ thống tự động tính tổng lương dựa trên tổng số giờ làm việc của nhân viên từ lịch trực ca.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" />
            <span>In báo cáo</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            <span>Xuất File Excel</span>
          </button>
        </div>
      </div>

      {/* Print-Only Header */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold uppercase text-slate-950">Bảng Thanh Toán Lương Nhân Viên</h1>
          <p className="text-sm text-slate-600 font-medium mt-1">Tháng {monthStr} năm {yearStr} — Hệ thống StaffFlow</p>
          <p className="text-xs text-slate-400 mt-0.5">Ngày xuất báo cáo: {new Date().toLocaleDateString('vi-VN')}</p>
        </div>
      </div>

      {/* Filters panel */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm bảng lương theo tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2 text-sm focus:border-indigo-500 focus:outline-none bg-slate-50/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-600">Tháng tính lương:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Summary Statistics widgets */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Widget 1: Total Month payroll */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng quỹ lương tháng</p>
            <h4 className="text-xl font-extrabold text-slate-900 mt-0.5">{formatVND(totalSalary)}</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Tháng {monthStr}/{yearStr}</p>
          </div>
        </div>

        {/* Widget 2: Hardest worker */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tích cực nhất tuần</p>
            <h4 className="text-sm font-bold text-slate-800 mt-1 truncate">
              {topWorker && topWorker.hours > 0 ? (
                <>
                  {topWorker.name} <span className="text-xs text-slate-500">({topWorker.hours}h)</span>
                </>
              ) : (
                'Chưa có số liệu'
              )}
            </h4>
            <p className="text-[10px] text-slate-500">Tổng số giờ làm cao nhất</p>
          </div>
        </div>

        {/* Widget 3: Top earner */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thu nhập cao nhất</p>
            <h4 className="text-sm font-bold text-slate-800 mt-1 truncate">
              {topEarner && topEarner.salary > 0 ? (
                <>
                  {topEarner.name} <span className="text-xs text-slate-500">({formatVND(topEarner.salary)})</span>
                </>
              ) : (
                'Chưa có số liệu'
              )}
            </h4>
            <p className="text-[10px] text-slate-500">Lương cộng dồn cao nhất</p>
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      {filteredPayroll.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <FileText className="h-12 w-12 text-slate-300" />
          <h4 className="mt-4 text-lg font-bold text-slate-900">Không có dữ liệu lương</h4>
          <p className="mt-1 text-sm text-slate-500">Hãy thử phân ca cho nhân viên trước để hệ thống tính toán số giờ.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:border-0 print:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider print:bg-white print:border-b-2">
                  <th className="px-6 py-4">Nhân viên</th>
                  <th className="px-6 py-4">Mức lương theo giờ</th>
                  <th className="px-6 py-4 text-center">Tổng số giờ làm việc</th>
                  <th className="px-6 py-4 text-right">Tổng lương thanh toán</th>
                  <th className="px-6 py-4 text-center print:hidden">Ký nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredPayroll.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/40 transition-colors print:hover:bg-transparent">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-xs text-slate-400 print:hidden">Mã NV: {p.id.substring(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {formatVND(p.hourly_rate)}<span className="text-xs font-normal text-slate-400">/giờ</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-800 print:bg-transparent print:p-0 print:text-sm">
                        {p.hours} giờ
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-indigo-600 print:text-slate-950">
                      {formatVND(p.salary)}
                    </td>
                    <td className="px-6 py-4 text-center print:hidden">
                      <span className="text-xs text-slate-300">Chưa xác nhận</span>
                    </td>
                    {/* Column for physical signatures in print mode */}
                    <td className="hidden print:table-cell px-6 py-4 text-center w-40 border-l border-slate-100">
                      <div className="h-10 w-full"></div>
                    </td>
                  </tr>
                ))}
                {/* Summary total row */}
                <tr className="bg-slate-50 font-extrabold text-slate-900 border-t border-slate-200 print:bg-transparent print:border-t-2">
                  <td className="px-6 py-5">TỔNG CỘNG</td>
                  <td className="px-6 py-5"></td>
                  <td className="px-6 py-5 text-center text-lg">{totalHours} giờ</td>
                  <td className="px-6 py-5 text-right text-lg text-indigo-600 print:text-slate-950">
                    {formatVND(totalSalary)}
                  </td>
                  <td className="px-6 py-5 print:hidden"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Disclaimer / Print Signature */}
      <div className="hidden print:grid grid-cols-3 gap-4 text-center mt-12 text-sm font-bold text-slate-800">
        <div>
          <p>Người lập bảng</p>
          <p className="text-xs font-normal text-slate-400 mt-1">(Ký, ghi rõ họ tên)</p>
          <div className="h-20"></div>
        </div>
        <div>
          <p>Kế toán trưởng</p>
          <p className="text-xs font-normal text-slate-400 mt-1">(Ký, ghi rõ họ tên)</p>
          <div className="h-20"></div>
        </div>
        <div>
          <p>Giám đốc duyệt</p>
          <p className="text-xs font-normal text-slate-400 mt-1">(Ký, đóng dấu)</p>
          <div className="h-20"></div>
        </div>
      </div>
    </div>
  );
}
