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
      navigate(roleRoutes[res.user.role] ?? '/');
    } catch (err: any) {
      setError(err.message ?? "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col md:flex-row">
      {/* Left Panel - Navy Blue */}
      <div
        className="md:w-1/2 p-8 md:p-16 flex flex-col justify-center items-center relative overflow-hidden"
        style={{ backgroundColor: "#001F5B" }}
      >
        {/* School Logo & Name */}
        <div className="text-center z-10 space-y-4">
          <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: "#800020" }}>
            <svg viewBox="0 0 24 24" className="w-12 h-12 text-white" fill="currentColor">
              <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white">Jericho School</h1>
          <p className="text-lg" style={{ color: "#C9A84C" }}>School Management System</p>
        </div>

        {/* Decorative element */}
        <div
          className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10"
          style={{ backgroundColor: "#800020", transform: "translate(-30%, 30%)" }}
        />
      </div>

      {/* Right Panel - White */}
      <div className="md:w-1/2 bg-white p-8 md:p-16 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          {/* School crest */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F4F4F6" }}>
              <svg viewBox="0 0 24 24" className="w-6 h-6" style={{ color: "#800020" }} fill="currentColor">
                <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" />
              </svg>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold mb-2" style={{ color: "#2C2C2C" }}>Welcome back</h2>
            <p className="text-sm" style={{ color: "#9A9A9A" }}>Sign in to your account</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@jericho.rw"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 h-11"
                style={{
                  borderColor: error ? "#C0392B" : "#9A9A9A",
                  backgroundColor: "#FFFFFF",
                }}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-2">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10"
                  style={{
                    borderColor: error ? "#C0392B" : "#9A9A9A",
                    backgroundColor: "#FFFFFF",
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#9A9A9A" }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-md text-sm" style={{ backgroundColor: "#FEE", color: "#C0392B" }}>
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 font-semibold"
              style={{
                backgroundColor: "#800020",
                color: "#FFFFFF",
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <p className="text-center text-sm" style={{ color: "#9A9A9A" }}>
              Forgot password? Contact your administrator
            </p>
          </form>

          {/* Quick login hints for demo */}
          <div className="mt-8 p-4 rounded-lg" style={{ backgroundColor: "#F4F4F6" }}>
            <p className="text-xs font-semibold mb-2" style={{ color: "#2C2C2C" }}>Demo Credentials:</p>
            <p className="text-xs" style={{ color: "#9A9A9A" }}>
              Email: admin@jericho.rw &nbsp;|&nbsp; Password: password
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
