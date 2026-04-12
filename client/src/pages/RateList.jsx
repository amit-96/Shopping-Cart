import { useEffect, useState } from 'react';
import api from '../api';

export default function RateList() {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [generatedAt, setGeneratedAt] = useState('');
  const [err, setErr] = useState('');

  const load = async () => {
    const params = category ? { category } : {};
    const { data } = await api.get('/reports/rate-list', { params });
    setRows(data.data || []);
    setGeneratedAt(data.generatedAt || new Date().toISOString());
  };

  useEffect(() => {
    api
      .get('/products/categories')
      .then((r) => setCategories(r.data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load().catch((e) => setErr(e.response?.data?.message || e.message));
  }, [category]);

  const downloadCsv = async () => {
    try {
      const { data } = await api.get('/reports/rate-list.csv', { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rate-list.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErr(e.response?.data?.message || e.message || 'Download failed');
    }
  };

  return (
    <div className="rate-print">
      <h1>Rate list</h1>
      <p className="muted no-print">Retail prices by SKU for display or printing.</p>
      {err && <p className="error-msg">{err}</p>}

      <div className="toolbar no-print" style={{ marginBottom: '1rem' }}>
        <div>
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => window.print()}>
          Print
        </button>
        <button type="button" className="btn" onClick={downloadCsv}>
          Download CSV
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <strong>Shopping Mall — Rate list</strong>
          <span className="muted" style={{ fontSize: '0.85rem' }}>
            Generated: {new Date(generatedAt).toLocaleString()}
          </span>
        </div>
        <table style={{ marginTop: '1rem' }}>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th>Unit price (₹)</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.sku}>
                <td>{r.sku}</td>
                <td>{r.name}</td>
                <td>{r.category}</td>
                <td>{Number(r.unit_price).toFixed(2)}</td>
                <td>{r.stock_qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
