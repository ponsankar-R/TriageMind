export type UserRole = 'patient' | 'doctor';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface PatientUser extends User {
  role: 'patient';
  age: number;
  gender: string;
  phone?: string;
  bloodGroup?: string;
  allergies?: string[];
}

export interface DoctorUser extends User {
  role: 'doctor';
  department: string;
  specialty: string;
  qualification: string;
  experienceYears: number;
  uniqueCases: string;
  consultationFee: number;
  rating: number;
  availableDays: string[];
  availableSlots: string[];
  bio: string;
  roomNo?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientEmail: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorDepartment: string;
  appointmentDate: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "09:30 AM"
  symptoms: string;
  severity?: 'Low' | 'Moderate' | 'High' | 'Emergency';
  aiMatchReasoning?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface PrescriptionItem {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string; // e.g. "Twice daily after meals"
  duration: string; // e.g. "5 Days"
  instructions?: string;
}

export interface Vitals {
  bp?: string; // e.g. "120/80 mmHg"
  pulse?: string; // e.g. "72 bpm"
  temp?: string; // e.g. "98.6 °F"
  weight?: string; // e.g. "68 kg"
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  appointmentId?: string;
  visitDate: string;
  diagnosis: string;
  symptomsSummary: string;
  prescriptions: PrescriptionItem[];
  clinicalNotes: string;
  followUpDate?: string;
  vitals?: Vitals;
  createdAt: string;
}

export interface SymptomMatchRequest {
  symptomText: string;
  patientAge: number;
  patientGender: string;
  durationDays?: number;
  painScale?: number;
}

export interface SymptomMatchResult {
  suggestedSpecialty: string;
  suggestedDepartment: string;
  urgencyLevel: 'Low' | 'Moderate' | 'High' | 'Emergency';
  reasoning: string;
  recommendedDoctorId: string;
  recommendedDoctorName: string;
  recommendedDoctorSpecialty: string;
  recommendedDoctorDepartment: string;
  suggestedDate: string;
  suggestedTimeSlot: string;
  matchConfidence: number; // e.g. 95%
}

export interface AuthState {
  user: PatientUser | DoctorUser | null;
  token: string | null;
}
