import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  XCircle,
  Clock,
  Microscope,
  Grid3X3,
  Eye,
} from "lucide-react";
import SlideViewer from "./SlideViewer";
import SlideGridView from "./SlideGridView";
import PatientInformation from "./PatientInformation";
import CompactAIAnalysis from "./CompactAIAnalysis";
import EnhancedActionPanel from "./EnhancedActionPanel";
import CaseNavigation from "./CaseNavigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const API_URL = "http://localhost:5000";

// --- PROPS INTERFACE ---
interface AISlideViewerProps {
  sampleData?: any;
}

const AISlideViewer = ({ sampleData }: AISlideViewerProps) => {
  const [activeTab, setActiveTab] = useState("viewer");
  const { toast } = useToast();
  const { user } = useAuth();
  console.log("DATA ARRIVED IN VIEWER:", sampleData);

  if (!sampleData) {
    return (
      <div className="flex items-center justify-center h-full p-20 border-2 border-dashed rounded-xl text-slate-400">
        <p>
          Waiting for slide data... Please select a sample from the dashboard.
        </p>
      </div>
    );
  }

  // Use real data from props, with safe fallbacks to prevent crashes
  const currentSlide = sampleData || {
    id: "",
    barcode: "Loading...",
    patient_name: "Unknown",
    status: "pending",
    imaging_url: "",
    aiAnalysis: { status: "pending", confidence: 0, findings: [] },
  };

  // --- HELPERS ---
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "text-green-600";
      case "review":
      case "processing":
        return "text-blue-600";
      case "failed":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "review":
      case "processing":
        return <Clock className="h-4 w-4" />;
      case "failed":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Microscope className="h-4 w-4" />;
    }
  };

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  });

  // --- HANDLERS ---
  const handleVerifyAnalysis = async (notes?: string) => {
    try {
      const res = await fetch(`${API_URL}/samples/verify`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          barcode: currentSlide.barcode,
          reviewed_by: user?.id,
          notes,
        }),
      });
      if (!res.ok) throw new Error("Verification failed");
      toast({
        title: "Analysis Verified",
        description: "Case updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleApproveAnalysis = async (
    diagnosis: string,
    recommendations?: string,
  ) => {
    try {
      const res = await fetch(`${API_URL}/test-results`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          sample_id: currentSlide.id,
          patient_id: currentSlide.patient_id,
          diagnosis,
          recommendations,
          reviewed_by: user?.id,
        }),
      });
      if (!res.ok) throw new Error("Approval failed");
      toast({ title: "Success", description: "Report finalized" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          AI Slide Analysis
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex gap-1 text-xs">
            <Microscope className="h-3 w-3" /> Digital Pathology
          </Badge>
          <Badge className="bg-slate-700 text-white text-xs">
            8 Cases in Queue
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[85vh]">
        {/* CENTER SECTION: VIEWER */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col overflow-hidden">
            <CardHeader className="border-b bg-white py-3 px-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-bold text-slate-800">
                  Slide Analysis -{" "}
                  <span className="text-blue-600">{currentSlide.barcode}</span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-bold">
                    {currentSlide.sample_type?.toUpperCase() || "LBC"}
                  </Badge>
                  <div className={`flex items-center gap-1 text-sm font-medium ${getStatusColor(currentSlide.status)}`}>
                    {getStatusIcon(currentSlide.status)}
                    <span className="capitalize">{currentSlide.status}</span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 flex-grow relative bg-slate-950">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="h-full flex flex-col"
              >
                <div className="bg-white px-4 border-b">
                  <TabsList className="bg-transparent h-11">
                    <TabsTrigger
                      value="viewer"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none bg-transparent text-sm"
                    >
                      <Eye className="h-4 w-4 mr-2" /> Slide Viewer
                    </TabsTrigger>
                    <TabsTrigger
                      value="grid"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none bg-transparent text-sm"
                    >
                      <Grid3X3 className="h-4 w-4 mr-2" /> Grid View
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="viewer" className="flex-grow m-0">
                  <SlideViewer imagingUrl={currentSlide.imaging_url} sampleData={currentSlide} />
                </TabsContent>

                <TabsContent
                  value="grid"
                  className="flex-grow m-0 p-4 bg-white overflow-auto"
                >
                  <SlideGridView slideData={currentSlide} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT SIDEBAR: INFORMATION */}
        <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar">
          <CaseNavigation
            currentCaseId={currentSlide.id}
            cases={[]}
            onCaseSelect={() => {}}
          />

          <PatientInformation
            patientData={{
              name: currentSlide.patient_name,
              id: currentSlide.barcode,
              age: currentSlide.age || "N/A",
              gender: currentSlide.gender || "N/A",
            }}
            sampleData={currentSlide}
          />

          <CompactAIAnalysis
            aiAnalysis={currentSlide.aiAnalysis || { status: "pending" }}
          />

          <EnhancedActionPanel
            sampleId={currentSlide.id}
            currentStatus={currentSlide.status}
            onVerifyAnalysis={handleVerifyAnalysis}
            onApproveAnalysis={handleApproveAnalysis}
            onRequestReview={(r) =>
              toast({ title: "Review Requested", description: r })
            }
            onExportReport={() =>
              toast({
                title: "Exporting...",
                description: "PDF generation started",
              })
            }
          />
        </div>
      </div>
    </div>
  );
};

export default AISlideViewer;
