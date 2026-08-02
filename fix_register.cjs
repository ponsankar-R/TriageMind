const fs = require('fs');
const path = require('path');

let serverCode = fs.readFileSync(path.join(__dirname, 'server.ts'), 'utf8');

// For patient register
serverCode = serverCode.replace(
  `if (!email || !name || !age || !gender) {
        return res.status(400).json({ error: 'Name, Age, Gender, and Email ID are required for patient registration.' });
      }`,
  `if (!email || !name) {
        return res.status(400).json({ error: 'Name and Email are required for registration.' });
      }`
);

serverCode = serverCode.replace(
  `age: Number(age),
        gender,`,
  `age: Number(age) || 30,
        gender: gender || 'Unspecified',`
);

// For patient login auto-register
serverCode = serverCode.replace(
  `if (!name || !age || !gender) {
          return res.status(400).json({ error: 'New patient registration requires Name, Age, and Gender.' });
        }`,
  `if (!name) {
          return res.status(400).json({ error: 'User not found. Please register first.' });
        }`
);

fs.writeFileSync(path.join(__dirname, 'server.ts'), serverCode, 'utf8');
console.log('Fixed server.ts');
