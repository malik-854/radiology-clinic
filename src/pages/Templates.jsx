import React, { useState } from 'react';
import { useCollection, fsdb as db } from '../useDb';
import { Settings, Plus, Edit2, X, Save, Trash2, Loader2 } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const Templates = () => {
  const templates = useCollection('templates', []);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [content, setContent] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.target);
    const templateData = {
      title: formData.get('title'),
      type: formData.get('type'),
      content: content,
      updated_at: new Date().toISOString()
    };
    
    try {
      if (editingTemplate && editingTemplate.id) {
        await db.templates.update(editingTemplate.id, templateData);
      } else {
        templateData.created_at = new Date().toISOString();
        await db.templates.add(templateData);
      }
      
      alert("Template saved successfully!");
      setShowModal(false);
      setEditingTemplate(null);
      setContent('');
    } catch (error) {
      console.error(error);
      alert("Error saving template.");
    } finally {
      setIsSaving(false);
    }
  };

  const openEdit = (template) => {
    setEditingTemplate(template);
    setContent(template.content || '');
    setShowModal(true);
  };

  const openNew = () => {
    setEditingTemplate(null);
    setContent('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      await db.templates.delete(id);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Report Templates</h1>
          <p>Create and edit default text for your radiology reports.</p>
        </div>
        <button className="btn-primary" onClick={openNew}>
          <Plus size={18} /> New Template
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {templates?.map(t => (
          <div key={t.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="flex justify-between items-start" style={{ marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem' }}>{t.title}</h3>
                <span className="badge badge-paid" style={{ marginTop: '0.25rem', display: 'inline-block' }}>{t.type}</span>
              </div>
              <div className="flex gap-2">
                <button className="btn-ghost" style={{ padding: '0.4rem' }} onClick={() => openEdit(t)}>
                  <Edit2 size={16} />
                </button>
                <button className="btn-ghost" style={{ padding: '0.4rem', color: 'var(--danger)' }} onClick={() => handleDelete(t.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <pre style={{ 
              fontFamily: 'var(--font-main)', 
              fontSize: '0.85rem', 
              color: 'var(--text-secondary)',
              whiteSpace: 'pre-wrap',
              background: 'rgba(0,0,0,0.2)',
              padding: '1rem',
              borderRadius: '6px',
              flex: 1,
              overflow: 'hidden',
              maxHeight: '150px'
            }}>
              {t.content}
            </pre>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyItems: 'center', zIndex: 50 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', margin: 'auto', background: '#1e293b', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h2>{editingTemplate ? 'Edit Template' : 'New Template'}</h2>
              <button className="btn-ghost" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Template Title</label>
                  <input type="text" name="title" defaultValue={editingTemplate?.title || ''} required placeholder="e.g. Chest X-Ray (Normal)" />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select name="type" defaultValue={editingTemplate?.type || 'X-Ray'}>
                    <option value="X-Ray">X-Ray</option>
                    <option value="Ultrasound">Ultrasound</option>
                    <option value="MRI">MRI</option>
                    <option value="CT Scan">CT Scan</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label>Template Content</label>
                <div style={{ background: 'white', borderRadius: '8px', color: 'black', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <ReactQuill 
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, false] }],
                        [{ 'size': ['small', false, 'large', 'huge'] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        [{ 'align': [] }],
                        ['clean']
                      ]
                    }}
                    placeholder="FINDINGS:..."
                    style={{ flex: 1, minHeight: '300px' }}
                  />
                </div>
                <div style={{ height: '50px' }}></div>
              </div>
              <div className="flex justify-end gap-2" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Templates;
