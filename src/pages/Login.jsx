import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import alertService from '../services/alert.service';
import { Mail, Lock, GraduationCap, ArrowRight } from 'lucide-react';

export default function Login() {
    const { login } = useAuth(); // Extracted backend provider context save hook
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            return alertService.error('Input Missing', 'Please enter both your credentials to proceed.');
        }

        setLoading(true);
        try {
            await login(email, password);
            alertService.success('Access Granted', 'Session footprint validated cleanly.');
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            alertService.error('Login Failed', err.response?.data?.message || 'Unauthorized role context.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-screen h-screen flex items-center justify-center bg-slate-900 text-slate-800 m-0 p-0 overflow-hidden font-sans relative">
            <div className="absolute top-1/4 left-1/4 h-96 w-96 bg-indigo-600/10 rounded-full filter blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 h-96 w-96 bg-purple-600/10 rounded-full filter blur-3xl animate-pulse"></div>

            <div className="w-full max-w-md p-8 bg-white border border-slate-200 rounded-3xl shadow-2xl relative z-10 space-y-6 mx-4">
                <div className="text-center space-y-2">
                    <div className="h-14 w-14 bg-indigo-600 rounded-2xl text-white flex items-center justify-center mx-auto shadow-xl shadow-indigo-600/30">
                        <GraduationCap size={28} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-4">Sign In to EduManager</h2>
                    <p className="text-slate-400 text-xs">Enter your institute login credentials below</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider">Official Email Address</label>
                        <div className="relative w-full">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><Mail size={16} /></span>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@institute.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider">Account Password</label>
                        <div className="relative w-full">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><Lock size={16} /></span>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition" />
                        </div>
                    </div>
                    <div className="flex justify-end items-center mb-1">
                        <Link
                            to="/forgot-password"
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
                        >
                            Forgot Password?
                        </Link>
                    </div>
                    <button type="submit" disabled={loading} style={{ backgroundColor: '#4f46e5', color: '#ffffff' }} className="w-full h-12 rounded-xl font-bold text-sm border-0 shadow-md cursor-pointer hover:opacity-95 transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-2">
                        <span>{loading ? 'Authenticating Profile...' : 'Secure Authorization Login'}</span>
                        {!loading && <ArrowRight size={16} style={{ color: '#ffffff' }} />}
                    </button>
                </form>

                <div className="pt-2 text-center border-t border-slate-100">
                    <p className="text-[11px] text-slate-400 font-medium">EduManager Multi-Tenant Enterprise Security Shield</p>
                </div>
            </div>
        </div>
    );
}
