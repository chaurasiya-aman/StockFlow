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

export default function SettingsPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("stockflow_token");
  const user = getStoredUser();
  const [threshold, setThreshold] = useState(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    axios.get(`${API_URL}/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(({ data }) => setThreshold(data.defaultLowStockThreshold))
      .catch((requestError) => setError(requestError.response?.data?.error || "Could not load settings."))
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) return <Navigate to="/login" replace />;

  async function saveSettings(event) {
    event.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);

    try {
      const { data } = await axios.put(`${API_URL}/settings`, {
        defaultLowStockThreshold: Number(threshold),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedUser = {
        ...user,
        organization: {
          ...user.organization,
          defaultLowStockThreshold: data.defaultLowStockThreshold,
        },
      };
      localStorage.setItem("stockflow_user", JSON.stringify(updatedUser));
      setThreshold(data.defaultLowStockThreshold);
      setSaved(true);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Could not save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    localStorage.clear();
    navigate("/login", { replace: true });
  }

  return (
    <main className="min-h-screen bg-[#f5f6f2] px-4 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <Link to="/dashboard" className="text-sm font-bold tracking-tight text-emerald-900">StockFlow</Link>
            <p className="mt-1 text-sm font-medium text-slate-700">{user.organization?.name || "Your organization"}</p>
          </div>
          <nav className="flex flex-wrap items-center gap-2" aria-label="Main navigation">
            <span className="text-xs text-slate-500 sm:text-sm">{user.email}</span>
            <Link to="/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white">Dashboard</Link>
            <Link to="/products" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white">Products</Link>
            <button onClick={logout} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white">Sign out</button>
          </nav>
        </header>

        <section className="mt-8 max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium text-emerald-800">Organization settings</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Default low-stock threshold</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Products without their own threshold use this value. Stock is low when quantity on hand is less than or equal to the threshold.
          </p>

          {loading ? (
            <p className="mt-6 text-sm text-slate-500">Loading settings...</p>
          ) : (
            <form onSubmit={saveSettings} className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Default quantity
                <input
                  type="number"
                  min="0"
                  max="2147483647"
                  step="1"
                  required
                  value={threshold}
                  onChange={(event) => { setThreshold(event.target.value); setSaved(false); }}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
                />
              </label>
              {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</p>}
              {saved && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">Settings saved.</p>}
              <button disabled={saving} className="rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? "Saving..." : "Save settings"}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
