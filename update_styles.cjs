const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/App.tsx',
  'src/components/Navbar.tsx',
  'src/components/AuthModal.tsx',
  'src/components/PatientPortal.tsx',
  'src/components/DoctorPortal.tsx',
  'src/components/DoctorCard.tsx'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');

  // Replace names
  content = content.replace(/CarePulse/g, 'Lumina Health');
  content = content.replace(/Smart Clinical & Patient Care/g, '');

  // Replace gradients
  content = content.replace(/bg-gradient-to-tr from-emerald-\d+ to-teal-\d+/g, 'bg-blue-600');
  content = content.replace(/bg-gradient-to-r from-slate-900 via-teal-900 to-emerald-800 bg-clip-text text-transparent/g, 'text-slate-800 uppercase');
  content = content.replace(/bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700/g, 'bg-blue-600 hover:bg-blue-700');
  content = content.replace(/bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900/g, 'bg-blue-600');
  content = content.replace(/bg-\[radial-gradient\([^)]+\)\] from-teal-400 via-emerald-200 to-transparent/g, 'bg-white/10');

  // Replace colors
  content = content.replace(/emerald-/g, 'blue-');
  content = content.replace(/teal-/g, 'blue-');
  
  // Specific styling tweaks to match the theme
  // Rounded corners
  content = content.replace(/rounded-3xl/g, 'rounded-2xl');
  content = content.replace(/rounded-full bg-blue-100 text-blue-800 tracking-wider/g, 'rounded bg-blue-50 text-blue-600');

  // Remove amber background and text and replace with blue or slate
  content = content.replace(/text-amber-\d+/g, 'text-blue-600');
  content = content.replace(/bg-amber-\d+/g, 'bg-blue-50');
  content = content.replace(/border-amber-\d+/g, 'border-blue-200');
  content = content.replace(/fill-amber-\d+/g, 'fill-blue-500');

  fs.writeFileSync(filePath, content, 'utf8');
});
console.log('Styles updated.');
