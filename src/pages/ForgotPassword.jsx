import React, { useState } from 'react';
import API from '../services/api';
import alertService from '../services/alert.service';
import { useNavigate } from 'react-router-dom';
import { Mail, Key, Lock, ArrowLeft, GraduationCap, ArrowRight, ShieldCheck } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // Step 1: Input Email, Step 2: Input Token + New Password
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1 Trigger Handler: Generate token footprint
  const handleRequestToken = async (e) => {
    e.preventDefault();
    if (!email) return alertService.error('Input Missing', 'Please provide your profile email address.');
    
    setLoading(true);
    try {
      const res = await API.post('/auth/forgot-password', { email });
      
      // Development Helper Notification Alert Prompt fallback
      await alertService.success(
        'Token Ledger Seeded',
        `A recovery verification token has been logged to the system.\n\n` +
        `👉 Testing Passcode Token: ${res.data.debugToken}\n\n` +
        `Please copy this code and input it into Step 2.`
      );
      
      setStep(2); // Toggle step screen view page dynamically
    } catch (err) {
      alertService.error('Reset Failed', err.response?.data?.message || 'Email record footprint not found.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 Trigger Handler: Commit password change configuration
  const handleCommitReset = async (e) => {
    e.preventDefault();
    if (!passcode || !newPassword) {
      return alertService.error('Validation Missing', 'Please enter your verification passcode alongside your new password.');
    }
    if (newPassword.length < 6) {
      return alertService.error('Weak Password', 'Your new master password block must contain at least 6 characters.');
    }

    setLoading(true);
    try {
      await API.post('/auth/reset-password', { email, passcode, newPassword });
      await alertService.success('Credentials Mutated', 'Your new password has been committed successfully! Please log in.');
      navigate('/login'); // Force redirect straight back onto clean login panel workspace
    } catch (err) {
      alertService.error('Reset Failed', err.response?.data?.message || 'Invalid or expired verification token parameters.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-slate-900 text-slate-800 m-0 p-0 overflow-hidden font-sans relative">
      <div className="absolute top-1/4 left-1/4 h-96 w-96 bg-indigo-600/10 rounded-full filter blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 bg-purple-600/10 rounded-full filter blur-3xl animate-pulse"></div>

      <div className="w-full max-w-md p-8 bg-white border border-slate-200 rounded-3xl shadow-2xl relative z-10 space-y-6 mx-4">
        
        {/* Navigation Return Header Trigger Link element */}
        <button 
          onClick={() => navigate('/login')} 
          className="flex items-center space-x-1 text-xs font-bold text-slate-400 hover:text-indigo-600 bg-transparent border-0 cursor-pointer p-0 transition"
        >
          <ArrowLeft size={14} />
          <span>Return to Sign In Desk</span>
        </button>

        <div className="text-center space-y-2">
          <div className="h-14 w-14 bg-indigo-600 rounded-2xl text-white flex items-center justify-center mx-auto shadow-xl shadow-indigo-600/30">
            <Key size={26} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-4">
            {step === 1 ? 'Recover Password' : 'Verify Account Authorization'}
          </h2>
          <p className="text-slate-400 text-xs">
            {step === 1 ? 'Enter your login parameters email to seed a verification passcode' : 'Enter the verification passcode alongside your new password'}
          </p>
        </div>

        {/* STEP 1 FORM VIEWPORT CONTAINER ELEMENT */}
        {step === 1 ? (
          <form onSubmit={handleRequestToken} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider">Your Registered Email Address</label>
              <div className="relative w-full">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><Mail size={16} /></span>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@institute.com" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition" 
                />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ backgroundColor: '#4f46e5', color: '#ffffff' }} className="w-full h-12 rounded-xl font-bold text-sm border-0 shadow-md cursor-pointer hover:opacity-95 transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-2">
              <span>{loading ? 'Seeding Token...' : 'Generate Recovery Token'}</span>
              {!loading && <ArrowRight size={16} style={{ color: '#ffffff' }} />}
            </button>
          </form>
        ) : (
          
          /* STEP 2 FORM VIEWPORT CONTAINER ELEMENT */
          <form onSubmit={handleCommitReset} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider">6-Digit Passcode Token</label>
              <div className="relative w-full">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><ShieldCheck size={16} /></span>
                <input 
                  type="text" 
                  maxLength="6"
                  value={passcode} 
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="e.g., 589214" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 focus:outline-none tracking-widest font-mono font-bold focus:border-indigo-500 focus:bg-white transition" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider">Choose New Password</label>
              <div className="relative w-full">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><Lock size={16} /></span>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition" 
                />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ backgroundColor: '#059669', color: '#ffffff' }} className="w-full h-12 rounded-xl font-bold text-sm border-0 shadow-md cursor-pointer hover:opacity-95 transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-2">
              <span>{loading ? 'Resetting Password...' : 'Commit Password Change'}</span>
            </button>
          </form>
        )}

        <div className="pt-2 text-center border-t border-slate-100">
          <p className="text-[11px] text-slate-400 font-medium">EduManager Recovery Engine System Control Shield</p>
        </div>
      </div>
    </div>
  );
}
