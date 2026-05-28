import { useState, useEffect } from "react";
import { FileText, Download, CheckSquare, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { api } from "../../../lib/api";
import { toast } from "sonner";

interface ExpiringEnrollment {
  id: number;
  type: 'feeding' | 'transport';
  meal_type: string | null;
  expiry_date: string;
  student: {
    id: number;
    name: string;
    current_class: {
      name: string;
      p_level: { name: string; };
    } | null;
  } | null;
  zone: { name: string; } | null;
  selected?: boolean;
}

const FILTER_OPTIONS = [
  { label: 'Expiring Today', days: 0 },
  { label: 'Expiring in 2 Days', days: 2 },
  { label: 'Expiring in 3 Days', days: 3 },
  { label: 'Expiring in 7 Days', days: 7 },
];

function getServiceLabel(e: ExpiringEnrollment): string {
  if (e.type === 'feeding') {
    if (e.meal_type === 'breakfast') return 'Feeding – Breakfast';
    if (e.meal_type === 'lunch') return 'Feeding – Lunch';
    return 'Feeding – Breakfast & Lunch';
  }
  if (e.type === 'transport') {
    return e.zone ? `Transport – ${e.zone.name}` : 'Transport';
  }
  return e.type;
}

function getClassName(e: ExpiringEnrollment): string {
  if (!e.student?.current_class) return '—';
  return `${e.student.current_class.p_level?.name ?? ''}${e.student.current_class.name}`;
}

export function CommuniqueGenerator() {
  const [enrollments, setEnrollments] = useState<ExpiringEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDays, setFilterDays] = useState<string>("3");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [currentStep, setCurrentStep] = useState<"select" | "preview">("select");

  const load = async (days: number) => {
    setLoading(true);
    setSelected(new Set());
    try {
      const res = await api.get<any>(`/api/v1/accountant/enrollments/expiring?days=${days}`);
      setEnrollments(Array.isArray(res) ? res : res.data ?? []);
    } catch {
      toast.error('Failed to load expiring enrollments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(+filterDays); }, [filterDays]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(enrollments.map(e => e.id)));
    } else {
      setSelected(new Set());
    }
  };

  const handleSelect = (id: number, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id); else next.delete(id);
    setSelected(next);
  };

  const selectedEnrollments = enrollments.filter(e => selected.has(e.id));
  const selectedCount = selectedEnrollments.length;

  const handleGeneratePDF = () => {
    if (selectedCount === 0) {
      toast.error("Please select at least one student");
      return;
    }

    // Generate CSV as a practical download
    const header = "Student Name,Class,Service,Expiry Date\n";
    const rows = selectedEnrollments.map(e =>
      `"${e.student?.name ?? ''}","${getClassName(e)}","${getServiceLabel(e)}","${e.expiry_date}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `communiques-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`${selectedCount} communiqué(s) downloaded`);
    setCurrentStep("select");
    setSelected(new Set());
  };

  const isExpiredToday = (expiry: string) => {
    const today = new Date().toISOString().split('T')[0];
    return expiry === today;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>Generate Communiqué</h1>
        <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>
          Create payment reminder slips for expiring subscriptions
        </p>
      </div>

      {/* Step Indicator */}
      <Card style={{ borderColor: "#E5E5E7" }}>
        <CardContent className="p-4">
          <div className="flex items-center">
            {["Select Students", "Preview & Generate"].map((step, index) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm"
                    style={{
                      backgroundColor: currentStep === ["select", "preview"][index] ? "#800020" : "#E5E5E7",
                      color: currentStep === ["select", "preview"][index] ? "#FFFFFF" : "#9A9A9A",
                    }}>
                    {index + 1}
                  </div>
                  <p className="text-sm mt-2 font-medium whitespace-nowrap"
                    style={{ color: currentStep === ["select", "preview"][index] ? "#800020" : "#9A9A9A" }}>
                    {step}
                  </p>
                </div>
                {index < 1 && (
                  <div className="h-0.5 flex-1 mx-4 -mt-6" style={{ backgroundColor: "#E5E5E7" }} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Select Students */}
      {currentStep === "select" && (
        <Card style={{ borderColor: "#E5E5E7" }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Expiring Enrollments</CardTitle>
              <Select value={filterDays} onValueChange={setFilterDays}>
                <SelectTrigger className="w-52 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILTER_OPTIONS.map(o => (
                    <SelectItem key={o.days} value={String(o.days)}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin" size={28} style={{ color: "#001F5B" }} />
              </div>
            ) : enrollments.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto mb-3" style={{ color: "#9A9A9A" }} />
                <p className="text-lg font-semibold" style={{ color: "#2C2C2C" }}>No Expiring Enrollments</p>
                <p className="text-sm mt-2" style={{ color: "#9A9A9A" }}>
                  No enrollments expiring within the selected timeframe.
                </p>
              </div>
            ) : (
              <>
                <div className="border rounded-lg overflow-hidden" style={{ borderColor: "#E5E5E7" }}>
                  <Table>
                    <TableHeader style={{ backgroundColor: "#001F5B" }}>
                      <TableRow>
                        <TableHead className="text-white w-12">
                          <Checkbox
                            checked={enrollments.length > 0 && selected.size === enrollments.length}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="text-white">Student</TableHead>
                        <TableHead className="text-white">Class</TableHead>
                        <TableHead className="text-white">Service</TableHead>
                        <TableHead className="text-white">Expiry Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollments.map((e, index) => (
                        <TableRow key={e.id}
                          style={{ backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F4F4F6" }}>
                          <TableCell>
                            <Checkbox
                              checked={selected.has(e.id)}
                              onCheckedChange={(checked) => handleSelect(e.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell className="font-medium" style={{ color: "#2C2C2C" }}>
                            {e.student?.name ?? '—'}
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded text-xs font-semibold text-white"
                              style={{ backgroundColor: "#001F5B" }}>
                              {getClassName(e)}
                            </span>
                          </TableCell>
                          <TableCell style={{ color: "#2C2C2C" }}>{getServiceLabel(e)}</TableCell>
                          <TableCell className="font-medium"
                            style={{ color: isExpiredToday(e.expiry_date) ? "#C0392B" : "#D97706" }}>
                            {new Date(e.expiry_date).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare size={20} style={{ color: "#800020" }} />
                    <span className="font-medium" style={{ color: "#2C2C2C" }}>
                      {selectedCount} student{selectedCount !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <Button onClick={() => setCurrentStep("preview")} disabled={selectedCount === 0}
                    className="h-11" style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
                    Continue to Preview
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Preview */}
      {currentStep === "preview" && (
        <Card style={{ borderColor: "#E5E5E7" }}>
          <CardHeader>
            <CardTitle>Preview Communiqué Template</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Template preview */}
            <div className="mb-6 p-6 border-2 border-dashed rounded-lg"
              style={{ borderColor: "#E5E5E7", backgroundColor: "#FAFAFA" }}>
              <div className="max-w-md mx-auto space-y-4">
                <div className="text-lg font-bold text-center" style={{ color: "#800020" }}>
                  JERICHO SCHOOL — Payment Reminder
                </div>
                <div className="h-px" style={{ backgroundColor: "#E5E5E7" }} />
                <div className="space-y-2">
                  <p style={{ color: "#2C2C2C" }}>
                    <strong>Dear Parent/Guardian of:</strong> [Student Name]
                  </p>
                  <p style={{ color: "#2C2C2C" }}><strong>Class:</strong> [Class]</p>
                  <p style={{ color: "#2C2C2C" }}><strong>Service:</strong> [Service]</p>
                  <p className="mt-4" style={{ color: "#2C2C2C" }}>
                    Your child's subscription expires on <strong>[Expiry Date]</strong>.
                  </p>
                  <p style={{ color: "#2C2C2C" }}>
                    Please renew at the school's accounting office.
                  </p>
                </div>
                <div className="h-px" style={{ backgroundColor: "#E5E5E7" }} />
                <p className="text-sm italic text-center" style={{ color: "#9A9A9A" }}>
                  Thank you for your cooperation
                </p>
              </div>
            </div>

            {/* Selected students list */}
            <div className="border rounded-lg overflow-hidden mb-6" style={{ borderColor: "#E5E5E7" }}>
              <Table>
                <TableHeader style={{ backgroundColor: "#F4F4F6" }}>
                  <TableRow>
                    <TableHead style={{ color: "#2C2C2C" }}>Student</TableHead>
                    <TableHead style={{ color: "#2C2C2C" }}>Class</TableHead>
                    <TableHead style={{ color: "#2C2C2C" }}>Service</TableHead>
                    <TableHead style={{ color: "#2C2C2C" }}>Expiry</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedEnrollments.map((e, index) => (
                    <TableRow key={e.id}
                      style={{ backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F4F4F6" }}>
                      <TableCell className="font-medium" style={{ color: "#2C2C2C" }}>
                        {e.student?.name ?? '—'}
                      </TableCell>
                      <TableCell style={{ color: "#2C2C2C" }}>{getClassName(e)}</TableCell>
                      <TableCell style={{ color: "#2C2C2C" }}>{getServiceLabel(e)}</TableCell>
                      <TableCell style={{ color: "#C0392B" }}>
                        {new Date(e.expiry_date).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: "#F4F4F6" }}>
              <p style={{ color: "#2C2C2C" }}>
                <strong>{selectedCount}</strong> communiqué{selectedCount !== 1 ? 's' : ''} will be generated
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setCurrentStep("select")} className="flex-1 h-11">
                Back
              </Button>
              <Button onClick={handleGeneratePDF} className="flex-1 h-11"
                style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
                <Download size={18} className="mr-2" />
                Download CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
