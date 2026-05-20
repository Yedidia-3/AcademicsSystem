import { useState } from "react";
import { Search, Plus, Download } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
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

interface TransportRecord {
  id: string;
  name: string;
  class: string;
  month1: boolean;
  month2: boolean;
  month3: boolean;
  month4: boolean;
  zone: string | null;
}

const mockRecords: TransportRecord[] = [
  { id: "1", name: "Alice Mukamana", class: "P2A", month1: true, month2: true, month3: false, month4: false, zone: "Zone 1" },
  { id: "2", name: "Bob Nshimiyimana", class: "P2A", month1: true, month2: false, month3: false, month4: false, zone: "Zone 2" },
  { id: "3", name: "Carol Uwase", class: "P2B", month1: false, month2: false, month3: false, month4: false, zone: null },
];

export function TransportEnrollment() {
  const [records, setRecords] = useState<TransportRecord[]>(mockRecords);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRecords = records.filter((record) =>
    record.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleZoneChange = (studentId: string, zone: string) => {
    setRecords(records.map(r =>
      r.id === studentId
        ? { ...r, zone }
        : r
    ));
    toast.success("Zone updated");
  };

  const handleCheckboxChange = (studentId: string, month: string) => {
    const record = records.find(r => r.id === studentId);
    if (!record?.zone) {
      toast.error("Please select a zone before enrolling in transport");
      return;
    }

    const key = `month${month}` as keyof TransportRecord;
    setRecords(records.map(r =>
      r.id === studentId
        ? { ...r, [key]: !r[key] }
        : r
    ));
    toast.success("Payment updated");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>
            Transport
          </h1>
          <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>
            Manage transport zone enrollments
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
            Add Student to Transport
          </Button>
        </div>
      </div>

      <Card style={{ borderColor: "#E5E5E7" }}>
        <CardContent className="p-6">
          {/* Search */}
          <div className="mb-6 relative">
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

          {/* Table */}
          <div className="border rounded-lg overflow-x-auto" style={{ borderColor: "#E5E5E7" }}>
            <Table>
              <TableHeader style={{ backgroundColor: "#001F5B" }}>
                <TableRow>
                  <TableHead className="text-white sticky left-0" style={{ backgroundColor: "#001F5B" }}>Name</TableHead>
                  <TableHead className="text-white">Class</TableHead>
                  <TableHead className="text-white text-center">1st Month</TableHead>
                  <TableHead className="text-white text-center">2nd Month</TableHead>
                  <TableHead className="text-white text-center">3rd Month</TableHead>
                  <TableHead className="text-white text-center">4th Month</TableHead>
                  <TableHead className="text-white">Zone</TableHead>
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
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={record.month1}
                          onCheckedChange={() => handleCheckboxChange(record.id, "1")}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={record.month2}
                          onCheckedChange={() => handleCheckboxChange(record.id, "2")}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={record.month3}
                          onCheckedChange={() => handleCheckboxChange(record.id, "3")}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={record.month4}
                          onCheckedChange={() => handleCheckboxChange(record.id, "4")}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={record.zone || ""}
                        onValueChange={(zone) => handleZoneChange(record.id, zone)}
                      >
                        <SelectTrigger className="w-32 h-9">
                          <SelectValue placeholder="Select zone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Zone 1">Zone 1</SelectItem>
                          <SelectItem value="Zone 2">Zone 2</SelectItem>
                          <SelectItem value="Zone 3">Zone 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
