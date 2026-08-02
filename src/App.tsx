import React, { useState, useEffect } from 'react';
import { UserRole, PatientUser, DoctorUser } from './types.ts';
import { Navbar } from './components/Navbar.tsx';
import { PatientPortal } from './components/PatientPortal.tsx';
import { DoctorPortal } from './components/DoctorPortal.tsx';
import { PatientLogin } from './components/PatientLogin.tsx';
import { DoctorLogin } from './components/DoctorLogin.tsx';
import { INITIAL_PATIENTS, INITIAL_DOCTORS } from './lib/mockData.ts';
import { Activity, User as UserIcon, Stethoscope, ArrowRight } from 'lucide-react';

type AppView = 'landing' | 'patient_login' | 'doctor_login' | 'patient_portal' | 'doctor_portal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<PatientUser | DoctorUser | null>(() => {
    try {
      const saved = localStorage.getItem('carepulse_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved user', e);
    }
    return null;
  });

  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (currentUser) {
      return currentUser.role === 'patient' ? 'patient_portal' : 'doctor_portal';
    }
    return 'landing';
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('carepulse_user', JSON.stringify(currentUser));
      setCurrentView(currentUser.role === 'patient' ? 'patient_portal' : 'doctor_portal');
    } else {
      localStorage.removeItem('carepulse_user');
      setCurrentView('landing');
    }
  }, [currentUser]);

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleAuthSuccess = (user: PatientUser | DoctorUser) => {
    setCurrentUser(user);
  };

  // If in a login screen, hide navbar for complete immersion
  if (currentView === 'patient_login') {
    return <PatientLogin onBack={() => setCurrentView('landing')} onAuthSuccess={handleAuthSuccess} />;
  }
  
  if (currentView === 'doctor_login') {
    return <DoctorLogin onBack={() => setCurrentView('landing')} onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased selection:bg-blue-100 selection:text-blue-900">
      {currentView !== 'landing' && (
        <Navbar
          currentUser={currentUser}
          currentRole={currentUser?.role || 'patient'}
          onSwitchPortal={() => {}} // Remove switch portal as they are logged in as specific user
          onLogout={handleLogout}
          onOpenAuthModal={() => {}} // Unused
        />
      )}

      <main className="flex-1 flex flex-col">
        {currentView === 'patient_portal' && currentUser?.role === 'patient' && (
          <PatientPortal patient={currentUser as PatientUser} />
        )}
        
        {currentView === 'doctor_portal' && currentUser?.role === 'doctor' && (
          <DoctorPortal
            doctor={currentUser as DoctorUser}
            onProfileUpdate={(updatedDoctor) => setCurrentUser(updatedDoctor)}
          />
        )}

        {currentView === 'landing' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 mb-8 mx-auto">
              <Activity className="w-8 h-8" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              Lumina Health
            </h1>
            <p className="text-lg text-slate-600 max-w-lg mx-auto mb-12">
              Next-generation clinical triage and patient management system powered by AI.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center w-full max-w-2xl">
              <button 
                onClick={() => setCurrentView('patient_login')}
                className="flex-1 group relative bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                <UserIcon className="w-10 h-10 text-blue-600 mb-6 relative z-10" />
                <h3 className="text-xl font-bold text-slate-900 mb-2 relative z-10">Patient Portal</h3>
                <p className="text-sm text-slate-500 mb-6 relative z-10">Book appointments, view AI symptom analysis, and access medical records.</p>
                <div className="flex items-center text-blue-600 font-semibold text-sm relative z-10 group-hover:translate-x-1 transition-transform">
                  Access Portal <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </button>

              <button 
                onClick={() => setCurrentView('doctor_login')}
                className="flex-1 group relative bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-sm hover:shadow-xl hover:shadow-blue-900/20 hover:border-slate-700 transition-all text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-800 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                <Stethoscope className="w-10 h-10 text-blue-400 mb-6 relative z-10" />
                <h3 className="text-xl font-bold text-white mb-2 relative z-10">Doctor Workstation</h3>
                <p className="text-sm text-slate-400 mb-6 relative z-10">Manage schedule, review AI triage insights, and update patient medical history.</p>
                <div className="flex items-center text-blue-400 font-semibold text-sm relative z-10 group-hover:translate-x-1 transition-transform">
                  Secure Login <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Lumina Health Management System. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>AI Triage Engine Enabled</span>
            <span>•</span>
            <span>HIPAA Compliant UI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
