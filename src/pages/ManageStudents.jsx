import React, { useState, useEffect } from 'react';
import API from '../services/api';
import alertService from '../services/alert.service';

export default function ManageStudents() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [classId, setClassId] = useState('');
  const [classrooms, setClassrooms] = useState([]); // Stores dynamic class options

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      // ⚡ Request limit='all' to bypass pagination constraints for the dropdown selector layout
      const res = await API.get('/classrooms', { params: { limit: 'all' } });
      const dataEnvelope = res.data;

      // ⚡ CRITICAL FIX: Extract the classrooms records array explicitly, falling back to an empty array
      const rawClassrooms = dataEnvelope?.records || (Array.isArray(dataEnvelope) ? dataEnvelope : []);
      setClassrooms(rawClassrooms);
      
    } catch (err) {
      console.error('Failed loading classrooms option choice nodes:', err);
      alertService.error('Fetch Failure', 'Could not load classroom nodes for assignment dropdown options.');
    }
  };

  const handleRegisterStudent = async (e) => {
    e.preventDefault();
    if (!classId) return alertService.error('Missing Selection', 'Please create a classroom first.');

    const currentAdmin = JSON.parse(localStorage.getItem('user'));

    try {
      await API.post('/auth/register', {
        name,
        email,
        password,
        role: 'student',
        classId, // Ties student directly to the selected database classroom UUID
        instituteId: currentAdmin?.instituteId
      });
      alertService.success('Student Registered', `Student profile for ${name} provisioned cleanly!`);
      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      alertService.error('Registration Failed', err.response?.data?.message || 'Failed to onboard student.');
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        
        <div className="pb-4 mb-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-lg tracking-tight">Onboard New Student Account</h3>
          <p className="text-slate-400 text-xs mt-0.5">Register individual student profile items into dynamic classrooms</p>
        </div>

        <form onSubmit={handleRegisterStudent} className="space-y-4">
          <div>
            <label className="block text-slate-600 text-xs font-bold uppercase mb-1.5 tracking-wide">Student Full Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition" />
          </div>

          <div>
            <label className="block text-slate-600 text-xs font-bold uppercase mb-1.5 tracking-wide">Login Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john.doe@school.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition" />
          </div>

          <div>
            <label className="block text-slate-600 text-xs font-bold uppercase mb-1.5 tracking-wide">Class Assignment Code</label>
            {/* ⚡ DROPDOWN UPGRADE: Dynamic select dropdown linking classrooms */}
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition font-medium cursor-pointer"
            >
              {classrooms.length === 0 && <option value="">No classrooms configured yet</option>}
              {classrooms.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} — {cls.section}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 text-xs font-bold uppercase mb-1.5 tracking-wide">Security Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition" />
          </div>

          <button type="submit" style={{ backgroundColor: '#4f46e5', color: '#ffffff' }} className="w-full font-bold text-sm py-3 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 mt-4 cursor-pointer hover:opacity-90 shadow-md shadow-indigo-600/20 border-0">
            <span>Register Student Workspace</span>
          </button>
        </form>
      </div>
    </div>
  );
}
