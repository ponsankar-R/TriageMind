import express, { Request, Response } from 'express';
import cors from 'cors';
import { dbStore } from '../server/db';
import { matchDoctorForSymptoms } from '../server/gemini';

const app = express();

app.use(cors());
app.use(express.json());

// --- API Routes ---

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Patient Login / Register
app.post('/api/auth/patient/login', (req: Request, res: Response) => {
  try {
    const { email, name, age, gender } = req.body;
    if (!email) return res.status(400).json({ error: 'Email address is required.' });

    let patient = dbStore.getPatientByEmail(email);
    if (!patient) {
      if (!name) return res.status(400).json({ error: 'User not found. Please register first.' });
      patient = dbStore.createPatient({ email, name, age: Number(age) || 30, gender: gender || 'Other' });
    }

    res.json({ user: patient, token: `token-${patient.id}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Authentication error' });
  }
});

app.post('/api/auth/patient/register', (req: Request, res: Response) => {
  try {
    const { email, name, age, gender, phone, bloodGroup, allergies } = req.body;
    if (!email || !name) return res.status(400).json({ error: 'Name and Email are required.' });

    const patient = dbStore.createPatient({
      email,
      name,
      age: Number(age) || 30,
      gender: gender || 'Unspecified',
      phone,
      bloodGroup,
      allergies: Array.isArray(allergies) ? allergies : [],
    });

    res.json({ user: patient, token: `token-${patient.id}` });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

// Doctor Login / Register
app.post('/api/auth/doctor/login', (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Doctor email address is required.' });

    const doctor = dbStore.getDoctorByEmail(email);
    if (!doctor) return res.status(404).json({ error: `No doctor account found with email '${email}'.` });

    res.json({ user: doctor, token: `token-${doctor.id}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Doctor login error' });
  }
});

app.post('/api/auth/doctor/register', (req: Request, res: Response) => {
  try {
    const { email, name, department, specialty, qualification, experienceYears, uniqueCases, consultationFee, availableDays, availableSlots, bio, roomNo, avatarUrl } = req.body;
    if (!email || !name || !department || !specialty) {
      return res.status(400).json({ error: 'Name, Email, Department, and Specialty are required.' });
    }

    const doctor = dbStore.createDoctor({
      email,
      name,
      department,
      specialty,
      qualification: qualification || 'MBBS, MD',
      experienceYears: Number(experienceYears) || 5,
      uniqueCases: uniqueCases || 'Specialized clinical care.',
      consultationFee: Number(consultationFee) || 100,
      availableDays: Array.isArray(availableDays) && availableDays.length ? availableDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      availableSlots: Array.isArray(availableSlots) && availableSlots.length ? availableSlots : ['09:00 AM', '10:30 AM', '02:00 PM', '03:30 PM'],
      bio: bio || `Specialist in ${department} and ${specialty}.`,
      roomNo: roomNo || 'OPD Suite 101',
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
    });

    res.json({ user: doctor, token: `token-${doctor.id}` });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Doctor registration failed' });
  }
});

// Doctors API
app.get('/api/doctors', (req: Request, res: Response) => {
  try {
    const { department, search } = req.query;
    let doctors = dbStore.getDoctors();

    if (department && typeof department === 'string' && department !== 'All') {
      doctors = doctors.filter((d) => d.department.toLowerCase() === department.toLowerCase());
    }

    if (search && typeof search === 'string') {
      const query = search.toLowerCase();
      doctors = doctors.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          d.department.toLowerCase().includes(query) ||
          d.specialty.toLowerCase().includes(query) ||
          d.uniqueCases.toLowerCase().includes(query)
      );
    }

    res.json(doctors);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/doctors/:id', (req: Request, res: Response) => {
  const doctor = dbStore.getDoctorById(req.params.id);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
  res.json(doctor);
});

app.put('/api/doctors/:id/profile', (req: Request, res: Response) => {
  try {
    const updated = dbStore.updateDoctorProfile(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Appointments API
app.get('/api/appointments', (req: Request, res: Response) => {
  const { patientId, doctorId } = req.query;
  if (patientId && typeof patientId === 'string') return res.json(dbStore.getAppointmentsForPatient(patientId));
  if (doctorId && typeof doctorId === 'string') return res.json(dbStore.getAppointmentsForDoctor(doctorId));
  res.json(dbStore.getAppointments());
});

app.post('/api/appointments/book', (req: Request, res: Response) => {
  try {
    const { patientId, patientName, patientAge, patientGender, patientEmail, doctorId, appointmentDate, timeSlot, symptoms, severity, aiMatchReasoning } = req.body;
    if (!patientId || !doctorId || !appointmentDate || !timeSlot || !symptoms) {
      return res.status(400).json({ error: 'Missing required appointment fields.' });
    }

    const appointment = dbStore.createAppointment({
      patientId,
      patientName: patientName || 'Patient',
      patientAge: Number(patientAge) || 30,
      patientGender: patientGender || 'Unspecified',
      patientEmail: patientEmail || 'patient@example.com',
      doctorId,
      appointmentDate,
      timeSlot,
      symptoms,
      severity,
      aiMatchReasoning,
    });

    res.json(appointment);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to book appointment' });
  }
});

app.patch('/api/appointments/:id/status', (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }
    const updated = dbStore.updateAppointmentStatus(req.params.id, status);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// AI Symptom Matcher API
app.post('/api/ai/symptom-match', async (req: Request, res: Response) => {
  try {
    const { symptomText, patientAge, patientGender, durationDays, painScale } = req.body;
    if (!symptomText) return res.status(400).json({ error: 'Symptom description is required.' });

    const doctors = dbStore.getDoctors();
    const matchResult = await matchDoctorForSymptoms(
      {
        symptomText,
        patientAge: Number(patientAge) || 30,
        patientGender: patientGender || 'Female',
        durationDays: Number(durationDays) || 1,
        painScale: Number(painScale) || 5,
      },
      doctors
    );

    res.json(matchResult);
  } catch (err: any) {
    console.error('[API AI Match Error]:', err);
    res.status(500).json({ error: err.message || 'AI Matching failed' });
  }
});

// Medical History API
app.get('/api/medical-history/:patientId', (req: Request, res: Response) => {
  try {
    res.json(dbStore.getMedicalRecordsForPatient(req.params.patientId));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/medical-history/add', (req: Request, res: Response) => {
  try {
    const { patientId, patientName, doctorId, doctorName, doctorSpecialty, appointmentId, visitDate, diagnosis, symptomsSummary, prescriptions, clinicalNotes, followUpDate, vitals } = req.body;
    if (!patientId || !doctorId || !diagnosis) {
      return res.status(400).json({ error: 'Patient ID, Doctor ID, and Diagnosis are required.' });
    }

    const record = dbStore.addMedicalRecord({
      patientId,
      patientName: patientName || 'Patient',
      doctorId,
      doctorName: doctorName || 'Doctor',
      doctorSpecialty: doctorSpecialty || 'Specialist',
      appointmentId,
      visitDate: visitDate || new Date().toISOString().split('T')[0],
      diagnosis,
      symptomsSummary: symptomsSummary || '',
      prescriptions: Array.isArray(prescriptions) ? prescriptions : [],
      clinicalNotes: clinicalNotes || '',
      followUpDate,
      vitals,
    });

    res.json(record);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to add medical record' });
  }
});

export default app;