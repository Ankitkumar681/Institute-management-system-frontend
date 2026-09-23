import React, { useState, useEffect } from 'react';
import API from '../services/api';
import alertService from '../services/alert.service';
import { Search, ArrowUpDown, Shield, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import PaginationBar from '../components/PaginationBar';

export default function StaffDirectory() {
    const { user } = useAuth(); // Read logged-in credentials scope
    const [staff, setStaff] = useState([]);
    const [search, setSearch] = useState('');
    const [sortOrder, setSortOrder] = useState('ASC');
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const isAdmin = user?.role === 'institute_admin';

    const fetchStaffData = async () => {
        setLoading(true);
        try {
            const res = await API.get('/users/staff', {
                params: { search, sortBy: 'name', sortOrder, page: currentPage, limit: 5 }
            });
            setStaff(res.data.records || []);
            setTotalPages(res.data.totalPages || 1);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaffData();
    }, [search, sortOrder, currentPage]);

    // 🚀 NEW: State handler to toggle active/inactive records dynamically
    const handleToggleStaff = async (memberId, currentStatus, name) => {
        const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
        const confirmed = await alertService.confirm(
            `Change status for ${name}?`,
            nextStatus === 'inactive' ? 'Suspended staff will be forcibly logged out instantly.' : 'Replaces baseline workspace execution metrics.',
            nextStatus === 'inactive' ? 'Yes, suspend them!' : 'Yes, reactivate!'
        );

        if (confirmed) {
            try {
                await API.put(`/users/staff/${memberId}/status`, { status: nextStatus });
                alertService.success('Record Saved', `Staff profile status mutated to ${nextStatus}.`);
                fetchStaffData();
            } catch (err) {
                alertService.error('Action Refused', err.response?.data?.message || 'Error processing action.');
            }
        }
    };
    return (
        <div className="w-full space-y-6 text-slate-800">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative flex-1 w-full max-w-md">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><Search size={16} /></span>
                    <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Search teachers by name or official email..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none" />
                </div>
                <button onClick={() => { setSortOrder(p => p === 'ASC' ? 'DESC' : 'ASC'); setCurrentPage(1); }} className="w-full sm:w-auto h-11 px-5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer border-0">
                    <ArrowUpDown size={14} />
                    <span>Alphabetical: {sortOrder === 'ASC' ? 'A to Z' : 'Z to A'}</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b font-bold text-slate-800 bg-slate-50/50 flex items-center space-x-2">
                    <Shield size={18} className="text-indigo-600" />
                    <span>Faculty & General Management Personnel Roster</span>
                </div>
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b bg-slate-50/10">
                                <th className="p-4 pl-6">Faculty Member Name</th>
                                <th className="p-4">Assigned Role</th>
                                <th className="p-4">Status</th>
                                {isAdmin && <th className="p-4 text-right pr-6">Operations</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && staff.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-10 text-slate-400">Loading roster items...</td></tr>
                            ) : staff.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-10 text-slate-400">No staff members match the query parameters.</td></tr>
                            ) : (
                                staff.map(member => (
                                    <tr key={member.id} className="hover:bg-slate-50/40 transition">
                                        <td className="p-4 pl-6 font-bold text-slate-900 flex items-center space-x-2">
                                            <div className="h-8 w-8 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center font-extrabold text-xs text-indigo-600">{member.name.charAt(0)}</div>
                                            <div>
                                                <p>{member.name}</p>
                                                <p className="text-xs text-slate-400 font-mono font-normal flex items-center mt-0.5"><Mail size={11} className="mr-1" />{member.email}</p>
                                            </div>
                                        </td>
                                        <td className="p-4 uppercase text-xs font-bold tracking-wider text-slate-500">{member.role?.replace('_', ' ')}</td>
                                        <td className="p-4">
                                            <span style={member.status !== 'inactive' ? { backgroundColor: '#e6f4ea', color: '#137333' } : { backgroundColor: '#fce8e6', color: '#c5221f' }} className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase">
                                                {member.status || 'active'}
                                            </span>
                                        </td>
                                        {isAdmin && (
                                            <td className="p-4 text-right pr-6">
                                                {member.role !== 'institute_admin' ? (
                                                    <button
                                                        onClick={() => handleToggleStaff(member.id, member.status || 'active', member.name)}
                                                        style={member.status !== 'inactive' ? { backgroundColor: '#fee2e2', color: '#991b1b' } : { backgroundColor: '#e2e8f0', color: '#334155' }}
                                                        className="text-xs font-bold px-3 py-1.5 rounded-lg border-0 cursor-pointer shadow-sm transition"
                                                    >
                                                        {member.status === 'inactive' ? 'Activate' : 'Deactivate'}
                                                    </button>
                                                ) : <span className="text-xs text-slate-400 italic">Root Owner</span>}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <PaginationBar currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
        </div>
    );
}
