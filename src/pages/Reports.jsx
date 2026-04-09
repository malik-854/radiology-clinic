import React, { useState } from 'react';
import { useCollection, fsdb as db } from '../useDb';
import { orderBy } from 'firebase/firestore';
import { FileText, Search, Printer, Edit2, Trash2, MessageCircle, Eye } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import html2pdf from 'html2pdf.js';

const Reports = () => {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('id');

  const [searchQuery, setSearchQuery] = useState('');

  const allReports = useCollection('reports', [orderBy('updated_at', 'desc')]);
  const allPatients = useCollection('patients', []);

  const reports = React.useMemo(() => {
    if (!allReports || !allPatients) return [];

    const enriched = allReports.map(r => {
      const p = allPatients.find(patient => patient.id.toString() === r.patientId?.toString());
      return { ...r, patientName: p ? p.name : 'Unknown Patient' };
    });

    if (!searchQuery) return enriched;

    const query = searchQuery.toLowerCase();
    return enriched.filter(r =>
      r.title.toLowerCase().includes(query) ||
      r.patientName.toLowerCase().includes(query)
    );
  }, [allReports, allPatients, searchQuery]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      await db.reports.delete(id);
    }
  };

  const getReportHtml = (report) => `
    <div style="font-family: Arial, sans-serif; padding: 10px 40px 40px 40px; color: black; line-height: 1.6;">
      <div style="height: 20px; margin-bottom: 10px;">
        <!-- Space for pre-printed letterhead -->
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px; background: #f3f4f6; padding: 15px; border-radius: 8px;">
        <div>
          <p style="margin: 0;"><strong>Patient Name:</strong> ${report.patientName}</p>
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

  const handleWhatsApp = (report) => {
    const element = document.createElement('div');
    element.innerHTML = getReportHtml(report);

    const filename = `Report_${report.patientName.replace(/ /g, '_')}.pdf`;
    const opt = {
      margin: 0.5,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).toPdf().get('pdf').then(pdf => {
      const blob = pdf.output('blob');
      const file = new File([blob], filename, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
          files: [file],
          title: filename,
          text: `Radiology report for ${report.patientName}`
        }).catch(err => console.log('Share canceled', err));
      } else {
        pdf.save(filename);
        alert("Since you are on a computer, websites cannot automatically attach files to WhatsApp. The PDF has been downloaded. Press OK to open WhatsApp, then manually attach the file.");
        window.open(`https://wa.me/?text=Please%20find%20the%20attached%20radiology%20document%20for%20${encodeURIComponent(report.patientName)}.`, '_blank');
      }
    });
  };

  const handleView = (report) => {
    const element = document.createElement('div');
    element.innerHTML = getReportHtml(report);
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
          <h1>Radiology Reports</h1>
          <p>Access and print all patient reports.</p>
        </div>
        <Link to="/reports/new" className="btn-primary">
          <FileText size={18} /> Generate Report
        </Link>
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <div className="flex items-center gap-2" style={{ background: 'rgba(15,23,42,0.6)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
          <Search size={20} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search reports by title or patient name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {reports && reports.length > 0 ? (
          reports.map(report => (
            <div
              key={report.id}
              className="glass-panel items-center justify-between"
              style={{
                display: 'flex',
                borderColor: report.id.toString() === highlightId ? 'var(--primary)' : 'var(--panel-border)',
                boxShadow: report.id.toString() === highlightId ? '0 0 0 1px var(--primary)' : 'none'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{report.title}</h3>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ margin: 0 }}>
                  Patient: <Link to={`/patients/${report.patientId}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>{report.patientName}</Link>
                </p>
                <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '6px', maxHeight: '100px', overflow: 'hidden' }}>
                  <pre style={{ margin: 0, fontFamily: 'var(--font-main)', fontSize: '0.85rem', color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>
                    {report.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                  </pre>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '2rem' }}>
                <div className="flex gap-2 justify-end" style={{ marginBottom: '0.5rem' }}>
                  <Link to={`/reports/new?reportId=${report.id}`} className="btn-ghost" style={{ padding: '0.3rem', color: 'var(--text-primary)' }} title="Edit Report">
                    <Edit2 size={18} />
                  </Link>
                  <button className="btn-ghost" style={{ padding: '0.3rem', color: 'var(--primary)' }} title="View Report" onClick={() => handleView(report)}>
                    <Eye size={18} />
                  </button>
                  <button className="btn-ghost" style={{ padding: '0.3rem', color: 'var(--accent)' }} title="Send WhatsApp" onClick={() => handleWhatsApp(report)}>
                    <MessageCircle size={18} />
                  </button>
                  <button className="btn-ghost" style={{ padding: '0.3rem', color: 'var(--danger)' }} title="Delete Report" onClick={() => handleDelete(report.id)}>
                    <Trash2 size={18} />
                  </button>
                </div>
                <button
                  className="btn-outline"
                  onClick={() => {
                    const printContent = getReportHtml(report);
                    const element = document.createElement('div');
                    element.innerHTML = printContent;

                    const opt = {
                      margin: 0.5,
                      filename: `Report_${report.patientName.replace(/ /g, '_')}.pdf`,
                      image: { type: 'jpeg', quality: 0.98 },
                      html2canvas: { scale: 2 },
                      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
                    };

                    html2pdf().set(opt).from(element).save();
                  }}
                >
                  <Printer size={18} /> Print PDF
                </button>
              </div>
            </div>
          ))
        ) : (
          <p style={{ textAlign: 'center', padding: '2rem' }}>No reports found.</p>
        )}
      </div>
    </div>
  );
};

export default Reports;
