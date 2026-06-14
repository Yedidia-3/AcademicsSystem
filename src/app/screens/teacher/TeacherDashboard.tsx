import { useState, useEffect, useCallback } from "react";
import { GraduationCap, Users, Check, X, Clock, ClipboardCheck, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { useAutoRefresh } from "../../../lib/useAutoRefresh";

interface Summary {
  classes: number;
  students: number;
  present: number;
  absent: number;
  late: number;
  classes_marked: number;
  classes_pending: number;
}

export function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get<any>('/api/v1/academics/teacher/today-summary');
      setSummary(res?.data ?? res);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load);

  const firstName = (user?.name ?? "Teacher").split(" ")[0];
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
  const s = summary;

  const stats = [
    { label: "My Classes", value: s?.classes ?? 0, icon: GraduationCap, color: "#001F5B" },
    { label: "Total Students", value: s?.students ?? 0, icon: Users, color: "#800020" },
    { label: "Present Today", value: s?.present ?? 0, icon: Check, color: "#1A7F4B" },
    { label: "Absent Today", value: s?.absent ?? 0, icon: X, color: "#C0392B" },
  ];

  // A friendly headline insight
  const insight = (() => {
    if (!s) return "";
    if (s.classes === 0) return "No classes assigned yet — the Dean will distribute your class soon.";
    if (s.classes_pending > 0) return `You still have ${s.classes_pending} class${s.classes_pending !== 1 ? 'es' : ''} to mark today.`;
    if (s.absent > 0) return `${s.absent} student${s.absent !== 1 ? 's were' : ' was'} absent today across your classes.`;
    return "All present today — great attendance!";
  })();

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="rounded-xl p-6 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(120deg, #001F5B 0%, #002a7a 100%)" }}>
        <div className="absolute right-0 top-0 w-40 h-40 rounded-full opacity-10"
          style={{ backgroundColor: "#C9A84C", transform: "translate(30%, -30%)" }} />
        <h2 className="text-2xl font-bold relative z-10">Welcome back, {firstName} 👋</h2>
        <p className="mt-1 relative z-10" style={{ color: "rgba(255,255,255,0.75)" }}>{todayLabel}</p>
        {!loading && <p className="mt-3 text-sm relative z-10" style={{ color: "rgba(255,255,255,0.9)" }}>{insight}</p>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} style={{ borderColor: "#E5E5E7" }}>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: "#9A9A9A" }}>{stat.label}</p>
                  <p className="text-3xl font-bold mt-1" style={{ color: "#2C2C2C" }}>
                    {loading ? "—" : stat.value}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}20` }}>
                  <Icon size={22} style={{ color: stat.color }} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Today's attendance progress */}
      <Card style={{ borderColor: "#E5E5E7" }}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#C9A84C20" }}>
                <ClipboardCheck size={22} style={{ color: "#C9A84C" }} />
              </div>
              <div>
                <p className="font-semibold" style={{ color: "#2C2C2C" }}>Today's Attendance</p>
                {loading ? (
                  <p className="text-sm" style={{ color: "#9A9A9A" }}>Loading…</p>
                ) : (
                  <p className="text-sm" style={{ color: "#9A9A9A" }}>
                    {s?.classes_marked ?? 0} of {s?.classes ?? 0} classes marked
                    {(s?.late ?? 0) > 0 && (
                      <span> · <Clock size={12} className="inline" style={{ color: "#D97706" }} /> {s?.late} late</span>
                    )}
                  </p>
                )}
              </div>
            </div>
            <Button onClick={() => navigate("/teacher/my-classes")}
              style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
              Go to My Classes <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>

          {/* progress bar */}
          {!loading && (s?.classes ?? 0) > 0 && (
            <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#F4F4F6" }}>
              <div className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.round(((s?.classes_marked ?? 0) / (s?.classes || 1)) * 100)}%`,
                  backgroundColor: (s?.classes_pending ?? 0) === 0 ? "#1A7F4B" : "#D97706",
                }} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
