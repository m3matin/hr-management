import { useEffect, useState } from 'react';
import { api } from './api/client.js';
import { AppShell } from './components/AppShell.jsx';
import { EmployeeDrawer } from './components/EmployeeDrawer.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { EmployeesPage } from './pages/EmployeesPage.jsx';

const initialFilters = { search: '', department: '', country: '', page: 1, pageSize: 10 };
function App() {
  const [page, setPage] = useState('dashboard'); const [dashboard, setDashboard] = useState(); const [employees, setEmployees] = useState(); const [filters, setFilters] = useState(initialFilters); const [selected, setSelected] = useState(); const [history, setHistory] = useState([]); const [editing, setEditing] = useState(false); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const loadDashboard = async () => { const data = await api.dashboard(); setDashboard(data); };
  const loadEmployees = async () => { setLoading(true); try { setEmployees(await api.employees(filters)); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  useEffect(() => { loadDashboard().catch((e) => setError(e.message)); }, []); useEffect(() => { if (page === 'employees') loadEmployees(); }, [page, filters]);
  const selectEmployee = async (id) => { try { const [employee, salaryHistory] = await Promise.all([api.employee(id), api.history(id)]); setSelected(employee); setHistory(salaryHistory.data); } catch (e) { setError(e.message); } };
  const saveRevision = async (payload) => { try { const employee = await api.reviseSalary(selected.id, payload); setSelected(employee); setHistory(employee.history); setEditing(false); await Promise.all([loadDashboard(), loadEmployees()]); } catch (e) { setError(e.message); } };
  return <AppShell page={page} onNavigate={setPage}>{error && <div className="error">{error}<button onClick={() => setError('')}>×</button></div>}{page === 'dashboard' ? <DashboardPage dashboard={dashboard} loading={!dashboard && !error} /> : <EmployeesPage result={employees} dashboard={dashboard} filters={filters} onFilters={setFilters} onSelect={selectEmployee} loading={loading} />}<EmployeeDrawer employee={selected} history={history} editing={editing} onClose={() => { setSelected(undefined); setEditing(false); }} onEdit={setEditing} onSave={saveRevision} /></AppShell>;
}
export default App;
