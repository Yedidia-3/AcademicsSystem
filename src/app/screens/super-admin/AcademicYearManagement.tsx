import { useState } from "react";
import { Calendar, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { toast } from "sonner";

const archivedYears = [
  { year: "2023-2024", status: "Archived", archivedDate: "2024-05-15" },
  { year: "2022-2023", status: "Archived", archivedDate: "2023-05-20" },
  { year: "2021-2022", status: "Archived", archivedDate: "2022-05-18" },
];

export function AcademicYearManagement() {
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const currentYear = "2024-2025";

  const handleArchive = () => {
    if (confirmationText === currentYear) {
      toast.success(`Academic year ${currentYear} has been archived`);
      setShowArchiveDialog(false);
      setConfirmationText("");
    } else {
      toast.error("Please type the year name correctly to confirm");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>
          Academic Year Management
        </h1>
      </div>

      {/* Current Year Card */}
      <Card style={{ borderColor: "#E5E5E7" }}>
        <CardHeader>
          <CardTitle>Current Academic Year</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#80002020" }}
            >
              <Calendar size={32} style={{ color: "#800020" }} />
            </div>
            <div className="flex-1">
              <h3 className="text-3xl font-bold" style={{ color: "#2C2C2C" }}>
                {currentYear}
              </h3>
              <div className="mt-2">
                <span
                  className="px-3 py-1 rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: "#1A7F4B" }}
                >
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div>
              <p className="text-sm" style={{ color: "#9A9A9A" }}>
                Start Date
              </p>
              <p className="font-semibold" style={{ color: "#2C2C2C" }}>
                September 1, 2024
              </p>
            </div>
            <div>
              <p className="text-sm" style={{ color: "#9A9A9A" }}>
                Expected End Date
              </p>
              <p className="font-semibold" style={{ color: "#2C2C2C" }}>
                May 31, 2025
              </p>
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={() => setShowArchiveDialog(true)}
              className="h-11"
              style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
            >
              Archive This Year
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Past Years */}
      <Card style={{ borderColor: "#E5E5E7" }}>
        <CardHeader>
          <CardTitle>Past Academic Years</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden" style={{ borderColor: "#E5E5E7" }}>
            <Table>
              <TableHeader style={{ backgroundColor: "#001F5B" }}>
                <TableRow>
                  <TableHead className="text-white">Year</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Archived Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archivedYears.map((year, index) => (
                  <TableRow
                    key={year.year}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F4F4F6",
                    }}
                  >
                    <TableCell style={{ color: "#2C2C2C" }} className="font-semibold">
                      {year.year}
                    </TableCell>
                    <TableCell>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: "#9A9A9A" }}
                      >
                        {year.status}
                      </span>
                    </TableCell>
                    <TableCell style={{ color: "#9A9A9A" }}>{year.archivedDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Archive Confirmation Dialog */}
      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#D9770620" }}
              >
                <AlertTriangle size={32} style={{ color: "#D97706" }} />
              </div>
            </div>
            <DialogTitle className="text-center">
              Archive Academic Year {currentYear}?
            </DialogTitle>
            <DialogDescription className="text-center">
              This will lock all current data and open a new academic cycle. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="confirmation">Type {currentYear} to confirm</Label>
              <Input
                id="confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder={currentYear}
                className="mt-2 h-11"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => {
                setShowArchiveDialog(false);
                setConfirmationText("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleArchive}
              disabled={confirmationText !== currentYear}
              style={{ backgroundColor: "#C0392B", color: "#FFFFFF" }}
            >
              Archive Year
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
