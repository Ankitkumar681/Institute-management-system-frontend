import React, { useState, useEffect } from 'react';
import API from '../services/api';
import alertService from '../services/alert.service';
import { useAuth } from '../hooks/useAuth';
import { Calendar, CheckCircle2, XCircle, Clock, ArrowLeft, ArrowRight } from 'lucide-react';

export default function StudentSummary() {
    const { user } = useAuth(); // Extracted logged-in student profile payload matrix

    // Roster arrays and loaders tracking variables
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination matrix state coordinates
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Multi-tenant aggregate numerical stats tracker metrics container
    const [stats, setStats] = useState({
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        rate: 0
    });
    const fetchPersonalLogs = async () => {
        setLoading(true);
        try {
            // 🚀 Step A: Query the modern backend pipeline passing page numbers array bounds
            const res = await API.get(`/attendance?page=${currentPage}&limit=6`);
            const dataEnvelope = res.data;

            // ⚡ FIX 1: Safely extract the paginated data collection rows, bypassing empty object errors
            const rawRecords = dataEnvelope?.records || (Array.isArray(dataEnvelope) ? dataEnvelope : []);
            setLogs(rawRecords);
            setTotalPages(dataEnvelope?.totalPages || 1);

            // 🚀 Step B: Compute overall statistics accurately from an un-paginated master query pull on load
            if (currentPage === 1) {
                const globalRes = await API.get('/attendance?limit=1000');
                const allRecords = globalRes.data?.records || (Array.isArray(globalRes.data) ? globalRes.data : []);

                const total = allRecords.length;
                const present = allRecords.filter(r => r.status === 'Present').length;
                const late = allRecords.filter(r => r.status === 'Late').length;
                const absent = allRecords.filter(r => r.status === 'Absent').length;

                // Formulates total presence rates including late check-ins cleanly
                const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

                setStats({ total, present, absent, late, rate });
            }
        } catch (err) {
            console.error('Error loading personal attendance data:', err);
            alertService.error('Fetch Error', 'Could not compile your attendance report context sheet.');
        } finally {
            setLoading(false);
        }
    };
    const getPerformanceBadge = (rate) => {
        if (rate >= 90) return { label: 'Excellent Attendance', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
        if (rate >= 75) return { label: 'Good Status', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
        return { label: 'Needs Attention', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    };

    // Run data streams whenever user session establishes or pagination coordinates shift
    useEffect(() => {
        if (user) {
            fetchPersonalLogs();
        }
    }, [user, currentPage]);

    const badge = getPerformanceBadge(stats.rate);
    return (
        <div className="space-y-8 w-full text-slate-800">

            {/* Overview Greeting Hero Banner */}
            <div className="bg-gradient-to-r from-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase">Personal Attendance Portal</span>
                        <h1 className="text-2xl font-black mt-1">Workspace Summary: {user?.name}</h1>
                        <p className="text-slate-400 text-sm mt-0.5">Track your regular localized check sheets logs history registries data context fields.</p>
                    </div>
                    <div className={`px-4 py-2 rounded-xl text-xs font-bold border uppercase tracking-wider h-fit w-fit ${badge.color}`}>
                        {badge.label}
                    </div>
                </div>
            </div>

            {/* Cumulative Metrics Scoreboard Matrices Row Layout */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Presence Rate</p>
                    <h3 className="text-2xl font-black text-indigo-600 mt-2">{stats.rate}%</h3>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Logged</p>
                    <h3 className="text-2xl font-black text-slate-800 mt-2">{stats.total} days</h3>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Present</p>
                    <h3 className="text-2xl font-black text-emerald-600 mt-2">{stats.present}</h3>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Absent</p>
                    <h3 className="text-2xl font-black text-rose-600 mt-2">{stats.absent}</h3>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center col-span-2 lg:col-span-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Late Logs</p>
                    <h3 className="text-2xl font-black text-amber-500 mt-2">{stats.late}</h3>
                </div>
            </div>

            {/* Historical Logs Ledger Data Table Card Sheet Container */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center space-x-2 pb-4 border-b border-slate-100">
                    <Calendar className="text-indigo-600 h-5 w-5" />
                    <h3 className="font-bold text-slate-800 text-base">Your Historical Attendance Ledger</h3>
                </div>

                {loading && logs.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 font-medium text-sm">Synchronizing ledger arrays parameters...</div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 font-medium text-sm">No recorded attendance logs matching your account ID footprint yet.</div>
                ) : (
                    <div className="overflow-x-auto w-full space-y-4">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="text-slate-400 border-b font-bold uppercase text-[10px] tracking-wider bg-slate-50/10">
                                    <th className="p-3 pl-4">Session Date Frame</th>
                                    <th className="p-3">Designated Classroom</th>
                                    <th className="p-3 text-right pr-4">Status Flag Response</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {logs.map((rec) => (
                                    <tr key={rec.id} className="hover:bg-slate-50/40 transition-colors">
                                        <td className="p-3 pl-4 font-mono text-slate-900 text-xs">{rec.date}</td>
                                        <td className="p-3">
                                            <span className="text-xs bg-slate-100 px-2 py-1 border rounded-lg text-slate-600 font-bold uppercase tracking-tight">
                                                {rec.classroom ? `${rec.classroom.name} — ${rec.classroom.section}` : 'General Namespace'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right pr-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${rec.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                rec.status === 'Absent' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                {rec.status === 'Present' && <CheckCircle2 size={12} className="mr-1" />}
                                                {rec.status === 'Absent' && <XCircle size={12} className="mr-1" />}
                                                {rec.status === 'Late' && <Clock size={12} className="mr-1" />}
                                                <span>{rec.status}</span>
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* HIGH VISIBILITY TEXT-BASED PAGINATION CONTROLLER ROW */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4 bg-slate-50/50 p-3 rounded-xl">
                            <span className="text-xs font-bold text-slate-500">
                                Page <span className="text-slate-900 font-extrabold">{currentPage}</span> of {totalPages}
                            </span>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    style={{ borderColor: '#cbd5e1' }}
                                    className="h-9 px-4 bg-white border text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-1 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-slate-50 active:scale-95 shadow-sm"
                                >
                                    <span className="text-sm font-black mr-0.5">←</span>
                                    <span>Prev</span>
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    style={{ borderColor: '#cbd5e1' }}
                                    className="h-9 px-4 bg-white border text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-1 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-slate-50 active:scale-95 shadow-sm"
                                >
                                    <span>Next</span>
                                    <span className="text-sm font-black ml-0.5">→</span>
                                </button>
                            </div>
                        </div>

                    </div>
                )}
            </div>

        </div>
    );

}