import { useState, useEffect, useCallback } from "react";
import { Search, Download, Loader2, MoreVertical, Utensils, Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Checkbox } from "../../components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { api } from "../../../lib/api";
import { toast } from "sonner";
import { useAutoRefresh } from "../../../lib/useAutoRefresh";

interface Enrollment {
  id: number;
  student_id: number;
  payments: Record<string, boolean>;
  student: {
    id: number;
    name: string;
    current_class: { id: number; name: string; p_level: { id: number; name: string } | null } | null;
  } | null;
}

const MONTHS = [1, 2, 3, 4];
const MEALS: { key: "B" | "L"; label: string }[] = [
  { key: "B", label: "B" },
  { key: "L", label: "L" },
];

function classLabel(e: Enrollment): string {
  const cc = e.student?.current_class;
  if (!cc) return "—";
  return `${cc.p_level?.name ?? ""}${cc.name}`;
}
function pLevelName(e: Enrollment): string {
  return e.student?.current_class?.p_level?.name ?? "";
}

export function FeedingEnrollment() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pLevelFilter, setPLevelFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get<any>('/api/v1/accountant/enrollments?type=feeding');
      setEnrollments(Array.isArray(res) ? res : res.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load);

  // Distinct P-levels and classes for the filter dropdowns
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

  const togglePayment = async (e: Enrollment, month: number, meal: "B" | "L") => {
    const key = `${month}${meal}`;
    const next = { ...(e.payments ?? {}) };
    if (next[key]) delete next[key]; else next[key] = true;

    // optimistic update
    setEnrollments(prev => prev.map(x => x.id === e.id ? { ...x, payments: next } : x));
    setSavingId(e.id);
    try {
      await api.put(`/api/v1/accountant/enrollments/${e.id}/payments`, { payments: next });
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to update payment');
      load(); // revert from server
    } finally {
      setSavingId(null);
    }
  };

  const handleWaive = async (e: Enrollment) => {
    try {
      await api.delete(`/api/v1/accountant/enrollments/${e.id}`);
      toast.success(`${e.student?.name ?? 'Student'} removed from feeding`);
      load();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to remove');
    }
  };

  const handleExport = () => {
    const header = "Name,Class," + MONTHS.flatMap(m => [`M${m} Breakfast`, `M${m} Lunch`]).join(",") + "\n";
    const rows = filtered.map(e => {
      const cells = MONTHS.flatMap(m => [
        e.payments?.[`${m}B`] ? "Paid" : "",
        e.payments?.[`${m}L`] ? "Paid" : "",
      ]);
      return `"${e.student?.name ?? ''}","${classLabel(e)}",${cells.map(c => `"${c}"`).join(",")}`;
    }).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'feeding-enrollments.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>School Feeding</h1>
          <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>
            Tick Breakfast (B) and Lunch (L) per month for each enrolled student
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
              <Utensils size={48} className="mx-auto mb-3" style={{ color: "#9A9A9A" }} />
              <p className="text-lg font-semibold" style={{ color: "#2C2C2C" }}>No students in feeding</p>
              <p className="text-sm mt-2 mb-4" style={{ color: "#9A9A9A" }}>
                Import students from <strong>Class Lists</strong> → toggle a P-Level → "Import to Feeding".
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
                    {MONTHS.map(m => (
                      <TableHead key={m} className="text-white text-center" colSpan={2}>
                        {m === 1 ? "1st" : m === 2 ? "2nd" : m === 3 ? "3rd" : "4th"} Month
                      </TableHead>
                    ))}
                    <TableHead className="text-white text-right">Actions</TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead className="sticky left-0" style={{ backgroundColor: "#001F5B" }}></TableHead>
                    <TableHead></TableHead>
                    {MONTHS.map(m => MEALS.map(meal => (
                      <TableHead key={`${m}${meal.key}`} className="text-white text-center text-xs">{meal.label}</TableHead>
                    )))}
                    <TableHead></TableHead>
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
                      {MONTHS.map(m => MEALS.map(meal => {
                        const key = `${m}${meal.key}`;
                        return (
                          <TableCell key={key} className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={!!e.payments?.[key]}
                                onCheckedChange={() => togglePayment(e, m, meal.key)}
                              />
                            </div>
                          </TableCell>
                        );
                      }))}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm"><MoreVertical size={16} /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-red-600" onClick={() => handleWaive(e)}>
                              Remove from Feeding
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
              {filtered.length} student{filtered.length !== 1 ? 's' : ''} in feeding
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
