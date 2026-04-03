import Dexie from 'dexie';

export const db = new Dexie('RadiologyClinicDB');

db.version(1).stores({
  patients: '++id, name, contact, age, gender, created_at, updated_at', // Patients
  reports: '++id, patientId, templateId, title, content, created_at, updated_at', // Reports
  invoices: '++id, patientId, amount, status, details, created_at, updated_at', // Invoices
  templates: '++id, title, type, content, created_at, updated_at' // Templates
});

db.version(2).stores({
  patients: '++id, name, contact, age, gender, created_at, updated_at',
  reports: '++id, patientId, templateId, title, content, created_at, updated_at',
  invoices: '++id, patientId, amount, status, details, created_at, updated_at',
  templates: '++id, title, type, content, created_at, updated_at',
  services: '++id, name' // New table for predefined invoice services
});

db.on('populate', () => {
  db.templates.bulkAdd([
    {
      title: 'Chest X-Ray (Normal)',
      type: 'X-Ray',
      content: `FINDINGS:\nLungs are clear without focal consolidation, effusion, or pneumothorax.\nCardiomediastinal silhouette is within normal limits.\nBony thorax is intact.\n\nIMPRESSION:\nNormal chest radiograph.`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      title: 'Abdomen Ultrasound (Normal)',
      type: 'Ultrasound',
      content: `FINDINGS:\nLiver: Normal size and echotexture. No focal solid or cystic mass.\nGallbladder: Well distended, wall is not thickened. No gallstones or pericholecystic fluid seen.\nPancreas: Visualized portions are unremarkable.\nSpleen: Normal in size and uniform echotexture.\nKidneys: Both kidneys are normal in size and echotexture. No hydronephrosis or shadowing calculi.\n\nIMPRESSION:\nNormal ultrasound of the abdomen.`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      title: 'Brain MRI (Normal)',
      type: 'MRI',
      content: `FINDINGS:\nThe brain parenchyma demonstrates normal signal intensity. No acute restrict diffusion, mass, or midline shift.\nThe ventricles and basal cisterns are unremarkable.\nThe craniocervical junction is normal.\nNo abnormal intracranial enhancement.\n\nIMPRESSION:\nUnremarkable MRI of the brain.`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);
});
