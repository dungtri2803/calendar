import React, { useMemo, useState } from 'react';
import { AlertCircle, KeyRound, LockKeyhole, UserCheck } from 'lucide-react';
import { Employee } from '../types';
import { verifyEmployeePin } from '../utils/auth';

interface EmployeeLoginProps {
  employees: Employee[];
  onLogin: (employeeId: string) => void;
}

export default function EmployeeLogin({ employees, onLogin }: EmployeeLoginProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedEmployee = useMemo(
    () => employees.find((emp) => emp.id === employeeId),
    [employees, employeeId]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!selectedEmployee) {
      setError('Vui lòng chọn nhân viên.');
      return;
    }

    if (!selectedEmployee.pin_hash) {
      setError('Hồ sơ này chưa có mã PIN. Vui lòng liên hệ Admin để tạo PIN.');
      return;
    }

    setIsSubmitting(true);
    const isValid = await verifyEmployeePin(pin, selectedEmployee.pin_hash);
    setIsSubmitting(false);

    if (!isValid) {
      setError('Mã PIN không chính xác. Vui lòng thử lại.');
      return;
    }

    onLogin(selectedEmployee.id);
  };

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center max-w-md mx-auto mt-12">
        <AlertCircle className="h-12 w-12 text-amber-500" />
        <h3 className="mt-4 text-lg font-bold text-slate-900">Chưa có nhân sự nào khả dụng</h3>
        <p className="mt-1 text-sm text-slate-500">Hãy chuyển lại vai trò Admin và khởi tạo nhân viên trước.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-8 max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <UserCheck className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-xl font-black tracking-tight text-slate-900">Đăng nhập nhân viên</h2>
        <p className="mt-1.5 text-sm text-slate-500">
          Chọn đúng hồ sơ và nhập mã PIN do Admin cấp để xem lịch làm việc, giờ công và lương tạm tính của riêng bạn.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
            Nhân viên
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <LockKeyhole className="h-4.5 w-4.5" />
            </span>
            <select
              value={employeeId}
              onChange={(event) => {
                setEmployeeId(event.target.value);
                setError('');
              }}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3 text-sm font-semibold text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">-- Chọn tên của bạn --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
            Mã PIN
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <KeyRound className="h-4.5 w-4.5" />
            </span>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(event) => {
                setPin(event.target.value.replace(/\D/g, '').slice(0, 8));
                setError('');
              }}
              placeholder="Nhập PIN 4-8 số"
              className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3 text-sm font-semibold text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-100 transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!employeeId || !pin || isSubmitting}
        >
          {isSubmitting ? 'Đang kiểm tra...' : 'Xem lịch và lương của tôi'}
        </button>
      </form>
    </div>
  );
}
