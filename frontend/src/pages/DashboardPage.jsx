import { StatCard } from "../components/StatCard.jsx";
import { formatMoney } from "../components/EmployeeTable.jsx";
export function DashboardPage({ dashboard, loading }) {
  if (loading) return <p>Loading salary insights…</p>;
  console.log("Dashboard data:", dashboard);
  if (!dashboard) return <p>Unable to load dashboard.</p>;
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Compensation intelligence</p>
          <h1>Salary overview</h1>
          <p>Answer the organisation’s core pay questions at a glance.</p>
        </div>
      </header>
      <div className="stat-grid">
        <StatCard
          label="Total employees"
          value={dashboard.headcount}
          detail="Demo data for component/API development"
        />
        {dashboard.payrollByCurrency.map((item) => (
          <StatCard
            key={item.currency}
            label={`Annual payroll · ${item.currency}`}
            value={formatMoney(item.totalSalaryMinor, item.currency)}
          />
        ))}
      </div>
      <section className="table-card">
        <div className="section-heading">
          <div>
            <h2>Department compensation</h2>
            <p>
              Current salary totals are grouped by department and currency in
              the API.
            </p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Department</th>
              <th>Currency</th>
              <th>Headcount</th>
              <th>Average salary</th>
              <th>Total salary</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.departments.map((item) => (
              <tr key={`${item.department}-${item.currency}`}>
                <td>{item.department}</td>
                <td>{item.currency}</td>
                <td>{item.headcount}</td>
                <td>{formatMoney(item.averageSalaryMinor, item.currency)}</td>
                <td>{formatMoney(item.totalSalaryMinor, item.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
