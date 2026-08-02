const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'server/gemini.ts');
let content = fs.readFileSync(file, 'utf8');

// Replace system prompt text
content = content.replace(/CarePulse AI/g, 'Lumina Health AI');

// After parsing, enforce available slots validation
const fallbackStr = `suggestedTimeSlot: parsed.suggestedTimeSlot || targetDoctor.availableSlots[0] || '10:00 AM'`;
const newFallbackStr = `suggestedTimeSlot: targetDoctor.availableSlots.includes(parsed.suggestedTimeSlot || '') ? parsed.suggestedTimeSlot : (targetDoctor.availableSlots[0] || '10:00 AM')`;
content = content.replace(fallbackStr, newFallbackStr);

fs.writeFileSync(file, content, 'utf8');
console.log('Gemini prompt fixed.');
