import React from 'react';
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Activity, LayoutDashboard, Users, FileText, Settings, FileSpreadsheet } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetails from './pages/PatientDetails';
import Templates from './pages/Templates';
import Reports from './pages/Reports';
import NewReport from './pages/NewReport';
import Invoices from './pages/Invoices';
import NewInvoice from './pages/NewInvoice';

const Layout = ({ children }) => {
  return (
    <div className="app-container">
      <aside className="sidebar no-print">
        <NavLink to="/" className="sidebar-logo">
          <Activity size={28} />
          <span>RadClinic Pro</span>
        </NavLink>
        <nav className="nav-links">
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
          <NavLink to="/patients" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Users size={20} /> Patients
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FileText size={20} /> Reports
          </NavLink>
          <NavLink to="/templates" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Settings size={20} /> Templates
          </NavLink>
          <NavLink to="/invoices" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FileSpreadsheet size={20} /> Invoices
          </NavLink>
        </nav>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/:id" element={<PatientDetails />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/new" element={<NewReport />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/new" element={<NewInvoice />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;
