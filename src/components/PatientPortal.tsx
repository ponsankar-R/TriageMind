import React, { useState, useEffect } from 'react';
import { PatientUser, DoctorUser, Appointment, MedicalRecord, SymptomMatchResult } from '../types.ts';
import { DoctorCard } from './DoctorCard.tsx';
import { Sparkles, Calendar, Clock, Stethoscope, FileText, CheckCircle2, AlertTriangle, ShieldCheck, Search, Filter, Plus, Pill, ChevronRight, User, HeartPulse, RefreshCw, X, FileCheck } from 'lucide-react';

interface PatientPortalProps {
  patient: PatientUser;
}

export const PatientPortal: React.FC<PatientPortalProps> = ({ patient }) => {
  const [activeTab, setActiveTab] = useState<'book' | 'appointments' | 'history'>('book');
  const [bookingMode, setBookingMode] = useState<'ai' | 'direct'>('ai');

  // Doctors & Data
  const [doctors, setDoctors] = useState<DoctorUser[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // AI Symptom Form
  const [symptomText, setSymptomText] = useState('');
  const [symptomDuration, setSymptomDuration] = useState(2);
  const [painScale, setPainScale] = useState(5);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<SymptomMatchResult | null>(null);

  // Booking Modal State (for Direct or AI confirmed booking)
  const [bookingDoctor, setBookingDoctor] = useState<DoctorUser | null>(null);
  const [bookingDate, setBookingDate] = useState<string>('');
  const [bookingSlot, setBookingSlot] = useState<string>('');
  const [bookingSymptoms, setBookingSymptoms] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  // Appointments & History State
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [appointmentFilter, setAppointmentFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  // Load doctors
  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const res = await fetch('/api/doctors');
      const data = await res.json();
      if (Array.isArray(data)) setDoctors(data);
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Load patient appointments
  const fetchAppointments = async () => {
    try {
      const res = await fetch(`/api/appointments?patientId=${patient.id}`);
      const data = await res.json();
      if (Array.isArray(data)) setAppointments(data);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    }
  };

  // Load patient medical records
  const fetchMedicalRecords = async () => {
    try {
      const res = await fetch(`/api/medical-history/${patient.id}`);
      const data = await res.json();
      if (Array.isArray(data)) setMedicalRecords(data);
    } catch (err) {
      console.error('Failed to load medical records:', err);
    }
  };

  useEffect(() => {
    fetchDoctors();
    fetchAppointments();
    fetchMedicalRecords();
  }, [patient.id]);

  // Set initial default booking date (tomorrow)
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBookingDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  // Handle AI Symptom Analysis
  const handleAnalyzeSymptoms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomText.trim()) return;

    setIsAnalyzing(true);
    setAiResult(null);
    setBookingSuccess(null);

    try {
      const res = await fetch('/api/ai/symptom-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptomText,
          patientAge: patient.age,
          patientGender: patient.gender,
          durationDays: symptomDuration,
          painScale,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze symptoms');

      setAiResult(data);
      if (data.suggestedDate) setBookingDate(data.suggestedDate);
      if (data.suggestedTimeSlot) setBookingSlot(data.suggestedTimeSlot);
    } catch (err: any) {
      alert(`AI Match Error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Confirm Booking
  const handleConfirmBooking = async (doc: DoctorUser, date: string, slot: string, symptomsStr: string, reasoning?: string, urgency?: any) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          patientName: patient.name,
          patientAge: patient.age,
          patientGender: patient.gender,
          patientEmail: patient.email,
          doctorId: doc.id,
          appointmentDate: date,
          timeSlot: slot,
          symptoms: symptomsStr,
          severity: urgency || 'Moderate',
          aiMatchReasoning: reasoning,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');

      setBookingSuccess(`Appointment successfully booked with ${doc.name} for ${date} at ${slot}!`);
      setBookingDoctor(null);
      setAiResult(null);
      setSymptomText('');
      fetchAppointments();
      setActiveTab('appointments');
    } catch (err: any) {
      alert(`Booking Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel Appointment
  const handleCancelAppointment = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (res.ok) {
        fetchAppointments();
      }
    } catch (err) {
      console.error('Failed to cancel appointment', err);
    }
  };

  const departmentsList = ['All', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology', 'General Medicine', 'ENT', 'Gastroenterology'];

  const filteredDoctors = doctors.filter((doc) => {
    const matchesDept = selectedDepartment === 'All' || doc.department === selectedDepartment;
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.uniqueCases.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const filteredAppointments = appointments.filter((apt) => {
    if (appointmentFilter === 'all') return true;
    return apt.status === appointmentFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Patient Header Banner */}
      <div className="bg-blue-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400 via-blue-200 to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold">
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Patient Dashboard & Health Care</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {patient.name}
            </h1>
            <p className="text-sm text-blue-100/80 max-w-xl">
              Schedule specialist appointments directly or use our AI Symptom Analyzer to match the ideal doctor and available slot.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-xs">
            <div>
              <span className="text-slate-300 block text-[10px] uppercase font-bold tracking-wider">Patient Details</span>
              <span className="font-bold text-white text-sm">{patient.age} Yrs • {patient.gender}</span>
            </div>
            <div className="h-8 w-px bg-white/20"></div>
            <div>
              <span className="text-slate-300 block text-[10px] uppercase font-bold tracking-wider">Blood Group</span>
              <span className="font-bold text-blue-300 text-sm">{patient.bloodGroup || 'A+'}</span>
            </div>
            <div className="h-8 w-px bg-white/20"></div>
            <div>
              <span className="text-slate-300 block text-[10px] uppercase font-bold tracking-wider">Upcoming Visits</span>
              <span className="font-bold text-blue-600 text-sm">
                {appointments.filter((a) => a.status === 'scheduled').length} Scheduled
              </span>
            </div>
          </div>
        </div>
      </div>

      {bookingSuccess && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-sm font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <span>{bookingSuccess}</span>
          </div>
          <button onClick={() => setBookingSuccess(null)} className="text-blue-700 hover:text-blue-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('book')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'book'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Book Appointment</span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'appointments'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>My Appointments ({appointments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Medical History & Prescriptions ({medicalRecords.length})</span>
        </button>
      </div>

      {/* TAB 1: BOOK APPOINTMENT */}
      {activeTab === 'book' && (
        <div className="space-y-6">
          {/* Sub Mode Toggle: AI vs Direct */}
          <div className="flex items-center justify-between bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200 max-w-md">
            <button
              onClick={() => setBookingMode('ai')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                bookingMode === 'ai'
                  ? 'bg-white text-blue-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>AI Symptom Matcher</span>
            </button>

            <button
              onClick={() => setBookingMode('direct')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                bookingMode === 'direct'
                  ? 'bg-white text-blue-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
              <span>Select Doctor Directly</span>
            </button>
          </div>

          {/* AI Symptom Matcher Section */}
          {bookingMode === 'ai' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Symptom Input Form */}
              <div className="lg:col-span-6 bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Smart Clinical Assistant</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Describe Your Symptoms
                  </h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Don't know which specialist to consult? Simply describe what you are feeling. AI will evaluate your symptoms against doctor specialties and automatically assign the right slot.
                  </p>
                </div>

                <form onSubmit={handleAnalyzeSymptoms} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      What symptoms are you experiencing?
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="e.g. Severe throbbing headache on right side, light sensitivity, mild nausea for 2 days..."
                      value={symptomText}
                      onChange={(e) => setSymptomText(e.target.value)}
                      className="w-full p-3 text-xs rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Duration (Days)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={symptomDuration}
                        onChange={(e) => setSymptomDuration(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">
                          Pain Scale (1-10)
                        </label>
                        <span className="text-xs font-bold text-blue-700">{painScale}/10</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={painScale}
                        onChange={(e) => setPainScale(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isAnalyzing || !symptomText.trim()}
                    className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all duration-200 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>AI Triage Analyzing Symptoms...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Analyze Symptoms & Recommend Doctor</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Quick Symptom Chips */}
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-2">Or tap sample symptoms:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSymptomText('Throbbing right-side migraine with photophobia and dizziness for 2 days')}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-800 transition-colors"
                    >
                      Headache & Dizziness
                    </button>
                    <button
                      type="button"
                      onClick={() => setSymptomText('Sharp chest tightness upon walking upstairs, breathlessness')}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-800 transition-colors"
                    >
                      Chest Tightness
                    </button>
                    <button
                      type="button"
                      onClick={() => setSymptomText('Severe knee joint swelling and sharp pain after sports strain')}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-800 transition-colors"
                    >
                      Knee Joint Pain
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Recommendation Output Card */}
              <div className="lg:col-span-6 space-y-4">
                {aiResult ? (
                  <div className="bg-white rounded-2xl p-6 sm:p-7 border border-blue-200 shadow-md space-y-5 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></span>
                        <span className="text-xs font-extrabold uppercase tracking-wider text-blue-800">
                          AI Match Recommendation
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{aiResult.matchConfidence}% Match Confidence</span>
                      </div>
                    </div>

                    {/* Urgency & Department badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        aiResult.urgencyLevel === 'High' || aiResult.urgencyLevel === 'Emergency'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : aiResult.urgencyLevel === 'Moderate'
                          ? 'bg-blue-50 text-blue-600 border-blue-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}>
                        Triage: {aiResult.urgencyLevel} Urgency
                      </span>

                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                        {aiResult.suggestedDepartment} • {aiResult.suggestedSpecialty}
                      </span>
                    </div>

                    {/* AI Reasoning Text */}
                    <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-100/80">
                      <h4 className="text-xs font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>Clinical Matching Reasoning</span>
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {aiResult.reasoning}
                      </p>
                    </div>

                    {/* Recommended Doctor Info */}
                    {(() => {
                      const recDoctor = doctors.find((d) => d.id === aiResult.recommendedDoctorId) || doctors[0];
                      return (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={recDoctor.avatarUrl}
                              alt={recDoctor.name}
                              className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-200"
                            />
                            <div>
                              <h3 className="text-sm font-bold text-slate-900">{recDoctor.name}</h3>
                              <p className="text-xs text-blue-700 font-semibold">{recDoctor.specialty}</p>
                              <p className="text-xs text-slate-500">{recDoctor.qualification}</p>
                            </div>
                          </div>

                          <div className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                            <span className="font-bold text-slate-800 block mb-0.5">Unique Cases Expertise:</span>
                            <span className="line-clamp-2">{recDoctor.uniqueCases}</span>
                          </div>

                          {/* Date & Slot selection */}
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Appointment Date
                              </label>
                              <input
                                type="date"
                                value={bookingDate}
                                onChange={(e) => setBookingDate(e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Preferred Slot
                              </label>
                              <select
                                value={bookingSlot}
                                onChange={(e) => setBookingSlot(e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                              >
                                {recDoctor.availableSlots.map((slot) => (
                                  <option key={slot} value={slot}>
                                    {slot}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() =>
                              handleConfirmBooking(
                                recDoctor,
                                bookingDate,
                                bookingSlot,
                                symptomText,
                                aiResult.reasoning,
                                aiResult.urgencyLevel
                              )
                            }
                            className="w-full mt-3 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Confirm & Auto-Book Appointment</span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-2xl p-8 border border-dashed border-slate-300 text-center space-y-3 h-full flex flex-col justify-center items-center">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">Awaiting Symptom Entry</h3>
                    <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                      Enter your symptoms on the left. AI will cross-reference medical specialties, doctor case histories, and live schedules to assign your appointment.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Direct Doctor Selection */}
          {bookingMode === 'direct' && (
            <div className="space-y-6">
              {/* Department Filters & Search */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search doctor by name, specialty, or unique cases..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Department Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  {departmentsList.map((dept) => (
                    <button
                      key={dept}
                      onClick={() => setSelectedDepartment(dept)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        selectedDepartment === dept
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>

              {/* Doctors Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDoctors.map((doc) => (
                  <DoctorCard
                    key={doc.id}
                    doctor={doc}
                    onBookClick={(doctor) => {
                      setBookingDoctor(doctor);
                      setBookingSlot(doctor.availableSlots[0] || '10:00 AM');
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Your Appointments</h2>
              <p className="text-xs text-slate-500">View upcoming scheduled visits or past consultation history</p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {(['all', 'scheduled', 'completed', 'cancelled'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setAppointmentFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                    appointmentFilter === filter
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-12 text-center border border-dashed border-slate-300">
              <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No Appointments Found</h3>
              <p className="text-xs text-slate-500 mt-1">
                You have no {appointmentFilter !== 'all' ? appointmentFilter : ''} appointments recorded.
              </p>
              <button
                onClick={() => {
                  setActiveTab('book');
                  setBookingMode('ai');
                }}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm hover:bg-blue-700 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Book New Appointment</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAppointments.map((apt) => (
                <div key={apt.id} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                      ID: #{apt.id.slice(-6)}
                    </span>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${
                        apt.status === 'scheduled'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : apt.status === 'completed'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{apt.doctorName}</h3>
                    <p className="text-xs text-blue-700 font-semibold">{apt.doctorSpecialty}</p>
                    <p className="text-xs text-slate-500">{apt.doctorDepartment}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Date</span>
                      <span className="font-bold text-slate-800">{apt.appointmentDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Time Slot</span>
                      <span className="font-bold text-slate-800">{apt.timeSlot}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-slate-800 block mb-0.5">Symptoms Provided:</span>
                    <p className="line-clamp-2 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                      "{apt.symptoms}"
                    </p>
                  </div>

                  {apt.aiMatchReasoning && (
                    <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 text-[11px] text-blue-900">
                      <span className="font-bold block text-blue-800 mb-0.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        AI Clinical Match
                      </span>
                      <span>{apt.aiMatchReasoning}</span>
                    </div>
                  )}

                  {apt.status === 'scheduled' && (
                    <button
                      onClick={() => handleCancelAppointment(apt.id)}
                      className="w-full py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs border border-red-200 transition-colors"
                    >
                      Cancel Appointment
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MEDICAL HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Medical History & Prescriptions</h2>
            <p className="text-xs text-slate-500">Access past consultation records, prescriptions, and physician notes</p>
          </div>

          {medicalRecords.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-12 text-center border border-dashed border-slate-300">
              <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No Medical Records Yet</h3>
              <p className="text-xs text-slate-500 mt-1">
                Completed doctor consultations will automatically populate your medical history here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Record List Sidebar */}
              <div className="lg:col-span-5 space-y-3">
                {medicalRecords.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => setSelectedRecord(rec)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedRecord?.id === rec.id
                        ? 'bg-blue-50 border-blue-300 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">{rec.visitDate}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        Record #{rec.id.slice(-6)}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-800">{rec.diagnosis}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">By {rec.doctorName} ({rec.doctorSpecialty})</p>
                  </div>
                ))}
              </div>

              {/* Record Detail Inspector */}
              <div className="lg:col-span-7">
                {selectedRecord ? (
                  <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                          Official Consultation Summary
                        </span>
                        <h2 className="text-lg font-bold text-slate-900">{selectedRecord.diagnosis}</h2>
                      </div>
                      <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-medium">
                        Visit Date: {selectedRecord.visitDate}
                      </span>
                    </div>

                    {/* Attending Doctor */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                        {selectedRecord.doctorName.charAt(3)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{selectedRecord.doctorName}</h4>
                        <p className="text-xs text-slate-500">{selectedRecord.doctorSpecialty}</p>
                      </div>
                    </div>

                    {/* Vitals Summary */}
                    {selectedRecord.vitals && (
                      <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Blood Pressure</span>
                          <span className="font-bold text-slate-800">{selectedRecord.vitals.bp || '120/80'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Pulse</span>
                          <span className="font-bold text-slate-800">{selectedRecord.vitals.pulse || '72 bpm'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Body Temp</span>
                          <span className="font-bold text-slate-800">{selectedRecord.vitals.temp || '98.6 °F'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Weight</span>
                          <span className="font-bold text-slate-800">{selectedRecord.vitals.weight || '70 kg'}</span>
                        </div>
                      </div>
                    )}

                    {/* Prescriptions Table */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                        <Pill className="w-4 h-4 text-blue-600" />
                        <span>Prescribed Medications</span>
                      </h4>

                      <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-3">Medicine</th>
                              <th className="p-3">Dosage</th>
                              <th className="p-3">Frequency</th>
                              <th className="p-3">Duration</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedRecord.prescriptions.map((p, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-3 font-bold text-slate-800">{p.medicineName}</td>
                                <td className="p-3 text-slate-600">{p.dosage}</td>
                                <td className="p-3 text-slate-600">{p.frequency}</td>
                                <td className="p-3 font-semibold text-blue-700">{p.duration}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Clinical Notes */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <h4 className="text-xs font-bold text-slate-800 mb-1">Physician Clinical Notes:</h4>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {selectedRecord.clinicalNotes}
                      </p>
                    </div>

                    {selectedRecord.followUpDate && (
                      <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-600 flex items-center justify-between">
                        <span className="font-bold">Recommended Follow-up Visit:</span>
                        <span className="font-extrabold">{selectedRecord.followUpDate}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-2xl p-10 text-center border border-dashed border-slate-300">
                    <FileCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Select a consultation record from the left list to inspect detailed prescription & diagnosis.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Booking Direct Doctor Modal */}
      {bookingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Book Appointment</h3>
              <button onClick={() => setBookingDoctor(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <img src={bookingDoctor.avatarUrl} alt={bookingDoctor.name} className="w-12 h-12 rounded-xl object-cover" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">{bookingDoctor.name}</h4>
                <p className="text-xs text-blue-700 font-semibold">{bookingDoctor.specialty}</p>
                <p className="text-[11px] text-slate-500">{bookingDoctor.department}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Appointment Date</label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Available Slot</label>
                <select
                  value={bookingSlot}
                  onChange={(e) => setBookingSlot(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  {bookingDoctor.availableSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Symptoms / Reason for Visit</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe reason for consultation..."
                  value={bookingSymptoms}
                  onChange={(e) => setBookingSymptoms(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <button
                type="button"
                disabled={isSubmitting || !bookingSymptoms.trim()}
                onClick={() =>
                  handleConfirmBooking(bookingDoctor, bookingDate, bookingSlot, bookingSymptoms)
                }
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
              >
                {isSubmitting ? 'Booking...' : 'Confirm Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
