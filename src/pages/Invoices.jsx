import React, { useState } from 'react';
import { useCollection, fsdb as db } from '../useDb';
import { orderBy } from 'firebase/firestore';
import { FileSpreadsheet, Search, Plus, CheckCircle, Printer, Trash2, MessageCircle, Eye, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import html2pdf from 'html2pdf.js';

const Invoices = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const allInvoices = useCollection('invoices', [orderBy('updated_at', 'desc')]);
  const allPatients = useCollection('patients', []);
  
  const invoices = React.useMemo(() => {
    if (!allInvoices || !allPatients) return [];
    
    const enriched = allInvoices.map(inv => {
      const p = allPatients.find(patient => patient.id.toString() === inv.patientId?.toString());
      return { ...inv, patientName: p ? p.name : 'Unknown Patient' };
    });
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return enriched.filter(inv => inv.patientName.toLowerCase().includes(query) || inv.details.toLowerCase().includes(query));
    }
    
    return enriched;
  }, [allInvoices, allPatients, searchQuery]);

  const markAsPaid = async (id) => {
    await db.invoices.update(id, {
      status: 'Paid',
      updated_at: new Date().toISOString()
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      await db.invoices.delete(id);
    }
  };

  const getInvoiceHtml = (inv) => `
    <div style="font-family: Arial, sans-serif; padding: 40px; color: black; line-height: 1.6;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px; padding-top: 80px;">
        <div></div>
        <div style="text-align: right;">
          <h1 style="margin: 0; color: #666;">INVOICE</h1>
          <p style="margin: 5px 0 0 0;">INV-${inv.id}00${inv.patientId}</p>
        </div>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div>
          <h3 style="margin: 0 0 10px 0;">Bill To:</h3>
          <p style="margin: 0; font-size: 16px;"><strong>${inv.patientName}</strong></p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0;"><strong>Date:</strong> ${new Date(inv.created_at).toLocaleDateString()}</p>
          <p style="margin: 5px 0 0 0;"><strong>Status:</strong> ${inv.status}</p>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Description</th>
            <th style="padding: 12px; text-align: right; border-bottom: 1px solid #ddd;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #ddd;">${inv.details}</td>
            <td style="padding: 12px; text-align: right; border-bottom: 1px solid #ddd;">Rs ${parseFloat(inv.amount).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      
      <div style="text-align: right; margin-top: 20px;">
        <h2 style="margin: 0;">Total: Rs ${parseFloat(inv.amount).toFixed(2)}</h2>
      </div>
    </div>
  `;

  const handleWhatsApp = (inv) => {
    const element = document.createElement('div');
    element.innerHTML = getInvoiceHtml(inv);
    
    const filename = `Invoice_${inv.patientName.replace(/ /g, '_')}.pdf`;
    const opt = {
      margin:       0.5,
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).toPdf().get('pdf').then(pdf => {
      const blob = pdf.output('blob');
      const file = new File([blob], filename, { type: 'application/pdf' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
          files: [file],
          title: filename,
          text: `Invoice for ${inv.patientName}`
        }).catch(err => console.log('Share canceled', err));
      } else {
        pdf.save(filename);
        alert("Since you are on a computer, websites cannot automatically attach files to WhatsApp. The PDF has been downloaded. Press OK to open WhatsApp, then manually attach the file.");
        window.open(`https://wa.me/?text=Please%20find%20the%20attached%20radiology%20invoice%20for%20${encodeURIComponent(inv.patientName)}.`, '_blank');
      }
    });
  };

  const handleView = (inv) => {
    const element = document.createElement('div');
    element.innerHTML = getInvoiceHtml(inv);
    const opt = { margin: 0.5, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } };
    html2pdf().set(opt).from(element).toPdf().get('pdf').then(pdf => {
      const dataUri = pdf.output('datauristring');
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html style="margin:0; height:100%;">
            <body style="margin:0; height:100%; overflow:hidden;">
              <embed src="${dataUri}" type="application/pdf" width="100%" height="100%" />
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Invoices & Payments</h1>
          <p>Track payments and issue patient invoices.</p>
        </div>
        <Link to="/invoices/new" className="btn-accent">
          <Plus size={18} /> New Invoice
        </Link>
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <div className="flex items-center gap-2" style={{ background: 'rgba(15,23,42,0.6)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
          <Search size={20} style={{ color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search invoices by patient or details..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}
          />
        </div>
      </div>

      <div className="glass-panel">
        {invoices && invoices.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Details</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 500, color: 'white' }}>
                    <Link to={`/patients/${inv.patientId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {inv.patientName}
                    </Link>
                  </td>
                  <td>{inv.details}</td>
                  <td style={{ fontWeight: 600 }}>Rs {parseFloat(inv.amount).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${inv.status === 'Paid' ? 'badge-paid' : 'badge-pending'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      {inv.status !== 'Paid' && (
                        <button className="btn-ghost" style={{ padding: '0.3rem', color: 'var(--accent)' }} onClick={() => markAsPaid(inv.id)} title="Mark as Paid">
                          <CheckCircle size={18} />
                        </button>
                      )}
                      <Link to={`/invoices/new?invoiceId=${inv.id}`} className="btn-ghost" style={{ padding: '0.3rem', color: 'var(--text-primary)' }} title="Edit Invoice">
                        <Edit2 size={18} />
                      </Link>
                      <button className="btn-ghost" style={{ padding: '0.3rem', color: 'var(--primary)' }} title="View Invoice" onClick={() => handleView(inv)}>
                        <Eye size={18} />
                      </button>
                      <button className="btn-ghost" style={{ padding: '0.3rem' }} title="Print Invoice" onClick={() => {
                        const printContent = getInvoiceHtml(inv);
                        const element = document.createElement('div');
                        element.innerHTML = printContent;
                        const opt = {
                          margin:       0.5,
                          filename:     `Invoice_${inv.patientName.replace(/ /g, '_')}.pdf`,
                          image:        { type: 'jpeg', quality: 0.98 },
                          html2canvas:  { scale: 2 },
                          jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
                        };
                        html2pdf().set(opt).from(element).save();
                      }}>
                        <Printer size={18} />
                      </button>
                      <button className="btn-ghost" style={{ padding: '0.3rem', color: 'var(--accent)' }} title="Send WhatsApp" onClick={() => handleWhatsApp(inv)}>
                        <MessageCircle size={18} />
                      </button>
                      <button className="btn-ghost" style={{ padding: '0.3rem', color: 'var(--danger)' }} title="Delete Invoice" onClick={() => handleDelete(inv.id)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ textAlign: 'center', padding: '2rem' }}>No invoices found.</p>
        )}
      </div>
    </div>
  );
};

export default Invoices;
