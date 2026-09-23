import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import alertService from '../services/alert.service';
import { useAuth } from '../hooks/useAuth';
import { UserPlus, UploadCloud, FileSpreadsheet, CheckCircle2, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';

export default function ManageStudents() {
  const { currentYearId } = useAuth();
  const fileInputRef = useRef(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [classId, setClassId] = useState('');
  const [classrooms, setClassrooms] = useState([]);

  const [uploading, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchClassrooms();
  }, [currentYearId]);
  useEffect(() => {
    const handleGlobalYearSwitch = () => {
      setClassId('');
      fetchClassrooms();
    };
    window.addEventListener("academic-year-changed", handleGlobalYearSwitch);
    return () => {
      window.removeEventListener("academic-year-changed", handleGlobalYearSwitch);
    };
  }, []);
  const fetchClassrooms = async () => {
    try {
      const res = await API.get('/classrooms', { params: { limit: 'all', academicYearId: currentYearId || '' } });
      const dataEnvelope = res.data;
      const rawClassrooms = dataEnvelope?.records || (Array.isArray(dataEnvelope) ? dataEnvelope : []);
      setClassrooms(rawClassrooms);
    } catch (err) {
      console.error('Failed loading classrooms option choice nodes:', err);
    }
  };
  const handleRegisterStudent = async (e) => {
    e.preventDefault();
    if (!classId) return alertService.error('Missing Selection', 'Please select a destination classroom container first.');

    const currentAdmin = JSON.parse(localStorage.getItem('user'));
    try {
      await API.post('/auth/register', {
        name,
        email,
        password,
        role: 'student',
        classId,
        instituteId: currentAdmin?.instituteId,
        academicYearId: currentYearId
      });
      alertService.success('Student Registered', `Student profile for ${name} provisioned cleanly!`);
      setName('');
      setEmail('');
      setPassword('');
      setClassId('');
    } catch (err) {
      alertService.error('Registration Failed', err.response?.data?.message || 'Failed to onboard student.');
    }
  };

  // 2. 🔥 Drag & Drop Event Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processCsvUpload(e.dataTransfer.files[0]);
    }
  };

  // 3. 🔥 Processing Multi-part CSV Form Upload Pipeline
  const processCsvUpload = async (file) => {
    if (!classId) {
      return alertService.error('Classroom Missing', 'Please select the destination Classroom dropdown filter code before importing a CSV spreadsheet file.');
    }

    if (!file.name.endsWith('.csv')) {
      return alertService.error('Invalid Format', 'Only verified standard .csv tabular spreadsheet entries are accepted.');
    }

    // Clear visual feedback: Fire a background loading screen blocking overlay while processing parses rows
    Swal.fire({
      title: 'Parsing Roster Sheet',
      html: 'Validating email constraints and mapping cells. Please wait...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('classId', classId);

    try {
      // The interceptor automatically appends the active academicYearId into this outbound query url
      const res = await API.post('/users/students/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      Swal.close();
      await alertService.success('Import Successful', res.data.message || 'Roster records onboarded successfully.');
      if (fileInputRef.current) fileInputRef.current.value = ""; // Clear file anchor value context
    } catch (err) {
      Swal.close();
      alertService.error('Bulk Import Failed', err.response?.data?.message || 'The data engine encountered a layout formatting mismatch inside your sheet records.');
    }
  };

  return (
    <div className="space-y-6 w-full text-slate-800">

      {/* 🚀 Dynamic Overview Control Header Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Student Enrollment Desk
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Enroll new single freshman profiles or drop complete multi-row roster templates natively.</p>
        </div>

        {/* Global Unified Classroom Destination Selection Dropdown Code */}
        <div className="w-full sm:w-64">
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition cursor-pointer shadow-sm"
          >
            <option value="">-- Select Destination Class --</option>
            {classrooms.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name} — {cls.section}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 🚀 Unified 2-Column Dashboard Framework Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* 📝 LEFT BLOCK: Your Manual Profile Creation input Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">A. Individual Profile Entry Form</h3>
            <p className="text-[11px] text-slate-400">Onboard a freshman user profile into the selected active educational year.</p>
          </div>

          <form onSubmit={handleRegisterStudent} className="space-y-4">
            <div>
              <label className="block text-slate-600 text-xs font-bold uppercase mb-1.5 tracking-wide">Student Full Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition" />
            </div>

            <div>
              <label className="block text-slate-600 text-xs font-bold uppercase mb-1.5 tracking-wide">Login Email Address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john.doe@school.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition" />
            </div>

            <div>
              <label className="block text-slate-600 text-xs font-bold uppercase mb-1.5 tracking-wide">Security Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition" />
            </div>

            <button type="submit" style={{ backgroundColor: '#4f46e5', color: '#ffffff' }} className="w-full h-11 font-bold text-sm py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center mt-4 cursor-pointer hover:opacity-90 shadow-md shadow-indigo-600/20 border-0">
              <span>Provision Single Student</span>
            </button>
          </form>
        </div>

        {/* 📊 RIGHT BLOCK: Drag-and-Drop CSV Spreadsheets Dropzone Workspace */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-full min-h-[385px] flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">B. Bulk Roster Spreadsheet Import (.csv)</h3>
              <p className="text-[11px] text-slate-400">Upload standard list ledgers to instantly map and register an entire cohort class roster row list.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mt-3 space-y-1.5 text-slate-600 text-xs font-medium">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wide">Required CSV Document Column Order:</p>
              <div className="flex items-center space-x-2 text-indigo-700 bg-indigo-50 border border-indigo-100 p-2 rounded-lg font-mono text-[11px]">
                <span>Name , Email</span>
              </div>
              <p className="text-[10px] text-slate-400 pt-0.5 leading-relaxed">
                💡 Note: Passwords automatically default to <span className="font-bold text-slate-700">Student@123</span>. Students will be prompted to change credentials safely upon their initial login desk sign-in sequence.
              </p>
            </div>
          </div>

          {/* Interactive Drag & Drop Box Section Input Interface Group */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 border-2 border-dashed rounded-2xl mt-4 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-200 group ${dragActive
                ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                : 'border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-slate-50'
              }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files && e.target.files[0] && processCsvUpload(e.target.files[0])}
              className="hidden"
            />

            <span className={`text-2xl mb-2 block transition-transform duration-200 ${dragActive ? 'scale-110' : 'group-hover:-translate-y-0.5'}`}>📁</span>

            <p className="text-xs font-bold text-slate-700">
              {dragActive ? 'Release to drop roster file now' : 'Drag & drop roster spreadsheet here, or click to browse'}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Accepts verified standard .csv data file streams</p>
          </div>

        </div>
      </div>
    </div>
  );
}
