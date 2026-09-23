// src/pages/AcademicYearManager.jsx (Part 1 of 3)
import React, { useState, useEffect } from 'react';
import API from '../services/api';
import alertService from '../services/alert.service';
import { Calendar, Plus, CheckCircle, Circle, RefreshCw, CalendarDays, ArrowRight } from 'lucide-react';
import Swal from 'sweetalert2';

export default function AcademicYearManager() {
    // Dynamic Layout Data States
    const [years, setYears] = useState([]);

    // Core Form Fields Input Tracker States
    const [name, setName] = useState(''); // Holds strings like "2026-2027"
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Transition UI Action Blocker Loading States
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);

    // Life-Cycle Event Hook: Triggers dynamic data grid loading on component mount
    useEffect(() => {
        fetchAcademicYears();
    }, []);
    // Asynchronous Handler: Fetches calendar rows registered under this institute tenant boundary
    const fetchAcademicYears = async () => {
        setFetchLoading(true);
        try {
            const res = await API.get('/attendance/academic-years');
            setYears(res.data || []);
        } catch (err) {
            console.error('Failed loading operational academic cycle timelines:', err);
            alertService.error('Fetch Failure', 'Could not retrieve registered educational calendars.');
        } finally {
            setFetchLoading(false);
        }
    };

    // Form Submit Handler: Dynamically provisions a new calendar timeline row entry
    const handleCreateYear = async (e) => {
        e.preventDefault();

        // Front-end Form Fields Text Validation Checks
        if (!name.trim() || !startDate || !endDate) {
            return alertService.error('Validation Error', 'Please complete all required fields (Name, Start Date, End Date).');
        }

        if (new Date(startDate) >= new Date(endDate)) {
            return alertService.error('Invalid Date Boundaries', 'The cycle Start Date must happen chronologically before the End Date.');
        }

        setLoading(true);
        try {
            await API.post('/attendance/academic-years', { name: name.trim(), startDate, endDate });
            alertService.success('Cycle Provisioned', `Academic cycle ${name} logged inside database registers cleanly.`);

            // Clear input context elements on workflow success
            setName('');
            setStartDate('');
            setEndDate('');

            // Instantly sync data ledger values inside grid layouts
            fetchAcademicYears();
        } catch (err) {
            alertService.error('Configuration Failed', err.response?.data?.message || 'Failed to seed new calendar track.');
        } finally {
            setLoading(false);
        }
    };

    // System Year-Shift Mutation Handler: Deactivates past track timelines and engages the target selection
    const handleActivateYear = async (yearId, yearName) => {
        const structuralConfirmation = await Swal.fire({
            title: 'Confirm System Year Shift',
            text: `Are you sure you want to change the active institutional year to ${yearName}? This will instantly re-scope the workspace tracking visibility bounds for all teachers, staff, and dashboards.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Activate Year Now',
            cancelButtonText: 'Go Back',
            confirmButtonColor: '#4f46e5', // Theme matching Indigo-600
            cancelButtonColor: '#64748b',  // Theme matching Slate-500
            customClass: {
                popup: 'rounded-3xl border border-slate-100 shadow-xl',
                confirmButton: 'rounded-xl px-5 py-2.5 font-semibold text-sm shadow-sm transition-all',
                cancelButton: 'rounded-xl px-5 py-2.5 font-semibold text-sm transition-all'
            }
        });

        if (!structuralConfirmation.isConfirmed) return;

        try {
            await API.patch(`/attendance/academic-years/${yearId}/activate`);

            await Swal.fire({
                title: 'Operational Year Swapped!',
                text: `The active calendar track has been updated to ${yearName}. The dashboard runtime workspace environment will reload automatically to refresh profile payload data frames.`,
                icon: 'success',
                confirmButtonText: 'Refresh View Workspace',
                confirmButtonColor: '#4f46e5',
                allowOutsideClick: false
            });

            // Hard browser window location refresh forces immediate JWT state data context updates cleanly
            window.location.reload();
        } catch (err) {
            alertService.error('Activation Mismatch Error', err.response?.data?.message || 'Could not toggle active calendar operational flags.');
        }
    };
    return (
        <div className="w-full text-slate-800 space-y-6 p-6">

            {/* COMPONENT TITLE HEADER BAR CONTROL SECTION */}
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-600" /> Academic Years Management
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Provision new educational calendar cycles and switch active timeline parameters natively.</p>
                </div>
                <button
                    onClick={fetchAcademicYears}
                    disabled={fetchLoading}
                    style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                    className="p-2.5 rounded-xl transition disabled:opacity-40 shadow-sm cursor-pointer border-0 flex items-center justify-center hover:opacity-90 active:scale-95"
                >
                    <RefreshCw className={`w-4 h-4 text-white ${fetchLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* RESPONSIVE LAYOUT COLUMNS GRID FRAME CONTAINER */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* 📝 LEFT COLUMN CONTAINER BOARD CARD: Projections Creation Form Panel */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <CalendarDays className="w-4 h-4 text-slate-400" /> Provision New Cycle
                    </h3>

                    <form onSubmit={handleCreateYear} className="space-y-4">
                        <div>
                            <label className="block text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1.5">Cycle Label Description</label>
                            <input
                                type="text"
                                placeholder="e.g., 2026-2027"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white text-slate-800 font-medium transition"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1.5">Start Date Boundary</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white text-slate-800 font-medium transition cursor-pointer"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1.5">End Date Boundary</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white text-slate-800 font-medium transition cursor-pointer"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                            className="w-full font-semibold text-sm py-2.5 rounded-xl transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer border-0 hover:opacity-90 active:scale-95"
                        >
                            <Plus className="w-4 h-4" /> {loading ? 'Processing...' : 'Provision Calendar Track'}
                        </button>
                    </form>
                </div>

                {/* 📊 RIGHT COLUMN CONTAINER BOARD CARD: Dynamic Cycle Data Table Grid Ledger List */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 overflow-hidden">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">Configured Academic Cycles</h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[11px] tracking-wider bg-slate-50/50">
                                    <th className="py-3 px-3">Session Label Name</th>
                                    <th className="py-3 px-3">Date Range Span Boundaries</th>
                                    <th className="py-3 px-3 text-center">Operational Status</th>
                                    <th className="py-3 px-3 text-right">Action Commands</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {fetchLoading && years.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center py-10 text-slate-400 font-medium">Querying database logs...</td></tr>
                                ) : years.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center py-10 text-slate-400 font-medium">No custom educational cycles provisioned yet. Use the tool panel form grid to add one.</td></tr>
                                ) : (
                                    years.map((year) => (
                                        <tr key={year.id} className={`hover:bg-slate-50/40 transition duration-150 ${year.isActive ? 'bg-indigo-50/30 font-semibold' : ''}`}>
                                            <td className="py-4 px-3 font-bold text-slate-900 text-sm">{year.name}</td>
                                            <td className="py-4 px-3 text-slate-600 text-xs font-mono">
                                                {year.startDate} <span className="text-slate-300 mx-1.5"><ArrowRight className="inline w-3 h-3" /></span> {year.endDate}
                                            </td>
                                            <td className="py-4 px-3 text-center">
                                                {year.isActive ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200">
                                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> System Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-400 border border-slate-200">
                                                        <Circle className="w-3.5 h-3.5 text-slate-300" /> Inactive Queue
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-3 text-right">
                                                {!year.isActive && (
                                                     <button 
                                                        onClick={() => handleActivateYear(year.id, year.name)}
                                                        style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                                                        className="px-3.5 py-1.5 text-xs font-bold rounded-xl shadow-sm transition-all hover:shadow active:scale-95 border-0 cursor-pointer hover:opacity-90"
                                                    >
                                                        Activate Year
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
