import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [detail, setDetail] = useState(null);
  const [err, setErr] = useState('');

  const load = async () => {
    const { data } = await api.get('/sales', { params: { limit: 100 } });
    setSales(data.data || []);
  };

  useEffect(() => {
    load().catch((e) => setErr(e.response?.data?.message || e.message));
  }, []);

  const openDetail = async (id) => {
    setErr('');
    try {
      const { data } = await api.get(`/sales/${id}`);
      setDetail(data.data);
    } catch (e) {
      setErr(e.response?.data?.message || e.message);
    }
  };

  return (
    <div>
      <h1>Sales register</h1>
      <p className="muted">Invoices created from billing; stock is reduced at checkout.</p>
      {err && <p className="error-msg">{err}</p>}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Payment</th>
              <th>Total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id}>
                <td>{s.invoice_no}</td>
                <td>{new Date(s.created_at).toLocaleString()}</td>
                <td>{s.customer_name || '—'}</td>
                <td>{s.payment_method}</td>
                <td>₹{Number(s.total_amount).toFixed(2)}</td>
                <td>
                  <button type="button" className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem' }} onClick={() => openDetail(s.id)}>
                    Lines
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sales.length === 0 && <p className="muted">No sales yet. Use <Link to="/billing">Billing</Link>.</p>}
      </div>

      {detail && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>{detail.invoice_no}</h2>
            <button type="button" className="btn" onClick={() => setDetail(null)}>
              Close
            </button>
          </div>
          <p className="muted">
            {new Date(detail.created_at).toLocaleString()} · ₹{Number(detail.total_amount).toFixed(2)}
          </p>
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Line</th>
              </tr>
            </thead>
            <tbody>
              {(detail.items || []).map((i) => (
                <tr key={i.id}>
                  <td>{i.sku}</td>
                  <td>{i.product_name}</td>
                  <td>{i.quantity}</td>
                  <td>₹{Number(i.unit_price).toFixed(2)}</td>
                  <td>₹{Number(i.line_total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
