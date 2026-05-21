import React, { useState } from 'react';
import { X, Lock, Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function AdminLoginModal({ onSuccess, onClose }: AdminLoginModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Simulate network delay for a more realistic & premium feel
    setTimeout(() => {
      // Allow 'admin' or 'admin123' as default passwords
      if (password === 'Liin@123') {
        onSuccess();
      } else {
        setError('Mật khẩu không chính xác. Vui lòng thử lại!');
        setIsSubmitting(false);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all duration-300 animate-scale-in">
        {/* Background gradient pattern */}
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-indigo-50 opacity-50 blur-3xl" />
        <div className="absolute -left-16 -bottom-16 h-36 w-36 rounded-full bg-violet-50 opacity-50 blur-3xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-100/50">
            <Shield className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-xl font-bold text-slate-900">Xác thực quyền Admin</h3>
          <p className="mt-1.5 text-xs text-slate-500 max-w-xs">
            Hệ thống yêu cầu mật khẩu Admin để truy cập và chỉnh sửa dữ liệu nhân sự, lịch làm việc & tính lương.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Mật khẩu truy cập
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-4.5 w-4.5" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Nhập mật khẩu quản trị viên"
                className={`block w-full rounded-xl border py-2.5 pl-10 pr-10 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 ${error
                    ? 'border-rose-300 bg-rose-50/50 text-rose-900 placeholder-rose-300 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-100'
                  }`}
                disabled={isSubmitting}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <EyeOff className="h-4.5 w-4.5" />
                ) : (
                  <Eye className="h-4.5 w-4.5" />
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-2 flex items-start gap-1.5 text-xs font-semibold text-rose-600 animate-shake">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Default Password Info Hint */}
            <p className="mt-2.5 text-[11px] text-slate-400 italic">
              * Gợi ý: Mật khẩu mặc định là <span className="font-bold text-slate-500 select-all">admin123</span> hoặc <span className="font-bold text-slate-500 select-all">admin</span>.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-100 hover:from-indigo-500 hover:to-violet-500 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              disabled={isSubmitting || !password}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Đang kiểm tra...</span>
                </>
              ) : (
                <span>Đăng nhập</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
