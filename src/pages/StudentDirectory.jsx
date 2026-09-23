import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import PaginationBar from '../components/PaginationBar';
import { useAuth } from '../hooks/useAuth';

export default function StudentDirectory() {
    const { currentYearId } = useAuth();

    const [students, setStudents] = useState([]);
    const [classrooms, setClassrooms] = useState([]);
    const [classFilter, setClassFilter] = useState('');
    const [search, setSearch] = useState('');
    const [sortOrder, setSortOrder] = useState('ASC');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    useEffect(() => {
        fetchFilterOptions();
    }, [currentYearId]);

    useEffect(() => {
        loadStudentData();
    }, [search, classFilter, sortOrder, currentPage, currentYearId]);

    useEffect(() => {
        const handleGlobalYearSwitch = () => {
            setClassFilter('');
            setCurrentPage(1);
        };
        window.addEventListener("academic-year-changed", handleGlobalYearSwitch);
        return () => {
            window.removeEventListener("academic-year-changed", handleGlobalYearSwitch);
        };
    }, []);
    const fetchFilterOptions = async () => {
        try {
            const res = await API.get('/classrooms', { params: { limit: 'all', academicYearId: currentYearId || '' } });

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
        try {
            const res = await API.get('/users/students', {
                params: {
                    search: search ? search.trim() : '',
                    classId: classFilter === 'All' ? '' : classFilter,
                    sortBy: 'name',
                    sortOrder,
                    page: currentPage,
                    limit: 5,
                    academicYearId: currentYearId || '' // ⚡ Scoped securely by global session timeline bounds
                }
            });
            setStudents(res.data.records || []);
            setTotalPages(res.data.totalPages || 1);
        } catch (err) {
            console.error('Failed loading student database directory tracking parameters:', err);
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
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="text-slate-400 border-b font-bold uppercase text-[10px] tracking-wider bg-slate-50/10">
                                <th className="p-4 pl-6">Student Profile Identifier</th>
                                <th className="p-4">Primary Contact Email</th>
                                <th className="p-4 text-right pr-6">Mapped Room Allocation Node</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {students.length === 0 ? (
                                <tr><td colSpan="3" className="text-center py-10 text-slate-400 font-semibold">No students found matching your filters for this active academic cycle.</td></tr>
                            ) : students.map(st => (
                                <tr key={st.id} className="hover:bg-slate-50/40 transition">
                                    <td className="p-4 pl-6 font-bold text-slate-900 flex items-center space-x-2">
                                        <div className="h-8 w-8 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center font-extrabold text-xs text-indigo-600">
                                            {st.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <span>{st.name}</span>
                                    </td>
                                    <td className="p-4 text-slate-500 font-mono text-xs">{st.email}</td>
                                    <td className="p-4 text-right pr-6 font-bold text-indigo-600">
                                        {st.classroom ? (
                                            <span className="inline-flex items-center text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                                                {st.classroom.name} — {st.classroom.section}
                                            </span>
                                        ) : <span className="text-slate-400 text-xs italic font-normal">Unassigned</span>}
                                    </td>
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