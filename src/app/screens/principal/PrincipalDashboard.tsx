import { useState, useEffect, useCallback } from "react";
import { AlertCircle, CheckCircle, XCircle, Loader2, Trash2, ClipboardList } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { useAutoRefresh } from "../../../lib/useAutoRefresh";
import { toast } from "sonner";

interface ShuffleSession {
  id: number;
  status: string;
  p_level: { id: number; name: string };
  submitted_at: string | null;
  reviewed_at: string | null;
  rejection_note: string | null;
  student_count?: number;
}

interface YearDeletion { id: number; name: string; deletion_requested_at: string | null; }

type Filter = "all" | "pending_approval" | "approved" | "rejected";

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending_approval: { label: "Pending", color: "#D97706", bg: "#FEF3E8" },
  approved:         { label: "Approved", color: "#1A7F4B", bg: "#F0FDF4" },
  distributed:      { label: "Distributed", color: "#2563EB", bg: "#EFF6FF" },
  rejected:         { label: "Rejected", color: "#C0392B", bg: "#FEE2E2" },
  in_progress:      { label: "Draft", color: "#9A9A9A", bg: "#F4F4F6" },
};

export function PrincipalDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ShuffleSession[]>([]);
  const [deletions, setDeletions] = useState<YearDeletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pending_approval");

  const load = useCallback(async () => {
    try {
      const [sess, dels] = await Promise.all([
        api.get<any>('/api/v1/academics/shuffle/sessions').catch(() => []),
        api.get<any>('/api/v1/admin/academic-years/pending-deletions').catch(() => []),
      ]);
      setSessions(Array.isArray(sess) ? sess : sess.data ?? []);
      setDeletions(Array.isArray(dels) ? dels : dels.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load);

  const counts = {
    pending_approval: sessions.filter(s => s.status === 'pending_approval').length,
    approved: sessions.filter(s => s.status === 'approved' || s.status === 'distributed').length,
    rejected: sessions.filter(s => s.status === 'rejected').length,
  };

  const filtered = sessions.filter(s => {
    if (filter === "all") return true;
    if (filter === "approved") return s.status === 'approved' || s.status === 'distributed';
    return s.status === filter;
  });

  const firstName = (user?.name ?? "Principal").split(" ")[0];

  const stats: { key: Filter; label: string; value: number; icon: any; color: string }[] = [
    { key: "pending_approval", label: "Pending Approvals", value: counts.pending_approval, icon: AlertCircle, color: "#D97706" },
    { key: "approved", label: "Approved", value: counts.approved, icon: CheckCircle, color: "#1A7F4B" },
    { key: "rejected", label: "Rejected", value: counts.rejected, icon: XCircle, color: "#C0392B" },
  ];

  const handleDeletion = async (id: number, name: string, approve: boolean) => {
    if (approve && !confirm(`Approve deletion of ${name}? This permanently removes the year and all its data.`)) return;
    try {
      await api.post(`/api/v1/admin/academic-years/${id}/${approve ? 'approve' : 'reject'}-deletion`, {});
      toast.success(approve ? `${name} deleted` : `Deletion of ${name} rejected`);
      await load();
    } catch (err: any) {
      toast.error(err.message ?? 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="rounded-xl p-6 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(120deg, #800020 0%, #a3082a 100%)" }}>
        <div className="absolute right-0 top-0 w-40 h-40 rounded-full opacity-10"
          style={{ backgroundColor: "#C9A84C", transform: "translate(30%, -30%)" }} />
        <h2 className="text-2xl font-bold relative z-10">Welcome, {firstName}</h2>
        <p className="mt-1 relative z-10" style={{ color: "rgba(255,255,255,0.8)" }}>
          {counts.pending_approval > 0
            ? `${counts.pending_approval} class list${counts.pending_approval !== 1 ? 's' : ''} awaiting your review`
            : "You're all caught up — no pending approvals"}
        </p>
      </div>

      {/* Stat cards (click to filter) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          const active = filter === stat.key;
          return (
            <button key={stat.key} onClick={() => setFilter(stat.key)} className="text-left">
              <Card style={{ borderColor: active ? stat.color : "#E5E5E7", borderWidth: active ? 2 : 1 }}>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: "#9A9A9A" }}>{stat.label}</p>
                    <p className="text-3xl font-bold mt-1" style={{ color: "#2C2C2C" }}>{loading ? "—" : stat.value}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}20` }}>
                    <Icon size={24} style={{ color: stat.color }} />
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      {/* Year deletion approvals */}
      {deletions.length > 0 && (
        <Card style={{ borderColor: "#C0392B", backgroundColor: "#FEF2F2" }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Trash2 size={18} style={{ color: "#C0392B" }} />
              <h3 className="font-semibold" style={{ color: "#C0392B" }}>Academic Year Deletion Requests</h3>
            </div>
            <div className="space-y-2">
              {deletions.map(d => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-white border"
                  style={{ borderColor: "#FECACA" }}>
                  <div>
                    <span className="font-bold" style={{ color: "#2C2C2C" }}>{d.name}</span>
                    <span className="text-sm ml-2" style={{ color: "#9A9A9A" }}>
                      requested by Super Admin
                      {d.deletion_requested_at ? ` · ${new Date(d.deletion_requested_at).toLocaleDateString()}` : ''}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleDeletion(d.id, d.name, false)}
                      style={{ color: "#9A9A9A", borderColor: "#E5E5E7" }}>Reject</Button>
                    <Button size="sm" onClick={() => handleDeletion(d.id, d.name, true)}
                      style={{ backgroundColor: "#C0392B", color: "#fff" }}>Approve &amp; Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {([
          { k: "pending_approval", label: `Pending (${counts.pending_approval})` },
          { k: "approved", label: `Approved (${counts.approved})` },
          { k: "rejected", label: `Rejected (${counts.rejected})` },
          { k: "all", label: "All" },
        ] as { k: Filter; label: string }[]).map(t => {
          const active = filter === t.k;
          return (
            <button key={t.k} onClick={() => setFilter(t.k)}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
              style={{ backgroundColor: active ? "#800020" : "#F4F4F6", color: active ? "#fff" : "#9A9A9A" }}>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Sessions list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin" size={28} style={{ color: "#001F5B" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border rounded-lg" style={{ borderColor: "#E5E5E7" }}>
          <ClipboardList size={48} className="mx-auto mb-3" style={{ color: "#9A9A9A" }} />
          <p style={{ color: "#9A9A9A" }}>No {filter === 'all' ? '' : STATUS_META[filter]?.label.toLowerCase() + ' '}class lists.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => {
            const meta = STATUS_META[s.status] ?? STATUS_META.in_progress;
            return (
              <div key={s.id} className="flex items-center justify-between p-4 rounded-lg border bg-white gap-4"
                style={{ borderColor: "#E5E5E7" }}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg font-bold" style={{ color: "#2C2C2C" }}>{s.p_level?.name ?? '—'}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: meta.bg, color: meta.color }}>{meta.label}</span>
                    {typeof s.student_count === 'number' && (
                      <span className="text-sm" style={{ color: "#9A9A9A" }}>· {s.student_count} students</span>
                    )}
                  </div>
                  <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>
                    {s.status === 'pending_approval' && s.submitted_at && `Submitted ${new Date(s.submitted_at).toLocaleDateString()}`}
                    {(s.status === 'approved' || s.status === 'distributed') && s.reviewed_at && `Approved ${new Date(s.reviewed_at).toLocaleDateString()}`}
                    {s.status === 'rejected' && s.reviewed_at && `Rejected ${new Date(s.reviewed_at).toLocaleDateString()}`}
                  </p>
                  {s.status === 'rejected' && s.rejection_note && (
                    <p className="text-sm mt-1 italic" style={{ color: "#C0392B" }}>“{s.rejection_note}”</p>
                  )}
                </div>
                <Button onClick={() => navigate(`/principal/review/${s.id}`)}
                  style={{ backgroundColor: s.status === 'pending_approval' ? "#800020" : "#FFFFFF",
                           color: s.status === 'pending_approval' ? "#FFFFFF" : "#800020",
                           borderColor: "#800020", borderWidth: 1 }}>
                  {s.status === 'pending_approval' ? 'Review' : 'View'}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
