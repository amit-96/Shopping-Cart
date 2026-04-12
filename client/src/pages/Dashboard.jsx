import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [low, setLow] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [dash, lowStock] = await Promise.all([
          api.get('/reports/dashboard'),
          api.get('/products/low-stock'),
        ]);
        if (!cancelled) {
          setStats(dash.data.data);
          setLow(lowStock.data.data || []);
        }
      } catch (e) {
        if (!cancelled) setErr(e.response?.data?.message || e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      {err && <p className="error-msg">{err}</p>}
      {stats && (
        <div className="grid-stats">
          <div className="stat">
            <div className="stat-label">Products</div>
            <div className="stat-value">{stats.productCount}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Low stock SKUs</div>
            <div className="stat-value">{stats.lowStockCount}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Today&apos;s sales</div>
            <div className="stat-value">₹{Number(stats.todaySalesTotal).toFixed(2)}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Pending POs</div>
            <div className="stat-value">{stats.pendingPurchaseOrders}</div>
          </div>
        </div>
      )}

      <div className="card">
        <h2>Quick actions</h2>
        <p className="muted" style={{ marginBottom: '0.75rem' }}>
          <Link to="/billing">New bill (POS)</Link>
          {' · '}
          <Link to="/products">Product register</Link>
          {' · '}
          <Link to="/rate-list">Print rate list</Link>
        </p>
      </div>

      <div className="card">
        <h2>Low stock alert</h2>
        {low.length === 0 ? (
          <p className="muted">All products above reorder level.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Stock</th>
                <th>Reorder</th>
              </tr>
            </thead>
            <tbody>
              {low.map((p) => (
                <tr key={p.id}>
                  <td>{p.sku}</td>
                  <td>{p.name}</td>
                  <td>{p.stock_qty}</td>
                  <td>{p.reorder_level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
