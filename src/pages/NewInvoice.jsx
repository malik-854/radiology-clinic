import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Save, ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { useCollection, fsdb as db } from '../useDb';
import { orderBy } from 'firebase/firestore';

const NewInvoice = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPatientId = searchParams.get('patient');
  const editInvoiceId = searchParams.get('invoiceId');
  const [isSaving, setIsSaving] = useState(false);

  const [patientId, setPatientId] = useState(initialPatientId || '');
  const [patientSearch, setPatientSearch] = useState('');
  const [amount, setAmount] = useState('');
  const [details, setDetails] = useState('');
  const [status, setStatus] = useState('Pending');
  const [newService, setNewService] = useState('');

  const patients = useCollection('patients', [orderBy('name', 'asc')]);
  const servicesList = useCollection('services', []);

  const filteredPatients = React.useMemo(() => {
    if (!patients) return [];
    return patients.filter(p => 
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) || 
      p.contact.includes(patientSearch)
    );
  }, [patients, patientSearch]);

  useEffect(() => {
    if (editInvoiceId) {
      db.invoices.get(editInvoiceId).then(inv => {
        if (inv) {
          setPatientId(inv.patientId.toString());
          setAmount(inv.amount);
          setDetails(inv.details);
          setStatus(inv.status);
        }
      });
    }
  }, [editInvoiceId]);

  const handleAddService = async () => {
    if (!newService.trim()) return;
    await db.services.add({ name: newService.trim() });
    setDetails(newService.trim());
    setNewService('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!patientId) {
      alert("Please select a patient.");
      return;
    }

    setIsSaving(true);
    const invData = {
      patientId: patientId,
      amount: parseFloat(amount),
      details,
      status,
      updated_at: new Date().toISOString()
    };

    try {
      if (editInvoiceId) {
        await db.invoices.update(editInvoiceId, invData);
      } else {
        invData.created_at = new Date().toISOString();
        await db.invoices.add(invData);
      }

      alert("Invoice saved successfully!");
      navigate('/invoices');
    } catch (error) {
      console.error(error);
      alert("Error saving invoice.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <button className="btn-ghost" style={{ padding: '0.5rem' }} onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>{editInvoiceId ? 'Edit Invoice' : 'Create Invoice'}</h1>
            <p>Generate a bill or record a payment.</p>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Search & Select Patient</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input 
                type="text" 
                placeholder="Type name or number to filter..." 
                value={patientSearch}
                onChange={e => setPatientSearch(e.target.value)}
                style={{ fontSize: '0.85rem', padding: '0.5rem' }}
              />
              <select 
                value={patientId} 
                onChange={e => setPatientId(e.target.value)}
                required
              >
                <option value="">-- {filteredPatients?.length || 0} Patients Found --</option>
                {filteredPatients?.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.contact})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Service Details / Description</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <select 
                value={servicesList?.find(s => s.name === details) ? details : ''} 
                onChange={e => {
                  setDetails(e.target.value);
                  setNewService('');
                }}
                style={{ flex: 1 }}
              >
                <option value="">-- Select a Saved Service --</option>
                {servicesList?.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                value={newService || (servicesList?.find(s => s.name === details) ? '' : details)}
                onChange={e => {
                   setNewService(e.target.value);
                   setDetails(e.target.value);
                }}
                placeholder="Or type a new service here..."
                style={{ flex: 1 }}
                required={!details}
              />
              <button type="button" className="btn-outline" onClick={handleAddService} title="Save to list" style={{ padding: '0 1rem' }}>
                <Plus size={18} /> Add
              </button>
            </div>
          </div>

          <div className="responsive-grid responsive-grid-2" style={{ gap: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Amount (Rs)</label>
              <input 
                type="number" 
                step="0.01"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="150.00"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Payment Status</label>
              <select 
                value={status} 
                onChange={e => setStatus(e.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-4" style={{ marginTop: '1rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={18} /> Save Invoice
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default NewInvoice;
