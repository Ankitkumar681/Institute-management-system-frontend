import React, { useState, useEffect } from 'react';
import API from '../services/api';
import alertService from '../services/alert.service';
import { useAuth } from '../hooks/useAuth';
import { Layers, ArrowRight, ArrowDown, Users, RefreshCw, GraduationCap } from 'lucide-react';
import Swal from 'sweetalert2';

export default function CohortPromotionManager() {
    const { currentYearId } = useAuth();

    // Source (From) Year-Aware States
    const [sourceClassrooms, setSourceClassrooms] = useState([]);
    const [selectedSourceClass, setSelectedClass] = useState('');
    const [cohortRoster, setCohortRoster] = useState([]);

    // Target (To) Year-Aware States
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedTargetYear, setSelectedTargetYear] = useState('');
    const [targetClassrooms, setTargetClassrooms] = useState([]);
    const [selectedTargetClass, setSelectedTargetClass] = useState('');

    const [loading, setLoading] = useState(false);
    const [rosterLoading, setRosterLoading] = useState(false);

    useEffect(() => {
        loadSourceClassrooms();
        loadAcademicCycles();
    }, [currentYearId]);

    useEffect(() => {
        if (selectedTargetYear) {
            loadTargetClassrooms();
        } else {
            setTargetClassrooms([]);
            setSelectedTargetClass('');
        }
    }, [selectedTargetYear]);

    const loadSourceClassrooms = async () => {
        try {
            const res = await API.get('/classrooms', { params: { limit: 'all', academicYearId: currentYearId } });
            const dataEnvelope = res.data;
            const list = dataEnvelope?.records || (Array.isArray(dataEnvelope) ? dataEnvelope : []);
            setSourceClassrooms(list);
        } catch (err) {
            console.error('Error loading source classrooms:', err);
        }
    };

    const loadAcademicCycles = async () => {
        try {
            const res = await API.get('/attendance/academic-years');
            setAcademicYears(res.data || []);
        } catch (err) {
            console.error('Error loading target cycles:', err);
        }
    };

    const loadTargetClassrooms = async () => {
        try {
            const res = await API.get('/classrooms', { params: { limit: 'all', academicYearId: selectedTargetYear } });
            const dataEnvelope = res.data;
            const list = dataEnvelope?.records || (Array.isArray(dataEnvelope) ? dataEnvelope : []);
            setTargetClassrooms(list);
        } catch (err) {
            console.error('Error loading target classrooms:', err);
        }
    };

    const fetchCohortRoster = async () => {
        if (!selectedSourceClass) return;
        setRosterLoading(true);
        try {
            const res = await API.get('/attendance/roster', {
                params: { classId: selectedSourceClass, academicYearId: currentYearId, date: new Date().toISOString().split('T')[0] }
            });
            setCohortRoster(res.data || []);
        } catch (err) {
            alertService.error('Fetch Error', 'Could not load student roster for this selection.');
        } finally {
            setRosterLoading(false);
        }
    };

    const handleExecutePromotion = async (e) => {
        e.preventDefault();
        if (!selectedSourceClass || !selectedTargetClass || !selectedTargetYear || cohortRoster.length === 0) {
            return alertService.error('Validation Missing', 'Please select source/target classes and ensure a student roster is loaded.');
        }

        if (String(currentYearId) === String(selectedTargetYear)) {
            return alertService.error('Invalid Cycle', 'The target educational cycle cannot match the active source year.');
        }

        const confirmAction = await Swal.fire({
            title: 'Confirm Bulk Cohort Promotion',
            text: `Are you sure you want to promote these ${cohortRoster.length} students into the selected target year container? This will create year-placements for the new cycle instantly.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Promote Cohort Now',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#64748b',
            customClass: {
                popup: 'rounded-3xl border border-slate-100 shadow-xl',
                confirmButton: 'rounded-xl px-5 py-2.5 font-semibold text-sm shadow-sm transition-all',
                cancelButton: 'rounded-xl px-5 py-2.5 font-semibold text-sm transition-all'
            }
        });

        if (!confirmAction.isConfirmed) return;

        setLoading(true);
        try {
            const studentIds = cohortRoster.map(s => s.id);
            await API.post('/attendance/promote-students', {
                sourceClassId: selectedSourceClass,
                targetClassId: selectedTargetClass,
                targetAcademicYearId: selectedTargetYear,
                studentIds
            });

            await Swal.fire({
                title: 'Promotion Completed!',
                text: `Successfully promoted ${cohortRoster.length} students to the new educational cycle assignment container.`,
                icon: 'success',
                confirmButtonColor: '#4f46e5',
                customClass: {
                    popup: 'rounded-3xl border border-slate-100 shadow-xl',
                    confirmButton: 'rounded-xl px-5 py-2.5 font-semibold text-sm shadow-sm transition-all'
                }
            });

            setSelectedClass('');
            setSelectedTargetClass('');
            setSelectedTargetYear('');
            setCohortRoster([]);
            loadSourceClassrooms();
        } catch (err) {
            alertService.error('Promotion Engine Error', err.response?.data?.message || 'Failed to complete bulk promotion.');
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="space-y-6 w-full text-slate-800 p-2">

            {/* Header Control Overview Banner */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-600" /> Bulk Cohort Promotion Desk
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Transition entire classes between academic years and update their mapping logs with a single command.</p>
            </div>

            {/* 3-Column Configuration Interactive Grid Dashboard */}
            <form onSubmit={handleExecutePromotion} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">

                {/* 📝 COLUMN 1: Source Classroom Selector Workspace */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between min-h-[350px]">
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm border-b pb-2 mb-3 flex items-center gap-1.5">
                            <GraduationCap className="w-4 h-4 text-slate-400" /> 1. Select Source Cohort
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1.5">Active Session Source Class</label>
                                <select
                                    value={selectedSourceClass}
                                    onChange={(e) => { setSelectedClass(e.target.value); setCohortRoster([]); }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 font-medium cursor-pointer"
                                >
                                    <option value="">-- Choose Source Class --</option>
                                    {sourceClassrooms.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} — {c.section}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="button"
                                onClick={fetchCohortRoster}
                                disabled={!selectedSourceClass || rosterLoading}
                                style={{ backgroundColor: '#4f46e5', color: '#ffffff' }} // 🔥 FORCED INLINE THEME OVERRIDE
                                className="w-full h-11 text-white font-bold text-xs rounded-xl shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 border-0 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 text-white ${rosterLoading ? 'animate-spin' : ''}`} />
                                <span style={{ color: '#ffffff' }}>Load Cohort Students</span>
                            </button>
                        </div>
                    </div>

                    {cohortRoster.length > 0 && (
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex items-center gap-2 text-indigo-800 text-xs font-semibold mt-4">
                            <Users size={16} />
                            <span>{cohortRoster.length} students loaded and ready for transition.</span>
                        </div>
                    )}
                </div>

                {/* 🔄 COLUMN 2: Transition Divider Visual Anchor Component */}
                <div className="flex flex-col items-center justify-center p-4 text-center min-h-[100px] lg:min-h-full">
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 hidden lg:block shadow-inner">
                        <ArrowRight size={24} className="animate-pulse" />
                    </div>
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 lg:hidden shadow-inner">
                        <ArrowDown size={24} className="animate-pulse" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mt-2 block">Migration Track</span>
                </div>

                {/* 📝 COLUMN 3: Target Year & Classroom Selector Destination Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between min-h-[350px]">
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-800 text-sm border-b pb-2 mb-3 flex items-center gap-1.5">
                            <GraduationCap className="w-4 h-4 text-slate-400" /> 2. Select Destination Target
                        </h3>

                        <div>
                            <label className="block text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1.5">Target Academic Cycle</label>
                            <select
                                value={selectedTargetYear}
                                onChange={(e) => { setSelectedTargetYear(e.target.value); setSelectedTargetClass(''); }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 font-medium cursor-pointer"
                            >
                                <option value="">-- Choose Target Year --</option>
                                {academicYears.map(y => (
                                    <option key={y.id} value={y.id}>{y.name} {y.isActive ? '(Active)' : ''}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1.5">Target Destination Classroom</label>
                            <select
                                value={selectedTargetClass}
                                disabled={!selectedTargetYear}
                                onChange={(e) => setSelectedTargetClass(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 font-medium cursor-pointer disabled:opacity-50"
                            >
                                <option value="">-- Choose Target Classroom --</option>
                                {targetClassrooms.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} — {c.section}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || cohortRoster.length === 0 || !selectedTargetClass}
                        style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                        className="w-full h-11 font-bold text-sm rounded-xl shadow-md border-0 cursor-pointer hover:opacity-95 transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-6"
                    >
                        <span>{loading ? 'Processing Crossover...' : 'Execute Cohort Promotion'}</span>
                    </button>
                </div>

            </form>
        </div>
    );
}