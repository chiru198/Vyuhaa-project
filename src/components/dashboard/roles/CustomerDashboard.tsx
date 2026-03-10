import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSamples, usePricingTiers } from "../../../hooks/useApiData";
import { useAuth } from "../../../hooks/useAuth";
import StatsCards from "../StatsCards";
import {
  Upload,
  Download,
  FileText,
  CreditCard,
  Loader2,
  FileCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface CustomerDashboardProps {
  currentView: string;
}

const CustomerDashboard = ({ currentView }: CustomerDashboardProps) => {
  const {
    samples,
    loading: samplesLoading,
    error: samplesError,
  } = useSamples();
  const { pricingTiers, loading: pricingLoading } = usePricingTiers();
  const { user } = useAuth();

  // State for the gallery list
  const [myReports, setMyReports] = useState<any[]>([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  // Inside CustomerDashboard component
  const [formData, setFormData] = useState({
    patientName: "",
    patientAge: "",
    patientGender: "",
    testType: "",
    urgency: "normal",
  });
  const [submitting, setSubmitting] = useState(false);
  // Inside CustomerDashboard component, add this:
const [customerSamples, setCustomerSamples] = useState<any[]>([]); //

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    console.log("Submitting Payload:", { ...formData, customerId: user?.id });

    try {
      const response = await fetch("http://localhost:5000/api/samples/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The customerId is automatically pulled from the logged-in user context
        body: JSON.stringify({ ...formData, customerId: user?.id }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Success! Patients added `);
        // Reset form
        setFormData({
          patientName: "",
          patientAge: "",
          patientGender: "",
          testType: "",
          urgency: "normal",
        });
      } else {
        throw new Error("Submission failed");
      }
    } catch (err) {
      alert("Error submitting request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter samples by the logged-in user for security
  // const customerSamples = samples
  //   ? samples.filter((s) => s.patient_id === user?.id)
  //   : [];

  // 1. Logic: Fetch finalized reports list
  const loadReports = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/customer/reports-list?customerId=${user.id}`,
      );
      const data = await res.json();
      setMyReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading reports:", err);
    }
  };
  const fetchCustomerSamples = async () => {
    try {
      // Note: Ensure your backend endpoint matches this URL
      const response = await fetch(
        `http://localhost:5000/api/customer/samples?customerId=${user.id}`,
      );

      if (!response.ok) throw new Error("Failed to fetch tracking data");

      const data = await response.json();
      setCustomerSamples(data); // This updates your state with the new list
    } catch (err) {
      console.error("Error fetching samples:", err);
      toast.error("Could not load sample tracking data.");
    }
  };

  useEffect(() => {
    loadReports();
  }, [user?.id]);
  useEffect(() => {
    if (currentView === "track") {
      fetchCustomerSamples(); // This function should call your updated API
    }
  }, [currentView]);

  // 2. Logic: Handle the actual PDF download with naming convention
  const handleDownloadReport = async (
    sampleId: any,
    barcode: any,
    patientName: string,
  ) => {
    try {
      // Logic: Append the customerId (from your user context) to the URL
      const response = await fetch(
        `http://localhost:5000/api/reports/download-by-sample/${sampleId}?customerId=${user.id}`,
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Download failed");
      }

      const blob = await response.blob();
      console.log("Blob size:", blob.size, "bytes"); // This should be a large number, like 150000
      console.log("Blob type:", blob.type); // This should be "application/pdf"
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${barcode}_${patientName.replace(/\s+/g, "_")}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error(err.message);
    }
  };
  if (samplesLoading || pricingLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading your portal...</span>
      </div>
    );
  }

  // --- SUBMIT VIEW ---
  // Simplified State and Logic for the Customer Dashboard
  if (currentView === "submit") {
    return (
      <div className="space-y-8 p-6 max-w-4xl">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Submit Sample Request
          </h2>
          <p className="text-gray-600 text-lg">
            Fill out the form below to schedule a sample pickup
          </p>
        </div>

        <Card className="w-full shadow-xl border-0">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center space-x-3 text-2xl font-bold text-gray-900">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white shadow-lg">
                <Upload className="h-6 w-6" />
              </div>
              <span>Sample Pickup Request</span>
            </CardTitle>
            <p className="text-gray-500 mt-2">
              Complete all fields to request sample collection
            </p>
          </CardHeader>

          <CardContent className="p-0">
            <form onSubmit={handleSubmit} className="space-y-6 p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Patient Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">
                    👤 Patient Name
                  </Label>
                  <Input
                    required
                    placeholder="Enter full name (e.g., John Doe)"
                    value={formData.patientName}
                    onChange={(e) =>
                      setFormData({ ...formData, patientName: e.target.value })
                    }
                    className="h-12 text-lg border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  />
                </div>

                {/* Patient Age */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">
                    📅 Patient Age
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="120"
                    required
                    placeholder="e.g., 35"
                    value={formData.patientAge}
                    onChange={(e) =>
                      setFormData({ ...formData, patientAge: e.target.value })
                    }
                    className="h-12 text-lg border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">
                    ⚥ Gender
                  </Label>
                  <select
                    className="w-full h-12 p-4 border-2 border-gray-200 rounded-xl text-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 appearance-none bg-no-repeat bg-right"
                    value={formData.patientGender}
                    required
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        patientGender: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Gender</option>
                    <option value="Male"> Male</option>
                    <option value="Female"> Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Test Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">
                    🧪 Test Type
                  </Label>
                  <select
                    className="w-full h-12 p-4 border-2 border-gray-200 rounded-xl text-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 appearance-none bg-no-repeat bg-right"
                    value={formData.testType}
                    required
                    onChange={(e) =>
                      setFormData({ ...formData, testType: e.target.value })
                    }
                  >
                    <option value="">Select Test Type</option>
                    <option value="LBC"> LBC (Liquid Based Cytology)</option>
                    <option value="HPV">HPV Testing</option>
                    <option value="Co-test"> Co-test (LBC + HPV)</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processing Request...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    <span>Submit Pickup Request</span>
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- TRACK VIEW ---
  if (currentView === "track") {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Track Your Samples ({customerSamples.length})
          </h2>
          {/* Added a Refresh button to check for new accession updates */}
          <Button variant="outline" size="sm" onClick={fetchCustomerSamples}>
            Refresh Status
          </Button>
        </div>

        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Patient Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Barcode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {customerSamples.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-gray-400 italic"
                      >
                        No active samples found in the lab workflow.
                      </td>
                    </tr>
                  ) : (
                    customerSamples.map((sample) => (
                      <tr
                        key={sample.id}
                        className="hover:bg-blue-50/30 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-blue-900">
                          {sample.patient_name || "Unknown Patient"}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-600">
                          {sample.barcode || "PENDING"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {sample.sample_type}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            className="capitalize"
                            variant={
                              sample.status === "completed"
                                ? "secondary"
                                : sample.status === "received"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {sample.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(sample.accession_date).toLocaleDateString()}
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
  }
  //REPORT GALLERY VIEW is handled in the main return below to allow toggling within the dashboard without switching views
  if (currentView === "reports") {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Finalized Reports
          </h2>
          <Button variant="ghost" size="sm" onClick={loadReports}>
            Refresh List
          </Button>
        </div>

        <Card className="border-blue-100 bg-blue-50/20">
          <CardHeader>
            <CardDescription>
              Click the download icon to save your official PDF results.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myReports.length === 0 ? (
                <p className="text-sm text-gray-500 italic p-4">
                  No finalized reports found for your account.
                </p>
              ) : (
                myReports.map((report, index) => (
                  <div
                    // Logic: Combine sample_id with index to ensure the key is always unique
                    key={`${report.sample_id}-${index}`}
                    className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm"
                  >
                    <div>
                      <p className="font-bold text-sm text-blue-900">
                        {report.barcode}_
                        {report.patient_name
                          ? report.patient_name.replace(/\s+/g, "_")
                          : "Patient"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Issued:{" "}
                        {report.created_at
                          ? new Date(report.created_at).toLocaleDateString()
                          : "Date Pending"}
                      </p>
                    </div>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      size="sm"
                      onClick={() =>
                        handleDownloadReport(
                          report.sample_id,
                          report.barcode,
                          report.patient_name,
                        )
                      }
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  // --- MAIN DASHBOARD VIEW ---
  const completedSamples = customerSamples.filter(
    (s) => s.status === "completed",
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Customer Portal</h2>
        <div className="text-sm text-gray-600">Welcome, {user?.name}</div>
      </div>

      <StatsCards role="customer" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>{completedSamples.length} Reports Ready</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setIsGalleryOpen(!isGalleryOpen)}
            >
              <FileCheck className="h-4 w-4 mr-2" />
              {isGalleryOpen ? "Hide Report List" : "View Finalized Reports"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* NEW: Report Gallery Logic */}
      {isGalleryOpen && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-600" />
              Your Available Downloads
            </CardTitle>
            <CardDescription>
              Click a report to download it as a PDF
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {myReports.length > 0 ? (
                myReports.map((report) => (
                  <div
                    key={report.sample_id}
                    className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div>
                      <p className="font-semibold text-sm text-gray-800">
                        {report.barcode}_{report.patient_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() =>
                        handleDownloadReport(
                          report.sample_id,
                          report.barcode,
                          report.patient_name,
                        )
                      }
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 p-4 italic">
                  No finalized reports found for your account.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerDashboard;
