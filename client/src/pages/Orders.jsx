import { useEffect, useState } from 'react';
import api from '../api';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplierName, setSupplierName] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([{ productId: '', quantity: '1', unitCost: '' }]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = async () => {
    const { data } = await api.get('/orders');
    setOrders(data.data || []);
  };

  useEffect(() => {
    Promise.all([load(), api.get('/products').then((r) => setProducts(r.data.data || []))]).catch((e) =>
      setErr(e.response?.data?.message || e.message)
    );
  }, []);

  const addRow = () => setLines([...lines, { productId: '', quantity: '1', unitCost: '' }]);

  const updateRow = (i, field, value) => {
    const next = [...lines];
    next[i] = { ...next[i], [field]: value };
    setLines(next);
  };

  const removeRow = (i) => setLines(lines.filter((_, j) => j !== i));

  const createOrder = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    const items = lines
      .map((l) => ({
        productId: parseInt(l.productId, 10),
        quantity: parseInt(l.quantity, 10),
        unitCost: parseFloat(l.unitCost),
      }))
      .filter((l) => l.productId && l.quantity > 0 && !Number.isNaN(l.unitCost));
    if (!supplierName.trim() || items.length === 0) {
      setErr('Supplier and at least one valid line required.');
      return;
    }
    try {
      await api.post('/orders', { supplierName: supplierName.trim(), notes, items });
      setMsg('Purchase order created.');
      setSupplierName('');
      setNotes('');
      setLines([{ productId: '', quantity: '1', unitCost: '' }]);
      load();
    } catch (ex) {
      setErr(ex.response?.data?.message || ex.message);
    }
  };

  const receive = async (id) => {
    setErr('');
    try {
      await api.patch(`/orders/${id}/receive`);
      setMsg(`Order #${id} received; stock updated.`);
      load();
      const refreshed = await api.get('/products');
      setProducts(refreshed.data.data || []);
    } catch (ex) {
      setErr(ex.response?.data?.message || ex.message);
    }
  };

  return (
    <div>
      <h1>Purchase orders</h1>
      <p className="muted">Place restock orders and receive them into inventory (admin).</p>
      {msg && <p style={{ color: 'var(--success)' }}>{msg}</p>}
      {err && <p className="error-msg">{err}</p>}

      <div className="card">
        <h2>New purchase order</h2>
        <form onSubmit={createOrder}>
          <div className="form-row two">
            <div>
              <label>Supplier</label>
              <input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} required />
            </div>
            <div>
              <label>Notes</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          {lines.map((l, i) => (
            <div key={i} className="form-row two" style={{ alignItems: 'flex-end' }}>
              <div>
                <label>Product</label>
                <select value={l.productId} onChange={(e) => updateRow(i, 'productId', e.target.value)}>
                  <option value="">Select…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} — {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Qty</label>
                <input type="number" min="1" value={l.quantity} onChange={(e) => updateRow(i, 'quantity', e.target.value)} />
              </div>
              <div>
                <label>Unit cost (₹)</label>
                <input type="number" step="0.01" min="0" value={l.unitCost} onChange={(e) => updateRow(i, 'unitCost', e.target.value)} />
              </div>
              <button type="button" className="btn btn-danger" onClick={() => removeRow(i)}>
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="btn" style={{ marginTop: 8 }} onClick={addRow}>
            Add line
          </button>
          <div style={{ marginTop: 12 }}>
            <button type="submit" className="btn btn-primary">
              Create order
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Open and past orders</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Supplier</th>
              <th>Status</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{o.supplier_name}</td>
                <td>{o.status}</td>
                <td>{new Date(o.created_at).toLocaleString()}</td>
                <td>
                  {o.status === 'pending' && (
                    <button type="button" className="btn btn-primary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => receive(o.id)}>
                      Receive stock
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
