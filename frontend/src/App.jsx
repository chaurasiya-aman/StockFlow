import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";

function WorkspacePage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("stockflow_token");

  if (!token) return <Navigate to="/login" replace />;

  const user = JSON.parse(localStorage.getItem("stockflow_user") || "{}");

  function logout() {
    localStorage.removeItem("stockflow_token");
    localStorage.removeItem("stockflow_user");
    navigate("/login", { replace: true });
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f6f2] p-6">
      <section className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl shadow-emerald-950/5 sm:p-10">
        <div className="grid size-12 place-items-center rounded-2xl bg-emerald-100 text-xl font-black text-emerald-900">S</div>
        <p className="mt-8 text-sm font-medium text-emerald-800">Signed in successfully</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Welcome to StockFlow</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Your workspace is <span className="font-medium text-slate-700">{user.organization?.name}</span>.
        </p>
        <button onClick={logout} className="mt-8 text-sm font-semibold text-emerald-800 hover:text-emerald-950">Sign out</button>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WorkspacePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
