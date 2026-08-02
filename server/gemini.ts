import dotenv from 'dotenv';
import path from 'path';
import Groq from 'groq-sdk';
import { DoctorUser, SymptomMatchRequest, SymptomMatchResult } from '../src/types.ts';

// Force load .env from the root directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const getAiClient = () => {
  const apiKey = process.env.GROQ_API_KEY?.trim();

  console.log(
    '[DEBUG] Groq API Key Status:',
    apiKey ? `Key Loaded (${apiKey.substring(0, 6)}...)` : 'KEY IS UNDEFINED'
  );

  if (!apiKey) {
    console.warn('[Groq AI] Warning: GROQ_API_KEY is not configured in process.env');
  }

  return new Groq({ apiKey: apiKey || '' });
};

export async function matchDoctorForSymptoms(
  request: SymptomMatchRequest,
  doctors: DoctorUser[]
): Promise<SymptomMatchResult> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const doctorsSummary = doctors.map((doc) => ({
    id: doc.id,
    name: doc.name,
    department: doc.department,
    specialty: doc.specialty,
    uniqueCases: doc.uniqueCases,
    experienceYears: doc.experienceYears,
    availableDays: doc.availableDays,
    availableSlots: doc.availableSlots,
  }));

  const systemPrompt = `You are Lumina Health AI, a world-class Clinical Triage & Specialist Matching Agent.
Your objective is to analyze a patient's symptoms and select the best doctor from the active hospital roster.

CRITICAL INSTRUCTIONS:
1. Examine symptoms, age, and gender.
2. Select the SINGLE BEST matching doctor from the provided roster.
3. Select ONE valid time slot EXACTLY as it appears in the doctor's "availableSlots" array.
4. Assess urgency level ('Low' | 'Moderate' | 'High' | 'Emergency').
5. You MUST return ONLY a valid JSON object matching this exact JSON structure:

{
  "suggestedSpecialty": "string",
  "suggestedDepartment": "string",
  "urgencyLevel": "Low" | "Moderate" | "High" | "Emergency",
  "reasoning": "detailed explanation",
  "recommendedDoctorId": "string",
  "recommendedDoctorName": "string",
  "recommendedDoctorSpecialty": "string",
  "recommendedDoctorDepartment": "string",
  "suggestedDate": "YYYY-MM-DD",
  "suggestedTimeSlot": "string",
  "matchConfidence": number
}

Active Doctors Roster:
${JSON.stringify(doctorsSummary, null, 2)}`;

  const userPrompt = `Patient Details:
- Age: ${request.patientAge}
- Gender: ${request.patientGender}
- Symptoms: "${request.symptomText}"
${request.painScale ? `- Pain Level: ${request.painScale}/10` : ''}
${request.durationDays ? `- Duration: ${request.durationDays} days` : ''}

Analyze symptoms and return the structured recommendation JSON.`;

  try {
    const groq = getAiClient();
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const jsonText = completion.choices[0]?.message?.content?.trim();
    if (jsonText) {
      const parsed = JSON.parse(jsonText) as SymptomMatchResult;
      const targetDoctor = doctors.find((d) => d.id === parsed.recommendedDoctorId) || doctors[0];

      return {
        ...parsed,
        recommendedDoctorId: targetDoctor.id,
        recommendedDoctorName: targetDoctor.name,
        recommendedDoctorSpecialty: targetDoctor.specialty,
        recommendedDoctorDepartment: targetDoctor.department,
        suggestedDate: parsed.suggestedDate || defaultDateStr,
        suggestedTimeSlot: targetDoctor.availableSlots.includes(parsed.suggestedTimeSlot || '')
          ? parsed.suggestedTimeSlot
          : targetDoctor.availableSlots[0] || '10:00 AM',
      };
    }
  } catch (err) {
    console.error('[Groq AI] Error generating doctor match:', err);
  }

  return fallbackSymptomMatcher(request, doctors, defaultDateStr);
}

function fallbackSymptomMatcher(
  request: SymptomMatchRequest,
  doctors: DoctorUser[],
  defaultDateStr: string
): SymptomMatchResult {
  const text = request.symptomText.toLowerCase();

  let matchedDept = 'General Medicine';
  let reasoningText = 'Matched with Internal Medicine for general evaluation based on overall symptom description.';

  if (text.includes('chest') || text.includes('heart') || text.includes('palpitation') || text.includes('cardio') || text.includes('blood pressure')) {
    matchedDept = 'Cardiology';
    reasoningText = 'Matched with Cardiology specialist due to cardiovascular indicators such as chest tightness or heart symptoms.';
  } else if (text.includes('headache') || text.includes('migraine') || text.includes('seizure') || text.includes('dizzy') || text.includes('numb') || text.includes('brain')) {
    matchedDept = 'Neurology';
    reasoningText = 'Assigned to Neurology due to neurological symptoms including cranial pressure, migraines, or dizziness.';
  } else if (text.includes('bone') || text.includes('joint') || text.includes('knee') || text.includes('fracture') || text.includes('back pain') || text.includes('shoulder')) {
    matchedDept = 'Orthopedics';
    reasoningText = 'Referred to Orthopedics specialist for musculoskeletal evaluation of joints, bones, or structural pain.';
  } else if (text.includes('child') || text.includes('baby') || text.includes('infant') || request.patientAge < 16) {
    matchedDept = 'Pediatrics';
    reasoningText = 'Assigned to Pediatrics for specialized age-appropriate juvenile healthcare.';
  } else if (text.includes('skin') || text.includes('rash') || text.includes('acne') || text.includes('itching') || text.includes('eczema')) {
    matchedDept = 'Dermatology';
    reasoningText = 'Referred to Dermatology for targeted dermatological assessment of skin condition/rash.';
  } else if (text.includes('throat') || text.includes('ear') || text.includes('sinus') || text.includes('nose') || text.includes('hearing')) {
    matchedDept = 'ENT';
    reasoningText = 'Assigned to Ear, Nose, & Throat specialist for otorhinolaryngological evaluation.';
  } else if (text.includes('stomach') || text.includes('digestion') || text.includes('acid') || text.includes('liver') || text.includes('vomit') || text.includes('gut')) {
    matchedDept = 'Gastroenterology';
    reasoningText = 'Matched with Gastroenterology for digestive tract and abdominal pain analysis.';
  }

  const doctor = doctors.find((d) => d.department.toLowerCase() === matchedDept.toLowerCase()) || doctors[0];

  return {
    suggestedSpecialty: doctor.specialty,
    suggestedDepartment: doctor.department,
    urgencyLevel: text.includes('severe') || text.includes('chest') || (request.painScale && request.painScale >= 8) ? 'High' : 'Moderate',
    reasoning: reasoningText,
    recommendedDoctorId: doctor.id,
    recommendedDoctorName: doctor.name,
    recommendedDoctorSpecialty: doctor.specialty,
    recommendedDoctorDepartment: doctor.department,
    suggestedDate: defaultDateStr,
    suggestedTimeSlot: doctor.availableSlots[0] || '10:00 AM',
    matchConfidence: 92,
  };
}