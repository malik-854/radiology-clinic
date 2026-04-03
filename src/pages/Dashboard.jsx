import React from 'react';
import { useCollection } from '../useDb';
import { orderBy, limit } from 'firebase/firestore';
import { Users, FileText, FileSpreadsheet, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const patients = useCollection('patients', [orderBy('updated_at', 'desc')]);
  const reports = useCollection('reports', [orderBy('updated_at', 'desc')]);
  const invoices = useCollection('invoices', [orderBy('updated_at', 'desc')]);
  const templates = useCollection('templates', []);

  // One-time seeding of default templates to Firestore
  React.useEffect(() => {
    const seedTemplates = async () => {
      if (templates && templates.length === 0) {
        const defaultTemplates = [
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
          }
        ];
        for (const t of defaultTemplates) {
          await db.templates.add(t);
        }
      }
    };
    seedTemplates();
  }, [templates]);

  const patientCount = patients?.length || 0;
  const reportCount = reports?.length || 0;
  const recentPatients = patients ? patients.slice(0, 5) : [];

  const totalRevenue = invoices?.reduce((acc, curr) => curr.status === 'Paid' ? acc + parseFloat(curr.amount) : acc, 0) || 0;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Welcome, Dr. Umme Habiba</h1>
          <p>Here's an overview of your clinic today.</p>
        </div>
        <div className="flex gap-4">
          <Link to="/patients" className="btn-outline">
            <Plus size={18} /> New Patient
          </Link>
          <Link to="/reports/new" className="btn-primary">
            <FileText size={18} /> Create Report
          </Link>
        </div>
      </div>

      <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel">
          <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--text-secondary)' }}>Total Patients</h3>
            <Users size={24} style={{ color: 'var(--primary)' }} />
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{patientCount || 0}</p>
        </div>
        <div className="glass-panel">
          <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--text-secondary)' }}>Reports Generated</h3>
            <FileText size={24} style={{ color: 'var(--accent)' }} />
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{reportCount || 0}</p>
        </div>
        <div className="glass-panel">
          <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--text-secondary)' }}>Revenue</h3>
            <FileSpreadsheet size={24} style={{ color: 'var(--warn)' }} />
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Rs {totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.5rem' }}>Recent Patients</h2>
        {recentPatients && recentPatients.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Age/Gender</th>
                <th>Last Visit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentPatients.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500, color: 'white' }}>{p.name}</td>
                  <td>{p.contact}</td>
                  <td>{p.age} / {p.gender}</td>
                  <td>{new Date(p.updated_at).toLocaleDateString()}</td>
                  <td>
                    <Link to={`/patients/${p.id}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>View Details</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ textAlign: 'center', padding: '2rem' }}>No patients found. Add a patient to get started.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
