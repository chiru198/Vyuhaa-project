import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, User, Loader2, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";

// Define the Customer type based on your new Users table structure
export type Customer = {
  id: string;
  name: string; // Organization Name
  contact: string;
  email: string;
  tier: "Platinum" | "Gold" | "Silver";
  location: string;
};

const API_URL = "http://localhost:5000";

const CustomerManagement = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    contact: "",
    email: "",
    tier: "" as Customer["tier"] | "",
    location: "",
  });

  // Fetch headers without tokens
  const getSimpleHeaders = () => ({
    "Content-Type": "application/json",
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/customers`, {
        headers: getSimpleHeaders(),
      });

      if (!res.ok) throw new Error("Failed to fetch customers");

      const data = await res.json();
      setCustomers(data);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.email || !newCustomer.tier) {
      toast.error("Please fill in required fields");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/customers`, {
        method: "POST",
        headers: getSimpleHeaders(),
        body: JSON.stringify({
          organizationName: newCustomer.name,
          contactNumber: newCustomer.contact,
          email: newCustomer.email,
          pricingTier: newCustomer.tier,
          location: newCustomer.location,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create customer");
      }

      toast.success("Customer created successfully");
      setNewCustomer({
        name: "",
        contact: "",
        email: "",
        tier: "",
        location: "",
      });
      setIsDialogOpen(false);
      fetchCustomers();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateCustomer = async () => {
    if (!editingCustomer) return;
    setUpdating(true);

    try {
      const res = await fetch(
        `${API_URL}/api/customers/${editingCustomer.id}`,
        {
          method: "PUT",
          headers: getSimpleHeaders(),
          body: JSON.stringify({
            organizationName: editingCustomer.name,
            contactNumber: editingCustomer.contact,
            email: editingCustomer.email,
            pricingTier: editingCustomer.tier,
            location: editingCustomer.location,
          }),
        },
      );

      if (!res.ok) throw new Error("Update failed");

      toast.success("Customer updated");
      setEditingCustomer(null);
      fetchCustomers();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm("Delete this customer?")) return;

    try {
      const res = await fetch(`${API_URL}/api/customers/${id}`, {
        method: "DELETE",
        headers: getSimpleHeaders(),
      });

      if (!res.ok) throw new Error("Delete failed");

      toast.success("Customer removed");
      fetchCustomers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-slate-500">Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">
          Customer Management
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" /> Add New Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>
                Register a new account in the system.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Organization Name</Label>
                <Input
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, name: e.target.value })
                  }
                  placeholder="Vyuhaa Med"
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Number</Label>
                <Input
                  value={newCustomer.contact}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, contact: e.target.value })
                  }
                  placeholder="+91-00000-00000"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, email: e.target.value })
                  }
                  placeholder="customer@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Pricing Tier</Label>
                <Select
                  value={newCustomer.tier}
                  onValueChange={(val: any) =>
                    setNewCustomer({ ...newCustomer, tier: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Platinum">Platinum</SelectItem>
                    <SelectItem value="Gold">Gold</SelectItem>
                    <SelectItem value="Silver">Silver</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={newCustomer.location}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, location: e.target.value })
                  }
                  placeholder="City, Country"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCreateCustomer}
                disabled={creating}
              >
                {creating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Create Customer"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-600" />
            <span>All Customers ({filteredCustomers.length})</span>
          </CardTitle>
          <CardDescription>Manage your organization accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search name or email..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Organization
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Tier
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Location
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCustomers.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      {editingCustomer?.id === c.id ? (
                        <Input
                          value={editingCustomer.name}
                          onChange={(e) =>
                            setEditingCustomer({
                              ...editingCustomer,
                              name: e.target.value,
                            })
                          }
                        />
                      ) : (
                        c.name
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {editingCustomer?.id === c.id ? (
                        <Input
                          value={editingCustomer.contact}
                          onChange={(e) =>
                            setEditingCustomer({
                              ...editingCustomer,
                              contact: e.target.value,
                            })
                          }
                        />
                      ) : (
                        c.contact
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {editingCustomer?.id === c.id ? (
                        <Input
                          value={editingCustomer.email}
                          onChange={(e) =>
                            setEditingCustomer({
                              ...editingCustomer,
                              email: e.target.value,
                            })
                          }
                        />
                      ) : (
                        c.email
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {editingCustomer?.id === c.id ? (
                        <Select
                          value={editingCustomer.tier}
                          onValueChange={(val: any) =>
                            setEditingCustomer({
                              ...editingCustomer,
                              tier: val,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Platinum">Platinum</SelectItem>
                            <SelectItem value="Gold">Gold</SelectItem>
                            <SelectItem value="Silver">Silver</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge
                          variant={
                            c.tier === "Platinum" ? "default" : "secondary"
                          }
                        >
                          {c.tier}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {editingCustomer?.id === c.id ? (
                        <Input
                          value={editingCustomer.location}
                          onChange={(e) =>
                            setEditingCustomer({
                              ...editingCustomer,
                              location: e.target.value,
                            })
                          }
                        />
                      ) : (
                        c.location
                      )}
                    </td>
                    <td className="px-4 py-4 text-center space-x-2">
                      {editingCustomer?.id === c.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={handleUpdateCustomer}
                            disabled={updating}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingCustomer(null)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-blue-600"
                            onClick={() => setEditingCustomer(c)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600"
                            onClick={() => handleDeleteCustomer(c.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerManagement;
