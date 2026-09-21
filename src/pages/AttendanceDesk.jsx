import React, { useState, useEffect } from 'react';
import API from '../services/api';
import alertService from '../services/alert.service';
import { useAuth } from '../hooks/useAuth';
import { Calendar, Search, Save, Check, X, RefreshCw, Download, ArrowLeft, ArrowRight, Printer } from 'lucide-react';
import Swal from 'sweetalert2';

export default function AttendanceDesk() {
    const { user } = useAuth();

    const [classId, setClassId] = useState('');
    const [roster, setRoster] = useState([]);
    const [classrooms, setClassrooms] = useState([]);
    const [attendanceGrid, setAttendanceGrid] = useState({});
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
    const [searchLog, setSearchLog] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [logsLoading, setLogsLoading] = useState(false);

    // 4. Auto-Fetch existing registry logs on initial component render mount
    useEffect(() => {
        fetchLogs();
        if (user) {
            fetchDropdownClassrooms();
        }
    }, [user, searchLog, dateFilter, currentPage]);
    const handleExportPDF = async () => {
        if (!classId || !selectedDate) {
            return alertService.error('Parameters Incomplete', 'Please select a classroom selection node and a valid date before printing.');
        }

        // Generate option elements dynamically for the swal dropdown
        const dropdownOptionsHTML = classrooms.map(cls => `
        <option value="${cls.id}" ${String(cls.id) === String(classId) ? 'selected' : ''}>
            ${cls.name} — ${cls.section}
        </option>
    `).join('');

        // 1. Fire the modern SweetAlert2 configuration modal layout
        const { value: formValues } = await Swal.fire({
            title: 'Confirm Export Parameters',
            icon: 'question',
            iconColor: '#4f46e5', // Beautiful theme matching your Indigo accents
            html: `
            <div style="text-align: left; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1e293b;">
                <p style="margin-bottom: 20px; font-size: 14px; line-height: 1.5; color: #64748b;">
                    Review or modify the parameters below. The backend server will compile a pixel-perfect PDF file matching your target filters.
                </p>
                
                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #4f46e5; margin-bottom: 6px;">Target Classroom</label>
                    <select id="swal-class-id" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 14px; color: #0f172a; outline: none; background: #fff; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); font-weight: 500; cursor: pointer; transition: all 0.2s;">
                        ${dropdownOptionsHTML}
                    </select>
                </div>

                <div style="margin-bottom: 8px;">
                    <label style="display: block; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #4f46e5; margin-bottom: 6px;">Target Date</label>
                    <input type="date" id="swal-date" value="${selectedDate}" max="${new Date().toISOString().split('T')[0]}" style="width: 100%; box-sizing: border-box; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 14px; color: #0f172a; outline: none; background: #fff; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); font-weight: 500; cursor: pointer; transition: all 0.2s;" />
                </div>
            </div>
        `,
            showCancelButton: true,
            confirmButtonText: 'Compile & Download PDF',
            cancelButtonText: 'Go Back',
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#94a3b8',
            focusConfirm: false,
            customClass: {
                popup: 'rounded-3xl border border-slate-100 shadow-xl',
                confirmButton: 'rounded-xl px-5 py-2.5 font-semibold text-sm shadow-sm transition-all',
                cancelButton: 'rounded-xl px-5 py-2.5 font-semibold text-sm transition-all'
            },
            preConfirm: () => {
                const finalClassId = document.getElementById('swal-class-id').value;
                const finalDate = document.getElementById('swal-date').value;

                if (!finalClassId || !finalDate) {
                    Swal.showValidationMessage('Both Class and Date selections are required!');
                    return false;
                }

                return { finalClassId, finalDate };
            }
        });

        if (!formValues) return;

        const { finalClassId, finalDate } = formValues;

        // Sync your primary dashboard states with the newly confirmed values
        setClassId(finalClassId);
        setSelectedDate(finalDate);

        // 2. Clear visual user feedback: Fire a sleek background loading sequence while Puppeteer runs
        Swal.fire({
            title: 'Generating Report Ledger',
            html: 'Launching engine context parameters. Please wait...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // 3. Hit the backend endpoint utilizing the synchronized variables
        try {
            const response = await API.get('/attendance/export-pdf', {
                params: {
                    classId: finalClassId,
                    date: finalDate
                },
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const blobUrl = window.URL.createObjectURL(blob);
            const downloadAnchor = document.createElement('a');
            downloadAnchor.href = blobUrl;
            downloadAnchor.download = `Attendance_Statement_${finalDate}.pdf`;
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            window.URL.revokeObjectURL(blobUrl);

            // 4. Automatically close the background processing animation and alert success
            Swal.close();
            alertService.success('PDF Generated', 'Your clean server-rendered document has downloaded successfully.');
        } catch (err) {
            console.error('PDF Download Pipeline Fault:', err);
            Swal.close(); // Clean out loading blocker
            alertService.error('Print Processing Failed', 'The server-side document tracking engine could not generate your PDF.');
        }
    };
    const fetchDropdownClassrooms = async () => {
        try {
            const res = await API.get('/classrooms', { params: { limit: 'all' } });
            const dataEnvelope = res.data;
            let classroomList = [];
            if (dataEnvelope && Array.isArray(dataEnvelope.records)) {
                classroomList = dataEnvelope.records;
            } else if (Array.isArray(dataEnvelope)) {
                classroomList = dataEnvelope;
            } else if (dataEnvelope && typeof dataEnvelope === 'object') {
                const discoveredArray = Object.values(dataEnvelope).find(val => Array.isArray(val));
                classroomList = discoveredArray || [];
            }
            if (user?.role === 'class_teacher') {
                const teacherClassId = user.classId || '';
                const restrictedList = Array.isArray(classroomList)
                    ? classroomList.filter(cls => cls && cls.id === teacherClassId)
                    : [];

                setClassrooms(restrictedList);
                if (restrictedList.length > 0) {
                    setClassId(restrictedList[0].id);
                }
            } else {
                const safeGlobalList = Array.isArray(classroomList) ? classroomList : [];
                setClassrooms(safeGlobalList);
                if (safeGlobalList.length > 0) {
                    setClassId(safeGlobalList[0].id);
                }
            }
        } catch (err) {
            console.error('Failed loading dropdown nodes:', err);
        }
    };
    const fetchLogs = async () => {
        setLogsLoading(true);
        try {
            const response = await API.get('/attendance', {
                params: {
                    // ⚡ MAPS DIRECTLY: Sends your local text state variable straight to the backend keys
                    search: searchLog ? searchLog.trim() : '',
                    date: dateFilter || '',
                    page: currentPage || 1,
                    limit: 5
                }
            });

            const dataEnvelope = response.data;
            if (dataEnvelope && dataEnvelope.records) {
                setLogs(dataEnvelope.records);
                setTotalPages(dataEnvelope.totalPages || 1);
            } else {
                setLogs([]);
                setTotalPages(1);
            }
        } catch (err) {
            console.error('Logs fetch failed:', err);
        } finally {
            setLogsLoading(false);
        }
    };
    const fetchClassRoster = async () => {
        if (!classId) return alertService.error('Validation Missing', 'Please select a classroom branch selection node.');
        setLoading(true);
        try {
            const res = await API.get(`/attendance/roster?classId=${classId}`);
            setRoster(res.data);
            const initialGrid = {};
            res.data.forEach(student => { initialGrid[student.id] = 'Present'; });
            setAttendanceGrid(initialGrid);
        } catch (err) {
            alertService.error('Roster Error', 'Error loading student roster information parameters.');
        } finally {
            setLoading(false);
        }
    };
    const updateStatusInGrid = (studentId, status) => {
        setAttendanceGrid(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const handleDownloadCSV = async () => {
        // 1. Gather choices for the alert menu
        const dropdownOptionsHTML = classrooms.map(cls => `
        <option value="${cls.id}" ${String(cls.id) === String(classId) ? 'selected' : ''}>
            ${cls.name} — ${cls.section}
        </option>
    `).join('');

        // 2. Fire the matching SweetAlert2 confirmation layout configuration
        const { value: formValues } = await Swal.fire({
            title: 'Confirm CSV Export',
            icon: 'question',
            iconColor: '#059669', // Professional Emerald theme matching your CSV action accents
            html: `
            <div style="text-align: left; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1e293b;">
                <p style="margin-bottom: 20px; font-size: 14px; line-height: 1.5; color: #64748b;">
                    Select the target classroom parameters. The data engine will compile an unpaginated spreadsheet file containing the full history registry ledger.
                </p>
                
                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #059669; margin-bottom: 6px;">Target Classroom</label>
                    <select id="swal-csv-class-id" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 14px; color: #0f172a; outline: none; background: #fff; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); font-weight: 500; cursor: pointer;">
                        <option value="all" ${classId === '' ? 'selected' : ''}>Export All Classrooms (Full Institution Scope)</option>
                        ${dropdownOptionsHTML}
                    </select>
                </div>
            </div>
        `,
            showCancelButton: true,
            confirmButtonText: 'Generate Spreadsheet',
            cancelButtonText: 'Go Back',
            confirmButtonColor: '#059669', // Emerald green styling matching your theme accents
            cancelButtonColor: '#94a3b8',
            focusConfirm: false,
            customClass: {
                popup: 'rounded-3xl border border-slate-100 shadow-xl',
                confirmButton: 'rounded-xl px-5 py-2.5 font-semibold text-sm shadow-sm transition-all',
                cancelButton: 'rounded-xl px-5 py-2.5 font-semibold text-sm transition-all'
            },
            preConfirm: () => {
                const finalClassId = document.getElementById('swal-csv-class-id').value;
                if (!finalClassId) {
                    Swal.showValidationMessage('Classroom configuration target is required!');
                    return false;
                }
                return { finalClassId };
            }
        });

        if (!formValues) return;

        const { finalClassId } = formValues;

        // Sync dashboard state seamlessly if the user targeted a specific classroom node container
        if (finalClassId !== 'all') {
            setClassId(finalClassId);
        }

        // 3. Prevent multi-clicks: Activate the fullscreen visual processing screen overlay blocks
        Swal.fire({
            title: 'Building Spreadsheet Registry',
            html: 'Compiling rows and formatting columns. Please wait...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // 4. Hit the unpaginated export service endpoint via your global API configuration pipeline
        try {
            const response = await API.get('/attendance/export', {
                params: {
                    classId: finalClassId === 'all' ? '' : finalClassId
                },
                responseType: 'blob' // ⚡ CRITICAL: Feeds raw tracking binary text frames downstream safely
            });

            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);

            const downloadAnchor = document.createElement('a');
            downloadAnchor.href = url;
            downloadAnchor.download = `Attendance_Report_${finalClassId === 'all' ? 'All_Classes' : 'Class_' + finalClassId}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();

            // Memory allocation cleanup routines
            downloadAnchor.remove();
            window.URL.revokeObjectURL(url);

            // 5. Wrap up processing steps cleanly
            Swal.close();
            alertService.success('CSV Exported', 'Your data sheet has loaded and downloaded successfully.');
        } catch (err) {
            console.error('CSV Download Pipeline Fault:', err);
            Swal.close(); // Clean up backdrop blocking overlays instantly
            alertService.error('Download Failure', 'The system encountered an error while formatting your spreadsheet data logs.');
        }
    };
    const submitBulkLogs = async () => {
        try {
            const records = Object.keys(attendanceGrid).map(studentId => ({
                studentId,
                classId,
                date: selectedDate,
                status: attendanceGrid[studentId]
            }));
            await API.post('/attendance/bulk', { records });
            alertService.success('Logs Recorded', `Bulk attendance logs for ${selectedDate} saved instantly!`);
            fetchLogs();
        } catch (err) {
            alertService.error('Commit Failure', 'Failed saving classroom batch logs.');
        }
    };
    return (
        <div className="space-y-6 w-full text-slate-800">

            {/* 🟢 TOP PART: Selection input bar component block */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-end gap-4">
                <div className="flex-1">
                    <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Target Class Selection</label>
                    <select
                        value={classId}
                        onChange={(e) => setClassId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800 font-medium transition cursor-pointer"
                    >
                        {classrooms.length === 0 && <option value="">No classrooms configured yet</option>}
                        {classrooms.map(cls => (
                            <option key={cls.id} value={cls.id}>
                                {cls.name} — {cls.section}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="w-full md:w-48">
                    <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Attendance Session Date</label>
                    <input
                        type="date"
                        value={selectedDate}
                        max={new Date().toISOString().split('T')[0]} onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800 font-medium cursor-pointer"
                    />
                </div>
                <button onClick={fetchClassRoster} disabled={loading || !classId} style={{ backgroundColor: '#0f172a', color: '#ffffff' }} className="text-sm font-bold h-11 px-6 rounded-xl flex items-center space-x-2 shrink-0 cursor-pointer disabled:opacity-40"><Search className="h-4 w-4" /><span style={{ color: '#ffffff' }}>Load Class Roster</span></button>
            </div>

            {/* 🟢 MIDDLE PART: Interactive roll call bulk grid matrix */}
            {roster.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
                        <span className="font-bold text-slate-800">Roster Log Sheet Matrix ({classId})</span>
                        <div className="flex items-center space-x-2">
                            <button onClick={() => { const u = {}; roster.forEach(s => u[s.id] = 'Present'); setAttendanceGrid(u); }} className="text-xs bg-white text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg transition font-bold cursor-pointer hover:bg-slate-50">Mark All Present</button>
                            <button onClick={() => { const u = {}; roster.forEach(s => u[s.id] = 'Absent'); setAttendanceGrid(u); }} className="text-xs bg-white text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg transition font-bold cursor-pointer hover:bg-slate-50">Mark All Absent</button>
                            <button onClick={submitBulkLogs} style={{ backgroundColor: '#059669', color: '#ffffff' }} className="text-sm font-bold px-5 py-2.5 rounded-xl flex items-center space-x-2 cursor-pointer hover:opacity-95 shadow-sm"><Save className="h-4 w-4" style={{ color: '#ffffff' }} /><span style={{ color: '#ffffff' }}>Commit Bulk</span></button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="text-slate-400 border-b border-slate-100 font-bold uppercase text-[10px] tracking-wider bg-slate-50/20"><th className="p-4 pl-6">Student Information Profile</th><th className="p-4 text-center w-24">Present</th><th className="p-4 text-center w-24">Absent</th><th className="p-4 text-center w-24">Late</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {roster.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50/50 transition">
                                        <td className="p-4 pl-6"><p className="font-bold text-slate-900">{student.name}</p><p className="text-xs text-slate-400 font-mono mt-0.5">{student.email}</p></td>
                                        <td className="p-4 text-center"><button onClick={() => updateStatusInGrid(student.id, 'Present')} style={attendanceGrid[student.id] === 'Present' ? { backgroundColor: '#10b981', borderColor: '#059669', color: '#ffffff' } : {}} className={`h-8 w-8 mx-auto rounded-full flex items-center justify-center border cursor-pointer ${attendanceGrid[student.id] === 'Present' ? 'text-white' : 'bg-slate-50 border-slate-200 text-slate-400'}`}><Check className="h-4 w-4" /></button></td>
                                        <td className="p-4 text-center"><button onClick={() => updateStatusInGrid(student.id, 'Absent')} style={attendanceGrid[student.id] === 'Absent' ? { backgroundColor: '#ef4444', borderColor: '#dc2626', color: '#ffffff' } : {}} className={`h-8 w-8 mx-auto rounded-full flex items-center justify-center border cursor-pointer ${attendanceGrid[student.id] === 'Absent' ? 'text-white' : 'bg-slate-50 border-slate-200 text-slate-400'}`}><X className="h-4 w-4" /></button></td>
                                        <td className="p-4 text-center"><button onClick={() => updateStatusInGrid(student.id, 'Late')} style={attendanceGrid[student.id] === 'Late' ? { backgroundColor: '#f59e0b', borderColor: '#d97706', color: '#ffffff' } : {}} className={`h-8 w-8 mx-auto rounded-full flex items-center justify-center border cursor-pointer ${attendanceGrid[student.id] === 'Late' ? 'text-white' : 'bg-slate-50 border-slate-200 text-slate-400'}`}><span className="text-xs font-black">L</span></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 🟢 BOTTOM PART: Audit tracking log panel engine list */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm w-full space-y-4">

                {/* Registry Section Control Toolbar Layout */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-4 border-b border-slate-100 gap-4">
                    <div>
                        <h3 className="font-bold text-slate-800 text-base">Historical Tracking Registry</h3>
                        <p className="text-slate-400 text-xs mt-0.5">Audit logs captured across active database boundaries</p>
                    </div>

                    {/* Right Column: Action Buttons Group (⚡ Preserved exactly as your current layout) */}
                    <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
                        <button
                            onClick={handleDownloadCSV}
                            style={{ backgroundColor: '#059669', color: '#ffffff' }}
                            className="h-10 px-4 rounded-xl font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-sm hover:opacity-90 active:scale-95 border-0"
                        >
                            <Download className="h-4 w-4" style={{ color: '#ffffff' }} />
                            <span style={{ color: '#ffffff' }}>Export Spreadsheet</span>
                        </button>
                        <button
                            onClick={handleExportPDF}
                            style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                            className="h-10 px-4 rounded-xl font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer hover:opacity-90 border-0 shadow-sm"
                        >
                            <Printer className="w-4 h-4" />Export PDF Report
                        </button>
                        <button
                            onClick={fetchLogs}
                            disabled={logsLoading}
                            style={{ backgroundColor: '#1e293b', color: '#ffffff' }}
                            className="h-10 w-10 rounded-xl flex items-center justify-center transition cursor-pointer shadow-sm hover:opacity-90 active:scale-95 disabled:opacity-40 border-0"
                        >
                            <span
                                className={`text-lg font-bold select-none ${logsLoading ? 'animate-spin inline-block' : ''}`}
                                style={{ color: '#ffffff', display: 'inline-block' }}
                            >
                                ↻
                            </span>
                        </button>
                    </div>
                </div>

                {/* ⚡ NEW Filter Ribbon Bar: Search inputs sit elegantly right below the header row */}
                <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="relative flex-1 w-full">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                            <Search size={14} />
                        </span>
                        <input
                            type="text"
                            value={searchLog}
                            onChange={(e) => { setSearchLog(e.target.value); setCurrentPage(1); }}
                            placeholder="Search student names or emails..."
                            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-800 transition shadow-sm"
                        />
                    </div>
                    <div className="w-full sm:w-44 flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                        <Calendar size={14} className="text-slate-400" />
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
                            className="bg-transparent border-0 text-xs text-slate-700 focus:outline-none w-full cursor-pointer font-semibold"
                        />
                    </div>
                    <button
                        onClick={() => { setSearchLog(''); setDateFilter(new Date().toISOString().split('T')[0]); setCurrentPage(1); }}
                        className="text-xs font-bold text-slate-500 hover:text-indigo-600 bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl transition cursor-pointer shadow-sm whitespace-nowrap"
                    >
                        Clear Filters
                    </button>
                </div>

                {/* Dynamic Table Body Viewport Grid */}
                {logsLoading ? (
                    <div className="text-center py-12 text-slate-400 font-medium text-sm">Refreshing history logs array metrics...</div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 font-medium text-sm">No log records matched your search parameters for this date.</div>
                ) : (
                    <div className="overflow-x-auto w-full space-y-4">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="text-slate-400 border-b border-slate-100 font-bold uppercase text-[10px] tracking-wider bg-slate-50/10">
                                    <th className="py-3 px-3">Student Name Target</th>
                                    <th className="py-3 px-3">Classroom Zone</th>
                                    <th className="py-3 px-3">Date Record Frame</th>
                                    <th className="py-3 px-3 text-right">Status Flag Metric</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {logs.map((rec) => (
                                    <tr key={rec.id} className="hover:bg-slate-50/40 transition-colors">
                                        <td className="py-3.5 px-3">
                                            <p className="font-bold text-slate-900">{rec.student?.name || 'Active Session'}</p>
                                            <p className="text-xs text-slate-400 font-mono mt-0.5">{rec.student?.email || 'N/A'}</p>
                                        </td>
                                        <td className="py-3.5 px-3">
                                            <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                                {rec.classroom ? `${rec.classroom.name} — ${rec.classroom.section}` : 'Unmapped Zone'}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-3 text-slate-500 font-medium">{rec.date}</td>
                                        <td className="py-3.5 px-3 text-right">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${rec.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : rec.status === 'Absent' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                {rec.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* 🚀 DYNAMIC PAGINATION CONTROLLER ROW */}
                        {/* 🚀 FIXED: DYNAMIC PAGINATION BAR CONTROLLER WITH TEXT ARROWS FOR HIGH VISIBILITY */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4 bg-slate-50/50 p-3 rounded-xl">
                            <span className="text-xs font-bold text-slate-500">
                                Page <span className="text-slate-900 font-extrabold">{currentPage}</span> of <span className="text-slate-900 font-extrabold">{totalPages}</span>
                            </span>

                            <div className="flex items-center space-x-2">
                                {/* Previous Page Action Control */}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    style={{ borderColor: '#cbd5e1' }}
                                    className="h-9 px-4 bg-white border text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-1 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-slate-50 active:scale-95 shadow-sm"
                                >
                                    <span className="text-sm font-black mr-0.5">←</span>
                                    <span>Prev</span>
                                </button>

                                {/* Next Page Action Control */}
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
