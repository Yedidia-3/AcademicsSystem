import { useState } from "react";
import { Plus, MoreVertical } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
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
import { toast } from "sonner";

interface Zone {
  id: string;
  name: string;
  price: number;
  studentsAssigned: number;
  status: string;
  statusColor: string;
}

const mockZones: Zone[] = [
  { id: "1", name: "Zone 1", price: 15000, studentsAssigned: 45, status: "Active", statusColor: "#1A7F4B" },
  { id: "2", name: "Zone 2", price: 20000, studentsAssigned: 38, status: "Active", statusColor: "#1A7F4B" },
  { id: "3", name: "Zone 3", price: 25000, studentsAssigned: 0, status: "Active", statusColor: "#1A7F4B" },
];

export function ZoneManagement() {
  const [zones, setZones] = useState<Zone[]>(mockZones);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [zoneName, setZoneName] = useState("");
  const [zonePrice, setZonePrice] = useState("");

  const handleAddZone = () => {
    if (zoneName && zonePrice) {
      toast.success(`Zone ${zoneName} created successfully`);
      setShowAddDialog(false);
      setZoneName("");
      setZonePrice("");
    } else {
      toast.error("Please fill all fields");
    }
  };

  const handleEditZone = () => {
    if (zoneName && zonePrice) {
      toast.success(`Zone ${selectedZone?.name} updated successfully`);
      setShowEditDialog(false);
      setZoneName("");
      setZonePrice("");
      setSelectedZone(null);
    }
  };

  const handleDeleteClick = (zone: Zone) => {
    setSelectedZone(zone);
    if (zone.studentsAssigned > 0) {
      toast.error(`Zone ${zone.name} has ${zone.studentsAssigned} students assigned. Reassign them before deleting.`);
    } else {
      setShowDeleteDialog(true);
    }
  };

  const handleDeleteZone = () => {
    if (selectedZone) {
      toast.success(`Zone ${selectedZone.name} deleted successfully`);
      setShowDeleteDialog(false);
      setSelectedZone(null);
    }
  };

  const handleEditClick = (zone: Zone) => {
    setSelectedZone(zone);
    setZoneName(zone.name);
    setZonePrice(zone.price.toString());
    setShowEditDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>
            Transport Zones
          </h1>
          <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>
            Manage transport zones and pricing
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="h-11"
          style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
        >
          <Plus size={18} className="mr-2" />
          Add Zone
        </Button>
      </div>

      <Card style={{ borderColor: "#E5E5E7" }}>
        <CardContent className="p-6">
          <div className="border rounded-lg overflow-hidden" style={{ borderColor: "#E5E5E7" }}>
            <Table>
              <TableHeader style={{ backgroundColor: "#001F5B" }}>
                <TableRow>
                  <TableHead className="text-white">Zone Name</TableHead>
                  <TableHead className="text-white">Price (RWF)</TableHead>
                  <TableHead className="text-white">Students Assigned</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((zone, index) => (
                  <TableRow
                    key={zone.id}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F4F4F6",
                    }}
                  >
                    <TableCell style={{ color: "#2C2C2C" }} className="font-semibold">
                      {zone.name}
                    </TableCell>
                    <TableCell style={{ color: "#2C2C2C" }}>
                      {zone.price.toLocaleString()} RWF
                    </TableCell>
                    <TableCell style={{ color: "#2C2C2C" }}>
                      {zone.studentsAssigned} students
                    </TableCell>
                    <TableCell>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: zone.statusColor }}
                      >
                        {zone.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditClick(zone)}>
                            Edit Zone
                          </DropdownMenuItem>
                          <DropdownMenuItem>Deactivate Zone</DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(zone)}
                            className="text-red-600"
                          >
                            Delete Zone
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

      {/* Add Zone Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Zone</DialogTitle>
            <DialogDescription>Create a new transport zone</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="zone-name">Zone Name</Label>
              <Input
                id="zone-name"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder="e.g., Zone 4"
                className="mt-2 h-11"
              />
            </div>
            <div>
              <Label htmlFor="zone-price">Price (RWF)</Label>
              <Input
                id="zone-price"
                type="number"
                value={zonePrice}
                onChange={(e) => setZonePrice(e.target.value)}
                placeholder="e.g., 15000"
                className="mt-2 h-11"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddZone}
              style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
            >
              Add Zone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Zone Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Zone</DialogTitle>
            <DialogDescription>Update zone details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-zone-name">Zone Name</Label>
              <Input
                id="edit-zone-name"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                className="mt-2 h-11"
              />
            </div>
            <div>
              <Label htmlFor="edit-zone-price">Price (RWF)</Label>
              <Input
                id="edit-zone-price"
                type="number"
                value={zonePrice}
                onChange={(e) => setZonePrice(e.target.value)}
                className="mt-2 h-11"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditZone}
              style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {selectedZone?.name}?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the zone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteZone}
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
