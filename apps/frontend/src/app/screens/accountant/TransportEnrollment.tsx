import { useState, useEffect, useCallback } from "react";
import { Search, Download, Loader2, MoreVertical, Bus, Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Checkbox } from "../../components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { api } from "../../../lib/api";
import { toast } from "sonner";
import { useAutoRefresh } from "../../../lib/useAutoRefresh";

interface Zone { id: number; name: string; price: number; }

interface PaymentCell { paid_on: string; months: number; expires_on: string; }

interface Enrollment {
  id: number;
  student_id: number;
  zone_id: number | null;
  payments: Record<string, PaymentCell>;
  student: {
    id: number;
    name: string;
    current_class: { id: number; name: string; p_level: { id: number; name: string } | null } | null;
  } | null;
}

// Timezone-safe: parse YYYY-MM-DD as a LOCAL date (not UTC) so the expiry
// stays in sync with the exact date the accountant picked.
function addMonths(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1 + months, d);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}
function fmtLocal(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
function cellState(cell?: PaymentCell): "none" | "active" | "soon" | "expired" {
  if (!cell) return "none";
  const today = new Date().toISOString().split('T')[0];
  if (cell.expires_on < today) return "expired";
  const soon = new Date(); soon.setDate(soon.getDate() + 3);
  if (cell.expires_on <= soon.toISOString().split('T')[0]) return "soon";
  return "active";
}
const STATE_COLOR: Record<string, string> = { active: "#1A7F4B", soon: "#D97706", expired: "#C0392B" };
const DURATION_OPTIONS = [
  { label: "1 month", months: 1 },
  { label: "2 months", months: 2 },
  { label: "3 months", months: 3 },
  { label: "Full term (4 months)", months: 4 },
];

const MONTHS = [1, 2, 3, 4];
const MONTH_LABEL = ["1st", "2nd", "3rd", "4th"];

function classLabel(e: Enrollment): string {
  const cc = e.student?.current_class;
  if (!cc) return "—";
  return `${cc.p_level?.name ?? ""}${cc.name}`;
}
function pLevelName(e: Enrollment): string {
  return e.student?.current_class?.p_level?.name ?? "";
}

export function TransportEnrollment() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pLevelFilter, setPLevelFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [savingId, setSavingId] = useState<number | null>(null);

  const [payTarget, setPayTarget] = useState<{ e: Enrollment; key: string; label: string } | null>(null);
  const [payDate, setPayDate] = useState("");
  const [payMonths, setPayMonths] = useState<string>("1");

  const load = useCallback(async () => {
    try {
      const [enrollRes, zoneRes] = await Promise.all([
        api.get<any>('/api/v1/accountant/enrollments?type=transport'),
        api.get<any>('/api/v1/accountant/zones').catch(() => []),
      ]);
      setEnrollments(Array.isArray(enrollRes) ? enrollRes : enrollRes.data ?? []);
      setZones(Array.isArray(zoneRes) ? zoneRes : zoneRes.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load);

  const pLevels = Array.from(new Set(enrollments.map(pLevelName).filter(Boolean))).sort();
  const classesForFilter = Array.from(
    new Set(
      enrollments
        .filter(e => pLevelFilter === "all" || pLevelName(e) === pLevelFilter)
        .map(classLabel)
        .filter(c => c !== "—")
    )
  ).sort();

  const filtered = enrollments.filter(e => {
    const matchSearch = (e.student?.name ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchPLevel = pLevelFilter === "all" || pLevelName(e) === pLevelFilter;
    const matchClass = classFilter === "all" || classLabel(e) === classFilter;
    return matchSearch && matchPLevel && matchClass;
  });

  const savePayments = async (e: Enrollment, next: Record<string, PaymentCell>) => {
    setEnrollments(prev => prev.map(x => x.id === e.id ? { ...x, payments: next } : x));
    setSavingId(e.id);
    try {
      await api.put(`/api/v1/accountant/enrollments/${e.id}/payments`, { payments: next });
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to update payment');
      load();
    } finally {
      setSavingId(null);
    }
  };

  const onToggle = (e: Enrollment, month: number) => {
    if (!e.zone_id) { toast.error('Assign a zone before recording payment'); return; }
    const key = `${month}`;
    if (e.payments?.[key]) {
      const next = { ...e.payments };
      delete next[key];
      savePayments(e, next);
    } else {
      setPayTarget({ e, key, label: `${e.student?.name ?? ''} · Month ${month} Transport` });
      setPayDate(new Date().toISOString().split('T')[0]);
      setPayMonths("1");
    }
  };

  const confirmPayment = () => {
    if (!payTarget || !payDate) return;
    const months = +payMonths;
    const cell: PaymentCell = { paid_on: payDate, months, expires_on: addMonths(payDate, months) };
    const next = { ...(payTarget.e.payments ?? {}), [payTarget.key]: cell };
    savePayments(payTarget.e, next);
    setPayTarget(null);
  };

  const setZone = async (e: Enrollment, zoneId: string) => {
    setEnrollments(prev => prev.map(x => x.id === e.id ? { ...x, zone_id: +zoneId } : x));
    try {
      await api.put(`/api/v1/accountant/enrollments/${e.id}/zone`, { zone_id: +zoneId });
      toast.success('Zone updated');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to set zone');
      load();
    }
  };

  const handleWaive = async (e: Enrollment) => {
    try {
      await api.delete(`/api/v1/accountant/enrollments/${e.id}`);
      toast.success(`${e.student?.name ?? 'Student'} removed from transport`);
      load();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to remove');
    }
  };

  const zoneName = (id: number | null) => zones.find(z => z.id === id)?.name ?? null;

  const handleExport = () => {
    const header = "Name,Class,Zone," + MONTHS.map(m => `M${m}`).join(",") + "\n";
    const rows = filtered.map(e => {
      const cells = MONTHS.map(m => e.payments?.[`${m}`]?.expires_on ? `exp ${e.payments[`${m}`].expires_on}` : "");
      return `"${e.student?.name ?? ''}","${classLabel(e)}","${zoneName(e.zone_id) ?? ''}",${cells.map(c => `"${c}"`).join(",")}`;
    }).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'transport-enrollments.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>Transport</h1>
          <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>
            Assign a zone and tick monthly payments for each enrolled student
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-11" onClick={handleExport}
            style={{ color: "#800020", borderColor: "#800020" }}>
            <Download size={18} className="mr-2" /> Download
          </Button>
          <Button className="h-11" onClick={() => navigate('/accountant/class-lists')}
            style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
            <Plus size={18} className="mr-2" /> Add Students (from Class Lists)
          </Button>
        </div>
      </div>

      <Card style={{ borderColor: "#E5E5E7" }}>
        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9A9A9A" }} />
              <Input placeholder="Search student name..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-11" />
            </div>
            <Select value={pLevelFilter} onValueChange={(v) => { setPLevelFilter(v); setClassFilter("all"); }}>
              <SelectTrigger className="w-full md:w-44 h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All P-Levels</SelectItem>
                {pLevels.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full md:w-44 h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classesForFilter.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin" size={28} style={{ color: "#001F5B" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Bus size={48} className="mx-auto mb-3" style={{ color: "#9A9A9A" }} />
              <p className="text-lg font-semibold" style={{ color: "#2C2C2C" }}>No students in transport</p>
              <p className="text-sm mt-2 mb-4" style={{ color: "#9A9A9A" }}>
                Import students from <strong>Class Lists</strong> → toggle a P-Level → "Import to Transport".
              </p>
              <Button onClick={() => navigate('/accountant/class-lists')}
                style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
                Go to Class Lists
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto" style={{ borderColor: "#E5E5E7" }}>
              <Table>
                <TableHeader style={{ backgroundColor: "#001F5B" }}>
                  <TableRow>
                    <TableHead className="text-white sticky left-0" style={{ backgroundColor: "#001F5B" }}>Name</TableHead>
                    <TableHead className="text-white">Class</TableHead>
                    {MONTHS.map((m, i) => (
                      <TableHead key={m} className="text-white text-center">{MONTH_LABEL[i]} Month</TableHead>
                    ))}
                    <TableHead className="text-white">Zone</TableHead>
                    <TableHead className="text-white text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e, index) => (
                    <TableRow key={e.id} style={{ backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F4F4F6" }}>
                      <TableCell className="font-medium sticky left-0"
                        style={{ color: "#2C2C2C", backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F4F4F6" }}>
                        {e.student?.name ?? '—'}
                        {savingId === e.id && <Loader2 className="inline ml-2 h-3 w-3 animate-spin" />}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded text-xs font-semibold text-white"
                          style={{ backgroundColor: "#001F5B" }}>{classLabel(e)}</span>
                      </TableCell>
                      {MONTHS.map(m => {
                        const cell = e.payments?.[`${m}`];
                        const state = cellState(cell);
                        return (
                          <TableCell key={m} className="text-center">
                            <div className="flex flex-col items-center gap-0.5"
                              title={cell ? `Paid ${cell.paid_on} · expires ${cell.expires_on}` : (e.zone_id ? 'Not paid' : 'Assign a zone first')}>
                              <Checkbox
                                checked={!!cell}
                                disabled={!e.zone_id}
                                onCheckedChange={() => onToggle(e, m)}
                              />
                              {cell && (
                                <span className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: STATE_COLOR[state] }} />
                              )}
                            </div>
                          </TableCell>
                        );
                      })}
                      <TableCell>
                        <Select value={e.zone_id ? String(e.zone_id) : ""} onValueChange={(v) => setZone(e, v)}>
                          <SelectTrigger className="w-32 h-9">
                            <SelectValue placeholder="Select zone" />
                          </SelectTrigger>
                          <SelectContent>
                            {zones.length === 0 ? (
                              <SelectItem value="__none" disabled>No zones</SelectItem>
                            ) : zones.map(z => (
                              <SelectItem key={z.id} value={String(z.id)}>{z.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm"><MoreVertical size={16} /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-red-600" onClick={() => handleWaive(e)}>
                              Remove from Transport
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && (
            <p className="text-sm mt-3" style={{ color: "#9A9A9A" }}>
              {filtered.length} student{filtered.length !== 1 ? 's' : ''} in transport
            </p>
          )}
        </CardContent>
      </Card>

      {/* Payment date dialog */}
      <Dialog open={!!payTarget} onOpenChange={(o) => !o && setPayTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>{payTarget?.label}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Payment Date</Label>
              <Input type="date" value={payDate} onChange={e => setPayDate(e.target.value)}
                className="mt-2 h-11" />
            </div>
            <div>
              <Label>Duration</Label>
              <Select value={payMonths} onValueChange={setPayMonths}>
                <SelectTrigger className="w-full h-11 mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map(o => (
                    <SelectItem key={o.months} value={String(o.months)}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {payDate && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#F0FDF4" }}>
                <p className="text-sm" style={{ color: "#1A7F4B" }}>
                  Paid <strong>{fmtLocal(payDate)}</strong> → expires <strong>{fmtLocal(addMonths(payDate, +payMonths))}</strong>
                </p>
                <p className="text-xs mt-1" style={{ color: "#15803D" }}>
                  You'll be reminded as this date approaches.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPayTarget(null)}>Cancel</Button>
            <Button onClick={confirmPayment} disabled={!payDate}
              style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
              Save Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
