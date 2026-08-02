const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/components/DoctorCard.tsx',
  'src/components/PatientPortal.tsx',
  'src/components/DoctorPortal.tsx',
  'src/lib/mockData.ts',
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');

  // Replace ${doctor.consultationFee} with ₹{doctor.consultationFee} -> Wait, it is in JSX, so it's probably <span>${doctor.consultationFee}</span>
  // Let's replace >$ with >₹
  content = content.replace(/>\$/g, '>₹');
  content = content.replace(/> \$/g, '> ₹');
  
  // also look for text instances like Fee: $
  content = content.replace(/Fee: \$/g, 'Fee: ₹');
  content = content.replace(/Fee \$/g, 'Fee ₹');
  
  // DoctorPortal.tsx has <span className="text-lg font-bold text-white">${doctor.consultationFee}</span>
  
  fs.writeFileSync(filePath, content, 'utf8');
});
console.log('Currency updated.');
