import React, { useState, useContext, useEffect } from 'react';
import { ProductProvider, ProductContext } from '../../context/ProductContext';
import { ArticleProvider, ArticleContext } from '../../context/ArticleContext';
import AdminSidebar from './AdminSidebar';
import AdminDashboard from '../../pages/admin/AdminDashboard';
import ProductDatabase from '../../pages/admin/ProductDatabase';
import ArticleEditor from '../../pages/admin/ArticleEditor';
import AdminAccounts from './AdminAccounts';
import SupabaseSetup from './SupabaseSetup';
import { menuData as staticMenuData } from '../common/menuData';
import { useLocation, useNavigate } from 'react-router-dom';
import { syncArrayToSupabase } from '../../utils/supabase';

// Icons for Mega Menu & Analytics
import { 
  Save, 
  RefreshCw, 
  Plus, 
  Edit2, 
  Trash, 
  ArrowRight,
  Shield,
  Lock,
  LogOut,
  Globe,
  Eye,
  EyeOff
} from 'lucide-react';

function AdminPanelContent({ setIsAdminActive, adminUser, setAdminUser }) {
  const [activeTab, setActiveTab] = useState('articles');
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();

  const [timeRemaining, setTimeRemaining] = useState(900); // 15 minutes = 900s

  useEffect(() => {
    if (!adminUser) return;
    const params = new URLSearchParams(location.search);
    const editId = params.get('edit');
    if (editId) {
      setEditingArticleId(editId);
      setActiveTab('article-editor');
      // Clear the query parameter to avoid stuck screens
      navigate('/admin', { replace: true });
    }
  }, [location.search, navigate, adminUser]);

  useEffect(() => {
    if (!adminUser) return;
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          sessionStorage.removeItem('wc_admin_session');
          setAdminUser(null);
          setIsAdminActive(false);
          alert("Session expired due to 15 minutes of inactivity. Re-authentication required.");
          return 900;
        }
        return prev - 1;
      });
    }, 1000);

    const resetTimer = () => setTimeRemaining(900);

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [adminUser]);

  const handleLogout = () => {
    sessionStorage.removeItem('wc_admin_session');
    setAdminUser(null);
    setIsAdminActive(false);
    navigate('/admin');
  };

  // Context lists
  const { setProducts } = useContext(ProductContext);
  const { setArticles } = useContext(ArticleContext);


  return (
    <div className="flex bg-slate-50 h-full w-full font-sans antialiased text-slate-800 overflow-hidden">
      
      {/* Admin Sidebar navigation menu */}
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
      />

      {/* Main workplace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium text-xs">CMS /</span>
            <span className="text-slate-900 font-bold text-xs capitalize">
              {activeTab === 'article-editor' ? 'Article Editor' : activeTab.replace('-', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-4">
            
            {feedbackMsg && (
              <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg font-medium animate-pulse">
                {feedbackMsg}
              </span>
            )}
            
          </div>
        </header>

        {/* Tab container */}
        <div className="p-8 max-w-7xl w-full mx-auto flex-1 overflow-y-auto">
          
          {/* Review Articles Tab */}
          {activeTab === 'articles' && (
            <ArticleEditor 
              editingArticleId={editingArticleId} 
              setEditingArticleId={(id) => {
                setEditingArticleId(id);
                if (id !== null) setActiveTab('article-editor');
              }}
              onCancel={() => setActiveTab('articles')}
            />
          )}

          {/* Create/Edit Post Tab */}
          {activeTab === 'article-editor' && (
            <ArticleEditor 
              editingArticleId={editingArticleId} 
              setEditingArticleId={setEditingArticleId}
              onCancel={() => {
                setActiveTab('articles');
                setEditingArticleId(null);
              }}
            />
          )}

          {/* Admin Accounts Tab */}
          {activeTab === 'accounts' && (
            <AdminAccounts />
          )}

          {/* Supabase Database Setup Tab */}
          {activeTab === 'supabase-setup' && (
            <SupabaseSetup />
          )}

        </div>
      </main>

    </div>
  );
}

