import React, { useState } from 'react';
import { UserIcon, Mail, Lock, Activity, ArrowLeft } from 'lucide-react';
import { PatientUser } from '../types.ts';

interface PatientLoginProps {
  onBack: () => void;
  onAuthSuccess: (user: PatientUser) => void;
}

export const PatientLogin: React.FC<PatientLoginProps> = ({ onBack, onAuthSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isRegister ? '/api/auth/patient/register' : '/api/auth/patient/login';
      const body = isRegister ? { email, password, name } : { email, password };
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      onAuthSuccess(data.user);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-8 left-8">
        <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-medium text-sm">Back to Home</span>
        </button>
      </div>

      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-10">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-500/30">
            <UserIcon className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Patient Portal</h2>
          <p className="mt-2 text-sm text-slate-500">Sign in to book appointments and view records</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegister && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    placeholder="Sarah Connor"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  placeholder="sarah@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl text-white font-bold bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-500/20"
            >
              {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-8 text-center text-sm text-slate-500">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => setIsRegister(!isRegister)} className="font-bold text-blue-600 hover:text-blue-700 hover:underline outline-none">
              {isRegister ? 'Sign in' : 'Create one'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
