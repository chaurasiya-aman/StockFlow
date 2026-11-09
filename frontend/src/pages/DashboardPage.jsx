import { useEffect, useState } from "react";
import axios from "axios";
import { Link, Navigate, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_APP_URL;

function getStoredUser() {
  try {
    const user = JSON.parse(localStorage.getItem("stockflow_user") || "{}");
    return user && typeof user === "object" && !Array.isArray(user) ? user : {};
  } catch {
    return {};
  }
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("stockflow_token");
  const user = getStoredUser();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    axios.get(`${API_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(({ data }) => setDashboard(data))
      .catch((requestError) => {
        setError(requestError.response?.data?.error || "Could not load the dashboard.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) return <Navigate to="/login" replace />;

  function logout() {
    localStorage.clear();
    navigate("/login", { replace: true });
  }

  return (
    <main className="min-h-screen bg-[#f5f6f2] px-4 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-sm font-bold tracking-tight text-emerald-900">StockFlow</p>
            <p className="mt-1 text-sm font-medium text-slate-700">{user.organization?.name || "Your organization"}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 sm:text-sm">{user.email}</span>
            <Link to="/products" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white">Products</Link>
            <Link to="/settings" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white">Settings</Link>
            <button onClick={logout} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white">Sign out</button>
          </div>
        </header>

        <section className="py-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">A quick view of your inventory.</p>

          {loading ? (
            <p className="mt-8 rounded-2xl bg-white p-8 text-center text-sm text-slate-500">Loading dashboard...</p>
          ) : error ? (
            <p className="mt-8 rounded-2xl bg-rose-50 p-8 text-center text-sm text-rose-700" role="alert">{error}</p>
          ) : dashboard && (
            <>
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">Total products</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">{dashboard.totalProducts}</p>
                </article>
                <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">Total quantity on hand</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">{dashboard.totalQuantityOnHand}</p>
                </article>
              </div>

              <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <h2 className="font-semibold text-slate-950">Low stock items</h2>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">{dashboard.lowStockCount}</span>
                </div>
                {dashboard.lowStockProducts.length === 0 ? (
                  <p className="p-8 text-center text-sm text-slate-500">No low-stock items.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-5 py-4 font-medium">Name</th>
                          <th className="px-5 py-4 font-medium">SKU</th>
                          <th className="px-5 py-4 text-right font-medium">Quantity on hand</th>
                          <th className="px-5 py-4 text-right font-medium">Low stock threshold</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dashboard.lowStockProducts.map((product) => (
                          <tr key={product.id} className="hover:bg-amber-50/60">
                            <td className="px-5 py-4 font-medium text-slate-900">
                              <Link to={`/products/${product.id}`} className="hover:text-emerald-800">{product.name}</Link>
                            </td>
                            <td className="px-5 py-4 font-mono text-xs text-slate-600">{product.sku}</td>
                            <td className="px-5 py-4 text-right tabular-nums text-slate-700">{product.quantityOnHand}</td>
                            <td className="px-5 py-4 text-right tabular-nums text-slate-700">{product.lowStockThreshold}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
