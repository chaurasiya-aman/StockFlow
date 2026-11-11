import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_APP_URL;

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ organizationName: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function updateForm(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.post(`${API_URL}/auth/signup`, {
        organizationName: form.organizationName,
        email: form.email,
        password: form.password,
      });
      localStorage.setItem("stockflow_token", data.token);
      localStorage.setItem("stockflow_user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Could not create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f6f2] p-3 sm:p-5">
      <section className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl shadow-emerald-950/5 sm:p-10">
        <Link to="/login" className="text-lg font-bold tracking-tight text-emerald-900">StockFlow</Link>
        <p className="mt-8 text-sm font-medium text-emerald-800">Get started</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Create your workspace</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Add your organization details to get started.</p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <label className="block text-sm font-medium text-slate-700">
            Organization name
            <input name="organizationName" value={form.organizationName} onChange={updateForm} autoComplete="organization" maxLength={100} required className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10" placeholder="Acme Supplies" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Email address
            <input name="email" type="email" value={form.email} onChange={updateForm} autoComplete="email" maxLength={254} required className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10" placeholder="you@company.com" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <span className="relative mt-2 block">
              <input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={updateForm} autoComplete="new-password" minLength={8} maxLength={72} required className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-16 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10" placeholder="At least 8 characters" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-emerald-800">
                {showPassword ? "Hide" : "Show"}
              </button>
            </span>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Confirm password
            <input name="confirmPassword" type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={updateForm} autoComplete="new-password" minLength={8} maxLength={72} required className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10" placeholder="Enter your password again" />
          </label>
          {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</p>}
          <button disabled={loading} className="w-full rounded-xl bg-emerald-800 px-5 py-3.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60">
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="font-semibold text-emerald-800">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
