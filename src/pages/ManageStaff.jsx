import React, { useState } from 'react';
import API from '../services/api';
import { UserPlus, Mail, Shield, CheckCircle, AlertCircle } from 'lucide-react';

export default function ManageStaff() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('class_teacher');
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleRegisterStaff = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    // Retrieve logged-in admin data to match the institute tenant mapping bounds
    const currentAdmin = JSON.parse(localStorage.getItem('user'));

    try {
      await API.post('/auth/register', {
        name,
        email,
        password,
        role,
        instituteId: currentAdmin?.instituteId
      });
      setMessage({ type: 'success', text: `Successfully registered new ${role.replace('_', ' ')}!` });
      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to onboard staff record' });
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3 pb-4 mb-6 border-b border-slate-100">
          <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg tracking-tight">Onboard Institute Staff</h3>
            <p className="text-slate-400 text-xs mt-0.5">Register teachers and management personnel for your school</p>
          </div>
        </div>

        {message.text && (
          <div className={`mb-5 p-4 rounded-xl border flex items-center space-x-2 text-sm ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {message.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleRegisterStaff} className="space-y-4">
          <div>
            <label className="block text-slate-600 text-xs font-bold uppercase mb-1.5 tracking-wide">Full Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Prof. Sarah Jenkins" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition" />
          </div>

          <div>
            <label className="block text-slate-600 text-xs font-bold uppercase mb-1.5 tracking-wide">Official Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><Mail className="h-4 w-4" /></span>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sarah.j@school.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition" />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 text-xs font-bold uppercase mb-1.5 tracking-wide">Assign System Role Type</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><Shield className="h-4 w-4" /></span>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition">
                <option value="class_teacher">Class Teacher</option>
                <option value="staff">General Management Staff</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 text-xs font-bold uppercase mb-1.5 tracking-wide">Temporary Secure Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition" />
          </div>

          <button type="submit" style={{ backgroundColor: '#4f46e5', color: '#ffffff' }} className="w-full font-bold text-sm py-3 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 mt-4 cursor-pointer hover:opacity-90 shadow-md shadow-indigo-600/20">
            <span>Register Staff Account</span>
          </button>
        </form>
      </div>
    </div>
  );
}
