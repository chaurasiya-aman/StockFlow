import { useEffect, useState } from "react";
import axios from "axios";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";

const API_URL = import.meta.env.VITE_APP_URL;
const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("stockflow_token");
  const user = JSON.parse(localStorage.getItem("stockflow_user") || "{}");
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    axios.get(`${API_URL}/products/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(({ data }) => setProduct(data.product))
      .catch((requestError) => {
        setError(requestError.response?.data?.error || "Could not load this product.");
      })
      .finally(() => setLoading(false));
  }, [id, token]);

  if (!token) return <Navigate to="/login" replace />;

  const threshold = product?.lowStockThreshold ?? user.organization?.defaultLowStockThreshold ?? 5;
  const isLowStock = product && product.quantityOnHand <= threshold;

  return (
    <main className="min-h-screen bg-[#f5f6f2] px-4 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
          <div>
            <Link to="/products" className="text-sm font-bold tracking-tight text-emerald-900">StockFlow</Link>
            <p className="mt-1 text-sm font-medium text-slate-700">{user.organization?.name || "Your organization"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-slate-500 sm:text-sm">{user.email}</span>
            <button onClick={() => navigate("/products")} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-950">
              Back to products
            </button>
          </div>
        </header>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          {loading ? (
            <p className="py-10 text-center text-sm text-slate-500">Loading product...</p>
          ) : error ? (
            <p className="py-10 text-center text-sm text-rose-700" role="alert">{error}</p>
          ) : product ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                  <p className="font-mono text-xs text-slate-500">{product.sku}</p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{product.name}</h1>
                  <p className="mt-2 text-sm text-slate-500">{product.description || "No description provided."}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${isLowStock ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-emerald-50 text-emerald-800 ring-emerald-200"}`}>
                    <span className={`size-1.5 rounded-full ${isLowStock ? "bg-amber-500" : "bg-emerald-500"}`} />
                    {isLowStock ? "Low stock" : "In stock"}
                  </span>
                  <button
                    onClick={() => navigate("/products", { state: { editProduct: product } })}
                    className="cursor-pointer rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
                  >
                    Edit product
                  </button>
                </div>
              </div>

              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Quantity on hand</dt>
                  <dd className="mt-2 text-xl font-semibold text-slate-950">{product.quantityOnHand}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Low-stock threshold</dt>
                  <dd className="mt-2 text-xl font-semibold text-slate-950">{threshold}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Cost price</dt>
                  <dd className="mt-2 text-xl font-semibold text-slate-950">{currency.format(Number(product.costPrice))}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Selling price</dt>
                  <dd className="mt-2 text-xl font-semibold text-slate-950">{currency.format(Number(product.sellingPrice))}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Created</dt>
                  <dd className="mt-2 text-sm font-medium text-slate-900">{new Date(product.createdAt).toLocaleString()}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Last updated</dt>
                  <dd className="mt-2 text-sm font-medium text-slate-900">{new Date(product.updatedAt).toLocaleString()}</dd>
                </div>
              </dl>
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}
