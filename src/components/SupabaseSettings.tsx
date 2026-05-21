import { useState } from 'react';
import { 
  Database, 
  Key, 
  Copy, 
  Check, 
  HelpCircle, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { SupabaseConfig } from '../types';
import { SQL_SCHEMA, getSupabaseConfig, saveSupabaseConfig } from '../utils/db';

interface SupabaseSettingsProps {
  onConfigChange: (config: SupabaseConfig) => Promise<void>;
}

export default function SupabaseSettings({ onConfigChange }: SupabaseSettingsProps) {
  const [config, setConfig] = useState<SupabaseConfig>(getSupabaseConfig);
  const [isCopied, setIsCopied] = useState(false);
  
  // Test connection states
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SQL_SCHEMA);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple format validation
    if (config.isEnabled) {
      if (!config.url.trim() || !config.anonKey.trim()) {
        alert('Vui lòng nhập đầy đủ URL và Anon Key nếu chọn kích hoạt kết nối.');
        return;
      }
    }

    try {
      saveSupabaseConfig(config);
      await onConfigChange(config);
      
      // Trigger a quick test
      if (config.isEnabled) {
        handleTestConnection();
      } else {
        setTestStatus('idle');
      }
    } catch (error) {
      alert('Lỗi khi lưu cấu hình');
    }
  };

  const handleTestConnection = async () => {
    if (!config.url || !config.anonKey) {
      setTestStatus('failed');
      setTestMessage('Vui lòng cung cấp URL và API Key để kiểm tra.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Đang kết nối kiểm tra cấu hình bảng...');

    try {
      // We import createClient on-demand to verify
      const { createClient } = await import('@supabase/supabase-js');
      const client = createClient(config.url, config.anonKey);
      
      // Query employees to check table schema
      const { error } = await client
        .from('employees')
        .select('id')
        .limit(1);

      if (error) {
        throw error;
      }

      setTestStatus('success');
      setTestMessage('Kết nối thành công! Đã tìm thấy cấu trúc bảng hợp lệ trên cơ sở dữ liệu Supabase.');
    } catch (error: any) {
      console.error(error);
      setTestStatus('failed');
      setTestMessage(
        error.message || 'Không thể kết nối. Vui lòng kiểm tra lại URL/Key hoặc chắc chắn bạn đã chạy tập lệnh SQL khởi tạo bảng.'
      );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 font-sans">Kết Nối Cơ Sở Dữ Liệu</h2>
        <p className="text-slate-500">
          Ứng dụng hỗ trợ lưu trữ dữ liệu trực tiếp trên Supabase Cloud hoặc chạy ngoại tuyến (Offline Demo) trên LocalStorage.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Form Configuration (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-600" />
                Thông tin máy chủ Supabase
              </h3>
              
              {/* Active state toggle */}
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.isEnabled}
                  onChange={(e) => setConfig({ ...config, isEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="ml-2.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {config.isEnabled ? 'Kích hoạt Live' : 'Tạm tắt'}
                </span>
              </label>
            </div>

            <div className="space-y-4">
              {/* URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Supabase Project URL</label>
                <div className="relative">
                  <Database className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                  <input
                    type="url"
                    placeholder="https://xxxxxxxxxxxxxxxxxxxx.supabase.co"
                    value={config.url}
                    onChange={(e) => setConfig({ ...config, url: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Lấy từ mục Settings {`>`} API trong bảng điều khiển Supabase.</p>
              </div>

              {/* Anon Key */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Supabase Public Anon Key</label>
                <div className="relative">
                  <Key className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={config.anonKey}
                    onChange={(e) => setConfig({ ...config, anonKey: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2.5 text-sm font-mono text-slate-700 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Khóa công khai an toàn để truy cập cơ sở dữ liệu Client-side.</p>
              </div>
            </div>

            {/* Test Connection & Save Results */}
            {testStatus !== 'idle' && (
              <div className={`rounded-xl border p-4 flex items-start gap-3 text-xs ${
                testStatus === 'testing' ? 'bg-slate-50 border-slate-200 text-slate-600' :
                testStatus === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {testStatus === 'testing' && <RefreshCw className="h-4 w-4 text-slate-500 animate-spin shrink-0" />}
                {testStatus === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                {testStatus === 'failed' && <XCircle className="h-4 w-4 text-rose-600 shrink-0" />}
                <div className="space-y-1">
                  <div className="font-bold">Trạng thái kiểm tra</div>
                  <p className="font-medium leading-relaxed">{testMessage}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              {config.isEnabled && (
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing'}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  Kiểm tra kết nối
                </button>
              )}
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-sm"
              >
                Lưu cấu hình lưu trữ
              </button>
            </div>
          </form>

          {/* Manual Instructions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 text-sm leading-relaxed text-slate-600">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <HelpCircle className="h-4.5 w-4.5 text-indigo-500" />
              Hướng dẫn thiết lập 3 bước
            </h4>
            
            <ol className="list-decimal list-inside space-y-2">
              <li>
                Đăng nhập vào <strong>supabase.com</strong> và khởi tạo 1 dự án (Project) trống.
              </li>
              <li>
                Truy cập mục <strong>SQL Editor</strong> ở thanh menu bên trái, click "New query".
              </li>
              <li>
                Sao chép và dán toàn bộ <strong>Tập lệnh SQL Khởi Tạo</strong> ở ô bên phải vào trình soạn thảo rồi click <strong>Run</strong>.
              </li>
              <li>
                Lấy thông tin <strong>Project URL</strong> và <strong>Anon Key</strong> ở mục <em>Settings {`>`} API</em> rồi điền vào form bên trên và nhấn lưu!
              </li>
            </ol>

            <div className="pt-2">
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
              >
                Đi tới Supabase Console
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

        </div>

        {/* SQL Schema Copy panel (1 column) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between max-h-[620px]">
          <div className="space-y-3 overflow-hidden flex flex-col h-full">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">Tập Lệnh SQL Khởi Tạo</span>
              <button
                onClick={handleCopySQL}
                className={`rounded-lg p-1.5 border transition-all flex items-center gap-1 text-[10px] font-bold ${
                  isCopied 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="h-3 w-3" />
                    <span>Đã sao chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Chạy các câu lệnh DDL này trên trang quản trị cơ sở dữ liệu Supabase của bạn để tự động tạo các bảng cấu hình ca và phân lịch:
            </p>

            <div className="flex-1 overflow-y-auto rounded-xl border border-slate-150 bg-slate-950 p-3 text-[10px] font-mono text-slate-300 leading-relaxed scrollbar-thin select-all">
              <pre className="whitespace-pre-wrap break-all">{SQL_SCHEMA}</pre>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 mt-3 flex items-center gap-2 text-xs font-medium text-slate-500">
            <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
            <span>Hỗ trợ các cơ chế ràng buộc dữ liệu Cascade delete tự động.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
