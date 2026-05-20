import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Search, Download, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

interface Student {
  id: string;
  name: string;
  formerClass: string;
  rank: number;
  marksPercent: number;
  currentClass: string;
}

const mockStudents: Record<string, Student[]> = {
  P2A: [
    { id: "1", name: "Alice Mukamana", formerClass: "P1A", rank: 1, marksPercent: 95, currentClass: "P2A" },
    { id: "2", name: "Bob Nshimiyimana", formerClass: "P1B", rank: 2, marksPercent: 94, currentClass: "P2A" },
  ],
  P2B: [
    { id: "3", name: "Carol Uwase", formerClass: "P1C", rank: 1, marksPercent: 93, currentClass: "P2B" },
    { id: "4", name: "David Habimana", formerClass: "P1A", rank: 3, marksPercent: 92, currentClass: "P2B" },
  ],
  P2C: [
    { id: "5", name: "Emma Iradukunda", formerClass: "P1B", rank: 4, marksPercent: 91, currentClass: "P2C" },
    { id: "6", name: "Frank Mugisha", formerClass: "P1C", rank: 2, marksPercent: 90, currentClass: "P2C" },
  ],
};

export function StudentListPerClass() {
  const { pLevel } = useParams<{ pLevel: string }>();
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState(`${pLevel}A`);
  const [searchTerm, setSearchTerm] = useState("");

  const students = mockStudents[selectedClass] || [];
  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClassBadgeColor = (className: string) => {
    const colors: Record<string, string> = {
      P1A: "#800020",
      P1B: "#001F5B",
      P1C: "#C9A84C",
    };
    return colors[className] || "#9A9A9A";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/accountant/class-lists")}
          style={{ color: "#800020" }}
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Class Lists
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>
          {pLevel} — Class Lists
        </h1>
        <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>
          Class Lists &gt; {pLevel}
        </p>
      </div>

      <Card style={{ borderColor: "#E5E5E7" }}>
        <CardContent className="p-6">
          <Tabs value={selectedClass} onValueChange={setSelectedClass}>
            <div className="flex items-center justify-between mb-6">
              <TabsList>
                <TabsTrigger value={`${pLevel}A`}>{pLevel}A</TabsTrigger>
                <TabsTrigger value={`${pLevel}B`}>{pLevel}B</TabsTrigger>
                <TabsTrigger value={`${pLevel}C`}>{pLevel}C</TabsTrigger>
              </TabsList>
              <Button
                variant="outline"
                className="h-11"
                style={{ color: "#800020", borderColor: "#800020" }}
              >
                <Download size={18} className="mr-2" />
                Download Excel
              </Button>
            </div>

            <TabsContent value={selectedClass}>
              {/* Search */}
              <div className="mb-4 relative">
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
              <div className="border rounded-lg overflow-hidden" style={{ borderColor: "#E5E5E7" }}>
                <Table>
                  <TableHeader style={{ backgroundColor: "#001F5B" }}>
                    <TableRow>
                      <TableHead className="text-white">Name</TableHead>
                      <TableHead className="text-white">Former Class</TableHead>
                      <TableHead className="text-white">Rank</TableHead>
                      <TableHead className="text-white">Marks %</TableHead>
                      <TableHead className="text-white">Current Class</TableHead>
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
                        <TableCell style={{ color: "#2C2C2C" }} className="font-medium">
                          {student.name}
                        </TableCell>
                        <TableCell>
                          <span
                            className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: getClassBadgeColor(student.formerClass) }}
                          >
                            {student.formerClass}
                          </span>
                        </TableCell>
                        <TableCell style={{ color: "#2C2C2C" }}>{student.rank}</TableCell>
                        <TableCell style={{ color: "#2C2C2C" }}>{student.marksPercent}%</TableCell>
                        <TableCell>
                          <span
                            className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: "#800020" }}
                          >
                            {student.currentClass}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
