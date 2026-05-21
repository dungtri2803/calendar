import { useState } from 'react';
import {
  UserPlus,
  Users,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  KeyRound,
  Search,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { Employee, ShiftAssignment, ShiftType } from '../types';
import {
  calculateHours,
  calculateSalary,
  formatVND,
  filterAssignmentsByMonth
} from '../utils/calculations';
import { hashEmployeePin, isValidPin } from '../utils/auth';

interface EmployeeManagementProps {
  employees: Employee[];
  shiftTypes: ShiftType[];
  assignments: ShiftAssignment[];
  onAddEmployee: (emp: Omit<Employee, 'id'>) => Promise<void>;
  onUpdateEmployee: (emp: Employee) => Promise<void>;
  onDeleteEmployee: (id: string) => Promise<void>;
}

export default function EmployeeManagement({
  employees,
  shiftTypes,
  assignments,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
}: EmployeeManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState<string | null>(null); // employee.id or 'new'

  // Form values
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [hourlyRate, setHourlyRate] = useState(30000);
  const [pin, setPin] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Month selection for quick hours & salary metrics
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  const monthAssignments = filterAssignmentsByMonth(assignments, selectedMonth);

  // Handle search
  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Open form to create new
  const handleNewClick = () => {
    setName('');
    setDob('');
    setHourlyRate(30000);
    setPin('');
    setFormError('');
    setIsEditing('new');
  };

  // Open form to edit
  const handleEditClick = (emp: Employee) => {
    setName(emp.name);
    setDob(emp.dob);
    setHourlyRate(emp.hourly_rate);
    setPin('');
    setFormError('');
    setIsEditing(emp.id);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Vui lòng nhập họ và tên nhân viên.');
      return;
    }
    if (!dob) {
      setFormError('Vui lòng chọn ngày sinh.');
      return;
    }
    if (hourlyRate <= 0) {
      setFormError('Mức lương theo giờ phải lớn hơn 0 VNĐ.');
      return;
    }

    const currentEmployee = isEditing && isEditing !== 'new'
      ? employees.find((emp) => emp.id === isEditing)
      : undefined;

    if (isEditing === 'new' && !pin) {
      setFormError('Vui lòng tạo mã PIN đăng nhập cho nhân viên.');
      return;
    }
    if (pin && !isValidPin(pin)) {
      setFormError('Mã PIN chỉ gồm 4-8 chữ số.');
      return;
    }
    if (currentEmployee && !currentEmployee.pin_hash && !pin) {
      setFormError('Nhân viên này chưa có mã PIN. Vui lòng tạo mã PIN trước khi lưu.');
      return;
    }

    setIsSaving(true);
    try {
      const nextPinHash = pin ? await hashEmployeePin(pin) : currentEmployee?.pin_hash;

      if (isEditing === 'new') {
        await onAddEmployee({
          name: name.trim(),
          dob,
          hourly_rate: hourlyRate,
          pin_hash: nextPinHash,
        });
      } else if (isEditing) {
        await onUpdateEmployee({
          id: isEditing,
          name: name.trim(),
          dob,
          hourly_rate: hourlyRate,
          pin_hash: nextPinHash,
        });
      }
      setIsEditing(null);
    } catch (error) {
      setFormError('Có lỗi xảy ra khi lưu dữ liệu.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete handler
  const handleDelete = async (id: string) => {
    try {
      await onDeleteEmployee(id);
      setConfirmDeleteId(null);
    } catch (error) {
      alert('Lỗi khi xóa nhân viên.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Title & Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Hồ Sơ Nhân Viên</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500 sm:text-base">Quản lý thông tin cơ bản, thiết lập mức lương theo giờ và theo dõi tổng giờ làm việc.</p>
        </div>
        <button
          onClick={handleNewClick}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
        >
          <UserPlus className="h-4 w-4" />
          Thêm nhân viên mới
        </button>
      </div>

      {/* Filters & Tools */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md md:flex-1">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm nhân viên theo tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
          />
        </div>
        <div className="flex w-full flex-col gap-1.5 min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-2 md:w-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Thống kê tháng:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none min-[420px]:w-auto min-[420px]:py-1.5"
          />
        </div>
      </div>

      {/* Form Modal / Sheet (Overlay when active) */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-xl animate-scale-in sm:max-w-lg sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <h3 className="pr-3 text-sm font-bold text-slate-900 sm:text-base">
                {isEditing === 'new' ? 'Thêm Nhân Viên Mới' : 'Chỉnh Sửa Thông Tin Nhân Viên'}
              </h3>
              <button
                onClick={() => setIsEditing(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="max-h-[calc(92vh-64px)] space-y-4 overflow-y-auto p-4 sm:p-6">
              {formError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Họ và tên</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* DOB */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ngày tháng năm sinh</label>
                <div className="relative">
                  <Calendar className="absolute top-2.5 left-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Hourly Rate */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Mức lương theo giờ (VNĐ/giờ)</label>
                <div className="relative">
                  <DollarSign className="absolute top-2.5 left-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    step="1000"
                    min="0"
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-16 py-2 text-sm font-bold text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="absolute top-2.5 right-3 text-xs font-bold text-slate-400 uppercase">VNĐ/H</span>
                </div>
              </div>

              {/* Employee PIN */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mã PIN đăng nhập {isEditing === 'new' ? '' : '(để trống nếu không đổi)'}
                </label>
                <div className="relative">
                  <KeyRound className="absolute top-2.5 left-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    inputMode="numeric"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder={isEditing === 'new' ? 'Tạo PIN 4-8 số' : 'Nhập PIN mới nếu muốn đổi'}
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm font-bold text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[11px] font-medium text-slate-400">
                  PIN được lưu dưới dạng mã hash, dùng để nhân viên tự xem lịch và lương cá nhân.
                </p>
              </div>

              {/* Footer buttons */}
              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditing(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:py-2"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 sm:py-2"
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Table & Grid */}
      {filteredEmployees.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <Users className="h-12 w-12 text-slate-300" />
          <h4 className="mt-4 text-lg font-bold text-slate-900">Không tìm thấy nhân viên nào</h4>
          <p className="mt-1 text-sm text-slate-500">Thử thay đổi từ khóa tìm kiếm hoặc thêm nhân viên mới.</p>
          <button
            onClick={handleNewClick}
            className="mt-4 text-sm font-semibold text-indigo-600 hover:underline"
          >
            Thêm ngay
          </button>
        </div>
      ) : (
        <>
        <div className="grid gap-3 md:hidden">
          {filteredEmployees.map((emp) => {
            const hours = calculateHours(emp.id, monthAssignments, shiftTypes);
            const salary = calculateSalary(emp.id, monthAssignments, shiftTypes, emp.hourly_rate);
            const isConfirmingDelete = confirmDeleteId === emp.id;
            const birthDate = new Date(emp.dob);
            const age = new Date().getFullYear() - birthDate.getFullYear();

            return (
              <div key={emp.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 font-bold text-indigo-600">
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold text-slate-900">{emp.name}</div>
                    <div className="mt-0.5 text-xs text-slate-500">Mã số: {emp.id.substring(0, 8)}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {emp.dob.split('-').reverse().join('/')} ({age} tuổi)
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-bold ${
                    emp.pin_hash
                      ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                      : 'border-amber-100 bg-amber-50 text-amber-700'
                  }`}>
                    {emp.pin_hash ? 'PIN' : 'Chưa PIN'}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="font-bold uppercase tracking-wider text-slate-400">Lương/giờ</div>
                    <div className="mt-1 font-black text-slate-800">{formatVND(emp.hourly_rate)}</div>
                  </div>
                  <div className="rounded-xl bg-indigo-50 p-3">
                    <div className="font-bold uppercase tracking-wider text-indigo-400">Giờ làm</div>
                    <div className="mt-1 font-black text-indigo-700">{hours} giờ</div>
                  </div>
                  <div className="col-span-2 rounded-xl bg-emerald-50 p-3">
                    <div className="font-bold uppercase tracking-wider text-emerald-500">Thành tiền ({selectedMonth})</div>
                    <div className="mt-1 text-base font-black text-emerald-700">{formatVND(salary)}</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  {isConfirmingDelete ? (
                    <div className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 p-1.5">
                      <span className="px-1 text-xs font-semibold text-rose-700">Xóa vĩnh viễn?</span>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="rounded-lg bg-rose-600 p-2 text-white hover:bg-rose-500"
                        title="Xác nhận xóa"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded-lg bg-slate-200 p-2 text-slate-700 hover:bg-slate-300"
                        title="Hủy bỏ"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEditClick(emp)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Sửa
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(emp.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-100 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Xóa
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Nhân viên</th>
                  <th className="px-6 py-4">Ngày sinh</th>
                  <th className="px-6 py-4">Mức lương / giờ</th>
                  <th className="px-6 py-4 text-center">PIN</th>
                  <th className="px-6 py-4 text-center">Giờ làm ({selectedMonth})</th>
                  <th className="px-6 py-4 text-right">Thành tiền ({selectedMonth})</th>
                  <th className="px-6 py-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredEmployees.map((emp) => {
                  const hours = calculateHours(emp.id, monthAssignments, shiftTypes);
                  const salary = calculateSalary(emp.id, monthAssignments, shiftTypes, emp.hourly_rate);
                  const isConfirmingDelete = confirmDeleteId === emp.id;

                  // Age calculation
                  const birthDate = new Date(emp.dob);
                  const age = new Date().getFullYear() - birthDate.getFullYear();

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 font-bold border border-indigo-100">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{emp.name}</div>
                            <div className="text-xs text-slate-500">Mã số: {emp.id.substring(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 text-slate-600">
                        <div>{emp.dob.split('-').reverse().join('/')}</div>
                        <div className="text-xs text-slate-400">({age} tuổi)</div>
                      </td>
                      <td className="px-6 py-4.5 font-semibold text-slate-800">
                        {formatVND(emp.hourly_rate)} <span className="text-xs font-normal text-slate-400">/h</span>
                      </td>
                      <td className="px-6 py-4.5 text-center">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${emp.pin_hash
                          ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                          : 'border-amber-100 bg-amber-50 text-amber-700'
                          }`}>
                          {emp.pin_hash ? 'Đã đặt' : 'Chưa đặt'}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-center">
                        <span className="inline-flex items-center rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700">
                          {hours} giờ
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-right font-bold text-indigo-600">
                        {formatVND(salary)}
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="flex items-center justify-center gap-2">
                          {isConfirmingDelete ? (
                            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-lg p-1 animate-shake">
                              <span className="text-xs font-semibold text-rose-700 px-1.5">Xóa vĩnh viễn?</span>
                              <button
                                onClick={() => handleDelete(emp.id)}
                                className="rounded bg-rose-600 p-1 text-white hover:bg-rose-500"
                                title="Xác nhận xóa"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="rounded bg-slate-200 p-1 text-slate-700 hover:bg-slate-300"
                                title="Hủy bỏ"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditClick(emp)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                                title="Chỉnh sửa thông tin"
                              >
                                <Edit className="h-4.5 w-4.5" />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(emp.id)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors"
                                title="Xóa nhân viên"
                              >
                                <Trash2 className="h-4.5 w-4.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
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
  );
}
