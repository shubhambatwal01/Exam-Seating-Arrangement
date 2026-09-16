import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  GraduationCap,
  CalendarDays,
  Armchair,
  BookOpenCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import CollegeHeader from "../components/CollegeHeader";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const submit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(form.email.trim(), form.password);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Invalid email or password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-[#f5f8fa]">
      <CollegeHeader />
      <main className="relative overflow-hidden">
        <div className="absolute -left-40 top-20 h-[380px] w-[380px] rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute -right-40 bottom-0 h-[420px] w-[420px] rounded-full bg-sky-400/10 blur-3xl" />

        <div className="relative mx-auto flex min-h-[calc(100vh-104px)] max-w-[1400px] items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid w-full max-w-[1080px] overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-[0_25px_70px_rgba(15,23,42,0.12)] lg:grid-cols-[1.05fr_0.95fr]">
            <section className="relative hidden min-h-[625px] overflow-hidden bg-gradient-to-br from-[#053b50] via-[#075b73] to-[#088395] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-12">
              <div className="absolute -right-24 -top-24 h-[280px] w-[280px] rounded-full border-[50px] border-white/5" />

              <div className="absolute -bottom-24 -left-24 h-[310px] w-[310px] rounded-full border-[55px] border-cyan-200/10" />

              <div className="relative z-10">
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                    Welcome to
                  </p>

                  <h2 className="max-w-[500px] text-[36px] font-bold leading-[1.15] tracking-tight">
                    Exam Seating &
                    <span className="block text-cyan-200">
                      Timetable Management
                    </span>
                  </h2>

                  <p className="mt-5 max-w-[490px] text-[14px] leading-7 text-cyan-50/80">
                    A centralized examination portal for managing students,
                    timetables, classrooms, fresh and backlog examinations,
                    seating arrangements and examination reports.
                  </p>
                </div>

                <div className="mt-9 grid gap-3">
                  <InfoCard
                    icon={<CalendarDays size={18} />}
                    title="Exam Timetable"
                    description="Plan and manage conflict-free examination schedules."
                  />

                  <InfoCard
                    icon={<Armchair size={18} />}
                    title="Seating Arrangement"
                    description="Generate organized hall-wise student seating."
                  />

                  <InfoCard
                    icon={<BookOpenCheck size={18} />}
                    title="Fresh & Backlog Students"
                    description="Manage current and backlog examination appearances."
                  />
                </div>
              </div>

              <div className="relative z-10 border-t border-white/15 pt-5">
                <div className="flex items-center gap-2 text-xs text-cyan-100/70">
                  <ShieldCheck size={15} />

                  <span>
                    Restricted access for authorized examination staff only
                  </span>
                </div>
              </div>
            </section>

            <section className="flex min-h-[610px] items-center px-5 py-10 sm:px-10 lg:px-12 xl:px-14">
              <div className="mx-auto w-full max-w-[390px]">
                <div className="mb-8">
                  <h2 className="mt-4 text-[30px] font-bold tracking-tight text-slate-900">
                    Sign in to your account
                  </h2>

                  <p className="mt-2 text-[13px] leading-6 text-slate-500">
                    Enter your registered examination department credentials to
                    continue.
                  </p>
                </div>

                <form onSubmit={submit}>
                  <div className="mb-5">
                    <label
                      htmlFor="email"
                      className="mb-2 block text-[13px] font-semibold text-slate-700"
                    >
                      Email Address
                    </label>

                    <div className="group relative">
                      <Mail
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-cyan-700"
                      />

                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        autoComplete="username"
                        disabled={loading}
                        required
                        className="h-[52px] w-full rounded-xl border border-slate-200 bg-[#f8fafc] pl-11 pr-4 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-600 focus:bg-white focus:ring-4 focus:ring-cyan-600/10 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="password"
                      className="mb-2 block text-[13px] font-semibold text-slate-700"
                    >
                      Password
                    </label>

                    <div className="group relative">
                      <LockKeyhole
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-cyan-700"
                      />

                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        disabled={loading}
                        required
                        className="h-[52px] w-full rounded-xl border border-slate-200 bg-[#f8fafc] pl-11 pr-12 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-600 focus:bg-white focus:ring-4 focus:ring-cyan-600/10 disabled:cursor-not-allowed disabled:opacity-60"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-cyan-700"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                      <p className="text-[12px] font-medium leading-5 text-red-600">
                        {error}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#087e8b] text-[13px] font-bold uppercase tracking-[0.08em] text-white shadow-[0_8px_20px_rgba(8,126,139,0.20)] transition duration-300 hover:bg-[#056775] hover:shadow-[0_10px_25px_rgba(8,126,139,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Signing In...
                      </>
                    ) : (
                      "Login"
                    )}
                  </button>
                </form>

                <div className="mt-7 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                  <LockKeyhole size={13} />
                  Secure examination management portal
                </div>

                <div className="mt-8 border-t border-slate-100 pt-5 text-center">
                  <p className="text-[10px] leading-5 text-slate-400">
                    Exam Seating Arrangement & Timetable Management System
                  </p>

                  <p className="text-[10px] text-slate-400">
                    Modern College, Ganeshkhind, Pune
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </section>
  );
}

function InfoCard({ icon, title, description }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3.5 backdrop-blur-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-300/15 text-cyan-100">
        {icon}
      </div>

      <div>
        <p className="text-[13px] font-semibold text-white">{title}</p>

        <p className="mt-0.5 text-[11px] leading-5 text-cyan-50/60">
          {description}
        </p>
      </div>
    </div>
  );
}
