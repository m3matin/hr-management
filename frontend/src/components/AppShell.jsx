export function AppShell({ page, onNavigate, children }) {
  return <div className="shell"><aside className="sidebar"><div className="brand">ACME <span>People</span></div><nav>{['dashboard', 'employees'].map((item) => <button key={item} className={page === item ? 'nav-item active' : 'nav-item'} onClick={() => onNavigate(item)}>{item === 'dashboard' ? 'Overview' : 'Employees'}</button>)}</nav><div className="rds-note">AWS RDS PostgreSQL<br/><small>configuration ready</small></div></aside><main className="content">{children}</main></div>;
}
