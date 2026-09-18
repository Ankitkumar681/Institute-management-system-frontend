import React, { useState } from 'react';
import API from '../services/api';
import { Building2, Plus, Mail, ShieldAlert, CheckCircle } from 'lucide-react';

export default function ManageSchools() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleRegisterSchool = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    try {
      await API.post('/auth/register', {
        name,
        email,
        password,
        role: 'institute_admin'
      });
      setMessage({ type: 'success', text: 'New school profile provisioned successfully!' });
      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error processing registration' });
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-8">
      
      <div className="w-full max-w-xl bg-white p-8 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300">
        <div className="flex items-center space-x-3 pb-4 mb-6 border-b border-slate-100">
          <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg tracking-tight">Onboard New Educational Institute</h3>
            <p className="text-slate-400 text-xs mt-0.5">Provision an isolated workspace tenant container</p>
          </div>
        </div>

        {message.text && (
          <div className={`mb-5 p-4 rounded-xl border flex items-center space-x-2 text-sm ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {message.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <ShieldAlert className="h-4 w-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleRegisterSchool} className="space-y-4">
          <div>
            <label className="block text-slate-600 text-xs font-bold uppercase mb-1.5 tracking-wide">Institute / School Name</label>
            <input 
              type="text" 
              required 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g. Stanford High School" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition text-slate-800" 
            />
          </div>

          <div>
            <label className="block text-slate-600 text-xs font-bold uppercase mb-1.5 tracking-wide">Root Admin Login Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Mail className="h-4 w-4" />
              </span>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="admin@schoolname.com" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition text-slate-800" 
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 text-xs font-bold uppercase mb-1.5 tracking-wide">Secure Password Assignment</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition text-slate-800" 
            />
          </div>

          {/* ⚡ FIX: Injected an explicit style block override to hardcode background color and text visibility securely */}
          <button 
            type="submit" 
            style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
            className="w-full font-bold text-sm py-3 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 mt-4 cursor-pointer hover:opacity-90 shadow-md shadow-indigo-600/20"
          >
            <Plus className="h-4 w-4" style={{ color: '#ffffff' }} />
            <span style={{ color: '#ffffff' }}>Provision School Workspace</span>
          </button>
        </form>
      </div>

    </div>
  );
}
