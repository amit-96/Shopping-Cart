import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/products', label: 'Product register' },
  { to: '/billing', label: 'Billing (POS)' },
  { to: '/sales', label: 'Sales register' },
  { to: '/orders', label: 'Purchase orders', adminOnly: true },
  { to: '/rate-list', label: 'Rate list' },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">Mall Manager</div>
        <nav style={{ flex: 1 }}>
          {links
            .filter((l) => !l.adminOnly || isAdmin)
            .map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                {l.label}
              </NavLink>
            ))}
        </nav>
        <div style={{ padding: '1rem 1.25rem', marginTop: 'auto', borderTop: '1px solid var(--border)' }}>
          <div className="muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            {user?.username} · {user?.role}
          </div>
          <button type="button" className="btn btn-ghost" onClick={logout} style={{ width: '100%' }}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
