import { 
  FileText, 
  LogOut,
  Globe,
  Users,
  Layout,
  Database
} from 'lucide-react';

export default function AdminSidebar({ activeTab, setActiveTab, onLogout }) {
  const menuItems = [
    { id: 'articles', label: 'Review Articles', icon: FileText },
    { id: 'homepage-layout', label: 'Homepage Layout', icon: Layout },
    { id: 'accounts', label: 'Admin Accounts', icon: Users },
    { id: 'supabase-setup', label: 'Cơ sở dữ liệu VPS', icon: Database },
  ];

  const sessionUser = (() => {
    try {
      const stored = sessionStorage.getItem('wc_admin_session');
      return stored ? JSON.parse(stored) : null;
    } catch(e) {
      return null;
    }
  })();
  const username = sessionUser?.username || 'guest';
  const roleName = sessionUser?.role === 'admin' ? 'Administrator' : 'Guest (Read-Only)';
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <aside className="w-64 bg-white text-slate-600 flex flex-col border-r border-slate-200 shrink-0 h-full">


      {/* Editor Identity */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-[11px] uppercase text-white ${sessionUser?.role === 'admin' ? 'bg-indigo-600' : 'bg-slate-500'}`}>
            {initials}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 capitalize">{username}</p>
            <span className={`text-[9px] font-bold block leading-none mt-0.5 ${sessionUser?.role === 'admin' ? 'text-indigo-600' : 'text-slate-500'}`}>
              {roleName}
            </span>
          </div>
        </div>
        
        {/* Logout Trigger button */}
        <button 
          onClick={onLogout}
          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors border border-transparent hover:border-rose-100 bg-white shadow-sm flex items-center justify-center cursor-pointer"
          title="Log Out CMS Portal"
        >
          <LogOut size={13} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.id === 'articles' && activeTab === 'article-editor');
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left ${
                isActive
                  ? 'bg-slate-100 text-slate-900 shadow-sm border border-slate-200/50'
                  : 'hover:bg-slate-50 hover:text-slate-900 text-slate-500'
              }`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}

      </nav>
    </aside>
  );
}
