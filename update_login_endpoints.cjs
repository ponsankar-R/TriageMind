const fs = require('fs');
const path = require('path');

let pLogin = fs.readFileSync(path.join(__dirname, 'src/components/PatientLogin.tsx'), 'utf8');
pLogin = pLogin.replace(/\/api\/auth\/register-patient/g, '/api/auth/patient/register');
pLogin = pLogin.replace(/\/api\/auth\/login-patient/g, '/api/auth/patient/login');
fs.writeFileSync(path.join(__dirname, 'src/components/PatientLogin.tsx'), pLogin, 'utf8');

let dLogin = fs.readFileSync(path.join(__dirname, 'src/components/DoctorLogin.tsx'), 'utf8');
dLogin = dLogin.replace(/\/api\/auth\/login-doctor/g, '/api/auth/doctor/login');
fs.writeFileSync(path.join(__dirname, 'src/components/DoctorLogin.tsx'), dLogin, 'utf8');

console.log('Endpoints updated.');
