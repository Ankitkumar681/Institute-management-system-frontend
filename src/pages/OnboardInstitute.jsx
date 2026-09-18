import React, { useState } from 'react';
import API from '../services/api';
import alertService from '../services/alert.service';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, ShieldAlert } from 'lucide-react';

export default function OnboardInstitute() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', adminName: '', adminEmail: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.adminName || !formData.adminEmail) {
      return alertService.error('Validation Missing', 'Please fill out all mandatory onboarding property fields.');
    }
    setSubmitting(true);
    try {
      // 🚀 Submits parameters to your tenant creation endpoint handler channels
      await API.post('/institutes', formData);
      await alertService.success('Tenant Boarded', `"${formData.name}" workspace container built successfully!`);
      navigate('/institutes'); // Force redirect straight back onto your clean schools ledger
    } catch (err) {
      console.error(err);
      alertService.error('Enrollment Failure', err.response?.data?.message || 'Error executing onboarding registration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 text-slate-800">
      
      {/* Back button action header row banner */}
      <button 
        onClick={() => navigate('/institutes')}
        className="flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-indigo-600 transition bg-transparent border-0 cursor-pointer p-0"
      >
        <ArrowLeft size={14} />
        <span>Return to Schools Ledger</span>
      </button>

      {/* Creation form workspace control panel box layout */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="pb-4 border-b flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 shadow-inner">
            <Building2 size={20} />
          </div>
          <div>
            <h3 className="font-black text-slate-800 text-lg tracking-tight">Onboard New Multi-Tenant School</h3>
            <p className="text-slate-400 text-xs mt-0.5">Provision a clean database container scope environment for a new institution</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Section A: Institutional Core Schema Parameters mapping */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">A. Institutional Profile Parameters</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 text-xs font-bold uppercase mb-1.5">School Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., St. Xavier's Academy" 
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition" 
                />
              </div>
              <div>
                <label className="block text-slate-600 text-xs font-bold uppercase mb-1.5">Official Institute Email Address</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g., contact@stxaviers.com" 
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-indigo-500 transition" 
                />
              </div>
            </div>
          </div>

          {/* Section B: Root Administrative Account Credentials seeder mapping */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">B. Master Administrator Account (Institute Admin)</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 text-xs font-bold uppercase mb-1.5">Admin Full Name</label>
                <input 
                  type="text" 
                  value={formData.adminName} 
                  onChange={(e) => setFormData(prev => ({ ...prev, adminName: e.target.value }))}
                  placeholder="e.g., Principal John Doe" 
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition" 
                />
              </div>
              <div>
                <label className="block text-slate-600 text-xs font-bold uppercase mb-1.5">Admin Security Login Email</label>
                <input 
                  type="email" 
                  value={formData.adminEmail} 
                  onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
                  placeholder="e.g., admin.xavier@system.com" 
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-indigo-500 transition" 
                />
              </div>
            </div>
            <div className="text-[11px] text-slate-400 font-medium flex items-center mt-1">
              <ShieldAlert size={12} className="text-amber-500 mr-1 shrink-0" />
              <span>A secure, auto-generated master password will be emailed straight to this login credential link address.</span>
            </div>
          </div>

          {/* Action Trigger Buttons Desk panel control elements footer */}
          <div className="flex items-center justify-end space-x-2 pt-2">
            <button 
              type="button" 
              onClick={() => navigate('/institutes')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl cursor-pointer transition border-0"
            >
              Cancel Setup
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
              className="px-6 py-2.5 rounded-xl font-bold text-sm border-0 cursor-pointer shadow-md hover:opacity-95 transition disabled:opacity-50"
            >
              <span>{submitting ? 'Provisioning Environment...' : 'Commit Onboarding Build'}</span>
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
