import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import PaginationBar from '../components/PaginationBar';

export default function StudentDirectory() {
    const [students, setStudents] = useState([]);
    const [classrooms, setClassrooms] = useState([]);
    const [classFilter, setClassFilter] = useState('');
    const [search, setSearch] = useState('');
    const [sortOrder, setSortOrder] = useState('ASC');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    useEffect(() => {
        fetchFilterOptions();
    }, []);

    useEffect(() => {
        loadStudentData();
    }, [search, classFilter, currentPage]);

    const fetchFilterOptions = async () => {
        try {
            const res = await API.get('/classrooms');

            const dataEnvelope = res.data;
            if (dataEnvelope && dataEnvelope.records) {
                setClassrooms(dataEnvelope.records);
            } else if (Array.isArray(dataEnvelope)) {
                setClassrooms(dataEnvelope);
            } else {
                setClassrooms([]);
            }
        } catch (err) {
            console.error('Failed loading filter drop choices:', err);
        }
    };

    const loadStudentData = async () => {
        const res = await API.get('/users/students', {
            params: { search, classId: classFilter === 'All' ? '' : classFilter, page: currentPage, limit: 5 }
        });
        setStudents(res.data.records || []);
        setTotalPages(res.data.totalPages || 1);
    };
    return (
        <div className="w-full space-y-6 text-slate-800">
            {/* Filtering control grid panel options workspace */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><Search size={16} /></span>
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students by name or unique profile email..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none" />
                </div>

                <div className="w-full md:w-56 flex items-center space-x-2">
                    <Filter size={16} className="text-slate-400" />
                    <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none font-medium cursor-pointer">
                        <option value="">All Class Segments</option>
                        {classrooms.map(c => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
                    </select>
                </div>

                <button onClick={() => setSortOrder(p => p === 'ASC' ? 'DESC' : 'ASC')} className="w-full md:w-auto h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer">
                    <ArrowUpDown size={14} />
                    <span>Alphabetical: {sortOrder}</span>
                </button>
            </div>

            {/* Primary students data listing registry viewport sheet */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="text-slate-400 border-b font-bold uppercase text-[10px] tracking-wider bg-slate-50/10">
                                <th className="p-4 pl-6">Student Profile Identifier</th>
                                <th className="p-4">Primary Contact Email</th>
                                <th className="p-4 text-right">Mapped Room Allocation Node</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {students.length === 0 ? (
                                <tr><td colSpan="3" className="text-center py-8 text-slate-400 font-medium">No record tracks clear sorting validation parameters.</td></tr>
                            ) : students.map(st => (
                                <tr key={st.id} className="hover:bg-slate-50/40 transition">
                                    <td className="p-4 pl-6 font-bold text-slate-900">{st.name}</td>
                                    <td className="p-4 text-slate-500 font-mono text-xs">{st.email}</td>
                                    <td className="p-4 text-right font-semibold text-indigo-600">{st.classroom ? `${st.classroom.name} (${st.classroom.section})` : 'Unassigned'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <PaginationBar
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>

    );
}
