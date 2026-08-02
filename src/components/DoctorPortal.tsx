import React, { useState, useEffect } from 'react';
import { DoctorUser, Appointment, MedicalRecord, PrescriptionItem } from '../types.ts';
import { Stethoscope, Calendar, Clock, User, Award, CheckCircle2, FileText, Plus, Trash2, Edit3, HeartPulse, UserCheck, Activity, Save, X, Sparkles, Pill } from 'lucide-react';

interface DoctorPortalProps {
  doctor: DoctorUser;
  onProfileUpdate: (updatedDoctor: DoctorUser) => void;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({ doctor, onProfileUpdate }) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'profile'>('queue');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingApts, setLoadingApts] = useState(false);

  // Consultation Modal State
  const [consultingApt, setConsultingApt] = useState<Appointment | null>(null);
  const [patientHistory, setPatientHistory] = useState<MedicalRecord[]>([]);

  // Consultation Form State
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [vitals, setVitals] = useState({
    bp: '120/80',
    pulse: '72 bpm',
    temp: '98.6 °F',
    weight: '70 kg',
  });

  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([
    {
      id: 'rx-1',
      medicineName: '',
      dosage: '1 Tablet',
      frequency: 'Twice daily after meals',
      duration: '5 Days',
      instructions: 'Take with plenty of water',
    },
  ]);

  const [isSubmittingRecord, setIsSubmittingRecord] = useState(false);

  // Profile Editor Form State
  const [profileForm, setProfileForm] = useState({
    name: doctor.name,
    department: doctor.department,
    specialty: doctor.specialty,
    qualification: doctor.qualification,
    experienceYears: doctor.experienceYears,
    uniqueCases: doctor.uniqueCases,
    consultationFee: doctor.consultationFee,
    bio: doctor.bio,
    availableSlotsStr: doctor.availableSlots.join(', '),
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  const fetchDoctorAppointments = async () => {
    setLoadingApts(true);
    try {
      const res = await fetch(`/api/appointments?doctorId=${doctor.id}`);
      const data = await res.json();
      if (Array.isArray(data)) setAppointments(data);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoadingApts(false);
    }
  };

  useEffect(() => {
    fetchDoctorAppointments();
  }, [doctor.id]);

  // Open Consultation Workspace for patient
  const handleOpenConsultation = async (apt: Appointment) => {
    setConsultingApt(apt);
    setDiagnosis('');
    setClinicalNotes('');
    setFollowUpDate('');
    setPrescriptions([
      {
        id: `rx-${Date.now()}`,
        medicineName: '',
        dosage: '1 Tablet',
        frequency: 'Twice daily after meals',
        duration: '5 Days',
        instructions: 'Take with plenty of water',
      },
    ]);

    // Fetch patient's past medical history
    try {
      const res = await fetch(`/api/medical-history/${apt.patientId}`);
      const data = await res.json();
      if (Array.isArray(data)) setPatientHistory(data);
    } catch (err) {
      console.error('Failed to fetch patient history', err);
    }
  };

  // Prescription Form Row Handlers
  const handleAddPrescriptionRow = () => {
    setPrescriptions([
      ...prescriptions,
      {
        id: `rx-${Date.now()}`,
        medicineName: '',
        dosage: '1 Tablet',
        frequency: 'Twice daily after meals',
        duration: '5 Days',
        instructions: '',
      },
    ]);
  };

  const handleRemovePrescriptionRow = (id: string) => {
    setPrescriptions(prescriptions.filter((p) => p.id !== id));
  };

  const handleUpdatePrescription = (id: string, field: keyof PrescriptionItem, val: string) => {
    setPrescriptions(
      prescriptions.map((p) => (p.id === id ? { ...p, [field]: val } : p))
    );
  };

  // Submit Consultation Record
  const handleSubmitConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultingApt || !diagnosis.trim()) return;

    setIsSubmittingRecord(true);
    try {
      const validPrescriptions = prescriptions.filter((p) => p.medicineName.trim() !== '');

      const res = await fetch('/api/medical-history/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: consultingApt.patientId,
          patientName: consultingApt.patientName,
          doctorId: doctor.id,
          doctorName: doctor.name,
          doctorSpecialty: doctor.specialty,
          appointmentId: consultingApt.id,
          visitDate: consultingApt.appointmentDate,
          diagnosis,
          symptomsSummary: consultingApt.symptoms,
          prescriptions: validPrescriptions,
          clinicalNotes,
          followUpDate,
          vitals,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to record medical history');
      }

      setConsultingApt(null);
      fetchDoctorAppointments();
      alert('Medical Record & Prescription successfully added and appointment completed!');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmittingRecord(false);
    }
  };

  // Save Doctor Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSaveSuccess(false);

    try {
      const slots = profileForm.availableSlotsStr
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const res = await fetch(`/api/doctors/${doctor.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileForm.name,
          department: profileForm.department,
          specialty: profileForm.specialty,
          qualification: profileForm.qualification,
          experienceYears: Number(profileForm.experienceYears),
          uniqueCases: profileForm.uniqueCases,
          consultationFee: Number(profileForm.consultationFee),
          bio: profileForm.bio,
          availableSlots: slots.length ? slots : doctor.availableSlots,
        }),
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || 'Failed to update profile');

      onProfileUpdate(updated);
      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Profile Save Error: ${err.message}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const pendingAppointments = appointments.filter((a) => a.status === 'scheduled');
  const completedAppointments = appointments.filter((a) => a.status === 'completed');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Doctor Header & Stats */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <img
              src={doctor.avatarUrl}
              alt={doctor.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-400 shadow-md flex-shrink-0"
            />
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold">
                <Stethoscope className="w-3.5 h-3.5" />
                <span>{doctor.department} Department</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">{doctor.name}</h1>
              <p className="text-xs text-blue-200 font-medium">{doctor.specialty} • {doctor.qualification}</p>
              <p className="text-xs text-slate-400 line-clamp-1 max-w-lg mt-1">{doctor.uniqueCases}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 text-center">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Scheduled Queue</span>
              <span className="text-lg font-bold text-blue-600">{pendingAppointments.length}</span>
            </div>
            <div className="border-x border-slate-700 px-2">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Completed</span>
              <span className="text-lg font-bold text-blue-400">{completedAppointments.length}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Consult Fee</span>
              <span className="text-lg font-bold text-white">₹{doctor.consultationFee}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'queue'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Patient Appointments & Schedule ({appointments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'profile'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Edit Profile & Unique Cases</span>
        </button>
      </div>

      {/* TAB 1: SCHEDULE & PATIENT QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Your Consultation Queue</h2>
              <p className="text-xs text-slate-500">Patients scheduled directly or matched via AI Triage</p>
            </div>
            <button
              onClick={fetchDoctorAppointments}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span>Refresh Schedule</span>
            </button>
          </div>

          {appointments.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-12 text-center border border-dashed border-slate-300">
              <UserCheck className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No Patient Appointments</h3>
              <p className="text-xs text-slate-500 mt-1">
                Appointments booked by patients will automatically appear in your queue.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {appointments.map((apt) => (
                <div key={apt.id} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Apt #{apt.id.slice(-6)}
                      </span>
                      <span
                        className={`text-xs font-bold px-3 py-0.5 rounded-full capitalize ${
                          apt.status === 'scheduled'
                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                            : apt.status === 'completed'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                        {apt.patientName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{apt.patientName}</h3>
                        <p className="text-xs text-slate-500">
                          {apt.patientAge} Yrs • {apt.patientGender}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Date</span>
                        <span className="font-bold text-slate-800">{apt.appointmentDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Slot</span>
                        <span className="font-bold text-slate-800">{apt.timeSlot}</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 bg-slate-50/60 p-3 rounded-2xl border border-slate-100">
                      <span className="font-bold text-slate-800 block mb-0.5">Reported Symptoms:</span>
                      <p className="line-clamp-2">"{apt.symptoms}"</p>
                    </div>

                    {apt.aiMatchReasoning && (
                      <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-[11px] text-blue-900">
                        <span className="font-bold block text-blue-800 mb-0.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-blue-600" />
                          AI Match Insight
                        </span>
                        <span className="line-clamp-2">{apt.aiMatchReasoning}</span>
                      </div>
                    )}
                  </div>

                  {apt.status === 'scheduled' && (
                    <button
                      onClick={() => handleOpenConsultation(apt)}
                      className="w-full mt-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <Stethoscope className="w-4 h-4 text-blue-400" />
                      <span>Start Consultation Workspace</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EDIT DOCTOR PROFILE & UNIQUE CASES */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm max-w-3xl space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Edit Doctor Profile & Medical Credentials</h2>
            <p className="text-xs text-slate-500">
              Update your department, specialty, unique cases handled, and available working slots.
            </p>
          </div>

          {profileSaveSuccess && (
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>Doctor profile & unique cases updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={profileForm.department}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Specialty</label>
                <input
                  type="text"
                  required
                  value={profileForm.specialty}
                  onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Qualifications</label>
                <input
                  type="text"
                  required
                  value={profileForm.qualification}
                  onChange={(e) => setProfileForm({ ...profileForm, qualification: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Experience (Years)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={profileForm.experienceYears}
                  onChange={(e) => setProfileForm({ ...profileForm, experienceYears: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Consultation Fee (₹)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={profileForm.consultationFee}
                  onChange={(e) => setProfileForm({ ...profileForm, consultationFee: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-blue-600" />
                <span>Unique Cases Handled & Notable Achievements</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Describe specialized procedures, complex surgeries, unique cases managed..."
                value={profileForm.uniqueCases}
                onChange={(e) => setProfileForm({ ...profileForm, uniqueCases: e.target.value })}
                className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Available Appointment Slots (Comma Separated)
              </label>
              <input
                type="text"
                required
                value={profileForm.availableSlotsStr}
                onChange={(e) => setProfileForm({ ...profileForm, availableSlotsStr: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Example: 09:00 AM, 10:30 AM, 02:00 PM, 03:30 PM</p>
            </div>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="py-3 px-6 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>
      )}

      {/* DOCTOR CONSULTATION WORKSPACE MODAL */}
      {consultingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-3xl w-full my-8 space-y-6 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-extrabold text-blue-700 uppercase tracking-wider block">
                  Patient Consultation Workspace
                </span>
                <h2 className="text-lg font-bold text-slate-900">
                  {consultingApt.patientName} ({consultingApt.patientAge} Yrs, {consultingApt.patientGender})
                </h2>
              </div>
              <button onClick={() => setConsultingApt(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient Info & Chief Complaint */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Reported Symptoms / Reason for Visit:</span>
              <p className="text-xs text-slate-700 leading-relaxed">"{consultingApt.symptoms}"</p>
            </div>

            {/* Past Medical History Timeline */}
            {patientHistory.length > 0 && (
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/80 space-y-2">
                <span className="text-xs font-bold text-blue-900 block flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Patient Prior Medical History ({patientHistory.length} Past Visits)</span>
                </span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto text-xs pr-1">
                  {patientHistory.map((h) => (
                    <div key={h.id} className="p-2 bg-white rounded-xl border border-blue-100 text-slate-700">
                      <div className="font-bold text-slate-900">{h.diagnosis} ({h.visitDate})</div>
                      <div className="text-[11px] text-slate-500">Doctor: {h.doctorName}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form to Record Diagnosis & Prescriptions */}
            <form onSubmit={handleSubmitConsultation} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Clinical Diagnosis <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute Migraine / Mild Angina / Allergic Rhinitis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Vitals */}
              <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">BP (mmHg)</label>
                  <input
                    type="text"
                    value={vitals.bp}
                    onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                    className="w-full p-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pulse</label>
                  <input
                    type="text"
                    value={vitals.pulse}
                    onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                    className="w-full p-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Temp</label>
                  <input
                    type="text"
                    value={vitals.temp}
                    onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                    className="w-full p-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Weight</label>
                  <input
                    type="text"
                    value={vitals.weight}
                    onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                    className="w-full p-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* Prescriptions Form Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-blue-600" />
                    <span>Prescribed Medications</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleAddPrescriptionRow}
                    className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Medicine</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {prescriptions.map((p) => (
                    <div key={p.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div className="col-span-4">
                        <input
                          type="text"
                          placeholder="Medicine Name"
                          value={p.medicineName}
                          onChange={(e) => handleUpdatePrescription(p.id, 'medicineName', e.target.value)}
                          className="w-full p-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="Dosage (500mg)"
                          value={p.dosage}
                          onChange={(e) => handleUpdatePrescription(p.id, 'dosage', e.target.value)}
                          className="w-full p-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="Frequency (Twice daily)"
                          value={p.frequency}
                          onChange={(e) => handleUpdatePrescription(p.id, 'frequency', e.target.value)}
                          className="w-full p-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="Duration (5 Days)"
                          value={p.duration}
                          onChange={(e) => handleUpdatePrescription(p.id, 'duration', e.target.value)}
                          className="w-full p-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        {prescriptions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePrescriptionRow(p.id)}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clinical Notes & Follow-up */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Physician Clinical Notes</label>
                <textarea
                  rows={3}
                  placeholder="Clinical observations, lifestyle recommendations, dietary advice..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Recommended Follow-up Date (Optional)</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingRecord || !diagnosis.trim()}
                className="w-full py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmittingRecord ? 'Saving Record...' : 'Complete Consultation & Add Record'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