export default function AdminPanel({ isAdminActive, setIsAdminActive }) {
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('wc_admin_session');
      return stored ? JSON.parse(stored) : null;
    } catch(e) {
      return null;
    }
  });

  const [isRegister, setIsRegister] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Verification States
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSentAt, setCodeSentAt] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [passwordVal, setPasswordVal] = useState('');
  const [confirmPasswordVal, setConfirmPasswordVal] = useState('');
  const [usernameVal, setUsernameVal] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('wc_saved_username');
      const savedPass = localStorage.getItem('wc_saved_password');
      if (savedUser && savedPass) {
        setUsernameVal(savedUser);
        setPasswordVal(savedPass);
        setRememberMe(true);
      }
    } catch (e) {
      console.warn("Failed to load saved credentials:", e);
    }
  }, []);

  // Password Requirement Flags (reactive based on passwordVal)
  const hasMinLength = passwordVal.length >= 8;
  const hasUppercase = /[A-Z]/.test(passwordVal);
  const hasLowercase = /[a-z]/.test(passwordVal);
  const hasNumber = /[0-9]/.test(passwordVal);
  const hasSpecial = /[^A-Za-z0-9]/.test(passwordVal);

  // Check if username is already taken
  const isUsernameTaken = (() => {
    const trimmed = usernameVal.trim().toLowerCase();
    if (!trimmed) return false;
    let users = [];
    try {
      users = JSON.parse(localStorage.getItem('wc_registered_users')) || [];
    } catch (e) {
      users = [];
    }
    // Also include default admin account check
    if (!users.some(u => u.username === 'admin')) {
      users.push({ username: 'admin', password: 'admin', role: 'admin' });
    }
    return users.some(u => u.username === trimmed);
  })();

  const isRegistrationFormValid = 
    usernameVal.trim().length > 0 && 
    !isUsernameTaken &&
    hasMinLength && 
    hasUppercase && 
    hasLowercase && 
    hasNumber && 
    hasSpecial && 
    confirmPasswordVal === passwordVal;

  // Countdown timer effect
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  const handleSendCode = async (username) => {
    if (!username || username.trim().length === 0) {
      setAuthError('Vui lòng nhập Username trước khi lấy mã.');
      return;
    }

    // Generate random 6-digit verification code
    const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

    // Start countdown immediately for instant UI feedback
    setVerificationCode(generatedOTP);
    setCodeSentAt(Date.now());
    setCountdown(60);

    setIsSendingCode(true);
    setAuthError('');
    setAuthSuccess('Đang gửi mã xác minh đến email doan******@gmail.com...');

    try {
      const response = await fetch('https://formsubmit.co/ajax/doanhaixuyen17@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: '🔴 Mã xác minh đăng ký CMS: ' + generatedOTP,
          username: username,
          code: generatedOTP,
          message: `Một yêu cầu tạo tài khoản CMS với tên đăng nhập "${username}" đã được gửi. Mã xác minh OTP là: ${generatedOTP}. Mã này chỉ có hiệu lực trong vòng 60 giây.`
        })
      });

      if (response.ok) {
        setAuthSuccess('Mã xác minh đã được gửi đến email: doan******@gmail.com. Hãy kiểm tra hộp thư của bạn!');
      } else {
        setAuthError('Không thể gửi mã xác minh. Hãy chắc chắn email của bạn đã chấp nhận FormSubmit hoặc thử lại.');
      }
    } catch (error) {
      // Keep the countdown active, but show connection issue warning
      setAuthError('Không thể kết nối đến máy chủ gửi mail. Hãy thử lại sau.');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleLoginSubmit = (username, password) => {
    username = username.trim().toLowerCase();
    
    // Retrieve registered users from localStorage
    let users = [];
    try {
      users = JSON.parse(localStorage.getItem('wc_registered_users')) || [];
    } catch (e) {
      users = [];
    }
    
    // Seed default admin account if empty
    if (!users.some(u => u.username === 'admin')) {
      users.push({ username: 'admin', password: 'admin', role: 'admin' });
      localStorage.setItem('wc_registered_users', JSON.stringify(users));
      try {
        syncArrayToSupabase('wc_registered_users', users);
      } catch (e) {
        console.error("Failed to sync seeded admin to Supabase:", e);
      }
    }
    
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      const session = {
        username: user.username,
        role: user.role || 'admin',
        token: `JWT-SECURE-${Math.random().toString(36).substring(2, 15)}`,
        loginTime: Date.now()
      };
      sessionStorage.setItem('wc_admin_session', JSON.stringify(session));
      setAdminUser(session);
      setIsAdminActive(true);
      setAuthError('');
      setAuthSuccess('Authenticated successfully!');

      if (rememberMe) {
        localStorage.setItem('wc_saved_username', username);
        localStorage.setItem('wc_saved_password', password);
      } else {
        localStorage.removeItem('wc_saved_username');
        localStorage.removeItem('wc_saved_password');
      }
    } else {
      setAuthError('Invalid username or password.');
    }
  };

  const handleRegisterSubmit = (username, password, confirmPassword, enteredCode) => {
    username = username.trim().toLowerCase();
    if (!username || !password) {
      setAuthError('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    // Password Complexity Validation
    const isMinLengthValid = password.length >= 8;
    const isUppercaseValid = /[A-Z]/.test(password);
    const isLowercaseValid = /[a-z]/.test(password);
    const isNumberValid = /[0-9]/.test(password);
    const isSpecialValid = /[^A-Za-z0-9]/.test(password);

    if (!isMinLengthValid || !isUppercaseValid || !isLowercaseValid || !isNumberValid || !isSpecialValid) {
      setAuthError('Mật khẩu chưa đáp ứng đầy đủ yêu cầu bảo mật.');
      return;
    }

    // OTP Code Validation
    if (!verificationCode || !codeSentAt) {
      setAuthError('Vui lòng nhấp "Lấy mã xác minh" trước.');
      return;
    }
    const age = (Date.now() - codeSentAt) / 1000;
    if (age > 60) {
      setAuthError('Mã xác minh đã hết hạn (chỉ có hiệu lực trong 60 giây).');
      return;
    }
    if (enteredCode.trim() !== verificationCode) {
      setAuthError('Mã xác minh không chính xác.');
      return;
    }
    
    let users = [];
    try {
      users = JSON.parse(localStorage.getItem('wc_registered_users')) || [];
    } catch (e) {
      users = [];
    }
    
    if (!users.some(u => u.username === 'admin')) {
      users.push({ username: 'admin', password: 'admin', role: 'admin' });
    }

    if (users.some(u => u.username === username)) {
      setAuthError('Username is already registered.');
      return;
    }

    users.push({ username, password, role: 'admin' });
    localStorage.setItem('wc_registered_users', JSON.stringify(users));
    try {
      syncArrayToSupabase('wc_registered_users', users);
    } catch (e) {
      console.error("Failed to sync registered user to Supabase:", e);
    }
    
    setAuthError('');
    setAuthSuccess('Account registered successfully! Please log in.');
    setIsRegister(false);

    // Reset code and password state
    setVerificationCode('');
    setCodeSentAt(null);
    setCountdown(0);
    setPasswordVal('');
    setConfirmPasswordVal('');
    setUsernameVal('');
  };

  if (!adminUser) {
    return (
      <div className="h-full w-full bg-slate-50 flex items-center justify-center p-6 text-slate-800 font-sans">
        <div className="bg-white border border-slate-200 max-w-md w-full rounded-2xl shadow-xl p-8 space-y-6 relative overflow-hidden text-left transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-indigo-600 to-emerald-500"></div>
          
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center bg-indigo-50 text-indigo-600 p-3 rounded-full mb-1 border border-indigo-100 animate-pulse">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              {isRegister ? 'Create CMS Account' : 'ReviewSmart Secure Gateway'}
            </h2>
            <p className="text-xs text-slate-500">
              {isRegister ? 'Register credentials for workspace access' : 'Enter credentials to manage review articles'}
            </p>
          </div>

          {authError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs py-2 px-3 rounded-lg text-center font-medium">
              {authError}
            </div>
          )}
          {authSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs py-2 px-3 rounded-lg text-center font-medium">
              {authSuccess}
            </div>
          )}

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target;
              if (isRegister) {
                handleRegisterSubmit(
                  form.username.value, 
                  passwordVal, 
                  confirmPasswordVal,
                  form.verificationCode.value
                );
              } else {
                handleLoginSubmit(form.username.value, passwordVal);
              }
            }} 
            className="space-y-4"
          >
             <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Username</label>
              <input 
                name="username" 
                type="text" 
                placeholder="Enter username"
                required
                value={usernameVal}
                onChange={(e) => setUsernameVal(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {isRegister && usernameVal.trim().length > 0 && isUsernameTaken && (
                <p className="text-[10px] text-rose-600 mt-1.5 font-bold">
                  ✗ Username này đã được đăng ký trong hệ thống
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter password"
                  required
                  value={passwordVal}
                  onChange={(e) => setPasswordVal(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3.5 pr-10 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-650 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {!isRegister && (
                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center space-x-2 cursor-pointer group select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-350 text-indigo-650 focus:ring-indigo-500 focus:ring-offset-0 h-4 w-4 cursor-pointer transition"
                    />
                    <span className="text-xs font-bold text-slate-450 uppercase tracking-wider group-hover:text-slate-600 transition">
                      Nhớ mật khẩu
                    </span>
                  </label>
                </div>
              )}

              {/* Password Complexity Checklist UI */}
              {isRegister && passwordVal.length > 0 && (
                <div className="mt-2.5 p-3 bg-slate-50 border border-slate-100 rounded-lg text-[10px] space-y-1.5 font-medium text-slate-500">
                  <p className="font-bold text-slate-700 mb-1">Mật khẩu phải đáp ứng:</p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className={hasMinLength ? "text-emerald-600 font-extrabold" : "text-slate-300 font-bold"}>
                        {hasMinLength ? "✓" : "○"}
                      </span>
                      <span className={hasMinLength ? "text-slate-800 font-semibold" : "text-slate-400"}>Tối thiểu 8 ký tự</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={hasUppercase ? "text-emerald-600 font-extrabold" : "text-slate-300 font-bold"}>
                        {hasUppercase ? "✓" : "○"}
                      </span>
                      <span className={hasUppercase ? "text-slate-800 font-semibold" : "text-slate-400"}>1 chữ hoa (A-Z)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={hasLowercase ? "text-emerald-600 font-extrabold" : "text-slate-300 font-bold"}>
                        {hasLowercase ? "✓" : "○"}
                      </span>
                      <span className={hasLowercase ? "text-slate-800 font-semibold" : "text-slate-400"}>1 chữ thường (a-z)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={hasNumber ? "text-emerald-600 font-extrabold" : "text-slate-300 font-bold"}>
                        {hasNumber ? "✓" : "○"}
                      </span>
                      <span className={hasNumber ? "text-slate-800 font-semibold" : "text-slate-400"}>1 chữ số (0-9)</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <span className={hasSpecial ? "text-emerald-600 font-extrabold" : "text-slate-300 font-bold"}>
                        {hasSpecial ? "✓" : "○"}
                      </span>
                      <span className={hasSpecial ? "text-slate-800 font-semibold" : "text-slate-400"}>1 ký tự đặc biệt (!@#$...)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <input 
                      name="confirmPassword" 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="Re-enter password"
                      required
                      value={confirmPasswordVal}
                      onChange={(e) => setConfirmPasswordVal(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3.5 pr-10 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-650 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {confirmPasswordVal.length > 0 && (
                    <p className={`text-[10px] mt-1.5 font-bold flex items-center gap-1 ${confirmPasswordVal === passwordVal ? "text-emerald-600" : "text-rose-600"}`}>
                      {confirmPasswordVal === passwordVal ? "✓ Mật khẩu trùng khớp" : "✗ Mật khẩu không trùng khớp"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Verification Code (OTP)</label>
                  <div className="flex gap-2">
                    <input 
                      name="verificationCode" 
                      type="text" 
                      placeholder="Enter 6-digit OTP"
                      required
                      maxLength={6}
                      className="flex-grow w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors tracking-widest font-mono text-center font-bold"
                    />
                    <button
                      type="button"
                      disabled={countdown > 0 || isSendingCode || !isRegistrationFormValid}
                      onClick={() => {
                        handleSendCode(usernameVal);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed shrink-0 min-w-[110px]"
                    >
                      {countdown > 0 ? `${countdown}s` : (isSendingCode ? 'Sending...' : 'Get Code')}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                    {!isRegistrationFormValid ? (
                      <span className="text-amber-600 font-semibold">⚠️ Vui lòng nhập Username hợp lệ và Mật khẩu chuẩn xác (đủ các dấu tích xanh) để kích hoạt nút Get Code.</span>
                    ) : (
                      <span>Mã OTP sẽ được gửi đến email <strong>doan******@gmail.com</strong> và hết hạn sau {countdown > 0 ? countdown : 60}s.</span>
                    )}
                  </p>
                </div>
              </>
            )}

            <button 
              type="submit" 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold tracking-widest uppercase py-3 rounded-lg shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-2"
            >
              <span>{isRegister ? 'Register & Request Access' : 'Authenticate Session'}</span>
              <ArrowRight size={14} />
            </button>
          </form>

          <div className="pt-2 text-center text-xs border-t border-slate-100 flex items-center justify-between text-slate-500">
            <span>
              {isRegister ? 'Already have an account?' : 'Need a manager account?'}
            </span>
            <button 
              type="button" 
              onClick={() => {
                setIsRegister(!isRegister);
                setAuthError('');
                setAuthSuccess('');
                setPasswordVal('');
                setConfirmPasswordVal('');
                setUsernameVal('');
              }}
              className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
            >
              {isRegister ? 'Log In' : 'Register Now'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <AdminPanelContent setIsAdminActive={setIsAdminActive} adminUser={adminUser} setAdminUser={setAdminUser} />;
}
