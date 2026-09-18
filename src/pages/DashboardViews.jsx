import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import API from '../services/api';
import StudentSummary from '../components/StudentSummary';
import { School, Calendar, TrendingUp, BarChart3, UserCheck, ShieldAlert, Users, Award, ShieldCheck } from 'lucide-react';

export function CoreDashboard() {
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState({ totalLogs: 0, presentRate: 0, absentRate: 0 });
    const [classMetrics, setClassMetrics] = useState([]);
    const [loading, setLoading] = useState(true);

    const isSuperAdmin = user?.role === 'super_admin';
    const isStudent = user?.role === 'student';
    const showMatrixView = user?.role === 'institute_admin' || user?.role === 'staff' || user?.role === 'class_teacher';


    useEffect(() => {
        if (!user || isStudent === 'student') return;

        const loadDataPipeline = async () => {
            try {
                // Global basic tracking totals calculations metrics
                const resLogs = await API.get('/attendance?limit=1000');
                const dataLogs = resLogs.data?.records || resLogs.data || [];

                if (dataLogs.length > 0) {
                    const present = dataLogs.filter(r => r.status === 'Present' || r.status === 'Late').length;
                    const presentRate = Math.round((present / dataLogs.length) * 100);
                    setAnalytics({
                        totalLogs: dataLogs.length,
                        presentRate: presentRate,
                        absentRate: 100 - presentRate
                    });
                }

                // 🚀 FETCH CLASSROOM MATRIX DATA SPECIFICALLY FOR THE INSTITUTE ADMIN
                if (showMatrixView) {
                    // Point to our optimized dashboard query endpoint
                    const resMetrics = await API.get('/attendance/dashboard-analytics');
                    setClassMetrics(resMetrics.data || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadDataPipeline();
    }, [user]);

    if (isStudent) {
        return <StudentSummary />;
    }

    return (
        <div className="space-y-8 w-full text-slate-800">

            {/* Jumbotron Header Welcome Row Banner Layout */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl relative border border-slate-800">
                <h1 className="text-2xl font-black mt-1">Hello, {user?.name}</h1>
                <p className="text-slate-400 text-sm mt-1 max-w-xl">
                    {isSuperAdmin
                        ? 'Global Cloud Operator Workspace: Manage global system tenants and school subscriptions.'
                        : user?.role === 'class_teacher'
                            ? 'Class Teacher Desk Workspace: Track analytics matching your assigned room node.'
                            : 'Institute Command Dashboard Desk: Track sections and faculty records metrics.'}
                </p>
            </div>

            {/* Ratios Metrics Cards (Hidden for Super Admin if you choose, visible here globally) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Analytics Node</span>
                            <h4 className="text-sm font-bold text-slate-700 mt-0.5">Presence Ratio</h4>
                        </div>
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shadow-inner">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="my-5 flex items-baseline space-x-2">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">{loading ? '...' : `${analytics.presentRate}%`}</h2>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Healthy</span>
                    </div>
                    <div className="space-y-1.5">
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/40">
                            <div
                                style={{ width: `${analytics.presentRate}%` }}
                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 shadow-sm"
                            ></div>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">Cumulative classroom regularity tracking index</p>
                    </div>
                </div>

                {/* Card 2: Absence Deviations */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Risk Metrics</span>
                            <h4 className="text-sm font-bold text-slate-700 mt-0.5">Absence Deviation</h4>
                        </div>
                        <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 shadow-inner">
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="my-5 flex items-baseline space-x-2">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">{loading ? '...' : `${analytics.absentRate}%`}</h2>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${analytics.absentRate > 25 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                            {analytics.absentRate > 25 ? 'Critical' : 'Nominal'}
                        </span>
                    </div>
                    <div className="space-y-1.5">
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/40">
                            <div
                                style={{ width: `${analytics.absentRate}%` }}
                                className="h-full rounded-full bg-gradient-to-r from-rose-400 to-orange-500 shadow-sm"
                            ></div>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">Loss index mapping non-presence session tags</p>
                    </div>
                </div>

                {/* Card 3: Audit Footprints */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">System Ledger</span>
                            <h4 className="text-sm font-bold text-slate-700 mt-0.5">Total Audit Footprints</h4>
                        </div>
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-inner">
                            <Calendar className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="my-5 flex items-baseline space-x-1.5">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">{loading ? '...' : analytics.totalLogs}</h2>
                        <span className="text-xs text-slate-400 font-bold font-mono">Row Logs</span>
                    </div>
                    <div className="space-y-1.5">
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/40">
                            <div
                                style={{ width: '100%' }}
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 shadow-sm"
                            ></div>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">Acquired database roll call transactions registered</p>
                    </div>
                </div>

            </div>

            {/* 🚀 FIXED CONFIGURATION: ONLY RENDER THE PERFORMANCE GRID FOR THE INSTITUTE ADMIN WORKSPACE */}
            {showMatrixView && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm w-full space-y-5">
                    <div className="flex items-center space-x-2 pb-4 border-b border-slate-100">
                        <BarChart3 className="text-indigo-600 h-5 w-5" />
                        <h3 className="font-bold text-slate-800 text-base">
                            {/* Dynamic Header text morphs context based on logged-in user profile role type */}
                            {user?.role === 'class_teacher' ? 'Your Assigned Classroom Performance' : 'Institute Classroom Performance Matrix'}
                        </h3>
                    </div>

                    {classMetrics.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm font-medium">
                            {user?.role === 'class_teacher'
                                ? 'You have not been assigned to manage an active classroom container yet. Contact Admin.'
                                : 'No classrooms configured inside this school workspace tenant yet.'}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {classMetrics.map((cls, idx) => (
                                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 transition hover:bg-white hover:shadow-md duration-200">

                                    {/* Classroom metadata header block bar context info */}
                                    <div className="flex flex-col space-y-0.5">
                                        <div className="flex justify-between items-start">
                                            <span className="font-black text-slate-900 text-base tracking-tight">{cls.name}</span>
                                            <span className="font-mono font-bold text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">{cls.rate}% Rate</span>
                                        </div>
                                        <p className="text-xs text-slate-400 font-medium">Section Designation: <span className="font-bold text-slate-600 uppercase">{cls.section || 'N/A'}</span></p>
                                    </div>

                                    {/* Horizontal visual CSS progress meter track gauge */}
                                    <div className="w-full bg-slate-200 h-3 rounded-lg overflow-hidden border shadow-inner">
                                        <div
                                            style={{ width: `${cls.rate}%`, backgroundColor: cls.rate >= 80 ? '#10b981' : cls.rate >= 60 ? '#f59e0b' : '#ef4444' }}
                                            className="h-full rounded-lg transition-all duration-700 shadow-sm"
                                        ></div>
                                    </div>

                                    {/* Faculty Assignment Footer Link details block marker */}
                                    <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-semibold pt-1 border-t border-slate-200/50">
                                        <UserCheck size={13} className="text-indigo-500" />
                                        <span>Assigned Class Teacher: </span>
                                        <span className="text-slate-900 font-bold ml-0.5">{cls.teacherName}</span>
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}

export function UnauthorizedPage() {
    return (
        <div className="w-full min-h-[calc(100vh-140px)] flex flex-col items-center justify-center px-4 py-12 text-slate-800">
            <div className="w-full max-w-md bg-white border border-slate-200 p-8 rounded-2xl text-center shadow-sm">
                <div className="h-14 w-14 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600"><span className="text-2xl font-black">!</span></div>
                <h2 className="text-xl font-black text-slate-900 mb-2">Access Boundary Restrained</h2>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">Your account role profile parameters do not hold authorization requirements to load this view workspace desk.</p>
                <a href="/dashboard" style={{ backgroundColor: '#4f46e5' }} className="inline-flex w-full items-center justify-center text-white font-bold text-sm py-3 rounded-xl shadow-md border-0">Return to Dashboard Desk</a>
            </div>
        </div>
    );
}
