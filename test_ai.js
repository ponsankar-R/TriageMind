import { matchDoctorForSymptoms } from './server/gemini.ts';
import { INITIAL_DOCTORS } from './src/lib/mockData.ts';
import 'dotenv/config';

(async () => {
  const req = {
    patientAge: 30,
    patientGender: 'Male',
    symptomText: 'I have a very bad headache and feel dizzy.',
    painScale: 7,
    durationDays: 2
  };
  console.log('Testing AI match...');
  const res = await matchDoctorForSymptoms(req, INITIAL_DOCTORS);
  console.log('Result:', res);
})();
