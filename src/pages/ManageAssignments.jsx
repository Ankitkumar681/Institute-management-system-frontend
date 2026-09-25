import React, { useState, useEffect } from 'react';
import API from '../services/api';
import alertService from '../services/alert.service';
import { Layers, User, Home, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function ManageAssignments() {
    const { currentYearId } = useAuth();
    const [teachers, setTeachers] = useState([]);
    const [classrooms, setClassrooms] = useState([]);

    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [loading, setLoading] = useState(false);
    const [localYearLocked, setLocalYearLocked] = useState(false);

    const loadData = async () => {
        try {
            // 🚀 FIXED: Send the academicYearId parameter down to the staff listing route 
            // to fetch year-isolated teacher state configurations correctly
            const [teachersRes, classesRes, yearsRes] = await Promise.all([
                API.get('/users/staff', { params: { limit: 'all', academicYearId: currentYearId } }),
                API.get('/classrooms', { params: { limit: 'all', academicYearId: currentYearId } }),
                API.get('/attendance/academic-years')
            ]);

            // 🚀 FIXED: Include both "class_teacher" and regular "teacher" roles in the assignment dropdown list
            // This prevents staff from completely vanishing from this view if they are unassigned from a primary room
            const rawTeachers = teachersRes?.data?.records || (Array.isArray(teachersRes?.data) ? teachersRes.data : []);
            setTeachers(rawTeachers.filter(t => t.role === 'class_teacher' || t.role === 'teacher'));

            const rawClassrooms = classesRes?.data?.records || (Array.isArray(classesRes?.data) ? classesRes.data : []);
            setClassrooms(rawClassrooms);

            const rawYearsArray = yearsRes?.data?.records || (Array.isArray(yearsRes?.data) ? yearsRes.data : (yearsRes || []));
            const targetYearObj = Array.isArray(rawYearsArray)
                ? rawYearsArray.find(y => String(y?.id) === String(currentYearId))
                : null;

            setLocalYearLocked(targetYearObj?.isLocked || false);
        } catch (err) {
            console.error('Failed loading assignment directory dependencies:', err);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentYearId]);
    useEffect(() => {
        window.addEventListener("academic-year-changed", loadData);
        return () => {
            window.removeEventListener("academic-year-changed", loadData);
        };
    }, []);
    const handleAssign = async (e) => {
        e.preventDefault();
        if (localYearLocked) return alertService.error('Read-Only Track', 'This academic cycle is archived and locked. You cannot modify assignments.');
        if (!selectedTeacher) return alertService.error('Validation Missing', 'Please pick a teacher to assign.');
        setLoading(true);
        try {
            // 🚀 FIXED: Bound parameters match your optimized assignment backend logic exactly
            await API.put('/users/staff/assign-class', {
                teacherId: selectedTeacher,
                classId: selectedClass || null, // Sends null cleanly if "-- Leave Unassigned --" is selected
                makePrimaryClassTeacher: selectedClass !== '', // Tells the engine if this should mount a primary slot row
                academicYearId: currentYearId
            });

            alertService.success('Assignment Saved', 'Teacher workspace linked successfully for this educational year!');
            setSelectedTeacher('');
            setSelectedClass('');
            await loadData(); // 🚀 Force re-fetch from the server immediately to update the table grid layout views
        } catch (err) {
            alertService.error('Operation Denied', err.response?.data?.message || 'Error processing assignment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full text-slate-800">

            {/* Left Column: Assignment Workspace Control Box */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                <div className="flex items-center space-x-2 pb-4 mb-4 border-b">
                    <Layers className="text-indigo-600 h-5 w-5" />
                    <h3 className="font-bold text-slate-800">Map Class Teacher</h3>
                </div>
                {!localYearLocked ? (
                    <form onSubmit={handleAssign} className="space-y-4">
                        <div>
                            <label className="block text-slate-600 text-xs font-bold uppercase mb-1.5">Select Class Teacher</label>
                            <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium cursor-pointer">
                                <option value="">-- Choose Faculty Member --</option>
                                {teachers
                                    .filter(t => t.role === 'class_teacher')
                                    .map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} ({t.email})
                                        </option>
                                    ))
                                }
                            </select>
                        </div>

                        <div>
                            <label className="block text-slate-600 text-xs font-bold uppercase mb-1.5">Target Classroom Allocation</label>
                            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium cursor-pointer">
                                <option value="">-- Leave Unassigned / Remove Class --</option>
                                {classrooms.map(c => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
                            </select>
                        </div>

                        <button type="submit" disabled={loading} style={{ backgroundColor: '#4f46e5', color: '#ffffff' }} className="w-full font-bold text-sm py-2.5 rounded-xl transition border-0 cursor-pointer shadow-md hover:opacity-95">
                            <span>Synchronize Allocation</span>
                        </button>
                    </form>
                ) : (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold p-4 rounded-xl leading-relaxed select-none">
                        🔒 Mapping Suspended: This academic cycle has been archived and locked. Faculty allocation modifications for this track are restricted.
                    </div>
                )}
            </div>

            {/* Right Column: Active Relationships Mapping Table Grid */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
                <div className="pb-4 mb-4 border-b">
                    <h3 className="font-bold text-slate-800 text-base">Current Faculty Mapping Roster</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Active rooms linked to localized class teacher nodes</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="text-slate-400 border-b font-bold uppercase text-[10px] tracking-wider bg-slate-50/10">
                                <th className="p-3 pl-4">Teacher Profile</th>
                                <th className="p-3 text-center"><ArrowRight size={14} className="mx-auto" /></th>
                                <th className="p-3 text-right pr-4">Assigned Classroom Entity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {teachers.filter(t => t.role === 'class_teacher').length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="text-center py-10 text-slate-400 font-semibold text-xs">
                                        No active primary Class Teachers found for this session track.
                                    </td>
                                </tr>
                            ) : (
                                teachers
                                    .filter(t => t.role === 'class_teacher')
                                    .map(t => (
                                        <tr key={t.id} className="hover:bg-slate-50/40 transition">
                                            <td className="p-3 pl-4">
                                                <p className="font-bold text-slate-900 flex items-center">
                                                    <User size={13} className="mr-1 text-slate-400" />
                                                    {t.name}
                                                </p>
                                                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{t.email}</span>
                                            </td>
                                            <td className="p-3 text-center text-slate-300 font-mono text-xs">Linked To</td>
                                            <td className="p-3 text-right pr-4">
                                                {t.classroom ? (
                                                    <span className="inline-flex items-center text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                                                        <Home size={11} className="mr-1" />
                                                        {t.classroom.name} — {t.classroom.section}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs italic font-normal bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">
                                                        No Class Assigned
                                                    </span>
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
    );
}
