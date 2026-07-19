import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { syncArrayToSupabase } from '../../utils/supabase';

export default function AdminAccounts() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Form states
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // user object being edited
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState({});

  useEffect(() => {
    // Load users
    let storedUsers = [];
    try {
      storedUsers = JSON.parse(localStorage.getItem('wc_registered_users')) || [];
    } catch (e) {
      storedUsers = [];
    }
    
    // Ensure default admin exists
    if (!storedUsers.some(u => u.username === 'admin')) {
      storedUsers.push({ username: 'admin', password: 'admin', role: 'admin' });
      saveUsersToStorage(storedUsers);
    } else {
      setUsers(storedUsers);
    }

    // Get current session user
    try {
      const session = sessionStorage.getItem('wc_admin_session');
      if (session) {
        setCurrentUser(JSON.parse(session));
      }
    } catch (e) {}
  }, []);

  const saveUsersToStorage = (updatedUsers) => {
    localStorage.setItem('wc_registered_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    try {
      syncArrayToSupabase('wc_registered_users', updatedUsers);
    } catch (e) {
      console.error("Failed to sync users to Supabase:", e);
    }
  };

  const handleAddAccount = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const uName = usernameInput.trim().toLowerCase();
    const pWord = passwordInput;

    if (!uName || !pWord) {
      setErrorMsg('Username and Password are required.');
      return;
    }

    if (pWord !== confirmPasswordInput) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (users.some(u => u.username === uName)) {
      setErrorMsg('Username already exists.');
      return;
    }

    const updated = [...users, { username: uName, password: pWord, role: 'admin' }];
    saveUsersToStorage(updated);
    setSuccessMsg(`Account "${uName}" added successfully.`);
    
    // Reset form
    setUsernameInput('');
    setPasswordInput('');
    setConfirmPasswordInput('');
    setIsAdding(false);
  };

  const handleEditAccount = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const pWord = passwordInput;

    if (!pWord) {
      setErrorMsg('Password is required.');
      return;
    }

    if (pWord !== confirmPasswordInput) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    const updated = users.map(u => {
      if (u.username === editingUser.username) {
        return { ...u, password: pWord };
      }
      return u;
    });

    saveUsersToStorage(updated);
    setSuccessMsg(`Password for "${editingUser.username}" updated successfully.`);
    
    // Reset edit state
    setPasswordInput('');
    setConfirmPasswordInput('');
    setEditingUser(null);
  };

  const handleDeleteAccount = (usernameToDelete) => {
    setErrorMsg('');
    setSuccessMsg('');

    if (currentUser && currentUser.username === usernameToDelete) {
      setErrorMsg('You cannot delete the account you are currently logged into.');
      return;
    }

    if (usernameToDelete === 'admin' && users.filter(u => u.role === 'admin').length <= 1) {
      setErrorMsg('Cannot delete the primary admin account.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete the account "${usernameToDelete}"?`)) {
      const updated = users.filter(u => u.username !== usernameToDelete);
      saveUsersToStorage(updated);
      setSuccessMsg(`Account "${usernameToDelete}" has been deleted.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Admin Account Management</h2>
          <p className="text-xs text-slate-500 mt-1">Manage usernames and passwords for CMS system administrators.</p>
        </div>
        {!isAdding && !editingUser && (
          <button
            onClick={() => {
              setIsAdding(true);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow transition cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Account</span>
          </button>
        )}
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs py-2.5 px-4 rounded-lg flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs py-2.5 px-4 rounded-lg flex items-center gap-2">
          <Check size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Add New Account Form */}
      {isAdding && (
        <form onSubmit={handleAddAccount} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Create New Administrator</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Username</label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="e.g. manager"
                required
                className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">New Password</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPasswordInput}
                onChange={(e) => setConfirmPasswordInput(e.target.value)}
                placeholder="Re-enter password"
                required
                className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setErrorMsg('');
              }}
              className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow cursor-pointer"
            >
              Create Account
            </button>
          </div>
        </form>
      )}

      {/* Edit Password Form */}
      {editingUser && (
        <form onSubmit={handleEditAccount} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Change Password for "{editingUser.username}"</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">New Password</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter new password"
                required
                className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPasswordInput}
                onChange={(e) => setConfirmPasswordInput(e.target.value)}
                placeholder="Re-enter new password"
                required
                className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setEditingUser(null);
                setErrorMsg('');
              }}
              className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow cursor-pointer"
            >
              Save Password
            </button>
          </div>
        </form>
      )}

      {/* Accounts List Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Username</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Password (Masked)</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => {
              const isSelf = currentUser && currentUser.username === u.username;
              return (
                <tr key={u.username} className="hover:bg-slate-50/50 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] uppercase">
                        {u.username.slice(0, 2)}
                      </div>
                      <span className="text-xs font-bold text-slate-800 capitalize">
                        {u.username} {isSelf && <span className="ml-1 text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold font-sans">You</span>}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-xs text-slate-500 capitalize">{u.role || 'admin'}</td>
                  <td className="p-4 text-xs text-slate-700 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="min-w-[60px] inline-block">
                        {visiblePasswords[u.username] ? u.password : '••••••••'}
                      </span>
                      <button
                        onClick={() => {
                          setVisiblePasswords(prev => ({
                            ...prev,
                            [u.username]: !prev[u.username]
                          }));
                        }}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        title={visiblePasswords[u.username] ? "Hide Password" : "Show Password"}
                      >
                        {visiblePasswords[u.username] ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setIsAdding(false);
                          setErrorMsg('');
                          setSuccessMsg('');
                          setPasswordInput('');
                          setConfirmPasswordInput('');
                        }}
                        className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 rounded text-slate-400 transition cursor-pointer"
                        title="Change Password"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(u.username)}
                        disabled={isSelf}
                        className={`p-1.5 rounded transition ${isSelf ? 'opacity-30 cursor-not-allowed text-slate-300' : 'hover:bg-red-50 hover:text-red-600 text-slate-400 cursor-pointer'}`}
                        title={isSelf ? 'Cannot delete your own account' : 'Delete Account'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
