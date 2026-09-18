import React, { useState, useEffect } from 'react';
import API from '../services/api';
import alertService from '../services/alert.service';
import PaginationBar from '../components/PaginationBar';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, Plus, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function SuperAdminSchools() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const res = await API.get('/institutes', {
        params: { search, page: currentPage, limit: 5 }
      });
      setSchools(res.data.records || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
      alertService.error('Fetch Error', 'Could not retrieve global institute registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, [search, currentPage]);

  const handleToggleStatus = async (schoolId, currentStatus, name) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const actionLabel = nextStatus === 'inactive' ? 'Yes, suspend it!' : 'Yes, reactivate!';
    
    const confirmed = await alertService.confirm(
      `Change status for ${name}?`,
      nextStatus === 'inactive' ? 'Suspended workspaces block all nested logins.' : 'This will reactivate school panel permissions.',
      actionLabel
    );

    if (confirmed) {
      try {
        await API.put(`/institutes/${schoolId}/status`, { status: nextStatus });
        alertService.success('Status Mutated', `Institute workspace set to ${nextStatus}.`);
        fetchSchools();
      } catch (err) {
        alertService.error('Action Failed', 'Could not apply status configuration updates.');
      }
    }
  };

  return (
    <div className="w-full space-y-6 text-slate-800">
      
      {/* Search Filter Header Action Panel Box */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search size={16} />
          </span>
          <input 
            type="text" 
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} 
            placeholder="Search school workspaces by name..." 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800 transition" 
          />
        </div>

        {/* Redirect button to the dedicated onboarding form */}
        <button 
          onClick={() => navigate('/institutes/onboard')}
          style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
          className="w-full sm:w-auto h-11 px-5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 border-0 shadow-md cursor-pointer hover:opacity-95 transition"
        >
          <Plus size={16} style={{ color: '#ffffff' }} />
          <span style={{ color: '#ffffff' }}>Onboard New School</span>
        </button>
      </div>

      {/* Main School Registry Data Sheet View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4">
        <div className="p-4 border-b font-bold text-slate-800 bg-slate-50/50 flex items-center space-x-2 mb-2 rounded-xl">
          <Building2 size={18} className="text-indigo-600" />
          <span>Global Registered Multi-Tenant Schools Ledger</span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="text-slate-400 border-b font-bold uppercase text-[10px] tracking-wider bg-slate-50/10">
                <th className="p-4 pl-6">School Tenant Name</th>
                <th className="p-4">Workspace Root Identifier ID</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Operations Desk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && schools.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-10 text-slate-400 font-medium">Synchronizing school nodes...</td></tr>
              ) : schools.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-10 text-slate-400 font-medium">No school spaces discovered matching parameters.</td></tr>
              ) : schools.map(school => (
                <tr key={school.id} className="hover:bg-slate-50/40 transition">
                  <td className="p-4 pl-6">
                    <p className="font-bold text-slate-900">{school.name}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{school.email}</p>
                  </td>
                  <td className="p-4 text-slate-500 font-mono text-xs select-all">{school.id}</td>
                  <td className="p-4">
                    <span style={school.status === 'active' ? { backgroundColor: '#e6f4ea', color: '#137333' } : { backgroundColor: '#fce8e6', color: '#c5221f' }} className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase">
                      {school.status}
                    </span>
                  </td>
                  <td className="p-4 text-right pr-6">
                    <button
                      onClick={() => handleToggleStatus(school.id, school.status, school.name)}
                      style={school.status === 'active' ? { backgroundColor: '#fee2e2', color: '#991b1b' } : { backgroundColor: '#e2e8f0', color: '#334155' }}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border-0 cursor-pointer shadow-sm transition"
                    >
                      {school.status === 'active' ? 'Suspend' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <PaginationBar currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

    </div>
  );
}
