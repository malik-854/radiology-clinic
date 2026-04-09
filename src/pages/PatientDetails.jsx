import React, { useState } from 'react';
import { useCollection, useDocument, fsdb as db } from '../useDb';
import { orderBy, where } from 'firebase/firestore';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, FileSpreadsheet, Calendar, User, Trash2, MessageCircle, Eye, Edit2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const PatientDetails = () => {
  const { id } = useParams();
  const patientId = id;

  const patient = useDocument('patients', patientId);
  const reports = useCollection('reports', [where('patientId', '==', patientId), orderBy('updated_at', 'desc')]);
  const invoices = useCollection('invoices', [where('patientId', '==', patientId), orderBy('updated_at', 'desc')]);

  const getReportHtml = (report) => `
    <div style="font-family: Arial, sans-serif; padding: 0 40px 40px 40px; color: black; line-height: 1.6;">
      <div style="height: 0px; margin-bottom: 0px;">
        <!-- Space for pre-printed letterhead managed by global margin -->
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px; background: #f3f4f6; padding: 15px; border-radius: 8px;">
        <div>
          <p style="margin: 0;"><strong>Patient Name:</strong> ${patient?.name}</p>
          <p style="margin: 5px 0 0 0;"><strong>Report Date:</strong> ${new Date(report.created_at).toLocaleDateString()}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0;"><strong>Examination:</strong> ${report.title}</p>
          <p style="margin: 5px 0 0 0;"><strong>Report ID:</strong> RAD-${report.id.substring(0, 8).toUpperCase()}</p>
        </div>
      </div>
      <div style="min-height: 400px; font-size: 16px;">
        <div style="font-family: Arial, sans-serif;">${report.content}</div>
      </div>
      <div style="margin-top: 50px; text-align: right; border-top: 1px solid #ccc; padding-top: 20px;">
        <p style="margin: 0;"><strong>Dr. Umme Habiba</strong></p>
        <p style="margin: 0; font-size: 12px; color: #666;">MBBS; MD Radiology</p>
      </div>
    </div>
  `;

  const getInvoiceHtml = (inv) => `
    <div style="font-family: Arial, sans-serif; padding: 40px; color: black; line-height: 1.6;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px; padding-top: 80px;">
        <div></div>
        <div style="text-align: right;">
          <h1 style="margin: 0; color: #666;">INVOICE</h1>
          <p style="margin: 5px 0 0 0;">INV-${inv.id.substring(0, 8).toUpperCase()}</p>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div>
          <h3 style="margin: 0 0 10px 0;">Bill To:</h3>
          <p style="margin: 0; font-size: 16px;"><strong>${patient?.name}</strong></p>
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

  const handleDeleteReport = async (id) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      await db.reports.delete(id);
    }
  };

  const handleWhatsAppReport = (report) => {
    const element = document.createElement('div');
    element.innerHTML = getReportHtml(report);
    const filename = `Report_${patient?.name.replace(/ /g, '_')}.pdf`;
    const opt = { margin: [1.3, 0.5, 0.5, 0.5], filename, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } };
    
    html2pdf().set(opt).from(element).toPdf().get('pdf').then(pdf => {
      const file = new File([pdf.output('blob')], filename, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: filename, text: `Report for ${patient?.name}` }).catch(console.error);
      } else {
        pdf.save(filename);
        alert("Since you are on a computer, websites cannot automatically attach files to WhatsApp. The PDF has been downloaded. Press OK to open WhatsApp, then manually attach the file.");
        window.open(`https://wa.me/?text=Please%20find%20the%20attached%20radiology%20document%20for%20${encodeURIComponent(patient?.name)}.`, '_blank');
      }
    });
  };

  const handleViewReport = (report) => {
    const element = document.createElement('div');
    element.innerHTML = getReportHtml(report);
    const opt = { margin: [1.3, 0.5, 0.5, 0.5], image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } };
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

  const handleDeleteInvoice = async (id) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      await db.invoices.delete(id);
    }
  };

  const handleWhatsAppInvoice = (inv) => {
    const element = document.createElement('div');
    element.innerHTML = getInvoiceHtml(inv);
    const filename = `Invoice_${patient?.name.replace(/ /g, '_')}.pdf`;
    const opt = { margin: 0.5, filename, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } };
    
    html2pdf().set(opt).from(element).toPdf().get('pdf').then(pdf => {
      const file = new File([pdf.output('blob')], filename, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: filename, text: `Invoice for ${patient?.name}` }).catch(console.error);
      } else {
        pdf.save(filename);
        alert("Since you are on a computer, websites cannot automatically attach files to WhatsApp. The PDF has been downloaded. Press OK to open WhatsApp, then manually attach the file.");
        window.open(`https://wa.me/?text=Please%20find%20the%20attached%20radiology%20invoice%20for%20${encodeURIComponent(patient?.name)}.`, '_blank');
      }
    });
  };

  const handleViewInvoice = (inv) => {
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

  if (!patient) return <div style={{ padding: '2rem' }}>Loading patient record...</div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div className="flex items-center gap-4">
          <Link to="/patients" className="btn-ghost" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1>{patient.name}</h1>
            <p>Patient Record</p>
          </div>
        </div>
        <div className="flex gap-4">
          <Link to={`/reports/new?patient=${patient.id}`} className="btn-primary">
            <FileText size={18} /> New Report
          </Link>
          <Link to={`/invoices/new?patient=${patient.id}`} className="btn-accent">
            <FileSpreadsheet size={18} /> Create Invoice
          </Link>
        </div>
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={20} /> Personal Information
        </h2>
        <div className="responsive-grid responsive-grid-4" style={{ gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.85rem' }}>Contact</p>
            <p style={{ fontWeight: 500, color: 'white' }}>{patient.contact}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.85rem' }}>Age</p>
            <p style={{ fontWeight: 500, color: 'white' }}>{patient.age} years</p>
          </div>
          <div>
            <p style={{ fontSize: '0.85rem' }}>Gender</p>
            <p style={{ fontWeight: 500, color: 'white' }}>{patient.gender}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.85rem' }}>First Visit</p>
            <p style={{ fontWeight: 500, color: 'white' }}>{new Date(patient.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="responsive-grid responsive-grid-2" style={{ gap: '2rem' }}>
        <div className="glass-panel">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} /> Radiology Reports
          </h2>
          {reports && reports.length > 0 ? (
            <div className="flex-col gap-4">
              {reports.map(report => (
                <div key={report.id} style={{ padding: '1rem', background: 'rgba(15,23,42,0.5)', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{report.title}</h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <pre style={{ fontFamily: 'var(--font-main)', fontSize: '0.9rem', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                    {report.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                  </pre>
                  <div className="flex gap-4 items-center" style={{ marginTop: '0.5rem' }}>
                    <Link to={`/reports/new?reportId=${report.id}`} style={{ color: 'var(--text-primary)', fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Edit2 size={16} /> Edit
                    </Link>
                    <button className="btn-ghost" style={{ padding: 0, color: 'var(--primary)', fontSize: '0.9rem', height: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem' }} onClick={() => handleViewReport(report)}>
                      <Eye size={16} /> View
                    </button>
                    <button className="btn-ghost" style={{ padding: 0, color: 'var(--accent)', fontSize: '0.9rem', height: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem' }} onClick={() => handleWhatsAppReport(report)}>
                      <MessageCircle size={16} /> WhatsApp
                    </button>
                    <button className="btn-ghost" style={{ padding: 0, color: 'var(--danger)', fontSize: '0.9rem', height: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem' }} onClick={() => handleDeleteReport(report.id)}>
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No reports generated yet.</p>
          )}
        </div>

        <div className="glass-panel">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileSpreadsheet size={20} /> Invoices & Payments
          </h2>
          {invoices && invoices.length > 0 ? (
            <div className="flex-col gap-4">
              {invoices.map(invoice => (
                <div key={invoice.id} style={{ padding: '1rem', background: 'rgba(15,23,42,0.5)', borderRadius: '8px', border: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{invoice.details}</h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', marginRight: '0.5rem' }}>Rs {parseFloat(invoice.amount).toFixed(2)}</span>
                    <span className={`badge ${invoice.status === 'Paid' ? 'badge-paid' : 'badge-pending'}`} style={{ marginRight: '0.5rem' }}>
                      {invoice.status}
                    </span>
                    <Link to={`/invoices/new?invoiceId=${invoice.id}`} className="btn-ghost" style={{ padding: '0.3rem', color: 'var(--text-primary)' }} title="Edit Invoice">
                      <Edit2 size={16} />
                    </Link>
                    <button className="btn-ghost" style={{ padding: '0.3rem', color: 'var(--primary)' }} title="View Invoice" onClick={() => handleViewInvoice(invoice)}>
                      <Eye size={16} />
                    </button>
                    <button className="btn-ghost" style={{ padding: '0.3rem', color: 'var(--accent)' }} title="Send WhatsApp" onClick={() => handleWhatsAppInvoice(invoice)}>
                      <MessageCircle size={16} />
                    </button>
                    <button className="btn-ghost" style={{ padding: '0.3rem', color: 'var(--danger)' }} title="Delete Invoice" onClick={() => handleDeleteInvoice(invoice.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No invoices created yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDetails;
