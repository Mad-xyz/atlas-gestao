const fs = require('fs');
const text = fs.readFileSync('src/modules/profile/ProfilePage.jsx', 'utf8');
const lines = text.split('\n');
const newSection = fs.readFileSync('new_section.js', 'utf8');
// remove lines 62 to 261 (0-indexed: 61 to 260 => length 200)
// checking the actual lines in ProfilePage.jsx
// line 61 is ]
// line 62 is // ════════════════════════════════════════════════════════════════
// line 63 is //  PAINEL: MINHA CONTA
// line 64 is // ════════════════════════════════════════════════════════════════
// line 65 is function SectionConta({ user, authUser, activeRole, onUpdateProfile }) {
// ...
// line 259 is     </div>
// line 260 is   )
// line 261 is }
lines.splice(61, 200, newSection);
fs.writeFileSync('src/modules/profile/ProfilePage.jsx', lines.join('\n'), 'utf8');
console.log('done');
