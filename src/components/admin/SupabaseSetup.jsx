import React, { useState, useEffect } from 'react';
import { Database, ShieldAlert, CheckCircle2, RefreshCw, Server, HardDrive, ShieldCheck, HelpCircle } from 'lucide-react';
import { syncAllLocalToSupabase } from '../../utils/supabase';
import { secureStorage } from '../../utils/security';

export default function SupabaseSetup() {
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [serverStats, setServerStats] = useState({
    dbType: 'SQLite 3 (Local File)',
    apiHost: 'http://127.0.0.1:5000',
    nginxProxy: 'Active (Port 443 HTTPS)',
    imageStorage: 'Local VPS Disk (/var/www/review_tot_system_com/uploads/)'
  });

  const handleMigrateOnly = async () => {
    setLoading(true);
    setStatusMsg({ type: 'info', text: 'Đang tiến hành đồng bộ dữ liệu cục bộ lên cơ sở dữ liệu VPS...' });
    try {
      const success = await syncAllLocalToSupabase(secureStorage);
      if (success) {
        setStatusMsg({
          type: 'success',
          text: '🎉 Đồng bộ dữ liệu thành công! Tất cả bài viết, sản phẩm, ưu đãi và cấu hình đã được sao lưu an toàn vào cơ sở dữ liệu SQLite trên VPS của bạn.'
        });
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({
        type: 'error',
        text: '❌ Đồng bộ thất bại! Lỗi kết nối API: ' + err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearLocalCache = () => {
    if (window.confirm("⚠️ Xóa bộ nhớ đệm trùng lặp?\nHành động này sẽ xóa dữ liệu nháp cũ trên trình duyệt này. Sau khi xóa, trang web sẽ tự động tải lại và lấy dữ liệu sạch trực tiếp từ cơ sở dữ liệu SQLite trên VPS của bạn.")) {
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

  return (
    <div className="space-y-6 text-left font-sans max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Server className="text-indigo-600 animate-pulse" size={24} />
          <span>Hệ Thống Cơ Sở Dữ Liệu VPS (SQLite)</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Quản lý cơ sở dữ liệu chạy trực tiếp trên VPS của bạn. Hoàn toàn miễn phí, không giới hạn dung lượng và hoạt động vĩnh viễn.
        </p>
      </div>

      {/* Connection Status Card */}
      <div className="bg-emerald-50/50 border border-emerald-200/60 p-5 rounded-2xl transition-all duration-200 shadow-sm">
        <div className="flex gap-4 items-start">
          <div className="p-2.5 rounded-xl shrink-0 bg-emerald-500 text-white shadow-sm shadow-emerald-500/20">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>Đang Chạy Trực Tiếp Trên VPS</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">
                Đã kết nối
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Trang web của bạn hiện đã được kết nối với backend Express API chạy trên cổng 5000 và cơ sở dữ liệu SQLite cục bộ trên VPS. Mọi thay đổi dữ liệu của bạn sẽ được lưu trữ vĩnh viễn trên ổ đĩa của VPS.
            </p>
          </div>
        </div>
      </div>

      {/* System Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start gap-4">
          <Database className="text-indigo-500 shrink-0 mt-1" size={20} />
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Cơ Sở Dữ Liệu</h4>
            <p className="text-xs font-semibold text-slate-900 mt-1">{serverStats.dbType}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Tự động khởi tạo, lưu trong file local bảo mật</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start gap-4">
          <HardDrive className="text-blue-500 shrink-0 mt-1" size={20} />
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Lưu Trữ Hình Ảnh</h4>
            <p className="text-xs font-semibold text-slate-900 mt-1 truncate max-w-xs">{serverStats.imageStorage}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Nginx phục vụ trực tiếp tốc độ cao</p>
          </div>
        </div>
      </div>

      {/* Migration Actions Card */}
      <div className="bg-gradient-to-br from-indigo-50/60 to-purple-50/60 p-6 rounded-2xl border border-indigo-150/80 shadow-sm space-y-4">
        <div className="border-b border-indigo-100/80 pb-2.5 flex items-center gap-2">
          <RefreshCw size={15} className="text-indigo-600" />
          <h3 className="text-xs font-extrabold uppercase text-indigo-750 tracking-wider">Đồng Bộ & Giải Phóng Bộ Nhớ Đệm</h3>
        </div>
        <p className="text-xs text-slate-650 leading-relaxed">
          Nếu đây là lần đầu tiên bạn chuyển sang chạy trên VPS hoặc bạn vừa truy cập từ một thiết bị mới có dữ liệu cũ, hãy thực hiện lần lượt 2 bước sau để đồng bộ dữ liệu:
        </p>
        
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleMigrateOnly}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-750 disabled:bg-indigo-300 text-white text-xs font-bold px-5 py-3 rounded-xl shadow-sm hover:shadow-md transition duration-200 cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>1. Đẩy toàn bộ dữ liệu từ trình duyệt lên VPS</span>
          </button>
          
          <button
            onClick={handleClearLocalCache}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-bold px-5 py-3 rounded-xl shadow-sm hover:shadow-md transition duration-200 cursor-pointer"
          >
            <span>2. Giải phóng bộ nhớ đệm (Chạy dữ liệu VPS)</span>
          </button>
        </div>
      </div>

      {statusMsg.text && (
        <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200 ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : statusMsg.type === 'error' 
              ? 'bg-rose-50 border-rose-200 text-rose-800' 
              : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> : <ShieldAlert size={16} className="text-rose-600 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Guide Section */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 space-y-4">
        <div className="border-b border-slate-200/60 pb-2 flex items-center gap-2">
          <HelpCircle size={15} className="text-slate-505" />
          <h3 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">Nguyên lý hoạt động</h3>
        </div>
        <ul className="list-disc pl-4 text-xs text-slate-650 space-y-2.5 leading-relaxed">
          <li>
            <strong>Hệ thống cơ sở dữ liệu SQLite:</strong> Mọi bài viết, danh mục, sản phẩm, link affiliate đều được lưu trữ trực tiếp trên file cơ sở dữ liệu trên VPS.
          </li>
          <li>
            <strong>Lưu trữ tệp cục bộ (Local Storage):</strong> Hình ảnh khi bạn tải lên từ trang quản trị sẽ được gửi qua API và lưu vào thư mục <code className="bg-slate-200/65 px-1 py-0.5 rounded text-[10px] font-mono">uploads/</code> trên VPS, sau đó được phục vụ tĩnh bởi Nginx. Không phụ thuộc vào bất kỳ bên thứ ba nào.
          </li>
          <li>
            <strong>Bảo trì tự động:</strong> PM2 quản lý tiến trình API luôn bật, tự động khởi động lại nếu có sự cố. Khi bạn cập nhật code qua GitHub, hệ thống CI/CD sẽ tự động build và triển khai lại mà không gián đoạn hoạt động của web.
          </li>
        </ul>
      </div>
    </div>
  );
}
