import { useState } from "react";
import { Plus, MoreVertical, Users, BookOpen } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";

interface PLevelData {
  id: string;
  name: string;
  classCount: number;
  studentCount: number;
  status: string;
  statusColor: string;
}

const initialPLevels: PLevelData[] = [
  { id: "P1", name: "P1", classCount: 3, studentCount: 95, status: "Distributed", statusColor: "#1A7F4B" },
  { id: "P2", name: "P2", classCount: 3, studentCount: 92, status: "Approved", statusColor: "#1A7F4B" },
  { id: "P3", name: "P3", classCount: 3, studentCount: 98, status: "Pending Approval", statusColor: "#D97706" },
  { id: "P4", name: "P4", classCount: 3, studentCount: 100, status: "In Progress", statusColor: "#C9A84C" },
  { id: "P5", name: "P5", classCount: 3, studentCount: 100, status: "In Progress", statusColor: "#C9A84C" },
];

export function PLevelManagement() {
  const navigate = useNavigate();
  const [pLevels] = useState<PLevelData[]>(initialPLevels);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPLevel, setSelectedPLevel] = useState<PLevelData | null>(null);
  const [newPLevelName, setNewPLevelName] = useState("");

  const handleAddPLevel = () => {
    if (newPLevelName.trim()) {
      toast.success(`P-Level ${newPLevelName} created successfully`);
      setShowAddDialog(false);
      setNewPLevelName("");
    }
  };

  const handleDeleteClick = (pLevel: PLevelData) => {
    setSelectedPLevel(pLevel);
    if (pLevel.classCount > 0) {
      toast.error("Cannot delete P-Level with existing classes. Redistribute students first.");
    } else {
      setShowDeleteDialog(true);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedPLevel) {
      toast.success(`P-Level ${selectedPLevel.name} deleted successfully`);
      setShowDeleteDialog(false);
      setSelectedPLevel(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>
          P-Levels
        </h1>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="h-11"
          style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
        >
          <Plus size={18} className="mr-2" />
          Add P-Level
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pLevels.map((pLevel) => (
          <Card key={pLevel.id} style={{ borderColor: "#E5E5E7" }}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold" style={{ color: "#2C2C2C" }}>
                    {pLevel.name}
                  </h3>
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white mt-2"
                    style={{ backgroundColor: pLevel.statusColor }}
                  >
                    {pLevel.status}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical size={18} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/dean/p-levels/${pLevel.id}/classes`)}>
                      Manage Classes
                    </DropdownMenuItem>
                    <DropdownMenuItem>Edit P-Level</DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(pLevel)}
                      className="text-red-600"
                    >
                      Delete P-Level
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#00 1F5B20" }}
                  >
                    <BookOpen size={20} style={{ color: "#001F5B" }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: "#9A9A9A" }}>
                      Classes
                    </p>
                    <p className="text-xl font-bold" style={{ color: "#2C2C2C" }}>
                      {pLevel.classCount}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#80002020" }}
                  >
                    <Users size={20} style={{ color: "#800020" }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: "#9A9A9A" }}>
                      Students
                    </p>
                    <p className="text-xl font-bold" style={{ color: "#2C2C2C" }}>
                      {pLevel.studentCount}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  onClick={() => navigate(`/dean/p-levels/${pLevel.id}/classes`)}
                  className="w-full"
                  variant="outline"
                  style={{ color: "#800020", borderColor: "#800020" }}
                >
                  Manage Classes
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add P-Level Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New P-Level</DialogTitle>
            <DialogDescription>Create a new P-Level for the current academic year</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="plevel-name">P-Level Name</Label>
              <Input
                id="plevel-name"
                value={newPLevelName}
                onChange={(e) => setNewPLevelName(e.target.value)}
                placeholder="e.g., P6"
                className="mt-2 h-11"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddPLevel}
              style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
            >
              Add P-Level
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {selectedPLevel?.name}?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the P-Level.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              style={{ backgroundColor: "#C0392B", color: "#FFFFFF" }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
