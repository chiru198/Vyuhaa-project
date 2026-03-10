import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MapPin, Trash2, Edit2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

const API_URL = "http://localhost:5000";

const LabManagement = () => {
  const [labs, setLabs] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false); // Global loading for fetching
  const [isCreating, setIsCreating] = useState(false); // Specific for button spinner
  const [newLab, setNewLab] = useState({ name: "", address: "" });

  // 1. Fetch Labs from Backend
  const fetchLabs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/labs`);
      if (!res.ok) throw new Error("Failed to fetch labs");
      const data = await res.json();
      setLabs(data);
    } catch (error) {
      console.error("Failed to fetch labs:", error);
      toast.error("Could not load labs from server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  // 2. Create New Lab
  const handleCreateLab = async () => {
    if (!newLab.name.trim() || !newLab.address.trim()) {
      toast.error("Please fill in both name and address");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(`${API_URL}/api/labs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Only sending name and address as per your current table structure
        body: JSON.stringify({
          name: newLab.name,
          address: newLab.address
        }),
      });

      if (response.ok) {
        toast.success("Lab created successfully");
        setNewLab({ name: "", address: "" }); // Reset form
        setIsDialogOpen(false); // Close modal
        fetchLabs(); // Refresh list immediately
      } else {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to create lab");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsCreating(false);
    }
  };

  // 3. Delete Lab
  const handleDeleteLab = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lab?")) return;
    
    try {
      const res = await fetch(`${API_URL}/api/labs/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Lab deleted");
        fetchLabs();
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Lab Management</h2>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" /> Add New Lab
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Lab Location</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="lab-name">Lab Name</Label>
                <Input
                  id="lab-name"
                  placeholder="e.g. Hyderabad Central Lab"
                  value={newLab.name}
                  onChange={(e) => setNewLab({ ...newLab, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lab-address">Address</Label>
                <Input
                  id="lab-address"
                  placeholder="Enter full address"
                  value={newLab.address}
                  onChange={(e) => setNewLab({ ...newLab, address: e.target.value })}
                />
              </div>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleCreateLab}
                disabled={isCreating}
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  "Create Lab"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {labs.map((lab: any) => (
            <Card
              key={lab.id}
              className="relative border-slate-200 hover:shadow-md transition-shadow group"
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-700">
                      {lab.name}
                    </h3>
                    <div className="flex items-start text-slate-500 text-sm">
                      <MapPin className="h-4 w-4 mr-2 mt-1 flex-shrink-0 text-blue-500" />
                      <span>{lab.address || "No address provided"}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        lab.active
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {lab.active ? "Active" : "Inactive"}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-blue-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-600"
                        onClick={() => handleDeleteLab(lab.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {labs.length === 0 && (
            <p className="text-slate-500 col-span-2 text-center py-10">No labs found. Add your first lab location!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default LabManagement;