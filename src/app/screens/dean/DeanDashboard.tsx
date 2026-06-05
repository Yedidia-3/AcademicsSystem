import { useEffect, useState, useCallback } from "react";
import { GraduationCap, Users, CheckCircle, Share2, Loader2 } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router";
import { api } from "../../../lib/api";
import { useAutoRefresh } from "../../../lib/useAutoRefresh";

interface AcademicYear { id: number; name: string; status: string; }
interface PLevel { id: number; name: string; status: string; classes: { id: number; students: any[] }[]; }
interface ShuffleSession { id: number; status: string; p_level: { id: number; name: string }; student_count?: number; }

const statusColor: Record<string, string> = {
  distributed: "#1A7F4B",
  approved: "#1A7F4B",
  pending_approval: "#D97706",
  in_progress: "#C9A84C",
  active: "#001F5B",
  rejected: "#C0392B",
};

const statusLabel: Record<string, string> = {
  distributed: "Distributed",
  approved: "Approved",
  pending_approval: "Pending Approval",
  in_progress: "In Progress",
  active: "Active",
  rejected: "Rejected",
};

export function DeanDashboard() {
  const navigate = useNavigate();
  const [activeYear, setActiveYear] = useState<AcademicYear | null>(null);
  const [pLevels, setPLevels] = useState<PLevel[]>([]);
  const [sessions, setSessions] = useState<ShuffleSession[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const years = await api.get<any>('/api/v1/academics/academic-years');
      const yearList: AcademicYear[] = Array.isArray(years) ? years : years.data ?? [];
      const active = yearList.find(y => y.status === 'active') ?? null;
      setActiveYear(active);
      if (active) {
        const [pl, sess] = await Promise.all([
          api.get<any>(`/api/v1/academics/p-levels?academic_year_id=${active.id}`),
          // Dean-accessible: every shuffle session with its live status
          api.get<any>('/api/v1/academics/shuffle/sessions').catch(() => []),
        ]);
        setPLevels(Array.isArray(pl) ? pl : pl.data ?? []);
        setSessions(Array.isArray(sess) ? sess : sess.data ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load);

  const totalStudents = pLevels.reduce((sum, pl) => sum + (pl.classes?.reduce((s, c) => s + (c.students?.length ?? 0), 0) ?? 0), 0);
  const pendingCount     = sessions.filter(s => s.status === 'pending_approval').length;
  const approvedCount    = sessions.filter(s => s.status === 'approved').length;
  const distributedCount = sessions.filter(s => s.status === 'distributed').length;

  const stats = [
    { label: "Total P-Levels", value: loading ? "—" : String(pLevels.length), icon: GraduationCap, color: "#001F5B" },
    { label: "Pending Approval", value: loading ? "—" : String(pendingCount), icon: CheckCircle, color: "#D97706" },
    { label: "Ready / Distributed", value: loading ? "—" : String(approvedCount + distributedCount), icon: Share2, color: "#1A7F4B" },
    { label: "Total Students", value: loading ? "—" : String(totalStudents), icon: Users, color: "#800020" },
  ];

  return (
    <div className="space-y-6">
      {activeYear && (
        <p className="text-sm" style={{ color: "#9A9A9A" }}>Academic Year: <strong style={{ color: "#2C2C2C" }}>{activeYear.name}</strong></p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} style={{ borderColor: "#E5E5E7" }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: "#9A9A9A" }}>{stat.label}</p>
                    <p className="text-3xl font-bold mt-2" style={{ color: "#2C2C2C" }}>{stat.value}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}20` }}>
                    <Icon size={24} style={{ color: stat.color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin" size={32} style={{ color: "#001F5B" }} />
        </div>
      ) : (
        <>
          {pLevels.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: "#2C2C2C" }}>P-Level Overview</h3>
              <div className="space-y-3">
                {pLevels.map((pl) => {
                  const session = sessions.find(s => s.p_level?.id === pl.id);
                  const displayStatus = session ? session.status : 'active';
                  return (
                    <div key={pl.id} className="flex items-center justify-between p-4 rounded-lg border bg-white"
                      style={{ borderColor: "#E5E5E7" }}>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold" style={{ color: "#2C2C2C" }}>{pl.name}</span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: statusColor[displayStatus] ?? "#9A9A9A" }}>
                          {statusLabel[displayStatus] ?? displayStatus}
                        </span>
                      </div>
                      <Button variant="outline" size="sm"
                        onClick={() => navigate(`/dean/p-levels/${pl.id}/classes`)}
                        style={{ color: "#800020", borderColor: "#800020" }}>
                        Manage
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Button onClick={() => navigate("/dean/import")} className="h-20"
              style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
              Import Excel Data
            </Button>
            <Button onClick={() => navigate("/dean/p-levels")} className="h-20" variant="outline"
              style={{ color: "#001F5B", borderColor: "#001F5B" }}>
              Manage P-Levels
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
