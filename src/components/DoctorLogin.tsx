import React, { useState } from 'react';
import { Stethoscope, Mail, Lock, ArrowLeft, User, Award, Clock, MapPin, DollarSign, BookOpen, Calendar, CheckCircle2 } from 'lucide-react';
import { DoctorUser } from '../types.ts';

interface DoctorLoginProps {
  onBack: () => void;
  onAuthSuccess: (user: DoctorUser) => void;
}

const DEPARTMENTS = [
  'General Medicine',
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Dermatology',
  'ENT',
  'Gastroenterology',
];

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DEFAULT_SLOTS = ['09:00 AM', '10:30 AM', '02:00 PM', '03:30 PM', '05:00 PM'];

export const DoctorLogin: React.FC<DoctorLoginProps> = ({ onBack, onAuthSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('General Medicine');
  const [specialty, setSpecialty] = useState('');
  const [qualification, setQualification] = useState('');
  const [experienceYears, setExperienceYears] = useState('8');
  const [consultationFee, setConsultationFee] = useState('100');
  const [roomNo, setRoomNo] = useState('OPD Suite 201');
  const [bio, setBio] = useState('');
  const [uniqueCases, setUniqueCases] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [selectedSlots, setSelectedSlots] = useState<string[]>(DEFAULT_SLOTS);

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const toggleSlot = (slot: string) => {
    if (selectedSlots.includes(slot)) {
      if (selectedSlots.length > 1) setSelectedSlots(selectedSlots.filter((s) => s !== slot));
    } else {
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/auth/doctor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      onAuthSuccess(data.user);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      const body = {
        name: name.startsWith('Dr.') ? name : `Dr. ${name}`,
        email,
        password,
        department,
        specialty: specialty || `${department} Specialist`,
        qualification: qualification || 'MBBS, MD',
        experienceYears: Number(experienceYears) || 5,
        consultationFee: Number(consultationFee) || 100,
        roomNo: roomNo || 'OPD Clinic',
        bio: bio || `Specialist in ${department} and clinical care.`,
        uniqueCases: uniqueCases || `Specialized treatment and diagnosis for ${department} conditions.`,
        availableDays: selectedDays,
        availableSlots: selectedSlots,
      };

      const res = await fetch('/api/auth/doctor/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Doctor registration failed');
      }
      onAuthSuccess(data.user);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-white">
      <div className="absolute top-8 left-8">
        <button onClick={onBack} className="flex items-center text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-medium text-sm">Back to Home</span>
        </button>
      </div>

      <div className={`w-full mx-auto transition-all duration-300 ${isRegister ? 'max-w-2xl' : 'max-w-md'}`}>
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 mb-4 border border-blue-500/30">
            <Stethoscope className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Doctor Workstation</h2>
          <p className="mt-2 text-sm text-slate-400">
            {isRegister ? 'Register your profile to join the medical roster' : 'Secure access for hospital medical staff'}
          </p>

          {/* Mode Tabs */}
          <div className="mt-6 inline-flex bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setErrorMessage(''); }}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                !isRegister ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In (Existing Doctor)
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setErrorMessage(''); }}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                isRegister ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Register New Doctor
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            {!isRegister && errorMessage.includes('No doctor account') && (
              <button
                onClick={() => setIsRegister(true)}
                className="ml-2 underline font-bold text-red-200 hover:text-white"
              >
                Register Now
              </button>
            )}
          </div>
        )}

        <div className="bg-slate-800/60 p-8 rounded-3xl shadow-xl border border-slate-700/60 backdrop-blur-sm">
          {!isRegister ? (
            /* Sign In Form */
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Institutional Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700 text-white text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-600"
                    placeholder="dr.alex@carepulse.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700 text-white text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-600"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-xs bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all shadow-lg shadow-blue-900/50"
              >
                {loading ? 'Authenticating...' : 'Secure Doctor Sign In'}
              </button>

              <div className="mt-6 pt-4 border-t border-slate-700/50">
                <p className="text-[11px] font-semibold text-slate-400 mb-2">Demo Roster Quick Logins:</p>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => { setLoginEmail('dr.alex@carepulse.com'); setLoginPassword('password'); }}
                    className="px-2.5 py-1 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600/50"
                  >
                    Dr. Alex (Cardiology)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLoginEmail('dr.elena@carepulse.com'); setLoginPassword('password'); }}
                    className="px-2.5 py-1 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600/50"
                  >
                    Dr. Elena (Neurology)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLoginEmail('dr.priya@carepulse.com'); setLoginPassword('password'); }}
                    className="px-2.5 py-1 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600/50"
                  >
                    Dr. Priya (Internal Med)
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Register New Doctor Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Doctor Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-white text-xs focus:border-blue-500 outline-none"
                      placeholder="Dr. Rajesh Sharma"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-white text-xs focus:border-blue-500 outline-none"
                      placeholder="dr.rajesh@lumina.com"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-white text-xs focus:border-blue-500 outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Department *</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-white text-xs focus:border-blue-500 outline-none"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept} className="bg-slate-800 text-white">
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Specialty *</label>
                  <input
                    type="text"
                    required
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-white text-xs focus:border-blue-500 outline-none"
                    placeholder="Interventional Cardiologist"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Qualification</label>
                  <input
                    type="text"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-white text-xs focus:border-blue-500 outline-none"
                    placeholder="MBBS, MD, DM"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Exp. (Years)</label>
                  <input
                    type="number"
                    min="1"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-white text-xs focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Fee (₹)</label>
                  <input
                    type="number"
                    min="50"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-white text-xs focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">OPD Suite / Room</label>
                  <input
                    type="text"
                    value={roomNo}
                    onChange={(e) => setRoomNo(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-white text-xs focus:border-blue-500 outline-none"
                    placeholder="Suite 302"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Doctor Description & Clinical Bio *</label>
                <textarea
                  rows={2}
                  required
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-white text-xs focus:border-blue-500 outline-none"
                  placeholder="Provide a clinical bio, medical background, and areas of interest..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Unique Expertise & Cases Handled *</label>
                <textarea
                  rows={2}
                  required
                  value={uniqueCases}
                  onChange={(e) => setUniqueCases(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-white text-xs focus:border-blue-500 outline-none"
                  placeholder="Describe unique medical conditions, surgical procedures, or cases handled..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Available OPD Days</label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_DAYS.map((day) => {
                    const isSel = selectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                          isSel ? 'bg-blue-600 text-white' : 'bg-slate-900/50 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {day.substring(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Available Time Slots</label>
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_SLOTS.map((slot) => {
                    const isSel = selectedSlots.includes(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => toggleSlot(slot)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                          isSel ? 'bg-blue-600 text-white' : 'bg-slate-900/50 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-white font-bold text-xs bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all shadow-lg shadow-blue-900/50 mt-2"
              >
                {loading ? 'Creating Profile & Logging In...' : 'Register Doctor Profile'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
