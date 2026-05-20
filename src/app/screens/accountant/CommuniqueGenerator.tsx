import { useState } from "react";
import { FileText, Download, CheckSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { toast } from "sonner";

interface ExpiringStudent {
  id: string;
  name: string;
  class: string;
  service: string;
  expiryDate: string;
  selected: boolean;
}

const mockExpiringStudents: ExpiringStudent[] = [
  { id: "1", name: "Alice Mukamana", class: "P2A", service: "Feeding - Breakfast", expiryDate: "2024-05-20", selected: false },
  { id: "2", name: "Bob Nshimiyimana", class: "P2A", service: "Transport - Zone 1", expiryDate: "2024-05-20", selected: false },
  { id: "3", name: "Carol Uwase", class: "P2B", service: "Feeding - Lunch", expiryDate: "2024-05-21", selected: false },
  { id: "4", name: "David Habimana", class: "P3A", service: "Transport - Zone 2", expiryDate: "2024-05-22", selected: false },
  { id: "5", name: "Emma Iradukunda", class: "P2C", service: "Feeding - Both", expiryDate: "2024-05-22", selected: false },
];

export function CommuniqueGenerator() {
  const [students, setStudents] = useState<ExpiringStudent[]>(mockExpiringStudents);
  const [filter, setFilter] = useState<string>("all");
  const [currentStep, setCurrentStep] = useState<"select" | "preview" | "generate">("select");

  const filteredStudents = students.filter((student) => {
    if (filter === "all") return true;
    if (filter === "today") return student.expiryDate === "2024-05-20";
    if (filter === "2days") return student.expiryDate <= "2024-05-21";
    if (filter === "3days") return student.expiryDate <= "2024-05-22";
    return true;
  });

  const selectedCount = students.filter((s) => s.selected).length;

  const handleSelectAll = (checked: boolean) => {
    setStudents(filteredStudents.map(s => ({ ...s, selected: checked as boolean })));
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    setStudents(students.map(s =>
      s.id === studentId ? { ...s, selected: checked as boolean } : s
    ));
  };

  const handleGeneratePDF = () => {
    if (selectedCount === 0) {
      toast.error("Please select at least one student");
      return;
    }

    toast.success(`${selectedCount} communiqués generated successfully`);
    setCurrentStep("select");
    setStudents(students.map(s => ({ ...s, selected: false })));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>
          Generate Communiqué
        </h1>
        <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>
          Create payment reminder slips for expiring subscriptions
        </p>
      </div>

      {/* Step Indicator */}
      <Card style={{ borderColor: "#E5E5E7" }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {["Select Students", "Preview", "Generate"].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentStep === ["select", "preview", "generate"][index]
                        ? "text-white"
                        : "text-gray-400"
                    }`}
                    style={{
                      backgroundColor:
                        currentStep === ["select", "preview", "generate"][index]
                          ? "#800020"
                          : "#E5E5E7",
                    }}
                  >
                    {index + 1}
                  </div>
                  <p
                    className="text-sm mt-2 font-medium"
                    style={{
                      color:
                        currentStep === ["select", "preview", "generate"][index]
                          ? "#800020"
                          : "#9A9A9A",
                    }}
                  >
                    {step}
                  </p>
                </div>
                {index < 2 && (
                  <div
                    className="h-0.5 w-20 mx-4"
                    style={{
                      backgroundColor: "#E5E5E7",
                    }}
                  />
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
            <CardTitle>Select Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full md:w-64 h-11">
                  <SelectValue placeholder="Filter students" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Expiring</SelectItem>
                  <SelectItem value="today">Expiring Today</SelectItem>
                  <SelectItem value="2days">Expiring in 2 Days</SelectItem>
                  <SelectItem value="3days">Expiring in 3 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg overflow-hidden" style={{ borderColor: "#E5E5E7" }}>
              <Table>
                <TableHeader style={{ backgroundColor: "#001F5B" }}>
                  <TableRow>
                    <TableHead className="text-white w-12">
                      <Checkbox
                        checked={filteredStudents.length > 0 && filteredStudents.every(s => s.selected)}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="text-white">Name</TableHead>
                    <TableHead className="text-white">Class</TableHead>
                    <TableHead className="text-white">Service</TableHead>
                    <TableHead className="text-white">Expiry Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student, index) => (
                    <TableRow
                      key={student.id}
                      style={{
                        backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F4F4F6",
                      }}
                    >
                      <TableCell>
                        <Checkbox
                          checked={student.selected}
                          onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell style={{ color: "#2C2C2C" }} className="font-medium">
                        {student.name}
                      </TableCell>
                      <TableCell>
                        <span
                          className="px-2 py-1 rounded text-xs font-semibold text-white"
                          style={{ backgroundColor: "#001F5B" }}
                        >
                          {student.class}
                        </span>
                      </TableCell>
                      <TableCell style={{ color: "#2C2C2C" }}>{student.service}</TableCell>
                      <TableCell style={{ color: "#C0392B" }} className="font-medium">
                        {student.expiryDate}
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
                  {selectedCount} student{selectedCount !== 1 ? "s" : ""} selected
                </span>
              </div>
              <Button
                onClick={() => setCurrentStep("preview")}
                disabled={selectedCount === 0}
                className="h-11"
                style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
              >
                Continue to Preview
              </Button>
            </div>
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
            <div className="mb-6 p-6 border-2 border-dashed rounded-lg" style={{ borderColor: "#E5E5E7", backgroundColor: "#FAFAFA" }}>
              <div className="max-w-md mx-auto space-y-4 text-center">
                <div className="text-lg font-bold" style={{ color: "#800020" }}>
                  JERICHO SCHOOL — Payment Reminder
                </div>
                <div className="h-px" style={{ backgroundColor: "#E5E5E7" }} />
                <div className="text-left space-y-2">
                  <p style={{ color: "#2C2C2C" }}>
                    <strong>Dear Parent/Guardian of:</strong> [Student Name]
                  </p>
                  <p style={{ color: "#2C2C2C" }}>
                    <strong>Class:</strong> [Class]
                  </p>
                  <p style={{ color: "#2C2C2C" }}>
                    <strong>Service:</strong> [Service]
                  </p>
                  <p className="mt-4" style={{ color: "#2C2C2C" }}>
                    Your child's subscription expires on <strong>[Expiry Date]</strong>.
                  </p>
                  <p style={{ color: "#2C2C2C" }}>
                    Please renew at the school's accounting office.
                  </p>
                </div>
                <div className="h-px" style={{ backgroundColor: "#E5E5E7" }} />
                <p className="text-sm italic" style={{ color: "#9A9A9A" }}>
                  Thank you for your cooperation
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: "#F4F4F6" }}>
              <p style={{ color: "#2C2C2C" }}>
                <strong>{selectedCount}</strong> communiqué{selectedCount !== 1 ? "s" : ""} will be generated
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep("select")}
                className="flex-1 h-11"
              >
                Back
              </Button>
              <Button
                onClick={handleGeneratePDF}
                className="flex-1 h-11"
                style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
              >
                <Download size={18} className="mr-2" />
                Generate & Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
