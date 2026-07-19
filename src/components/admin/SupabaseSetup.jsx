import React, { useState, useEffect } from 'react';
import { Database, ShieldAlert, CheckCircle2, Copy, RefreshCw, CloudLightning, Info } from 'lucide-react';
import { getSupabaseConfig, SUPABASE_SQL_SCRIPT, syncAllLocalToSupabase } from '../../utils/supabase';
import { secureStorage } from '../../utils/security';

export default function SupabaseSetup() {
  const [urlInput, setUrlInput] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [config, setConfig] = useState(getSupabaseConfig());
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    setUrlInput(localStorage.getItem('supabase_url') || '');
    setKeyInput(localStorage.getItem('supabase_anon_key') || '');
  }, []);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ type: '', text: '' });

    const trimmedUrl = urlInput.trim();
    const trimmedKey = keyInput.trim();

    if (!trimmedUrl || !trimmedKey) {
      localStorage.removeItem('supabase_url');
      localStorage.removeItem('supabase_anon_key');
      setConfig(getSupabaseConfig());
      setStatusMsg({ type: 'error', text: 'Supabase configuration cleared. Web is back to LocalStorage.' });
      setLoading(false);
      return;
    }

    try {
      // Temporarily store in local storage to validate
      localStorage.setItem('supabase_url', trimmedUrl);
      localStorage.setItem('supabase_anon_key', trimmedKey);
      
      // Test the credentials by triggering the migration/validation
      setStatusMsg({ type: 'info', text: 'Connecting & validating credentials...' });
      
      // Perform migration of existing local articles/products/deals to Supabase
      const success = await syncAllLocalToSupabase(secureStorage);
      
      if (success) {
        setConfig(getSupabaseConfig());
        setStatusMsg({ 
          type: 'success', 
          text: '🎉 Connected successfully! All your existing LocalStorage articles, products, and deals have been migrated to Supabase.' 
        });
        
        // Force refresh components
        window.dispatchEvent(new CustomEvent('supabase-db-synced'));
      }
    } catch (err) {
      console.error(err);
      // Revert items
      localStorage.removeItem('supabase_url');
      localStorage.removeItem('supabase_anon_key');
      setConfig(getSupabaseConfig());
      setStatusMsg({ 
        type: 'error', 
        text: '❌ Connection failed! Make sure you created all tables in Supabase by running the SQL script below. Error details: ' + err.message 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMigrateOnly = async () => {
    setLoading(true);
    setStatusMsg({ type: 'info', text: 'Đang tiến hành đồng bộ dữ liệu cục bộ lên Supabase...' });
    try {
      const success = await syncAllLocalToSupabase(secureStorage);
      if (success) {
        setStatusMsg({
          type: 'success',
          text: '🎉 Đồng bộ dữ liệu thành công! Tất cả bài viết, sản phẩm và menu đã được tải lên lưu trữ trực tuyến an toàn trên Supabase. Bây giờ hãy bấm nút "Giải phóng bộ nhớ" bên dưới để dọn sạch bộ nhớ đệm trình duyệt.'
        });
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({
        type: 'error',
        text: '❌ Đồng bộ thất bại! Lỗi kết nối: ' + err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearLocalCache = () => {
    if (window.confirm("⚠️ Bạn có chắc chắn muốn giải phóng bộ nhớ trình duyệt? Hành động này sẽ xóa sạch dữ liệu cục bộ trùng lặp trên trình duyệt của bạn (sau khi đã được sao lưu an toàn lên Supabase) để chấm dứt vĩnh viễn thông báo lỗi đầy bộ nhớ. Sau khi xóa, trang web sẽ tự động tải lại và đọc dữ liệu trực tiếp từ Supabase.")) {
      // Clear local storage keys
      localStorage.removeItem("wc_categories");
      localStorage.removeItem("wc_products");
      localStorage.removeItem("review_products");
      localStorage.removeItem("wc_articles");
      localStorage.removeItem("review_articles");
      localStorage.removeItem("wc_deals");
      
      // Force reload the page
      window.location.reload();
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 text-left font-sans max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Database className="text-indigo-600" size={24} />
          <span>Supabase Cloud Integration</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Connect your site to a free cloud database on Supabase to save your articles and products permanently.
        </p>
      </div>

      {/* Integration Status Card */}
      <div className={`p-5 rounded-2xl border transition-all duration-200 ${
        config.isConfigured 
          ? 'bg-emerald-50/50 border-emerald-200/60' 
          : 'bg-amber-50/50 border-amber-250/60'
      }`}>
        <div className="flex gap-4 items-start">
          <div className={`p-2.5 rounded-xl shrink-0 ${
            config.isConfigured ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20' : 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
          }`}>
            {config.isConfigured ? <CloudLightning size={20} /> : <ShieldAlert size={20} />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {config.isConfigured ? 'Cloud Mode Active (Supabase)' : 'Local Mode Active (LocalStorage Only)'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {config.isConfigured 
                ? 'Your website is connected to Supabase. Articles, products, and homepage layout changes are automatically synchronized to your database in real-time. No browser limits!'
                : 'Your database is currently stored inside your web browser. It is limited to 5MB and other users cannot see articles you create. Connect to Supabase to make your edits live for everyone.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Migration Actions Card */}
      {config.isConfigured && (
        <div className="bg-gradient-to-br from-indigo-50/60 to-purple-50/60 p-5 rounded-2xl border border-indigo-150/80 shadow-sm space-y-3.5">
          <div className="border-b border-indigo-100/80 pb-2 flex items-center gap-2">
            <RefreshCw size={15} className="text-indigo-600" />
            <h3 className="text-xs font-extrabold uppercase text-indigo-750 tracking-wider">Đồng bộ dữ liệu & Giải phóng bộ nhớ đệm</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Dữ liệu của bạn hiện đã sẵn sàng để lưu trên đám mây Supabase. Hãy thực hiện hai bước sau để đồng bộ hóa bài viết và giải quyết dứt điểm thông báo đầy bộ nhớ trình duyệt:
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              onClick={handleMigrateOnly}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-750 disabled:bg-indigo-300 text-white text-xs font-bold px-4.5 py-2.5 rounded-lg shadow-sm transition cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              <span>1. Đẩy toàn bộ dữ liệu từ máy lên Supabase</span>
            </button>
            
            <button
              onClick={handleClearLocalCache}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-750 disabled:bg-rose-300 text-white text-xs font-bold px-4.5 py-2.5 rounded-lg shadow-sm transition cursor-pointer"
            >
              <span>2. Giải phóng bộ nhớ trình duyệt (Xóa cache đầy)</span>
            </button>
          </div>
        </div>
      )}

      {statusMsg.text && (
        <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200 ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : statusMsg.type === 'error' 
              ? 'bg-rose-50 border-rose-200 text-rose-800' 
              : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> : <Info size={16} className="text-blue-600 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Setup Form & Guide Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Form panel */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Connection Settings</h3>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Supabase Project URL</label>
              <input
                type="url"
                placeholder="https://yourprojectid.supabase.co"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 bg-white transition-all"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Supabase Anon Key (API Key)</label>
              <input
                type="text"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey..."
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 bg-white transition-all"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-sm transition cursor-pointer"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <CloudLightning size={14} />}
                <span>Save & Sync Database</span>
              </button>
              
              {(urlInput || keyInput) && (
                <button
                  type="button"
                  onClick={() => {
                    setUrlInput('');
                    setKeyInput('');
                    localStorage.removeItem('supabase_url');
                    localStorage.removeItem('supabase_anon_key');
                    setConfig(getSupabaseConfig());
                    setStatusMsg({ type: 'info', text: 'Configuration cleared. Now running in offline local mode.' });
                    window.dispatchEvent(new CustomEvent('supabase-db-synced'));
                  }}
                  className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold px-5 py-2.5 rounded-lg transition"
                >
                  Clear Config
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Instructions panel */}
        <div className="lg:col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-200/60 space-y-4">
          <div className="border-b border-slate-200/60 pb-2">
            <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Step-by-Step Guide</h3>
          </div>

          <ol className="list-decimal pl-4 text-xs text-slate-600 space-y-3 font-medium leading-relaxed">
            <li>
              Đăng ký tài khoản miễn phí tại <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-bold">supabase.com</a> và tạo một Project mới.
            </li>
            <li>
              Vào mục **SQL Editor** trong thanh công cụ bên trái của bảng điều khiển Supabase.
            </li>
            <li>
              Tạo một truy vấn mới, dán mã SQL ở phần bên dưới vào và click nút **Run** để khởi tạo các bảng và phân quyền bảo mật.
            </li>
            <li>
              Vào mục **Project Settings** $\rightarrow$ **API** $\rightarrow$ Copy thông tin **Project URL** và **Anon Key** điền vào form bên trái.
            </li>
            <li>
              Nhấp **Save & Sync Database**. Toàn bộ bài viết hiện tại của bạn sẽ tự động được tải lên lưu trữ trực tuyến vĩnh viễn trên đám mây!
            </li>
          </ol>
        </div>
      </div>

      {/* SQL Script Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
          <h3 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">Database Setup Script (SQL)</h3>
          <button
            onClick={handleCopySql}
            className="inline-flex items-center gap-1.5 border border-slate-200 hover:bg-slate-100 bg-white text-slate-600 hover:text-slate-800 text-[10px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
          >
            {copied ? <CheckCircle2 size={12} className="text-emerald-600" /> : <Copy size={12} />}
            <span>{copied ? 'Copied!' : 'Copy SQL Script'}</span>
          </button>
        </div>
        <div className="p-5 bg-slate-900 overflow-x-auto max-h-[300px]">
          <pre className="text-[11px] font-mono text-emerald-400 text-left leading-relaxed">
            {SUPABASE_SQL_SCRIPT}
          </pre>
        </div>
      </div>
    </div>
  );
}
