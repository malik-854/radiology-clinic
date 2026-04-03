const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'pages');
const files = ['Invoices.jsx', 'NewInvoice.jsx', 'NewReport.jsx', 'PatientDetails.jsx', 'Reports.jsx', 'Templates.jsx'];

files.forEach(file => {
  let content = fs.readFileSync(path.join(srcDir, file), 'utf8');
  
  // Replace imports
  content = content.replace(/import\s*\{\s*useLiveQuery\s*\}\s*from\s*'dexie-react-hooks';/, '');
  content = content.replace(/import\s*\{\s*db\s*\}\s*from\s*'\.\.\/db';/, `import { useCollection, useDocument, fsdb as db } from '../useDb';\nimport { orderBy, where } from 'firebase/firestore';`);
  
  // Replace useLiveQuery calls
  content = content.replace(/useLiveQuery\(\s*async\s*\(\)\s*=>\s*\{\s*let\s*allInvoices\s*=\s*await\s*db\.invoices\.reverse\(\)\.toArray\(\);\w*\s*/g,
    `const [allInvoices] = useState([]); // This needs manual fix. `); // Too complex

  fs.writeFileSync(path.join(srcDir, file), content, 'utf8');
});
console.log('Done');
