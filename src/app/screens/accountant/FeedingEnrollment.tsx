import { useState } from "react";
import { Search, Plus, Download, Check, MoreVertical } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { toast } from "sonner";

interface FeedingRecord {
  id: string;
  name: string;
  class: string;
  month1B: boolean;
  month1L: boolean;
  month2B: boolean;
  month2L: boolean;
  month3B: boolean;
  month3L: boolean;
  month4B: boolean;
  month4L: boolean;
}

const mockRecords: FeedingRecord[] = [
  { id: "1", name: "Alice Mukamana", class: "P2A", month1B: true, month1L: true, month2B: true, month2L: false, month3B: false, month3L: false, month4B: false, month4L: false },
  { id: "2", name: "Bob Nshimiyimana", class: "P2A", month1B: true, month1L: true, month2B: true, month2L: true, month3B: false, month3L: false, month4B: false, month4L: false },
  { id: "3", name: "Carol Uwase", class: "P2B", month1B: false, month1L: true, month2B: false, month2L: true, month3B: false, month3L: false, month4B: false, month4L: false },
];

export function FeedingEnrollment() {
  const [records, setRecords] = useState<FeedingRecord[]>(mockRecords);
  const [searchTerm, setSearchTerm] = useState("");
  const [pLevelFilter, setPLevelFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<{ studentId: string; month: string; type: string } | null>(null);
  const [paymentDate, setPaymentDate] = useState("");
  const [duration, setDuration] = useState("1");

  const filteredRecords = records.filter((record) => {
    const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPLevel = pLevelFilter === "all" || record.class.startsWith(pLevelFilter);
    const matchesClass = classFilter === "all" || record.class === classFilter;
    return matchesSearch && matchesPLevel && matchesClass;
  });

  const handleCheckboxClick = (studentId: string, month: string, type: "B" | "L") => {
    const record = records.find(r => r.id === studentId);
    const key = `month${month}${type}` as keyof FeedingRecord;

    if (!record?.[key]) {
      setSelectedPayment({ studentId, month, type: type === "B" ? "Breakfast" : "Lunch" });
      setShowPaymentDialog(true);
    } else {
      // Unchecking - remove payment
      setRecords(records.map(r =>
        r.id === studentId
          ? { ...r, [key]: false }
          : r
      ));
      toast.success("Payment removed");
    }
  };

  const handleSavePayment = () => {
    if (!paymentDate || !selectedPayment) {
      toast.error("Please enter payment date");
      return;
    }

    const key = `month${selectedPayment.month}${selectedPayment.type === "Breakfast" ? "B" : "L"}` as keyof FeedingRecord;
    setRecords(records.map(r =>
      r.id === selectedPayment.studentId
        ? { ...r, [key]: true }
        : r
    ));

    toast.success("Payment recorded successfully");
    setShowPaymentDialog(false);
    setPaymentDate("");
    setDuration("1");
    setSelectedPayment(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>
            School Feeding
          </h1>
          <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>
            Manage breakfast and lunch enrollments
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="h-11"
            style={{ color: "#800020", borderColor: "#800020" }}
          >
            <Download size={18} className="mr-2" />
            Download
          </Button>
          <Button
            className="h-11"
            style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
          >
            <Plus size={18} className="mr-2" />
            Add Student to Feeding
          </Button>
        </div>
      </div>

      <Card style={{ borderColor: "#E5E5E7" }}>
        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "#9A9A9A" }}
              />
              <Input
                placeholder="Search student name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Select value={pLevelFilter} onValueChange={setPLevelFilter}>
              <SelectTrigger className="w-full md:w-40 h-11">
                <SelectValue placeholder="P-Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All P-Levels</SelectItem>
                <SelectItem value="P1">P1</SelectItem>
                <SelectItem value="P2">P2</SelectItem>
                <SelectItem value="P3">P3</SelectItem>
              </SelectContent>
            </Select>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full md:w-40 h-11">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="P2A">P2A</SelectItem>
                <SelectItem value="P2B">P2B</SelectItem>
                <SelectItem value="P2C">P2C</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-x-auto" style={{ borderColor: "#E5E5E7" }}>
            <Table>
              <TableHeader style={{ backgroundColor: "#001F5B" }}>
                <TableRow>
                  <TableHead className="text-white sticky left-0" style={{ backgroundColor: "#001F5B" }}>Name</TableHead>
                  <TableHead className="text-white">Class</TableHead>
                  <TableHead className="text-white text-center" colSpan={2}>1st Month</TableHead>
                  <TableHead className="text-white text-center" colSpan={2}>2nd Month</TableHead>
                  <TableHead className="text-white text-center" colSpan={2}>3rd Month</TableHead>
                  <TableHead className="text-white text-center" colSpan={2}>4th Month</TableHead>
                  <TableHead className="text-white text-right">Actions</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="text-white sticky left-0" style={{ backgroundColor: "#001F5B" }}></TableHead>
                  <TableHead className="text-white"></TableHead>
                  <TableHead className="text-white text-center text-xs">B</TableHead>
                  <TableHead className="text-white text-center text-xs">L</TableHead>
                  <TableHead className="text-white text-center text-xs">B</TableHead>
                  <TableHead className="text-white text-center text-xs">L</TableHead>
                  <TableHead className="text-white text-center text-xs">B</TableHead>
                  <TableHead className="text-white text-center text-xs">L</TableHead>
                  <TableHead className="text-white text-center text-xs">B</TableHead>
                  <TableHead className="text-white text-center text-xs">L</TableHead>
                  <TableHead className="text-white"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record, index) => (
                  <TableRow
                    key={record.id}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F4F4F6",
                    }}
                  >
                    <TableCell className="font-medium sticky left-0" style={{ color: "#2C2C2C", backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F4F4F6" }}>
                      {record.name}
                    </TableCell>
                    <TableCell>
                      <span
                        className="px-2 py-1 rounded text-xs font-semibold text-white"
                        style={{ backgroundColor: "#001F5B" }}
                      >
                        {record.class}
                      </span>
                    </TableCell>
                    {/* Month 1 */}
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={record.month1B}
                          onCheckedChange={() => handleCheckboxClick(record.id, "1", "B")}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={record.month1L}
                          onCheckedChange={() => handleCheckboxClick(record.id, "1", "L")}
                        />
                      </div>
                    </TableCell>
                    {/* Month 2 */}
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={record.month2B}
                          onCheckedChange={() => handleCheckboxClick(record.id, "2", "B")}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={record.month2L}
                          onCheckedChange={() => handleCheckboxClick(record.id, "2", "L")}
                        />
                      </div>
                    </TableCell>
                    {/* Month 3 */}
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={record.month3B}
                          onCheckedChange={() => handleCheckboxClick(record.id, "3", "B")}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={record.month3L}
                          onCheckedChange={() => handleCheckboxClick(record.id, "3", "L")}
                        />
                      </div>
                    </TableCell>
                    {/* Month 4 */}
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={record.month4B}
                          onCheckedChange={() => handleCheckboxClick(record.id, "4", "B")}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={record.month4L}
                          onCheckedChange={() => handleCheckboxClick(record.id, "4", "L")}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit Payments</DropdownMenuItem>
                          <DropdownMenuItem>View Payment History</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Waive from Feeding
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Record Payment — {selectedPayment?.type} — Month {selectedPayment?.month}
            </DialogTitle>
            <DialogDescription>Enter payment details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="payment-date">Payment Date</Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="mt-2 h-11"
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="w-full h-11 mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 month</SelectItem>
                  <SelectItem value="2">2 months</SelectItem>
                  <SelectItem value="3">3 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {paymentDate && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#F4F4F6" }}>
                <p className="text-sm" style={{ color: "#9A9A9A" }}>
                  <strong style={{ color: "#2C2C2C" }}>Expires on:</strong> {new Date(new Date(paymentDate).setMonth(new Date(paymentDate).getMonth() + parseInt(duration))).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePayment}
              style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
            >
              Save Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
