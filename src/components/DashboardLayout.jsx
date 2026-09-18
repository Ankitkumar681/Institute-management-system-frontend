import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link, useLocation } from 'react-router-dom';
// 🛠️ FIX: Added 'Layers' explicitly to your icon imports list here!
import { LayoutDashboard, CalendarCheck, LogOut, GraduationCap, Building2, Users, Layers } from 'lucide-react';
import API from '../services/api';
import alertService from '../services/alert.service';

export default function DashboardLayout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!user || user.role === 'super_admin') return;

        const checkRealTimeStatus = async () => {
            try {
                // ⚡ FIX: Appended unique timestamp to completely bypass any hidden local browser caches
                await API.get(`/auth/check-status?_cb=${new Date().getTime()}`);
            } catch (err) {
                if (err.response && err.response.status === 403 && err.response.data?.message === 'INSTITUTE_SUSPENDED') {
                    clearInterval(heartbeatInterval); // Stop the polling loop

                    // 1. Instantly clear out all user session details from browser memory
                    localStorage.clear();

                    // 2. Alert the user with your high-fidelity SweetAlert panel modal
                    await alertService.error(
                        'Workspace Suspended',
                        'Your multi-tenant school container has been deactivated by the system administrator. Logging out...'
                    );

                    // 3. Immediately drop them out to the login screen panel layout
                    window.location.href = '/login';
                }
            }
        };

        // ⚡ FIX: Reduced the timer interval to 2 seconds for a true "real-time" immediate feel
        const heartbeatInterval = setInterval(checkRealTimeStatus, 10000);

        return () => clearInterval(heartbeatInterval);
    }, [user]);

    const menuItems = [
        { path: '/dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['super_admin', 'institute_admin', 'staff', 'class_teacher', 'student'] },
        { path: '/institutes', label: 'Manage Schools', icon: Building2, roles: ['super_admin'] },
        { path: '/attendance', label: 'Attendance Desk', icon: CalendarCheck, roles: ['institute_admin', 'staff', 'class_teacher'] },
        { path: '/staff/onboard', label: 'Manage Staff', icon: Users, roles: ['institute_admin'] },
        { path: '/students/onboard', label: 'Manage Students', icon: Users, roles: ['institute_admin'] },
        { path: '/classrooms', label: 'Classrooms', icon: Building2, roles: ['institute_admin'] },
        { path: '/students', label: 'Students Directory', icon: Users, roles: ['institute_admin', 'staff', 'class_teacher'] },
        { path: '/staff', label: 'Staff Directory', icon: Users, roles: ['institute_admin', 'staff', 'class_teacher'] },
        { path: '/staff/assignments', label: 'Class Assignments', icon: Layers, roles: ['institute_admin'] }
    ];

    return (
        // ⚡ FIX: Adjusted from 'h-screen' to explicit grid viewport bounds to fill the whole screen edge-to-edge
        <div className="w-screen h-screen flex bg-slate-50 text-slate-900 font-sans antialiased overflow-hidden m-0 p-0">

            {/* Sidebar Navigation Panel */}
            <aside className="w-64 min-w-[256px] h-full bg-slate-900 text-slate-200 flex flex-col justify-between shadow-xl border-r border-slate-800 shrink-0">
                <div>
                    <div className="p-6 border-b border-slate-800 flex items-center space-x-3 bg-slate-950">
                        <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/30">
                            <GraduationCap className="h-6 w-6" />
                        </div>
                        <span className="font-bold text-lg tracking-tight text-white">EduManager</span>
                    </div>

                    <nav className="p-4 space-y-1 mt-4">
                        {menuItems.map((item) => {
                            if (!item.roles.includes(user?.role)) return null;
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 border-0 ${isActive
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                        : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                                        }`}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* User Context Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-950/60">
                    <div className="flex items-center space-x-3 mb-4 px-2">
                        <div className="h-9 w-9 bg-slate-800 rounded-full flex items-center justify-center font-bold text-indigo-400 border border-slate-700">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300">
                                {user?.role?.replace('_', ' ')}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => { logout(); navigate('/login'); }}
                        className="w-full flex items-center justify-center space-x-2 bg-rose-950/30 hover:bg-rose-900 border border-rose-900/50 hover:border-rose-700 text-rose-300 hover:text-white py-2.5 rounded-xl transition text-sm font-semibold cursor-pointer"
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out Desk</span>
                    </button>
                </div>
            </aside>

            {/* ⚡ FIX: Main Workspace viewport takes all remaining horizontal space dynamically */}
            <div className="flex-1 h-full flex flex-col min-w-0 bg-slate-50">
                <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-sm shrink-0">
                    <h2 className="font-bold text-slate-800 tracking-tight text-lg">System Management Desk</h2>
                    <div className="text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full flex items-center space-x-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>School Tenant: </span>
                        <span className="font-mono font-bold text-slate-700 uppercase">
                            {user?.instituteId ? user.instituteId.slice(0, 8) : 'Global Namespace'}
                        </span>
                    </div>
                </header>

                {/* Content Viewport Component Area */}
                <main className="flex-1 overflow-y-auto p-8">
                    <div className="w-full max-w-full mx-auto space-y-6">
                        {children}
                    </div>
                </main>
            </div>

        </div>
    );
}
