import React, { useState } from 'react';
import { useCollection, fsdb as db } from '../useDb';
import { orderBy } from 'firebase/firestore';
import { Plus, Search, X, Trash2, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Patients = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const allPatients = useCollection('patients', [orderBy('updated_at', 'desc')]);
  const patients = allPatients?.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.contact.includes(searchQuery));

  const handleAddPatient = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const patientData = {
      name: formData.get('name'),
      contact: formData.get('contact'),
      age: formData.get('age'),
      gender: formData.get('gender'),
      updated_at: new Date().toISOString()
    };
    
    if (editingPatient) {
      await db.patients.update(editingPatient.id, patientData);
    } else {
      patientData.created_at = new Date().toISOString();
      await db.patients.add(patientData);
    }
    
    setShowModal(false);
  };

  const openNew = () => {
    setEditingPatient(null);
    setShowModal(true);
  };

  const openEdit = (patient) => {
    setEditingPatient(patient);
    setShowModal(true);
  };

  const handleDeletePatient = async (id) => {
    if (window.confirm("Are you sure you want to delete this patient? All their reports and invoices will also be permanently deleted.")) {
      // NOTE: Associated reports and invoices are kept in the database for now or requires a cloud function to cascade delete
      await db.patients.delete(id);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Patients</h1>
          <p>Manage your patient records and histories.</p>
        </div>
        <button className="btn-primary" onClick={openNew}>
          <Plus size={18} /> Add Patient
        </button>
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <div className="flex items-center gap-2" style={{ background: 'rgba(15,23,42,0.6)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
          <Search size={20} style={{ color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search patients by name or contact..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}
          />
        </div>
      </div>

      <div className="glass-panel">
        {patients && patients.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500, color: 'white' }}>{p.name}</td>
                  <td>{p.contact}</td>
                  <td>{p.age}</td>
                  <td>{p.gender}</td>
                  <td>
                    <div className="flex gap-2">
                      <Link to={`/patients/${p.id}`} className="btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                        Open Record
                      </Link>
                      <button className="btn-ghost" style={{ padding: '0.4rem', color: 'var(--text-primary)' }} onClick={() => openEdit(p)} title="Edit Patient">
                        <Edit2 size={16} />
                      </button>
                      <button className="btn-ghost" style={{ padding: '0.4rem', color: 'var(--danger)' }} onClick={() => handleDeletePatient(p.id)} title="Delete Patient">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ textAlign: 'center', padding: '2rem' }}>No patients found.</p>
        )}
      </div>

    {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', background: '#1e293b' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h2>{editingPatient ? 'Edit Patient' : 'New Patient'}</h2>
              <button className="btn-ghost" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleAddPatient}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" name="name" required placeholder="John Doe" defaultValue={editingPatient?.name || ''} />
              </div>
              <div className="form-group">
                <label>Contact Number</label>
                <input type="text" name="contact" required placeholder="+1 234 567 890" defaultValue={editingPatient?.contact || ''} />
              </div>
              <div className="responsive-grid responsive-grid-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label>Age</label>
                  <input type="number" name="age" required placeholder="35" defaultValue={editingPatient?.age || ''} />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select name="gender" required defaultValue={editingPatient?.gender || 'Male'}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2" style={{ marginTop: '2rem' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingPatient ? 'Save Changes' : 'Save Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;
