import React, { useState, useEffect } from 'react';
import API from '../services/api';
import alertService from '../services/alert.service';
import { useAuth } from '../hooks/useAuth';
import { UserPlus, Mail, Shield, CheckCircle, AlertCircle, Plus, Trash2, ShieldAlert, BookOpen, Layers } from 'lucide-react';
import Swal from 'sweetalert2';

export default function ManageStaff() {
  const { currentYearId } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('class_teacher');
  const [message, setMessage] = useState({ type: '', text: '' });

  const [staffList, setStaffList] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedStaff, setSelectedStaff] = useState(null);
  const [targetClassId, setTargetClassId] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [makePrimary, setMakePrimary] = useState(false);
  const [localYearLocked, setLocalYearLocked] = useState(false);

  useEffect(() => {
    fetchDirectoryData();
  }, [currentYearId]);
  useEffect(() => {
    const handleGlobalYearSwitch = () => {
      setSelectedStaff(null);
      fetchDirectoryData();
    };
    window.addEventListener("academic-year-changed", handleGlobalYearSwitch);
    return () => {
      window.removeEventListener("academic-year-changed", handleGlobalYearSwitch);
    };
  }, []);
  const fetchDirectoryData = async () => {
    setLoading(true);
    try {
      const [staffRes, classesRes] = await Promise.all([
        API.get('/users/staff', { params: { limit: 'all', academicYearId: currentYearId } }),
        API.get('/classrooms', { params: { limit: 'all', academicYearId: currentYearId } })
      ]);
      setStaffList(staffRes.data?.records || []);
      setClassrooms(classesRes.data?.records || (Array.isArray(classesRes.data) ? classesRes.data : []));
      const resYears = await API.get('/attendance/academic-years');
      const targetYearObj = (resYears.data || []).find(y => String(y.id) === String(currentYearId));

      // Update local tracking state dynamically to refresh your view elements instantly!
      setLocalYearLocked(targetYearObj?.isLocked || false);
    } catch (err) {
      console.error('Failed to pull directory registries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterStaff = async (e) => {
    e.preventDefault();
    if (localYearLocked) return alertService.error('Read-Only Track', 'This academic cycle is archived and locked.');
    setMessage({ type: '', text: '' });

    const currentAdmin = JSON.parse(localStorage.getItem('user'));

    try {
      await API.post('/auth/register', {
        name,
        email,
        password,
        role,
        instituteId: currentAdmin?.instituteId,
        academicYearId: currentYearId
      });
      setMessage({ type: 'success', text: `Successfully registered new ${role.replace('_', ' ')}!` });
      setName('');
      setEmail('');
      setPassword('');
      fetchDirectoryData(); // Refresh list grid
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to onboard staff record' });
    }
  };
  const handleAssignMatrix = async (e) => {
    e.preventDefault();
    if (localYearLocked) return alertService.error('Read-Only', 'This academic cycle is locked.');
    if (!selectedStaff || !targetClassId) return alertService.error('Missing Node', 'Please pick a target classroom allocation.');

    try {
      await API.put('/users/staff/assign-class', {
        teacherId: selectedStaff.id,
        classId: targetClassId,
        subjectName: subjectName.trim(),
        makePrimaryClassTeacher: makePrimary,
        academicYearId: currentYearId
      });

      alertService.success('Matrix Synchronized', 'Faculty relationship mappings updated successfully.');

      // 🚀 THE STATE RESET FIX: Flush choices out cleanly to force React to update the DOM grid
      setTargetClassId('');
      setSubjectName('');
      setMakePrimary(false);
      setSelectedStaff(null);

      // 🚀 RE-FETCH DATA FROM SERVER INSTANTLY
      await fetchDirectoryData();
    } catch (err) {
      alertService.error('Assignment Failed', err.response?.data?.message || 'Error mapping parameters');
    }
  };

  // 🚀 DROP INDIVIDUAL SUBJECT LINK
  const handleRevokeSubject = async (assignmentId) => {
    if (localYearLocked) return alertService.error('Read-Only Track', 'This academic cycle is archived and locked.');

    const confirmed = await alertService.confirm(
      'Drop Subject Allocation?',
      'This will remove this teacher from managing this subject roll list for this section.',
      'Yes, drop link'
    );

    if (confirmed) {
      try {
        await API.delete(`/users/staff/subjects/${assignmentId}`);
        alertService.success('Link Removed', 'Subject assignment deleted successfully.');
        fetchDirectoryData();
      } catch (err) {
        alertService.error('Revocation Denied', err.response?.data?.message || 'Failed dropping constraint.');
      }
    }
  };

  return (
    <div className="space-y-6 w-full text-slate-800">

      {/* 🛡️ YEAR LOCK WARNING STRIP STATUS BANNER */}
      {localYearLocked && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold px-6 py-3 rounded-2xl flex items-center gap-2 select-none shadow-sm animate-fadeIn">
          <ShieldAlert size={16} className="text-amber-600 shrink-0" />
          <span>This academic cycle track is archived and locked. Faculty roles and secondary classroom mappings are strictly read-only.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* 📝 LEFT COLUMN: ONBOARDING / WORKSPACE ALLOCATION CONTROLS */}
        <div className="space-y-6 lg:col-span-1">

          {/* Card A: Account Onboarding Entry Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
              <UserPlus className="h-5 w-5 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm">A. Onboard New Personnel</h3>
            </div>

            {!localYearLocked ? (
              <form onSubmit={handleRegisterStaff} className="space-y-3.5">
                {message.text && (
                  <div className={`p-3 rounded-xl border flex items-center space-x-2 text-xs font-medium ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                    <span>{message.text}</span>
                  </div>
                )}
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Full Name</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Prof. Sarah Jenkins" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Email Address</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sarah.j@school.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">System Role Type</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none cursor-pointer font-semibold">
                    <option value="teacher">Subject Teacher</option>
                    <option value="class_teacher">Primary Class Teacher</option>
                    <option value="staff">General Management Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Password</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none" />
                </div>
                <button type="submit" style={{ backgroundColor: '#4f46e5', color: '#ffffff' }} className="w-full font-bold text-xs py-2.5 rounded-xl border-0 cursor-pointer shadow-sm hover:opacity-95">Register Faculty Member</button>
              </form>
            ) : (
              <div className="text-xs text-slate-400 italic py-4 text-center">Registration frozen for locked year tracks.</div>
            )}
          </div>

          {/* Card B: Dynamic Subject / Classroom Allocator Panel Form */}
          {selectedStaff && (
            <div className="bg-gradient-to-b from-indigo-50/40 to-slate-50/50 p-6 rounded-2xl border border-indigo-100 shadow-sm space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-indigo-100/60">
                <div className="flex items-center space-x-2">
                  <Layers className="h-4 w-4 text-indigo-600" />
                  <h4 className="font-bold text-slate-800 text-xs">B. Allocate Workspace Context</h4>
                </div>
                <button type="button" onClick={() => setSelectedStaff(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold border-0 bg-transparent cursor-pointer">Cancel</button>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Configuring mappings for: <span className="font-bold text-indigo-700">{selectedStaff.name}</span></p>

              <form onSubmit={handleAssignMatrix} className="space-y-3.5">
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Target Classroom Container</label>
                  <select required value={targetClassId} onChange={(e) => setTargetClassId(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer">
                    <option value="">-- Pick Class Section --</option>
                    {classrooms.map(c => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Subject Coverage Line (Optional)</label>
                  <input type="text" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="e.g. Mathematics, Physics" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none" />
                </div>

                <div className="flex items-center space-x-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-inner select-none">
                  <input type="checkbox" id="primary-toggle" checked={makePrimary} onChange={(e) => setMakePrimary(e.target.checked)} className="h-3.5 w-3.5 rounded text-indigo-600 cursor-pointer" />
                  <label htmlFor="primary-toggle" className="text-[11px] font-bold text-slate-600 cursor-pointer">Set as Primary Class Teacher</label>
                </div>

                <button type="submit" style={{ backgroundColor: '#059669', color: '#ffffff' }} className="w-full font-bold text-xs py-2.5 rounded-xl border-0 cursor-pointer shadow-sm hover:opacity-95">Commit Assignment Mapping</button>
              </form>
            </div>
          )}
        </div>

        {/* 📊 RIGHT COLUMN: PERSONNEL MATRIX TABLE VIEW LISTING */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-2 flex flex-col h-full min-h-[480px]">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-sm">Faculty Management Directory Matrix</h3>
            <p className="text-slate-400 text-[11px] mt-0.5">Click any staff row profile to update or add subject coverage assignments.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="text-slate-400 border-b font-bold uppercase text-[9px] tracking-wider bg-slate-50/20">
                  <th className="p-4 pl-6">Faculty Profile Info</th>
                  <th className="p-4">Primary Classroom Slot</th>
                  <th className="p-4">Subject Multi-Class Allocations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="3" className="text-center py-12 text-slate-400 text-xs font-semibold">
                      Loading system personnel directory matrix...
                    </td>
                  </tr>
                ) : staffList.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center py-12 text-slate-400 text-xs font-semibold">
                      No operational personnel registered for this academic period track.
                    </td>
                  </tr>
                ) : (
                  staffList.map(st => (
                    <tr
                      key={st.id}
                      onClick={() => !localYearLocked && openProfileDrawer(st)}
                      className={`transition duration-150 ${localYearLocked ? '' : 'hover:bg-indigo-50/20 cursor-pointer'} ${selectedStaff?.id === st.id ? 'bg-indigo-50/40' : ''}`}
                    >
                      {/* Column 1: Faculty Profile Info */}
                      <td className="p-4 pl-6">
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${st.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                          {st.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{st.email}</p>
                        <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded mt-1 shadow-sm border ${st.role === 'class_teacher' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : st.role === 'teacher' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-100 border-slate-200 text-slate-500'
                          }`}>{st.role?.replace('_', ' ')}</span>
                      </td>

                      {/* Column 2: Primary Classroom Slot */}
                      <td className="p-4">
                        {st.classroom ? (
                          <span className="inline-flex items-center text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                            👑 {st.classroom.name} — {st.classroom.section}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic font-normal">None Assigned</span>
                        )}
                      </td>

                      {/* Column 3: Subject Multi-Class Allocations */}
                      <td className="p-4">
                        {st.subjects && st.subjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                            {st.subjects.map((sub, sIdx) => (
                              <div
                                key={sIdx}
                                onClick={(e) => { e.stopPropagation(); }} // Block row click selection from firing
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-white border border-indigo-200 px-2 py-0.5 rounded-lg shadow-sm group/chip"
                              >
                                <BookOpen size={10} className="text-indigo-400" />
                                {/* 🚀 FIXED: Displays both target Class Name and Section together clearly! */}
                                <span>
                                  {sub.className || sub.name} — {sub.section}: <span className="text-slate-900 font-extrabold">{sub.subjectName}</span>
                                </span>
                                {!localYearLocked && (
                                  <button
                                    type="button"
                                    onClick={() => handleRevokeSubject(sub.assignmentId)}
                                    className="p-0 border-0 bg-transparent text-slate-400 hover:text-rose-600 transition cursor-pointer ml-0.5 group-hover/chip:scale-105 flex items-center justify-center font-bold"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic font-normal">No Subjects Mapped</span>
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

  // 🚀 HELPER DRAWER POPULATOR: Structures variables cleanly upon row selections
   function openProfileDrawer(st) {
    setSelectedStaff(st);
    setTargetClassId(''); // Clear previous target select inputs to force re-render
    setSubjectName('');
    setMakePrimary(st.role === 'class_teacher');
  }
}