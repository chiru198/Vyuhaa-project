import { useState, useEffect } from "react";
// Remove getAuthHeaders if you are not using JWT for now
// import { getAuthHeaders } from "../../../lib/authHeaders";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Users,
  Loader2,
  Trash2,
  Edit2,
  ShieldCheck,
  Mail,
  MapPin,
  Key,
} from "lucide-react";
import { toast } from "sonner";
import { User } from "@/types/user";

const API_URL = "http://localhost:5000";

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Standard headers since JWT is disabled
  const standardHeaders = {
    "Content-Type": "application/json",
  };

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "" as User["role"] | "",
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/users`, {
        headers: standardHeaders,
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (error: any) {
      toast.error(`Failed to fetch users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.role) {
      toast.error("Please fill in all required fields");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: standardHeaders,
        body: JSON.stringify(newUser),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to create user");

      toast.success("User created with encrypted password 'Password@1'");
      setNewUser({ name: "", email: "", role: "" });
      setIsAddOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    setUpdating(true);
    try {
      const res = await fetch(`${API_URL}/users/${editingUser.id}`, {
        method: "PUT",
        headers: standardHeaders,
        body: JSON.stringify({
          name: editingUser.name,
          role: editingUser.role,
        }),
      });

      if (!res.ok) throw new Error("Failed to update user");

      toast.success("User profile updated successfully");
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(`Update Error: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    try {
      const res = await fetch(`${API_URL}/users/${userId}`, {
        method: "DELETE",
        headers: standardHeaders,
      });
      if (!res.ok) throw new Error("Failed to delete user");
      toast.success("User removed");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: "bg-blue-50 text-blue-700 border-blue-100",
      pathologist: "bg-purple-50 text-purple-700 border-purple-100",
      technician: "bg-orange-50 text-orange-700 border-orange-100",
      accession: "bg-cyan-50 text-cyan-700 border-cyan-100",
      customer: "bg-slate-50 text-slate-700 border-slate-100",
    };
    return (
      <Badge
        variant="outline"
        className={`capitalize font-semibold ${styles[role.toLowerCase()] || styles.customer}`}
      >
        {role}
      </Badge>
    );
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            User Management
          </h2>
          <p className="text-slate-500 mt-1">
            Configure system access and secure bcrypt credentials.
          </p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm px-6">
              <Plus className="h-4 w-4 mr-2" /> Add New User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px] rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-xl">Create User Profile</DialogTitle>
              <DialogDescription>
                New users will default to 'Password@1' (Encrypted).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Full Name</Label>
                <Input
                  placeholder="Admin User"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">
                  Email Address
                </Label>
                <Input
                  type="email"
                  placeholder="admin@vyuhaa.com"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">
                  System Role
                </Label>
                <Select
                  onValueChange={(val: any) =>
                    setNewUser({ ...newUser, role: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="pathologist">Pathologist</SelectItem>
                    <SelectItem value="technician">Technician</SelectItem>
                    <SelectItem value="accession">Accession</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateUser}
                disabled={creating}
                className="bg-blue-600"
              >
                {creating ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  "Confirm & Create"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit User Dialog */}
      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
      >
        <DialogContent className="sm:max-w-[450px] rounded-xl">
          <DialogHeader>
            <DialogTitle>Update User</DialogTitle>
            <DialogDescription>
              Modify details for {editingUser?.name}.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={editingUser.name}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(val: any) =>
                    setEditingUser({ ...editingUser, role: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="pathologist">Pathologist</SelectItem>
                    <SelectItem value="technician">Technician</SelectItem>
                    <SelectItem value="accession">Accession</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={updating}
              className="bg-blue-600"
            >
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Section */}
      <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Active Personnel</CardTitle>
                <CardDescription>
                  {filteredUsers.length} users found
                </CardDescription>
              </div>
            </div>
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or email..."
                className="pl-10 bg-white border-slate-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-slate-500 font-bold bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4">Identity</th>
                  <th className="px-6 py-4">System Access</th>
                  <th className="px-6 py-4 text-right">Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="py-20 text-center text-blue-200">
                      <Loader2 className="h-10 w-10 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold mr-3 shadow-sm">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">
                              {user.name}
                            </div>
                            <div className="flex items-center text-xs text-slate-500">
                              <Mail className="h-3 w-3 mr-1" /> {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {getRoleBadge(user.role)}
                          {user.role === "admin" && (
                            <ShieldCheck className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => setEditingUser(user)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
