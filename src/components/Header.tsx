import {
  Users,
  CalendarDays,
  CreditCard,
  Database,
  Shield,
  User,
  Sparkles,
  RefreshCw,
  Coins
} from 'lucide-react';
import { Employee, UserRole, SupabaseConfig } from '../types';

interface HeaderProps {
  role: UserRole;
  setRole: (role: UserRole) => void;
  employees: Employee[];
  activeEmployeeId: string;
  setActiveEmployeeId: (id: string) => void;
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
  setActiveEmployeeId,
  activeTab,
  setActiveTab,
  dbConfig,
  isSyncing,
  triggerSync,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-100">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">StaffFlow</h1>
              <p className="text-xs font-medium text-slate-500">Lập Lịch & Tính Lương</p>
            </div>
          </div>

          {/* Center Navigation Tabs (Admin only) */}
          {role === 'admin' && (
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${activeTab === 'dashboard'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                Tổng quan
              </button>
              <button
                onClick={() => setActiveTab('employees')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${activeTab === 'employees'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <Users className="h-4 w-4" />
                Nhân viên
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${activeTab === 'schedule'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <CalendarDays className="h-4 w-4" />
                Lịch làm việc
              </button>
              <button
                onClick={() => setActiveTab('payroll')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${activeTab === 'payroll'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <CreditCard className="h-4 w-4" />
                Tính lương
              </button>
              <button
                onClick={() => setActiveTab('advances')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${activeTab === 'advances'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <Coins className="h-4 w-4" />
                Ứng lương
              </button>

            </nav>
          )}

          {/* Right Operations */}
          <div className="flex items-center gap-3 ml-auto md:ml-0">
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
                  <span>Supabase Live</span>
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
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                onClick={() => {
                  setRole('admin');
                  setActiveTab('dashboard');
                }}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${role === 'admin'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <Shield className="h-3 w-3 text-indigo-500" />
                <span>Admin</span>
              </button>
              <button
                onClick={() => setRole('employee')}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${role === 'employee'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <User className="h-3 w-3 text-indigo-500" />
                <span>Nhân viên</span>
              </button>
            </div>

            {/* Employee Switcher (when role is employee) */}
            {role === 'employee' && employees.length > 0 && (
              <div className="flex items-center gap-1.5">
                <select
                  value={activeEmployeeId}
                  onChange={(e) => setActiveEmployeeId(e.target.value)}
                  className="block rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      Xem: {emp.name}
                    </option>
                  ))}
                </select>
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
