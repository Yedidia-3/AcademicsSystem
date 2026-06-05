import { useState, useEffect, useCallback } from "react";
import { AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router";
import { api } from "../../../lib/api";
import { useAutoRefresh } from "../../../lib/useAutoRefresh";

interface ShuffleSession {
  id: number;
  status: string;
  p_level: { id: number; name: string; };
  submitted_at: string | null;
}

export function PrincipalDashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ShuffleSession[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      // Full session list so approved/rejected counts are accurate
      const res = await api.get<any>('/api/v1/academics/shuffle/sessions');
      setSessions(Array.isArray(res) ? res : res.data ?? []);
    } catch {
      // silent — empty state is shown
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load);

  const pendingCount = sessions.filter(s => s.status === 'pending_approval').length;
  const approvedCount = sessions.filter(s => s.status === 'approved' || s.status === 'distributed').length;
  const rejectedCount = sessions.filter(s => s.status === 'rejected').length;

  const pendingSessions = sessions.filter(s => s.status === 'pending_approval');

  const stats = [
    { label: "Pending Approvals", value: loading ? "—" : String(pendingCount), icon: AlertCircle, color: "#D97706" },
    { label: "Approved This Year", value: loading ? "—" : String(approvedCount), icon: CheckCircle, color: "#1A7F4B" },
    { label: "Rejected This Year", value: loading ? "—" : String(rejectedCount), icon: XCircle, color: "#C0392B" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: "#2C2C2C" }}>Pending Approvals</h3>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin" size={28} style={{ color: "#001F5B" }} />
          </div>
        ) : pendingSessions.length === 0 ? (
          <div className="text-center py-12 border rounded-lg" style={{ borderColor: "#E5E5E7" }}>
            <CheckCircle size={48} className="mx-auto mb-3" style={{ color: "#1A7F4B" }} />
            <p style={{ color: "#9A9A9A" }}>No pending approvals at this time.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4 rounded-lg border bg-white"
                style={{ borderColor: "#E5E5E7" }}>
                <div>
                  <span className="text-lg font-bold mr-3" style={{ color: "#2C2C2C" }}>{s.p_level?.name ?? '—'}</span>
                  <span className="text-sm" style={{ color: "#9A9A9A" }}>
                    Submitted by Dean of Studies
                    {s.submitted_at ? ` on ${new Date(s.submitted_at).toLocaleDateString()}` : ''}
                  </span>
                </div>
                <Button onClick={() => navigate(`/principal/review/${s.id}`)}
                  style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
                  Review
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button onClick={() => navigate('/principal/approvals')} variant="outline"
        style={{ color: "#800020", borderColor: "#800020" }}>
        View All Submissions
      </Button>
    </div>
  );
}
