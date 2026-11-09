import { useEffect, useState } from "react";
import axios from "axios";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_APP_URL;
const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

export default function ProductsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("stockflow_token");
  const user = JSON.parse(localStorage.getItem("stockflow_user") || "{}");
  const organizationName = user.organization?.name || "Your organization";
  const [defaultThreshold, setDefaultThreshold] = useState(user.organization?.defaultLowStockThreshold ?? 5);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    axios.get(`${API_URL}/products`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(({ data }) => setProducts(data.products))
      .catch((requestError) => {
        setError(requestError.response?.data?.error || "Could not load products. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!token) return;

    axios.get(`${API_URL}/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(({ data }) => setDefaultThreshold(data.defaultLowStockThreshold))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    const product = location.state?.editProduct;
    if (!product) return;

    setEditing(product);
    setAdding(false);
    setEditForm({
      name: product.name,
      sku: product.sku,
      description: product.description || "",
      quantityOnHand: String(product.quantityOnHand),
      costPrice: String(product.costPrice),
      sellingPrice: String(product.sellingPrice),
      lowStockThreshold: product.lowStockThreshold == null ? "" : String(product.lowStockThreshold),
    });
    setEditError("");
    navigate("/products", { replace: true, state: null });
  }, [location.state, navigate]);

  if (!token) return <Navigate to="/login" replace />;

  const filteredProducts = products.filter((product) => {
    const query = search.trim().toLowerCase();
    return product.name.toLowerCase().includes(query) || product.sku.toLowerCase().includes(query);
  });

  function logout() {
    localStorage.removeItem("stockflow_token");
    localStorage.removeItem("stockflow_user");
    navigate("/login", { replace: true });
  }

  function startEditing(product) {
    setEditing(product);
    setAdding(false);
    setEditForm({
      name: product.name,
      sku: product.sku,
      description: product.description || "",
      quantityOnHand: String(product.quantityOnHand),
      costPrice: String(product.costPrice),
      sellingPrice: String(product.sellingPrice),
      lowStockThreshold: product.lowStockThreshold == null ? "" : String(product.lowStockThreshold),
    });
    setEditError("");
  }

  function startAdding() {
    setEditing(null);
    setAdding(true);
    setEditForm({
      name: "",
      sku: "",
      description: "",
      quantityOnHand: "0",
      costPrice: "0",
      sellingPrice: "0",
      lowStockThreshold: "",
    });
    setEditError("");
  }

  async function saveProduct(event) {
    event.preventDefault();
    setSaving(true);
    setEditError("");

    const updatedFields = {
      ...editForm,
      quantityOnHand: Number(editForm.quantityOnHand),
      costPrice: Number(editForm.costPrice),
      sellingPrice: Number(editForm.sellingPrice),
      lowStockThreshold: editForm.lowStockThreshold === "" ? null : Number(editForm.lowStockThreshold),
    };

    try {
      const request = adding
        ? axios.post(`${API_URL}/products`, updatedFields, { headers: { Authorization: `Bearer ${token}` } })
        : axios.put(`${API_URL}/products/${editing.id}`, updatedFields, { headers: { Authorization: `Bearer ${token}` } });
      const { data } = await request;
      setProducts((current) => adding
        ? [data.product, ...current]
        : current.map((product) => product.id === data.product.id ? data.product : product));
      setEditing(null);
      setAdding(false);
      setEditForm(null);
    } catch (requestError) {
      setEditError(requestError.response?.data?.error || "Could not save the product. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(event, product) {
    event.stopPropagation();
    if (!window.confirm(`Delete ${product.name}? This cannot be undone.`)) return;

    setDeletingId(product.id);
    setDeleteError("");

    try {
      await axios.delete(`${API_URL}/products/${product.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts((current) => current.filter((item) => item.id !== product.id));
    } catch (requestError) {
      setDeleteError(requestError.response?.data?.error || "Could not delete the product. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f6f2] px-4 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-sm font-bold tracking-tight text-emerald-900">StockFlow</p>
            <p className="mt-1 text-sm font-medium text-slate-700">{organizationName}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 sm:text-sm">{user.email}</span>
            <Link to="/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white">Dashboard</Link>
            <Link to="/settings" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white">Settings</Link>
            <button onClick={startAdding} className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900">
              Add product
            </button>
            <button onClick={logout} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-950">
              Sign out
            </button>
          </div>
        </header>

        <section className="py-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Products</h1>
              <p className="mt-2 text-sm text-slate-500">View and search {organizationName} inventory.</p>
            </div>
            <p className="rounded-full bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
              {products.length} {products.length === 1 ? "product" : "products"}
            </p>
          </div>

          <label className="mt-6 block max-w-md">
            <span className="sr-only">Search products</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or SKU"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
            />
          </label>

          {deleteError && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{deleteError}</p>}

          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <p className="p-8 text-center text-sm text-slate-500">Loading products…</p>
            ) : error ? (
              <p className="p-8 text-center text-sm text-rose-700" role="alert">{error}</p>
            ) : filteredProducts.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">
                {search ? "No products match your search." : "No products yet."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-medium">Product</th>
                      <th className="px-5 py-4 font-medium">SKU</th>
                      <th className="px-5 py-4 text-right font-medium">On hand</th>
                      <th className="px-5 py-4 text-right font-medium">Selling price</th>
                      <th className="px-5 py-4 font-medium">Stock status</th>
                      <th className="px-5 py-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((product) => {
                      const threshold = product.lowStockThreshold ?? defaultThreshold;
                      const isLowStock = product.quantityOnHand <= threshold;

                      return (
                        <tr
                          key={product.id}
                          role="link"
                          tabIndex={0}
                          onClick={() => navigate(`/products/${product.id}`)}
                          onKeyDown={(event) => {
                            if (event.target !== event.currentTarget) return;
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              navigate(`/products/${product.id}`);
                            }
                          }}
                          className="cursor-pointer transition-colors hover:bg-emerald-50 focus-visible:bg-emerald-50 focus-visible:outline-none"
                        >
                          <td className="cursor-pointer px-5 py-4">
                            <p className="font-medium text-slate-900">{product.name}</p>
                            {product.description && <p className="mt-1 max-w-xs truncate text-xs text-slate-500">{product.description}</p>}
                          </td>
                          <td className="cursor-pointer px-5 py-4 font-mono text-xs text-slate-600">{product.sku}</td>
                          <td className="cursor-pointer px-5 py-4 text-right tabular-nums text-slate-700">{product.quantityOnHand}</td>
                          <td className="cursor-pointer px-5 py-4 text-right tabular-nums text-slate-700">{currency.format(Number(product.sellingPrice))}</td>
                          <td className="cursor-pointer px-5 py-4">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${isLowStock ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-emerald-50 text-emerald-800 ring-emerald-200"}`}>
                              <span className={`size-1.5 rounded-full ${isLowStock ? "bg-amber-500" : "bg-emerald-500"}`} />
                              {isLowStock ? "Low stock" : "In stock"}
                            </span>
                          </td>
                          <td className="cursor-pointer px-5 py-4">
                            <div className="flex items-center gap-3">
                              <button onClick={(event) => { event.stopPropagation(); startEditing(product); }} className="cursor-pointer font-medium text-emerald-800 hover:text-emerald-950">
                                Edit
                              </button>
                              <button
                                disabled={deletingId === product.id}
                                onClick={(event) => deleteProduct(event, product)}
                                className="cursor-pointer font-medium text-rose-700 hover:text-rose-900 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {deletingId === product.id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      </div>

      {(editing || adding) && editForm && (
        <div className="fixed inset-0 z-10 grid place-items-center overflow-y-auto bg-slate-950/40 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="edit-product-title" className="my-4 w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl sm:p-8">
            <h2 id="edit-product-title" className="text-xl font-semibold text-slate-950">{adding ? "Add product" : "Edit product"}</h2>
            <form onSubmit={saveProduct} className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Name
                <input required maxLength={120} value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-700" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                SKU
                <input required maxLength={100} value={editForm.sku} onChange={(event) => setEditForm({ ...editForm, sku: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-700" />
              </label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Description
                <input maxLength={1000} value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-700" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Quantity
                <input type="number" min="0" step="1" required value={editForm.quantityOnHand} onChange={(event) => setEditForm({ ...editForm, quantityOnHand: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-700" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Cost price
                <input type="number" min="0" step="0.01" value={editForm.costPrice} onChange={(event) => setEditForm({ ...editForm, costPrice: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-700" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Selling price
                <input type="number" min="0" step="0.01" value={editForm.sellingPrice} onChange={(event) => setEditForm({ ...editForm, sellingPrice: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-700" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Low-stock threshold
                <input type="number" min="0" step="1" value={editForm.lowStockThreshold} onChange={(event) => setEditForm({ ...editForm, lowStockThreshold: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-700" placeholder={`Organization default: ${defaultThreshold}`} />
              </label>
              {editError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:col-span-2" role="alert">{editError}</p>}
              <div className="flex justify-end gap-3 pt-2 sm:col-span-2">
                <button type="button" onClick={() => { setEditing(null); setAdding(false); }} className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
                <button disabled={saving} className="cursor-pointer rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? "Saving..." : adding ? "Add product" : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
