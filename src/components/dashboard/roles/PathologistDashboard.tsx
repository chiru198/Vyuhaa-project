import { useState, useMemo } from "react";
import { useSamples } from "../../../hooks/useApiData";
import { useAuth } from "../../../hooks/useAuth";
import StatsCards from "../StatsCards";
import AISlideViewer from "../pathologist/AISlideViewer";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import LBCReporting from "@/components/LBCReporting";
import HPVReporting from "@/components/HPVReporting";
import {
  Loader2,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  FileEdit,
  ClipboardList,
  Search,
  Image,
  ImageIcon,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { usePathologistDashboard } from "../../../hooks/usePathologistDashboard";
import { useReviewQueue } from "../../../hooks/useReviewQueue";
import { useRecentActivity } from "../../../hooks/useRecentActivity";
import { Input } from "@/components/ui/input";

//
interface PathologistDashboardProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

const PathologistDashboard = ({
  currentView,
  setCurrentView,
}: PathologistDashboardProps) => {
  // Inside PathologistDashboard component
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { samples, loading: samplesLoading, error, refetch } = useSamples();
  const { user } = useAuth();
  const { toast } = useToast();

  const { loading: dashboardLoading } = usePathologistDashboard();
  const { samples: reviewQueue } = useReviewQueue();
  const { activities } = useRecentActivity();

  // States for pagination and selection
  // New states for the table and pagination logic
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSample, setSelectedSample] = useState<any>(null);
  const itemsPerPage = 10;

  // States for form inputs
  const [diagnosis, setDiagnosis] = useState<{ [key: string]: string }>({});
  // This creates the "memory" for the selected slide
  const [activeReviewSample, setActiveReviewSample] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<{
    [key: string]: string;
  }>({});
  const [submitting, setSubmitting] = useState<{ [key: string]: boolean }>({});

  // Filter logic to catch all variations of "pending" status
  console.log("All samples in dashboard:", samples);
  const pendingReviews = useMemo(() => {
    console.log("samples in useMemo:", samples);
    console.log("reviewQueue in useMemo:", reviewQueue);
    return samples.filter((sample) => {
      const status = sample.status?.toLowerCase();
      const matchesStatus =
        status === "pending" ||
        status === "review" ||
        status === "urgent" ||
        status === "received";
      const matchesSearch =
        sample.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sample.patient_name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [samples, searchTerm]);

  // Pagination calculations
  // const totalPages = Math.ceil(pendingReviews.length / itemsPerPage);
  // const currentTableData = useMemo(() => {
  //   const start = (currentPage - 1) * itemsPerPage;
  //   return pendingReviews.slice(start, start + itemsPerPage);
  // }, [pendingReviews, currentPage]);

  const handleDeleteSample = async (sampleId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this sample? This action cannot be undone.",
      )
    )
      return;
    try {
      const res = await fetch(`http://localhost:5000/api/samples/${sampleId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete sample");
      toast({ title: "Deleted", description: "Sample deleted successfully!" });
      refetch();
      setCurrentView("finalize");
    } catch (error: any) {
      toast({ variant: "destructive", description: error.message });
    }
  };

  const handleFinalizeReport = async (sampleId: string) => {
    if (!diagnosis[sampleId]) {
      toast({ variant: "destructive", description: "Diagnosis is required." });
      return;
    }

    setSubmitting((prev) => ({ ...prev, [sampleId]: true }));
    try {
      const res = await fetch(
        `http://localhost:5000/api/reports/finalize/${sampleId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            diagnosis: diagnosis[sampleId],
            recommendations:
              recommendations[sampleId] || "No specific recommendations.",
          }),
        },
      );

      if (!res.ok) throw new Error("Failed to save report");

      toast({ title: "Success", description: "Report stored successfully!" });
      setSelectedSample(null); // Close the input area after success
      // window.location.reload(); // Optional: trigger data refresh
    } catch (error: any) {
      toast({ variant: "destructive", description: error.message });
    } finally {
      setSubmitting((prev) => ({ ...prev, [sampleId]: false }));
    }
  };

  const renderContent = () => {
    if (samplesLoading || dashboardLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-20 text-blue-600">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="mt-4 font-medium">Updating Dashboard...</p>
        </div>
      );
    }
    // 2. ADD THIS: Show error if the fetch failed
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center p-20 text-red-500">
          <p className="font-bold">Error loading samples:</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-100 rounded-md"
          >
            Retry Connection
          </button>
        </div>
      );
    }

    switch (currentView) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">
              Pathologist Dashboard
            </h1>
            <StatsCards role="pathologist" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT SIDE — Showing ALL Pending Reviews */}
              <div className="lg:col-span-2">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                  Active Queue Summary ({reviewQueue.length})
                </h2>

                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {/* FIXED: Removed .slice(0, 5) to show all items */}
                      {reviewQueue.length === 0 ? (
                        <div className="p-10 text-center text-slate-500 italic">
                          No pending reviews found.
                        </div>
                      ) : (
                        reviewQueue.map((s) => (
                          <div
                            key={s.id}
                            className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors"
                          >
                            <div>
                              <p className="font-bold text-slate-800">
                                {s.barcode}
                              </p>
                              <p className="text-xs text-slate-500">
                                Patient: {s.patient_name}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* --- ADD THIS BUTTON --- */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-600 border-blue-200 hover:bg-blue-50 h-8"
                                onClick={() => {
                                  // This saves the specific sample (s) to your memory state
                                  setActiveReviewSample(s);
                                  // This switches the view to the AISlideViewer
                                  setCurrentView("review-queue");
                                }}
                              >
                                <ImageIcon className="h-4 w-4 mr-2" />
                                View Slide
                              </Button>

                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 border-blue-200"
                              >
                                {s.sample_type}
                              </Badge>
                              <span className="text-[10px] text-slate-400">
                                {new Date(s.collected_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* RIGHT SIDE — Recent Activities */}
              <div>
                <h2 className="text-xl font-semibold mb-4 text-slate-800">
                  Recent Activities
                </h2>
                <Card>
                  <CardContent className="p-4 space-y-3">
                    {activities.length === 0 ? (
                      <p className="text-sm text-slate-500 italic text-center">
                        No recent activity.
                      </p>
                    ) : (
                      activities.map((act, i) => (
                        <div
                          key={i}
                          className="text-sm text-green-700 bg-green-50 p-2 rounded flex items-center gap-2"
                        >
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          Finalized {act.barcode}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );

      case "reporting_test": // Temporary name change
        return (
          <LBCReporting
            selectedSample={selectedSample}
            onBack={() => setCurrentView("finalize")}
          />
        );
      case "lbc-reporting":
        return (
          <LBCReporting
            selectedSample={selectedSample}
            onBack={() => {
              setCurrentView("dashboard");
              setSelectedSample(null);
            }}
          />
        );

      case "hpv-reporting":
        return (
          <HPVReporting
            selectedSample={selectedSample}
            onBack={() => {
              setCurrentView("finalize");
              setSelectedSample(null);
            }}
          />
        );

      case "review-queue":
        // If the user clicked the sidebar link directly, activeReviewSample is null.
        // We need to tell them to pick a sample first.
        if (!activeReviewSample) {
          return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
              <div className="p-8 border-2 border-dashed rounded-xl bg-slate-50 text-center">
                <p className="font-medium">No Slide Selected</p>
                <p className="text-sm">
                  Please go to the <b>Dashboard</b> and click{" "}
                  <b>"View Slide"</b> on a patient record.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setCurrentView("dashboard")}
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          );
        }
        return <AISlideViewer sampleData={activeReviewSample} />;

      case "finalize":
        const totalPages = Math.ceil(pendingReviews.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const currentTableData = pendingReviews.slice(
          startIndex,
          startIndex + itemsPerPage,
        );

        return (
          <div className="w-full flex flex-col items-start space-y-6 max-w-none">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-slate-800">
                Finalize Patient Reports
              </h2>
              <div className="relative w-full md:w-72">
                <Input
                  placeholder="Search barcode..."
                  className="pl-4"
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            {/* THE TABLE */}
            <Card className="border-none shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-y text-slate-600">
                    <tr>
                      <th className="px-6 py-4 font-semibold">
                        Sample Barcode
                      </th>
                      <th className="px-6 py-4 font-semibold">Patient Name</th>
                      <th className="px-6 py-4 font-semibold">Sample Type</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {currentTableData.map((sample) => (
                      <tr
                        key={sample.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-blue-700">
                          {sample.barcode}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {sample.patient_name}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="secondary">
                            {sample.sample_type}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedSample(sample);
                                if (sample.sample_type?.toLowerCase() === "hpv") {
                                  setCurrentView("hpv-reporting");
                                } else {
                                  setCurrentView("reporting_test");
                                }
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                            >
                              Finalize
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-slate-500 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="max-w-[400px]">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Are you absolutely sure?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the sample
                                    record from **Vyuhaa Med Data**. This action
                                    cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-slate-200">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeleteSample(sample.id)
                                    }
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Confirm Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination controls stay here at the bottom of the table */}
              <div className="bg-white px-6 py-4 border-t flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => p - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next 10
                  </Button>
                </div>
              </div>
            </Card>

            {/* MODAL OVERLAY: This fixes the scrolling issue */}
          </div>
        );

      default:
        return (
          <div>
            <h1 className="text-3xl font-bold">
              Welcome, {user?.name || "Pathologist"}
            </h1>
            <StatsCards role="pathologist" />
          </div>
        );
    }
  };

  return <div className="max-w-7xl mx-auto p-4">{renderContent()}</div>;
};

export default PathologistDashboard;
