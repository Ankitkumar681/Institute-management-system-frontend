import React, { useState, useEffect } from 'react';
import API from '../services/api';
import alertService from '../services/alert.service';
import PaginationBar from '../components/PaginationBar';
import { useAuth } from '../hooks/useAuth';

export default function ManageClassrooms() {
    const { currentYearId } = useAuth();

    const [name, setName] = useState('');
    const [section, setSection] = useState('');
    const [classrooms, setClassrooms] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // ⚡ Inline Editing State Core Indicators
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editSection, setEditSection] = useState('');

    const fetchClassrooms = async () => {
        try {
            const res = await API.get('/classrooms', { params: { page: currentPage, limit: 5, academicYearId: currentYearId || '' } });
            setClassrooms(res.data.records || []);
            setTotalPages(res.data.totalPages || 1);
        } catch (err) {
            console.error('Error loading classrooms:', err);
        }
    };

    useEffect(() => {
        fetchClassrooms();
    }, [currentPage, currentYearId]);
    useEffect(() => {
        const handleGlobalYearSwitch = () => {
            setCurrentPage(1);
            setEditingId(null);
        };
        window.addEventListener("academic-year-changed", handleGlobalYearSwitch);
        return () => {
            window.removeEventListener("academic-year-changed", handleGlobalYearSwitch);
        };
    }, []);
    const handleCreateClass = async (e) => {
        e.preventDefault();
        try {
            await API.post('/classrooms', { name, section, academicYearId: currentYearId || null });
            alertService.success('Classroom Registered', `"${name} (${section})" is now live.`);
            setName('');
            setSection('');
            fetchClassrooms();
        } catch (err) {
            alertService.error('Registration Denied', err.response?.data?.message || 'Error creating classroom.');
        }
    };

    // ⚡ Trigger inline modifications save event loop
    const handleUpdateClass = async (id) => {
        try {
            await API.put(`/classrooms/${id}`, { name: editName, section: editSection });
            alertService.success('Updated Successfully', 'Classroom changes saved.');
            setEditingId(null); // Close editing context state loop
            fetchClassrooms();
        } catch (err) {
            alertService.error('Update Failed', err.response?.data?.message || 'Error saving changes.');
        }
    };

    const startEditing = (cls) => {
        setEditingId(cls.id);
        setEditName(cls.name);
        setEditSection(cls.section);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full text-slate-800">

            {/* Left Column: Form Panel */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                <div className="pb-4 mb-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 text-base">Create New Classroom</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Define structured class nodes for students</p>
                </div>

                <form onSubmit={handleCreateClass} className="space-y-4">
                    <div>
                        <label className="block text-slate-600 text-xs font-bold uppercase mb-1">Class Name</label>
                        <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grade-10" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition" />
                    </div>

                    <div>
                        <label className="block text-slate-600 text-xs font-bold uppercase mb-1">Section / Division</label>
                        <input type="text" required value={section} onChange={(e) => setSection(e.target.value)} placeholder="e.g. Section-A" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition" />
                    </div>

                    <button type="submit" style={{ backgroundColor: '#4f46e5', color: '#ffffff' }} className="w-full font-bold text-sm py-2.5 rounded-xl transition cursor-pointer hover:opacity-90 border-0 flex items-center justify-center h-11 shadow-md">
                        <span>Add Classroom</span>
                    </button>
                </form>
            </div>

            {/* Right Column: Listing Grid View with Inline Mode Controllers */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
                <div className="pb-4 mb-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 text-base">Registered Classrooms</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Active partitions discovered inside this institute session</p>
                </div>

                {classrooms.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">No classroom spaces mapped yet.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="text-slate-400 border-b border-slate-100 font-bold uppercase text-[10px] tracking-wider bg-slate-50/10">
                                    <th className="p-3">Classroom Target</th>
                                    <th className="p-3">Section Stream</th>
                                    <th className="p-3 text-right">Actions Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {classrooms.map((cls) => (
                                    <tr key={cls.id} className="hover:bg-slate-50/40 transition">

                                        {/* Render Fields if matching current Active Edit Row ID */}
                                        {editingId === cls.id ? (
                                            <>
                                                <td className="p-2">
                                                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-sm text-slate-800 focus:outline-none" />
                                                </td>
                                                <td className="p-2">
                                                    <input type="text" value={editSection} onChange={(e) => setEditSection(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-sm text-slate-800 focus:outline-none" />
                                                </td>
                                                <td className="p-2 text-right space-x-1.5 shrink-0 whitespace-nowrap">
                                                    <button onClick={() => handleUpdateClass(cls.id)} style={{ backgroundColor: '#10b981', color: '#ffffff' }} className="text-xs font-bold px-3 py-1.5 rounded-lg transition hover:opacity-90 cursor-pointer border-0">Save</button>
                                                    <button onClick={() => setEditingId(null)} style={{ backgroundColor: '#64748b', color: '#ffffff' }} className="text-xs font-bold px-3 py-1.5 rounded-lg transition hover:opacity-90 cursor-pointer border-0">Cancel</button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="p-4 font-bold text-slate-900">{cls.name}</td>
                                                <td className="p-4 text-slate-500 font-medium">{cls.section}</td>
                                                <td className="p-4 text-right space-x-2 shrink-0 whitespace-nowrap">
                                                    <button
                                                        onClick={() => startEditing(cls)}
                                                        style={{ backgroundColor: '#e2e8f0', color: '#334155' }}
                                                        className="text-xs font-bold px-3 py-1.5 rounded-lg transition hover:bg-slate-300 cursor-pointer border-0"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            // 🚀 FIX: Pass "Yes, delete it!" as the third parameter to differentiate from suspension modals
                                                            const confirmed = await alertService.confirm(
                                                                'Are you absolutely sure?',
                                                                `This will permanently purge "${cls.name}" and all historical logs attached to it.`,
                                                                'Yes, delete it!' // ⚡ Sent straight to our upgraded dynamic alert service
                                                            );

                                                            if (confirmed) {
                                                                try {
                                                                    await API.delete(`/classrooms/${cls.id}`);
                                                                    alertService.success('Purged Successfully', 'The classroom node was dropped cleanly.');
                                                                    fetchClassrooms();
                                                                } catch (err) {
                                                                    alertService.error('Operation Failed', 'Failed dropping classroom boundary constraints.');
                                                                }
                                                            }
                                                        }}
                                                        style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}
                                                        className="text-xs font-bold px-3 py-1.5 rounded-lg transition hover:bg-red-200 cursor-pointer shadow-sm border-0"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <PaginationBar currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>

                )}
            </div>

        </div>
    );
}
