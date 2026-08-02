import { DoctorUser, PatientUser, Appointment, MedicalRecord } from '../src/types';
import { INITIAL_DOCTORS, INITIAL_PATIENTS, INITIAL_APPOINTMENTS, INITIAL_MEDICAL_RECORDS } from '../src/lib/mockData';
import initialDbJson from '../carepulse_db.json';

interface DBState {
  doctors: DoctorUser[];
  patients: PatientUser[];
  appointments: Appointment[];
  medicalRecords: MedicalRecord[];
}

class DatabaseStore {
  private state: DBState;

  constructor() {
    // Load directly from imported JSON file or fallback mock data
    if (initialDbJson && Array.isArray(initialDbJson.doctors) && Array.isArray(initialDbJson.patients)) {
      // Clone memory state to avoid mutating original import
      this.state = JSON.parse(JSON.stringify(initialDbJson));
    } else {
      this.state = {
        doctors: [...INITIAL_DOCTORS],
        patients: [...INITIAL_PATIENTS],
        appointments: [...INITIAL_APPOINTMENTS],
        medicalRecords: [...INITIAL_MEDICAL_RECORDS],
      };
    }
  }

  // --- Doctor Methods ---
  public getDoctors(): DoctorUser[] {
    return this.state.doctors;
  }

  public getDoctorById(id: string): DoctorUser | undefined {
    return this.state.doctors.find((d) => d.id === id);
  }

  public getDoctorByEmail(email: string): DoctorUser | undefined {
    return this.state.doctors.find((d) => d.email.toLowerCase() === email.toLowerCase());
  }

  public createDoctor(data: Omit<DoctorUser, 'id' | 'role' | 'rating'>): DoctorUser {
    const existing = this.getDoctorByEmail(data.email);
    if (existing) {
      throw new Error('A doctor with this email address already exists.');
    }

    const newDoctor: DoctorUser = {
      ...data,
      id: `doc-${Date.now()}`,
      role: 'doctor',
      rating: 5.0,
      availableDays: data.availableDays?.length ? data.availableDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      availableSlots: data.availableSlots?.length ? data.availableSlots : ['09:00 AM', '10:30 AM', '02:00 PM', '03:30 PM'],
      avatarUrl: data.avatarUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
    };

    this.state.doctors.push(newDoctor);
    return newDoctor;
  }

  public updateDoctorProfile(id: string, updates: Partial<DoctorUser>): DoctorUser {
    const idx = this.state.doctors.findIndex((d) => d.id === id);
    if (idx === -1) {
      throw new Error('Doctor not found');
    }

    this.state.doctors[idx] = {
      ...this.state.doctors[idx],
      ...updates,
    };

    return this.state.doctors[idx];
  }

  // --- Patient Methods ---
  public getPatients(): PatientUser[] {
    return this.state.patients;
  }

  public getPatientById(id: string): PatientUser | undefined {
    return this.state.patients.find((p) => p.id === id);
  }

  public getPatientByEmail(email: string): PatientUser | undefined {
    return this.state.patients.find((p) => p.email.toLowerCase() === email.toLowerCase());
  }

  public createPatient(data: Omit<PatientUser, 'id' | 'role'>): PatientUser {
    const existing = this.getPatientByEmail(data.email);
    if (existing) {
      return existing;
    }

    const newPatient: PatientUser = {
      ...data,
      id: `pat-${Date.now()}`,
      role: 'patient',
    };

    this.state.patients.push(newPatient);
    return newPatient;
  }

  // --- Appointment Methods ---
  public getAppointments(): Appointment[] {
    return this.state.appointments;
  }

  public getAppointmentsForPatient(patientId: string): Appointment[] {
    return this.state.appointments.filter((a) => a.patientId === patientId);
  }

  public getAppointmentsForDoctor(doctorId: string): Appointment[] {
    return this.state.appointments.filter((a) => a.doctorId === doctorId);
  }

  public createAppointment(data: {
    patientId: string;
    patientName: string;
    patientAge: number;
    patientGender: string;
    patientEmail: string;
    doctorId: string;
    appointmentDate: string;
    timeSlot: string;
    symptoms: string;
    severity?: 'Low' | 'Moderate' | 'High' | 'Emergency';
    aiMatchReasoning?: string;
  }): Appointment {
    const doctor = this.getDoctorById(data.doctorId);
    if (!doctor) {
      throw new Error('Selected doctor does not exist.');
    }

    const existingBooking = this.state.appointments.find(
      (a) =>
        a.doctorId === data.doctorId &&
        a.appointmentDate === data.appointmentDate &&
        a.timeSlot === data.timeSlot &&
        a.status === 'scheduled'
    );

    if (existingBooking) {
      throw new Error(
        `Doctor ${doctor.name} already has an appointment booked at ${data.timeSlot} on ${data.appointmentDate}. Please choose another slot.`
      );
    }

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      patientId: data.patientId,
      patientName: data.patientName,
      patientAge: data.patientAge,
      patientGender: data.patientGender,
      patientEmail: data.patientEmail,
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty,
      doctorDepartment: doctor.department,
      appointmentDate: data.appointmentDate,
      timeSlot: data.timeSlot,
      symptoms: data.symptoms,
      severity: data.severity || 'Moderate',
      aiMatchReasoning: data.aiMatchReasoning,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    };

    this.state.appointments.unshift(newApt);
    return newApt;
  }

  public updateAppointmentStatus(id: string, status: 'scheduled' | 'completed' | 'cancelled'): Appointment {
    const apt = this.state.appointments.find((a) => a.id === id);
    if (!apt) {
      throw new Error('Appointment not found');
    }
    apt.status = status;
    return apt;
  }

  // --- Medical History Methods ---
  public getMedicalRecordsForPatient(patientId: string): MedicalRecord[] {
    return this.state.medicalRecords.filter((m) => m.patientId === patientId);
  }

  public addMedicalRecord(record: Omit<MedicalRecord, 'id' | 'createdAt'>): MedicalRecord {
    const newRecord: MedicalRecord = {
      ...record,
      id: `med-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    this.state.medicalRecords.unshift(newRecord);

    if (record.appointmentId) {
      const apt = this.state.appointments.find((a) => a.id === record.appointmentId);
      if (apt) {
        apt.status = 'completed';
      }
    }

    return newRecord;
  }
}

export const dbStore = new DatabaseStore();