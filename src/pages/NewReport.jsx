import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import { useCollection, fsdb as db } from '../useDb';

const NewReport = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPatientId = searchParams.get('patient');
  const editReportId = searchParams.get('reportId');

  const [patientId, setPatientId] = useState(initialPatientId || '');
  const [templateId, setTemplateId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const patients = useCollection('patients', []);
  const templates = useCollection('templates', []);

  useEffect(() => {
    if (editReportId) {
      db.reports.get(editReportId).then(report => {
        if (report) {
          setPatientId(report.patientId.toString());
          setTitle(report.title);
          setContent(report.content);
        }
      });
    }
  }, [editReportId]);

  useEffect(() => {
    if (templateId && templates && !editReportId) {
      const template = templates.find(t => t.id.toString() === templateId);
      if (template) {
        setTitle(template.title);
        setContent(template.content);
      }
    }
  }, [templateId, templates, editReportId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!patientId) {
      alert("Please select a patient.");
      return;
    }

    const reportData = {
      patientId: patientId,
      templateId: templateId || null,
      title,
      content,
      updated_at: new Date().toISOString()
    };

    let reportId;
    if (editReportId) {
      await db.reports.update(editReportId, reportData);
      reportId = editReportId;
    } else {
      reportData.created_at = new Date().toISOString();
      reportId = await db.reports.add(reportData);
    }

    navigate(`/reports?id=${reportId}`);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <button className="btn-ghost" style={{ padding: '0.5rem' }} onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>{editReportId ? 'Edit Report' : 'Create New Report'}</h1>
            <p>Generate a diagnosis report using templates.</p>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="responsive-grid responsive-grid-2" style={{ gap: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Select Patient</label>
              <select 
                value={patientId} 
                onChange={e => setPatientId(e.target.value)}
                required
              >
                <option value="">-- Select a Patient --</option>
                {patients?.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.contact})</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Apply Template (Optional)</label>
              <select 
                value={templateId} 
                onChange={e => setTemplateId(e.target.value)}
              >
                <option value="">-- Start Blank --</option>
                {templates?.map(t => (
                  <option key={t.id} value={t.id}>{t.title} ({t.type})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Report Title / Examination</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. MRI Brain with Contrast"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label>Findings and Impression</label>
            <textarea 
              required
              value={content}
              onChange={e => setContent(e.target.value)}
              style={{ minHeight: '400px', resize: 'vertical', fontFamily: 'monospace', fontSize: '1rem' }}
              placeholder="Type report here..."
            />
          </div>

          <div className="flex justify-end gap-4" style={{ marginTop: '1rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
            {editReportId && (
              <button 
                type="button" 
                className="btn-accent" 
                onClick={async () => {
                  if (!patientId) {
                    alert("Please select a patient.");
                    return;
                  }
                  const reportData = {
                    patientId: patientId,
                    templateId: templateId || null,
                    title,
                    content,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  };
                  const newReportId = await db.reports.add(reportData);
                  navigate(`/reports?id=${newReportId}`);
                }}
              >
                <Save size={18} /> Save as New
              </button>
            )}
            <button type="submit" className="btn-primary">
              <Save size={18} /> {editReportId ? 'Update Report' : 'Save & View Report'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default NewReport;
