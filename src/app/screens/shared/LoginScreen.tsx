import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { api } from "../../../lib/api";
import { useAuth, AuthUser, UserRole } from "../../../lib/auth";

const roleRoutes: Record<UserRole, string> = {
  super_admin: "/admin/dashboard",
  dean:        "/dean/dashboard",
  principal:   "/principal/dashboard",
  teacher:     "/teacher/dashboard",
  accountant:  "/accountant/dashboard",
};

export function LoginScreen() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post<{ token: string; user: AuthUser }>(
        '/api/v1/auth/login',
        { email, password }
      );
      setAuth(res.user, res.token);
      if (res.user.must_change_password) {
        navigate('/change-password');
      } else {
        navigate(roleRoutes[res.user.role] ?? '/');
      }
    } catch (err: any) {
      // No page reload — keep the email, clear only the password, and refocus
      // it so the user just retypes the password.
      setError(err.message ?? "Invalid email or password");
      setPassword("");
      requestAnimationFrame(() =>
        (document.getElementById("password") as HTMLInputElement | null)?.focus()
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ backgroundColor: "#F4F4F6" }}>

      {/* ── Left branding panel (hidden on mobile, shown md+) ──────────────── */}
      <div
        className="hidden lg:flex lg:w-2/5 xl:w-1/2 flex-col justify-center items-center relative overflow-hidden"
        style={{ backgroundColor: "#001F5B" }}
      >
        {/* Top decorative circle */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ backgroundColor: "#800020", transform: "translate(30%, -30%)" }}
        />

        <div className="text-center z-10 px-12 space-y-6 max-w-md">
          {/* Logo */}
          <div className="w-28 h-28 mx-auto rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#800020" }}>
            <svg viewBox="0 0 24 24" className="w-14 h-14 text-white" fill="currentColor">
              <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Jericho School
            </h1>
            <p className="text-xl mt-2" style={{ color: "#C9A84C" }}>Management System</p>
          </div>
          <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
            Streamlined academic management for teachers, deans, principals, and staff.
          </p>
        </div>

        {/* Bottom decorative circle */}
        <div
          className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10"
          style={{ backgroundColor: "#C9A84C", transform: "translate(-30%, 30%)" }}
        />
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
        <div className="w-full max-w-md">

          {/* Mobile-only logo */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: "#001F5B" }}>
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="currentColor">
                <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold" style={{ color: "#001F5B" }}>Jericho School</h1>
            <p className="text-sm" style={{ color: "#9A9A9A" }}>Management System</p>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold" style={{ color: "#2C2C2C" }}>Welcome back</h2>
            <p className="mt-2 text-base" style={{ color: "#9A9A9A" }}>Sign in to your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-sm font-medium" style={{ color: "#2C2C2C" }}>
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@jericho.rw"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 h-12 text-base"
                style={{ borderColor: error ? "#C0392B" : "#E5E5E7" }}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium" style={{ color: "#2C2C2C" }}>
                Password
              </Label>
              <div className="relative mt-2">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-base pr-11"
                  style={{ borderColor: error ? "#C0392B" : "#E5E5E7" }}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded"
                  style={{ color: "#9A9A9A" }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-lg text-sm" style={{ backgroundColor: "#FEE2E2", color: "#C0392B" }}>
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in…
                </>
              ) : "Sign In"}
            </Button>

            <p className="text-center text-sm" style={{ color: "#9A9A9A" }}>
              Forgot your password? Contact your administrator.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
