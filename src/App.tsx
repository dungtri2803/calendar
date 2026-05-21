import { useState, useEffect, useCallback } from 'react';
import {
  X,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { db, getSupabaseConfig } from './utils/db';
import { Employee, ShiftType, ShiftAssignment, UserRole, SupabaseConfig, AppNotification, SalaryAdvance } from './types';

import Header from './components/Header';
import Dashboard from './components/Dashboard';
import EmployeeManagement from './components/EmployeeManagement';
import ShiftScheduler from './components/ShiftScheduler';
import PayrollReports from './components/PayrollReports';
import SalaryAdvances from './components/SalaryAdvances';
import SupabaseSettings from './components/SupabaseSettings';
import UserView from './components/UserView';
import AdminLoginModal from './components/AdminLoginModal';
import EmployeeLogin from './components/EmployeeLogin';

export default function App() {
  // Security and Navigation States
  const [role, setRoleState] = useState<UserRole>(() => {
    return (localStorage.getItem('user_role') as UserRole) || 'employee';
  });
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);

  // Core DB States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [salaryAdvances, setSalaryAdvances] = useState<SalaryAdvance[]>([]);

  // Active employee session for personal workspace
  const [activeEmployeeId, setActiveEmployeeId] = useState<string>(() => {
    return localStorage.getItem('active_employee_id') || '';
  });

  // Database configuration
  const [dbConfig, setDbConfig] = useState<SupabaseConfig>(getSupabaseConfig);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Toast notification queue
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Notification helper
  const addNotification = useCallback((type: AppNotification['type'], message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);

    // Auto dismiss
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  const handleRoleChange = (newRole: UserRole) => {
    if (newRole === 'admin') {
      setIsAdminLoginOpen(true);
    } else {
      setRoleState('employee');
      localStorage.setItem('user_role', 'employee');
      setActiveTab('dashboard');
      addNotification('info', 'Đã chuyển sang khu vực nhân viên.');
    }
  };

  const handleAdminLoginSuccess = () => {
    setRoleState('admin');
    localStorage.setItem('user_role', 'admin');
    setActiveTab('dashboard');
    setIsAdminLoginOpen(false);
    addNotification('success', 'Đăng nhập Admin thành công!');
  };

  // Load all data from configured database engine
  const loadAllData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const fetchedEmployees = await db.getEmployees();
      const fetchedShiftTypes = await db.getShiftTypes();

      // Set a date range wide enough to load all assignments for current month calculations (e.g. ±1 year)
      const today = new Date();
      const startYear = today.getFullYear() - 1;
      const endYear = today.getFullYear() + 1;
      const fetchedAssignments = await db.getAssignments(`${startYear}-01-01`, `${endYear}-12-31`);
      const fetchedSalaryAdvances = await db.getSalaryAdvances(`${startYear}-01-01`, `${endYear}-12-31`);

      setEmployees(fetchedEmployees);
      setShiftTypes(fetchedShiftTypes);
      setAssignments(fetchedAssignments);
      setSalaryAdvances(fetchedSalaryAdvances);
    } catch (error: any) {
      console.error(error);
      addNotification(
        'error',
        `Lỗi tải dữ liệu: ${error.message || 'Không kết nối được cơ sở dữ liệu. Vui lòng kiểm tra cấu hình kết nối.'}`
      );
    } finally {
      setIsSyncing(false);
    }
  }, [addNotification]);

  // Initial load on mount
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handle Supabase connection settings adjustment
  const handleConfigChange = async (newConfig: SupabaseConfig) => {
    setDbConfig(newConfig);
    // Reset state lists
    setEmployees([]);
    setShiftTypes([]);
    setAssignments([]);
    setSalaryAdvances([]);
    // Fetch fresh data
    addNotification('info', newConfig.isEnabled ? 'Đang kết nối đến Supabase...' : 'Đã chuyển sang chế độ Offline Demo.');

    // Small timeout to let configuration persist in localStorage
    setTimeout(() => {
      loadAllData();
    }, 100);
  };

  // EMPLOYEE CRUD HANDLERS
  const handleAddEmployee = async (empData: Omit<Employee, 'id'>) => {
    setIsSyncing(true);
    try {
      const newEmp = await db.upsertEmployee(empData);
      addNotification('success', `Đã thêm nhân viên: ${newEmp.name}`);
      await loadAllData();
    } catch (error: any) {
      addNotification('error', `Lỗi thêm nhân viên: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateEmployee = async (empData: Employee) => {
    setIsSyncing(true);
    try {
      const updated = await db.upsertEmployee(empData);
      addNotification('success', `Đã cập nhật thông tin: ${updated.name}`);
      await loadAllData();
    } catch (error: any) {
      addNotification('error', `Lỗi sửa đổi nhân viên: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    setIsSyncing(true);
    try {
      const targetName = employees.find(e => e.id === id)?.name || '';
      await db.deleteEmployee(id);
      addNotification('success', `Đã xóa nhân viên ${targetName} khỏi danh sách.`);

      // Clear active selection if it was deleted
      if (activeEmployeeId === id) {
        setActiveEmployeeId('');
        localStorage.removeItem('active_employee_id');
      }
      await loadAllData();
    } catch (error: any) {
      addNotification('error', `Lỗi xóa nhân viên: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // SHIFT TYPES HANDLERS
  const handleAddShiftType = async (shiftData: Omit<ShiftType, 'id'>) => {
    setIsSyncing(true);
    try {
      const newShift = await db.upsertShiftType(shiftData);
      addNotification('success', `Đã thêm loại ca: ${newShift.name}`);
      await loadAllData();
    } catch (error: any) {
      addNotification('error', `Lỗi tạo ca trực: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteShiftType = async (id: string) => {
    setIsSyncing(true);
    try {
      const targetName = shiftTypes.find(s => s.id === id)?.name || '';
      await db.deleteShiftType(id);
      addNotification('success', `Đã xóa cấu hình ca: ${targetName}`);
      await loadAllData();
    } catch (error: any) {
      addNotification('error', `Lỗi xóa ca trực: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // SHIFT ASSIGNMENT HANDLERS
  const handleAddAssignment = async (employeeId: string, date: string, shiftTypeId: string) => {
    setIsSyncing(true);
    try {
      const empName = employees.find(e => e.id === employeeId)?.name || '';
      const shiftName = shiftTypes.find(s => s.id === shiftTypeId)?.name || '';

      await db.addAssignment(employeeId, date, shiftTypeId);
      addNotification('success', `Đã xếp ${shiftName} cho ${empName} vào ${date.split('-').reverse().join('/')}`);
      await loadAllData();
    } catch (error: any) {
      addNotification('error', `Lỗi xếp lịch ca làm: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    setIsSyncing(true);
    try {
      await db.deleteAssignment(id);
      addNotification('info', `Đã xóa lịch ca khỏi ngày trực.`);
      await loadAllData();
    } catch (error: any) {
      addNotification('error', `Lỗi xóa phân lịch: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleApplyWeekToMonth = async (sourceWeekDates: string[], targetMonthYear: string): Promise<number> => {
    setIsSyncing(true);
    try {
      const res = await db.applyWeekToMonth(sourceWeekDates, targetMonthYear);
      addNotification('success', `Đã áp dụng thành công lịch tuần cho tháng ${targetMonthYear.split('-').reverse().join('/')}.`);
      await loadAllData();
      return res.count;
    } catch (error: any) {
      addNotification('error', `Lỗi áp dụng lịch tháng: ${error.message}`);
      return 0;
    } finally {
      setIsSyncing(false);
    }
  };

  // SALARY ADVANCES HANDLERS
  const handleAddSalaryAdvance = async (advanceData: Omit<SalaryAdvance, 'id'>) => {
    setIsSyncing(true);
    try {
      const newAdvance = await db.addSalaryAdvance(advanceData);
      const empName = employees.find(e => e.id === advanceData.employee_id)?.name || '';
      addNotification('success', `Đã ghi nhận ứng lương cho ${empName}: ${newAdvance.amount.toLocaleString('vi-VN')}đ`);
      await loadAllData();
    } catch (error: any) {
      addNotification('error', `Lỗi thêm khoản ứng lương: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteSalaryAdvance = async (id: string) => {
    setIsSyncing(true);
    try {
      await db.deleteSalaryAdvance(id);
      addNotification('success', 'Đã xóa khoản ứng lương.');
      await loadAllData();
    } catch (error: any) {
      addNotification('error', `Lỗi xóa khoản ứng lương: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };
  const loggedInEmployee = employees.find(e => e.id === activeEmployeeId);
  const employeeAssignments = loggedInEmployee
    ? assignments.filter((assignment) => assignment.employee_id === loggedInEmployee.id)
    : [];
  const employeeSalaryAdvances = loggedInEmployee
    ? salaryAdvances.filter((advance) => advance.employee_id === loggedInEmployee.id)
    : [];

  const handleEmployeeLogin = (employeeId: string) => {
    setActiveEmployeeId(employeeId);
    localStorage.setItem('active_employee_id', employeeId);
    const empName = employees.find((emp) => emp.id === employeeId)?.name || 'nhân viên';
    addNotification('success', `Đã đăng nhập khu vực nhân viên: ${empName}`);
  };

  const handleEmployeeLogout = () => {
    setActiveEmployeeId('');
    localStorage.removeItem('active_employee_id');
    addNotification('info', 'Đã đăng xuất khu vực nhân viên.');
  };

  useEffect(() => {
    if (!activeEmployeeId || employees.length === 0) return;
    const employeeExists = employees.some((employee) => employee.id === activeEmployeeId);
    if (!employeeExists) {
      setActiveEmployeeId('');
      localStorage.removeItem('active_employee_id');
    }
  }, [activeEmployeeId, employees]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-700 antialiased">

      {/* Header Component */}
      <Header
        role={role}
        setRole={handleRoleChange}
        employees={employees}
        activeEmployeeId={activeEmployeeId}
        activeEmployee={loggedInEmployee}
        onEmployeeLogout={handleEmployeeLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dbConfig={dbConfig}
        isSyncing={isSyncing}
        triggerSync={loadAllData}
      />

      {/* Main Content container */}
      <main className="mx-auto max-w-[1440px] px-3 py-5 sm:px-5 sm:py-7 lg:px-8">

        {role === 'admin' ? (
          /* ADMIN DASHBOARD TABS */
          <div className="animate-fade-in">
            {activeTab === 'dashboard' && (
              <Dashboard
                employees={employees}
                shiftTypes={shiftTypes}
                assignments={assignments}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'employees' && (
              <EmployeeManagement
                employees={employees}
                shiftTypes={shiftTypes}
                assignments={assignments}
                onAddEmployee={handleAddEmployee}
                onUpdateEmployee={handleUpdateEmployee}
                onDeleteEmployee={handleDeleteEmployee}
              />
            )}

            {activeTab === 'schedule' && (
              <ShiftScheduler
                employees={employees}
                shiftTypes={shiftTypes}
                assignments={assignments}
                salaryAdvances={salaryAdvances}
                onAddAssignment={handleAddAssignment}
                onDeleteAssignment={handleDeleteAssignment}
                onApplyWeekToMonth={handleApplyWeekToMonth}
                onAddShiftType={handleAddShiftType}
                onDeleteShiftType={handleDeleteShiftType}
              />
            )}

            {activeTab === 'payroll' && (
              <PayrollReports
                employees={employees}
                shiftTypes={shiftTypes}
                assignments={assignments}
                salaryAdvances={salaryAdvances}
              />
            )}

            {activeTab === 'advances' && (
              <SalaryAdvances
                employees={employees}
                salaryAdvances={salaryAdvances}
                onAddAdvance={handleAddSalaryAdvance}
                onDeleteAdvance={handleDeleteSalaryAdvance}
              />
            )}

            {activeTab === 'connection' && (
              <SupabaseSettings
                onConfigChange={handleConfigChange}
              />
            )}
          </div>
        ) : (
          /* EMPLOYEE VIEWPORT */
          <div className="animate-fade-in">
            {loggedInEmployee ? (
              <UserView
                employee={loggedInEmployee}
                shiftTypes={shiftTypes}
                assignments={employeeAssignments}
                salaryAdvances={employeeSalaryAdvances}
              />
            ) : (
              <EmployeeLogin employees={employees} onLogin={handleEmployeeLogin} />
            )}
          </div>
        )}

      </main>

      {/* Bottom right toast notifications */}
      <div className="pointer-events-none fixed inset-x-3 bottom-3 z-50 space-y-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-full sm:max-w-sm">
        {notifications.map((note) => (
          <div
            key={note.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg transition-all duration-300 animate-slide-up ${note.type === 'success'
              ? 'bg-white border-emerald-200 text-emerald-800 shadow-emerald-100/50'
              : note.type === 'error'
                ? 'bg-white border-rose-200 text-rose-800 shadow-rose-100/50'
                : note.type === 'warning'
                  ? 'bg-white border-amber-200 text-amber-800 shadow-amber-100/50'
                  : 'bg-white border-indigo-200 text-indigo-800 shadow-indigo-100/50'
              }`}
          >
            {note.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />}
            {note.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />}
            {note.type === 'warning' && <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />}
            {note.type === 'info' && <Info className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />}

            <div className="flex-1 text-xs font-semibold leading-relaxed">
              {note.message}
            </div>

            <button
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== note.id))}
              className="rounded-lg p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Admin Login Modal */}
      {isAdminLoginOpen && (
        <AdminLoginModal
          onSuccess={handleAdminLoginSuccess}
          onClose={() => setIsAdminLoginOpen(false)}
        />
      )}

      {/* Footer */}
      {/* <footer className="mt-12 border-t border-slate-200 bg-white py-8 print:hidden">
        <div className="mx-auto max-w-8xl px-4 text-center sm:px-6 lg:px-8 space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            StaffFlow — Hệ thống sắp xếp ca & Tự động tính lương nhân sự
          </p>
          <p className="text-xs font-medium text-slate-400">
            © 2026 StaffFlow Inc. Hỗ trợ kéo thả trực quan và tích hợp Supabase Cloud.
          </p>
        </div>
      </footer> */}
    </div>
  );
}
