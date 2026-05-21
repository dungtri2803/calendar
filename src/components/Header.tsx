import {
  CalendarDays,
  Database,
  LogOut,
  RefreshCw,
  Shield,
  Sparkles,
  User
} from 'lucide-react';
import { Employee, SupabaseConfig, UserRole } from '../types';

interface HeaderProps {
  role: UserRole;
  setRole: (role: UserRole) => void;
  employees: Employee[];
  activeEmployeeId: string;
  activeEmployee?: Employee;
  onEmployeeLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  dbConfig: SupabaseConfig;
  isSyncing: boolean;
  triggerSync: () => void;
}

export default function Header({
  role,
  setRole,
  employees,
  activeEmployeeId,
  activeEmployee,
  onEmployeeLogout,
  activeTab,
  setActiveTab,
  dbConfig,
  isSyncing,
  triggerSync,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-[1440px] px-3 sm:px-5 lg:px-8">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-2 py-2 sm:gap-4">
          {/* Logo & Brand */}
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-100 sm:h-10 sm:w-10">
              <CalendarDays className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-black tracking-tight text-slate-900 sm:text-lg">StaffFlow</h1>
              <p className="hidden text-xs font-medium text-slate-500 sm:block">Lập lịch & tính lương</p>
            </div>
          </div>

          {/* Center Navigation Tabs (Admin only) */}
          {role === 'admin' && (
            <nav className="order-3 hidden w-full items-center gap-1 overflow-x-auto md:flex lg:order-none lg:w-auto">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${activeTab === 'dashboard'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                Tổng quan
              </button>
              <button
                onClick={() => setActiveTab('employees')}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${activeTab === 'employees'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >

                Nhân viên
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${activeTab === 'schedule'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                Lịch làm việc
              </button>
              <button
                onClick={() => setActiveTab('payroll')}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${activeTab === 'payroll'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                Tính lương
              </button>
              <button
                onClick={() => setActiveTab('advances')}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${activeTab === 'advances'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                Ứng lương
              </button>

            </nav>
          )}

          {/* Right Operations */}
          <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-3 md:ml-0">
            {/* Sync Indicator */}
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              title={dbConfig.isEnabled ? 'Đang đồng bộ với Supabase' : 'Chế độ Demo Offline'}
              className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${dbConfig.isEnabled
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
                }`}
            >
              {dbConfig.isEnabled ? (
                <>
                  <Database className="h-3 w-3 text-emerald-500 animate-pulse" />

                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  <span>Chế độ Demo</span>
                </>
              )}
              <RefreshCw className={`ml-0.5 h-3 w-3 ${isSyncing ? 'animate-spin' : 'opacity-70 hover:opacity-100'}`} />
            </button>

            {/* Role Selector Switch */}
            <div className="flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
              <button
                onClick={() => {
                  setRole('admin');
                  setActiveTab('dashboard');
                }}
                className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all sm:px-2.5 ${role === 'admin'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <Shield className="h-3 w-3 text-indigo-500" />
                <span className="hidden min-[380px]:inline">Admin</span>
              </button>
              <button
                onClick={() => setRole('employee')}
                className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all sm:px-2.5 ${role === 'employee'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <User className="h-3 w-3 text-indigo-500" />
                <span className="hidden min-[380px]:inline">Nhân viên</span>
              </button>
            </div>

            {/* Active employee identity */}
            {role === 'employee' && employees.length > 0 && activeEmployeeId && activeEmployee && (
              <div className="flex min-w-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm sm:gap-2 sm:px-2.5">
                <User className="h-3.5 w-3.5 text-indigo-500" />
                <span className="max-w-[70px] truncate text-xs font-bold text-slate-700 sm:max-w-[160px]">
                  {activeEmployee.name}
                </span>
                <button
                  onClick={onEmployeeLogout}
                  title="Đăng xuất nhân viên"
                  className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation (Admin only) */}
      {role === 'admin' && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-2 flex items-center justify-around gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
              }`}
          >
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap flex items-center gap-1 ${activeTab === 'employees' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
              }`}
          >
            Nhân viên
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap flex items-center gap-1 ${activeTab === 'schedule' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
              }`}
          >
            Lịch
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap flex items-center gap-1 ${activeTab === 'payroll' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
              }`}
          >
            Tính lương
          </button>
          <button
            onClick={() => setActiveTab('advances')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap flex items-center gap-1 ${activeTab === 'advances' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
              }`}
          >
            Ứng lương
          </button>
          <button
            onClick={() => setActiveTab('connection')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap flex items-center gap-1 ${activeTab === 'connection' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
              }`}
          >
            DB
          </button>
        </div>
      )}
    </header>
  );
}
