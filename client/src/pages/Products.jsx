import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  sku: '',
  name: '',
  description: '',
  category: 'General',
  unitPrice: '',
  costPrice: '',
  stockQty: '0',
  reorderLevel: '10',
};

export default function Products() {
  const { isAdmin } = useAuth();
  const [list, setList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterCat, setFilterCat] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = async () => {
    const params = filterCat ? { category: filterCat } : {};
    const { data } = await api.get('/products', { params });
    setList(data.data || []);
  };

  useEffect(() => {
    api.get('/products/categories').then((r) => setCategories(r.data.data || []));
  }, []);

  useEffect(() => {
    load().catch((e) => setErr(e.response?.data?.message || e.message));
  }, [filterCat]);

  const runSearch = async (e) => {
    e.preventDefault();
    setErr('');
    if (!search.trim()) {
      setSearchResults(null);
      return;
    }
    const { data } = await api.get('/products/search', { params: { q: search.trim() } });
    setSearchResults(data.data || []);
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({
      sku: p.sku,
      name: p.name,
      description: p.description || '',
      category: p.category,
      unitPrice: String(p.unit_price),
      costPrice: String(p.cost_price),
      stockQty: String(p.stock_qty),
      reorderLevel: String(p.reorder_level),
    });
    setMsg('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const save = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    const body = {
      sku: form.sku,
      name: form.name,
      description: form.description,
      category: form.category,
      unitPrice: parseFloat(form.unitPrice),
      costPrice: parseFloat(form.costPrice),
      stockQty: parseInt(form.stockQty, 10),
      reorderLevel: parseInt(form.reorderLevel, 10),
    };
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, body);
        setMsg('Product updated.');
      } else {
        await api.post('/products', body);
        setMsg('Product created.');
      }
      cancelEdit();
      load();
      const cats = await api.get('/products/categories');
      setCategories(cats.data.data || []);
    } catch (ex) {
      setErr(ex.response?.data?.message || ex.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    setErr('');
    try {
      await api.delete(`/products/${id}`);
      setMsg('Deleted.');
      load();
    } catch (ex) {
      setErr(ex.response?.data?.message || ex.message);
    }
  };

  const displayList = searchResults !== null ? searchResults : list;

  return (
    <div>
      <h1>Product register</h1>
      <p className="muted">Maintain SKU, pricing, categories, and on-hand stock.</p>

      {msg && <p style={{ color: 'var(--success)' }}>{msg}</p>}
      {err && <p className="error-msg">{err}</p>}

      <div className="card">
        <h2>Lookup product</h2>
        <form className="toolbar no-print" onSubmit={runSearch} style={{ alignItems: 'center' }}>
          <div>
            <label>Search by name, SKU, or category</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. rice, SKU-001" />
          </div>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
          {searchResults !== null && (
            <button type="button" className="btn" onClick={() => setSearchResults(null)}>
              Clear
            </button>
          )}
        </form>
      </div>

      {isAdmin && (
        <div className="card">
          <h2>{editingId ? 'Edit product' : 'Add product'}</h2>
          <form onSubmit={save}>
            <div className="form-row two">
              <div>
                <label>SKU</label>
                <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required disabled={!!editingId} />
              </div>
              <div>
                <label>Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <label>Description</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-row two">
              <div>
                <label>Category</label>
                <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div>
                <label>Unit price (₹)</label>
                <input type="number" step="0.01" min="0" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} required />
              </div>
            </div>
            <div className="form-row two">
              <div>
                <label>Cost price (₹)</label>
                <input type="number" step="0.01" min="0" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
              </div>
              <div>
                <label>Stock qty</label>
                <input type="number" min="0" value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: e.target.value })} />
              </div>
            </div>
            <div className="form-row" style={{ maxWidth: 200 }}>
              <label>Reorder level</label>
              <input type="number" min="0" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Save changes' : 'Add product'}
            </button>
            {editingId && (
              <button type="button" className="btn" style={{ marginLeft: 8 }} onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </form>
        </div>
      )}

      <div className="card">
        <div className="toolbar no-print">
          <div>
            <label>Filter category</label>
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {displayList.map((p) => (
              <tr key={p.id}>
                <td>{p.sku}</td>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>₹{Number(p.unit_price).toFixed(2)}</td>
                <td>
                  <span className={p.stock_qty <= p.reorder_level ? 'badge badge-low' : 'badge badge-ok'}>
                    {p.stock_qty}
                  </span>
                </td>
                <td>
                  {isAdmin && (
                    <>
                      <button type="button" className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem' }} onClick={() => startEdit(p)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', marginLeft: 4 }} onClick={() => remove(p.id)}>
                        Delete
                      </button>
                    </>
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
