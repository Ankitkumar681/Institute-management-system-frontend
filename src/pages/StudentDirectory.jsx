import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Search, Filter, ArrowUpDown, Edit2, Check, X, ShieldAlert, GraduationCap, User } from 'lucide-react';
import PaginationBar from '../components/PaginationBar';
import { useAuth } from '../hooks/useAuth';
import alertService from '../services/alert.service';

export default function StudentDirectory() {
    const { currentYearId } = useAuth();

    const [students, setStudents] = useState([]);
    const [classrooms, setClassrooms] = useState([]);
    const [classFilter, setClassFilter] = useState('');
    const [search, setSearch] = useState('');
    const [sortOrder, setSortOrder] = useState('ASC');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editClass, setEditClass] = useState('');
    const [localYearLocked, setLocalYearLocked] = useState(false);
    const [selectedStudentProfile, setSelectedProfile] = useState(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [formParentName, setFormParentName] = useState('');
    const [formParentContact, setFormParentContact] = useState('');
    const [formParentEmail, setFormParentEmail] = useState('');
    const [formBloodGroup, setFormBloodGroup] = useState('');
    useEffect(() => {
        if (currentYearId) {
            fetchFilterOptions();
        }
    }, [search, classFilter, sortOrder, currentPage, currentYearId]);
    useEffect(() => {
        const handleGlobalYearSwitch = () => {
            setClassFilter('');
            setCurrentPage(1);
            setEditingId(null);
            setSelectedProfile(null);
            setIsEditingProfile(false);
        };
        window.addEventListener("academic-year-changed", handleGlobalYearSwitch);
        return () => {
            window.removeEventListener("academic-year-changed", handleGlobalYearSwitch);
        };
    }, []);
    const fetchFilterOptions = async () => {
        try {
            const [classesRes, yearsRes] = await Promise.all([
                API.get('/classrooms', { params: { limit: 'all', academicYearId: currentYearId || '' } }),
                API.get('/attendance/academic-years')
            ]);
            const dataEnvelope = classesRes.data;
            const list = dataEnvelope?.records || (Array.isArray(dataEnvelope) ? dataEnvelope : []);
            setClassrooms(list);
            await loadStudentData();
            const rawYears = yearsRes?.data?.records || (Array.isArray(yearsRes?.data) ? yearsRes.data : (yearsRes || []));
            const activeCycleObj = Array.isArray(rawYears) ? rawYears.find(y => String(y.id) === String(currentYearId)) : null;

            setLocalYearLocked(activeCycleObj?.isLocked || false);
        } catch (err) {
            console.error('Failed loading filter drop choices or sync states:', err);
        }
    };

    const loadStudentData = async () => {
        try {
            const res = await API.get('/users/students', {
                params: {
                    search: search ? search.trim() : '',
                    classId: classFilter === 'All' ? '' : classFilter,
                    sortBy: 'name',
                    sortOrder,
                    page: currentPage,
                    limit: 5,
                    academicYearId: currentYearId || ''
                }
            });
            setStudents(res.data.records || []);
            setTotalPages(res.data.totalPages || 1);
        } catch (err) {
            console.error('Failed loading student database directory tracking parameters:', err);
        }
    };

    const handleUpdateStudent = async (id) => {
        if (!editName.trim() || !editEmail.trim()) {
            return alertService.error('Validation Missing', 'Please satisfy all required student account field parameters.');
        }
        try {
            await API.put(`/users/students/${id}`, {
                name: editName,
                email: editEmail.trim(),
                classId: editClass || null,
                academicYearId: currentYearId
            });
            alertService.success('Profile Saved', 'Student record properties updated successfully.');
            setEditingId(null);
            loadStudentData();

        } catch (err) {
            alertService.error('Update Denied', err.response?.data?.message || 'Error processing student modifications.');
        }
    };
    const openProfileViewDrawer = (st) => {
        console.log("==> FETCHED STUDENT STREAM FOOTPRINT:", st);

        setSelectedProfile(st);
        setIsEditingProfile(false);

        // 1. Core Identity Variables Sync
        setEditName(st.name || '');
        setEditEmail(st.email || '');

        // 🚀 2. FIXED TIMELINE OVERRIDE RESOLUTION (Handles both Array and Object structures)
        let targetClassroomObj = null;

        if (st.yearlyEnrollments) {
            if (Array.isArray(st.yearlyEnrollments)) {
                // Find the specific timeline record matching the currently selected academic year ID
                const activeEnrollment = st.yearlyEnrollments.find(e => String(e.academicYearId) === String(currentYearId));
                targetClassroomObj = activeEnrollment?.classroom;
            } else if (String(st.yearlyEnrollments.academicYearId) === String(currentYearId)) {
                targetClassroomObj = st.yearlyEnrollments.classroom;
            }
        }

        // Fall back to the live root classroom if no historical cycle override is found
        if (!targetClassroomObj) {
            targetClassroomObj = st.classroom;
        }

        const studentClassId = targetClassroomObj?.id || st.classId || '';

        // Ensure the class option exists inside the current academic year dropdown array list
        if (studentClassId && classrooms.some(c => String(c.id) === String(studentClassId))) {
            setEditClass(studentClassId);
        } else {
            setEditClass('');
        }

        // 3. Parent / Guardian Details Profile Sync
        const extension = st.profileExtension || st.profile_extension || {};
        setFormParentName(extension.parentName || extension.parent_name || 'Not Provided');
        setFormParentContact(extension.parentContact || extension.parent_contact || 'Not Provided');
        setFormParentEmail(extension.parentEmail || extension.parent_email || '');
        setFormBloodGroup(extension.bloodGroup || extension.blood_group || '');
    };

    const handleSaveExtendedProfile = async (e) => {
        e.preventDefault();
        if (localYearLocked) return alertService.error('Read-Only Track', 'This academic cycle is archived and locked.');
        if (!editName.trim() || !editEmail.trim() || !formParentName.trim() || !formParentContact.trim()) {
            return alertService.error('Fields Incomplete', 'Please populate all mandatory identity and guardian details.');
        }

        try {
            await API.put(`/users/students/${selectedStudentProfile.id}/profile`, {
                name: editName,
                email: editEmail.trim(),
                classId: editClass || null,
                parentName: formParentName,
                parentContact: formParentContact,
                parentEmail: formParentEmail || null,
                bloodGroup: formBloodGroup || 'N/A',
                academicYearId: currentYearId
            });

            alertService.success('Dossier Synchronized', 'Student profile extension records saved successfully.');
            setSelectedProfile(null);
            setIsEditingProfile(false);
            loadStudentData();
        } catch (err) {
            alertService.error('Commit Failure', err.response?.data?.message || 'Error processing extended data saves.');
        }
    };
    return (
        <div className="w-full space-y-6 text-slate-800">
            {/* Filtering control grid panel options workspace */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><Search size={16} /></span>
                    <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Search students by name or unique profile email..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none text-slate-800 font-medium transition" />
                </div>

                <div className="w-full md:w-56 flex items-center space-x-2">
                    <Filter size={16} className="text-slate-400" />
                    <select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setCurrentPage(1); }} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none font-medium cursor-pointer text-slate-800">
                        <option value="">All Class Segments</option>
                        {classrooms.map(c => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
                    </select>
                </div>

                <button onClick={() => { setSortOrder(p => p === 'ASC' ? 'DESC' : 'ASC'); setCurrentPage(1); }} className="w-full md:w-auto h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer border-0 shadow-sm active:scale-95 transition">
                    <ArrowUpDown size={14} />
                    <span>Alphabetical: {sortOrder === 'ASC' ? 'A to Z' : 'Z to A'}</span>
                </button>
            </div>

            {/* Primary students data listing registry viewport sheet */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {localYearLocked && (
                    <div className="bg-amber-50 border-b border-amber-100 text-amber-800 text-xs font-bold px-6 py-2.5 flex items-center gap-1.5 select-none">
                        <ShieldAlert size={14} className="text-amber-600" />
                        <span>This academic cycle track is archived and locked. Roster row adjustments are restricted.</span>
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="text-slate-400 border-b font-bold uppercase text-[10px] tracking-wider bg-slate-50/10">
                                <th className="p-4 pl-6">Student Profile Identifier</th>
                                <th className="p-4">Primary Contact Email</th>
                                <th className="p-4">Mapped Room Allocation Node</th>
                                <th className="p-4 text-right pr-6">Operations Desk</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-10 text-slate-400 font-semibold">
                                        No students found matching your filters for this active academic cycle.
                                    </td>
                                </tr>
                            ) : (
                                students.map(st => (
                                    <tr key={st.id} className="hover:bg-slate-50/40 transition">
                                        {editingId === st.id ? (
                                            <>
                                                <td className="p-2 pl-6">
                                                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-900 focus:outline-none" />
                                                </td>
                                                <td className="p-2">
                                                    <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-600 focus:outline-none" />
                                                </td>
                                                <td className="p-2">
                                                    <select value={editClass} onChange={(e) => setEditClass(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-bold text-indigo-700 focus:outline-none cursor-pointer">
                                                        <option value="">-- Unassigned --</option>
                                                        {classrooms.map(c => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
                                                    </select>
                                                </td>
                                                <td className="p-2 text-right pr-6 space-x-1.5 shrink-0 whitespace-nowrap">
                                                    <button onClick={() => handleUpdateStudent(st.id)} style={{ backgroundColor: '#10b981', color: '#ffffff' }} className="p-1.5 rounded-lg border-0 cursor-pointer shadow-sm hover:opacity-90 transition"><Check size={14} /></button>
                                                    <button onClick={() => setEditingId(null)} style={{ backgroundColor: '#64748b', color: '#ffffff' }} className="p-1.5 rounded-lg border-0 cursor-pointer shadow-sm hover:opacity-90 transition"><X size={14} /></button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="p-4 pl-6 font-bold text-slate-900 flex items-center space-x-2">
                                                    <div className="h-8 w-8 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center font-extrabold text-xs text-indigo-600 select-none">
                                                        {st.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    {/* 🚀 HYPERLINK TRIGGER: Click name to reveal full dossier profile drawer */}
                                                    <button
                                                        type="button"
                                                        onClick={() => openProfileViewDrawer(st)}
                                                        className="bg-transparent border-0 p-0 text-slate-900 font-bold hover:text-indigo-600 hover:underline cursor-pointer text-left font-sans text-sm focus:outline-none"
                                                    >
                                                        {st.name}
                                                    </button>
                                                </td>
                                                <td className="p-4 text-slate-500 font-mono text-xs select-all">{st.email}</td>
                                                <td className="p-4 font-bold text-indigo-600">
                                                    {(() => {
                                                        let targetClassroom = null;

                                                        if (st.yearlyEnrollments) {
                                                            if (Array.isArray(st.yearlyEnrollments)) {
                                                                const activeEnrollment = st.yearlyEnrollments.find(e => String(e.academicYearId) === String(currentYearId));
                                                                targetClassroom = activeEnrollment?.classroom;
                                                            } else if (String(st.yearlyEnrollments.academicYearId) === String(currentYearId)) {
                                                                targetClassroom = st.yearlyEnrollments.classroom;
                                                            }
                                                        }

                                                        if (!targetClassroom) {
                                                            targetClassroom = st.classroom;
                                                        }

                                                        return targetClassroom ? (
                                                            <span className="inline-flex items-center text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                                                                {targetClassroom.name} — {targetClassroom.section}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs italic font-normal">Unassigned</span>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="p-4 text-right pr-6 shrink-0 whitespace-nowrap">
                                                    <button
                                                        onClick={() => openProfileViewDrawer(st)}
                                                        style={{ backgroundColor: '#f1f5f9', color: '#475569' }}
                                                        className="text-xs font-bold px-3 py-1.5 rounded-xl border-0 cursor-pointer hover:bg-slate-200 hover:text-slate-900 inline-flex items-center space-x-1.5 shadow-sm active:scale-95 transition ml-auto"
                                                    >
                                                        <Edit2 size={12} />
                                                        <span>{localYearLocked ? 'View Profile' : 'View / Edit'}</span>
                                                    </button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <PaginationBar
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>
            {/* ======================================================================== */}
            {/* 🚀 EXPANDABLE SLIDE-OVER DRAWER PANEL FOR EXTENDED METRICS */}
            {/* ======================================================================== */}
            {selectedStudentProfile && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-xl rounded-3xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                        {/* Drawer Heading Jumbotron Banner */}
                        {/* 🚀 FIXED HEADER: Repositioned and stylized close handle to prevent text overlaps */}
                        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white relative shrink-0">

                            {/* ✕ Button isolated cleanly into the absolute top-right frame corner */}
                            <button
                                type="button"
                                onClick={() => setSelectedProfile(null)}
                                style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
                                className="absolute top-4 right-4 h-8 w-8 text-white rounded-full flex items-center justify-center text-xs font-bold border-0 cursor-pointer transition-all duration-200 hover:bg-white/20 active:scale-90"
                            >
                                ✕
                            </button>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 pr-8">
                                <div className="flex items-center space-x-3.5">
                                    <div className="h-11 w-12 bg-indigo-600 text-white font-black text-lg rounded-2xl flex items-center justify-center shadow-lg border border-indigo-500/30 select-none">
                                        {editName?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="truncate">
                                        <h3 className="text-base font-black tracking-tight text-white truncate">{editName}</h3>
                                        <p className="text-[11px] text-indigo-300 font-medium mt-0.5">Parental & Biological Flag Extension Dossier</p>
                                    </div>
                                </div>

                                {/* Action trigger button column shifted down cleanly */}
                                {!localYearLocked && (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                                        style={{ backgroundColor: isEditingProfile ? '#64748b' : '#4f46e5' }}
                                        className="text-white text-xs font-bold px-4 py-2 rounded-xl border-0 cursor-pointer shadow-md transition hover:opacity-90 self-start sm:self-auto shrink-0"
                                    >
                                        {isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}
                                    </button>
                                )}
                            </div>
                        </div>


                        {/* Extended Form Details Workspace Body */}
                        <form onSubmit={handleSaveExtendedProfile} className="flex-1 overflow-y-auto p-6 space-y-5 text-slate-800">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest border-b pb-1.5 border-slate-100 flex items-center gap-1.5">
                                    <GraduationCap size={14} /> A. Core Account Credentials
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-400 font-bold text-[11px] mb-1">Student Full Name</label>
                                        <input type="text" disabled={!isEditingProfile || localYearLocked} value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-slate-50 disabled:bg-slate-100/50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 font-bold text-[11px] mb-1">Contact Email Address</label>
                                        <input type="email" disabled={!isEditingProfile || localYearLocked} value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full bg-slate-50 disabled:bg-slate-100/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 focus:outline-none" />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-slate-400 font-bold text-[11px] mb-1">Assigned Classroom Track</label>
                                        <select
                                            disabled={!isEditingProfile || localYearLocked}
                                            value={editClass}
                                            onChange={(e) => setEditClass(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-indigo-700 focus:outline-none cursor-pointer disabled:opacity-75"
                                        >
                                            <option value="">-- Unassigned Profile --</option>

                                            {/* 🚀 FIXED: Strictly render current academic year options only */}
                                            {classrooms.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name} — {c.section}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <h4 className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest border-b pb-1.5 border-slate-100">B. Guardian Contact Registers</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-400 font-bold text-[11px] mb-1">Primary Guardian Name</label>
                                        {/* 🚀 FIXED: Bound value to formParentName instead of editName! */}
                                        <input
                                            type="text"
                                            disabled={!isEditingProfile || localYearLocked}
                                            value={formParentName}
                                            onChange={(e) => setFormParentName(e.target.value)}
                                            className="w-full bg-slate-50 disabled:bg-slate-100/50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 font-bold text-[11px] mb-1">Guardian Mobile Number</label>
                                        {/* 🚀 FIXED: Bound value to formParentContact instead of editEmail! */}
                                        <input
                                            type="text"
                                            disabled={!isEditingProfile || localYearLocked}
                                            value={formParentContact}
                                            onChange={(e) => setFormParentContact(e.target.value)}
                                            className="w-full bg-slate-50 disabled:bg-slate-100/50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono text-slate-700 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-slate-400 font-bold text-[11px] mb-1">Guardian Personal Email ID</label>
                                        {/* 🚀 FIXED: Bound value to formParentEmail */}
                                        <input
                                            type="email"
                                            disabled={!isEditingProfile || localYearLocked}
                                            value={formParentEmail}
                                            onChange={(e) => setFormParentEmail(e.target.value)}
                                            className="w-full bg-slate-50 disabled:bg-slate-100/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4 pt-2">
                                <h4 className="text-[10px] font-extrabold text-rose-600 uppercase tracking-widest border-b pb-1.5 border-slate-100">C. Medical Metrics Summary</h4>
                                <div>
                                    <label className="block text-slate-400 font-bold text-[11px] mb-1">Blood Group Type</label>
                                    {/* 🚀 FIXED: Bound value to formBloodGroup instead of editClass! */}
                                    <select
                                        disabled={!isEditingProfile || localYearLocked}
                                        value={formBloodGroup}
                                        onChange={(e) => setFormBloodGroup(e.target.value)}
                                        className="w-2/3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-rose-700 focus:outline-none cursor-pointer disabled:opacity-75"
                                    >
                                        <option value="">Not Registered / Provided</option>
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Sticky Drawer Action Footer Controllers */}
                            <div className="pt-4 border-t flex justify-end gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setSelectedProfile(null)}
                                    style={{ backgroundColor: '#64748b', color: '#ffffff' }}
                                    className="px-4 py-2 font-bold text-xs rounded-xl shadow-sm border-0 cursor-pointer hover:opacity-90 transition"
                                >
                                    Close Dossier
                                </button>{isEditingProfile && !localYearLocked && (
                                    <button
                                        type="submit"
                                        style={{ backgroundColor: '#10b981', color: '#ffffff' }}
                                        className="px-4 py-2 font-bold text-xs rounded-xl shadow-md border-0 cursor-pointer hover:opacity-90 transition inline-flex items-center gap-1.5 text-white"
                                    >
                                        Save Profile Changes
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}