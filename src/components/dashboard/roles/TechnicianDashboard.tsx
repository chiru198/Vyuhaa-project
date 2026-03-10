import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSamples } from "../../../hooks/useApiData";
import {
  Loader2,
  MapPin,
  User,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  Beaker,
  ClipboardList,
} from "lucide-react";

// Added setCurrentView to the props to allow buttons to navigate
const TechnicianDashboard = ({
  currentView,
  setCurrentView,
}: {
  currentView: string;
  setCurrentView: (view: string) => void;
}) => {
  const { samples, loading, error } = useSamples();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // Add this with your other states at the top of the component
  const [activeSampleId, setActiveSampleId] = useState<string>("");
  // 1. Add these at the top of your component
  const [selectedNdpi, setSelectedNdpi] = useState<File | null>(null);
  const [selectedNdpa, setSelectedNdpa] = useState<File | null>(null);
  const ndpaInputRef = useRef<HTMLInputElement>(null);

  // --- LOGIC HANDLERS ---
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // 2. Updated Handlers
  const handleNdpiChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setSelectedNdpi(file);
  };

  const handleNdpaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setSelectedNdpa(file);
  };

  // const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (file) {
  //     setSelectedFile(file);
  //     console.log("File selected:", file.name);
  //   }
  // };
  const handleUploadToPathology = async () => {
    // Use 'selectedNdpi' since that's what you named it in your state
    if (!selectedNdpi || !activeSampleId) {
      return alert("Please select the .ndpi slide file first!");
    }

    const selectedSample = samples.find(
      (s) => s.id.toString() === activeSampleId,
    );

    const formData = new FormData();
    formData.append("barcode", selectedSample?.barcode || "No_Barcode");
    formData.append("sampleId", activeSampleId);

    // Appending the actual files using your new state names
    formData.append("ndpiFile", selectedNdpi);

    if (selectedNdpa) {
      formData.append("ndpaFile", selectedNdpa);
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/upload-pathology-dual",
        {
          method: "POST",
          body: formData,
        },
      );

      if (response.ok) {
        alert(
          `Success! Files for ${selectedSample?.patient_name} have been stored.`,
        );
        // Clear all states
        setSelectedNdpi(null);
        setSelectedNdpa(null);
        setActiveSampleId("");
      } else {
        alert("Upload failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server.");
    }
  };
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
        <p className="text-slate-500 font-medium">Loading portal...</p>
      </div>
    );

  if (error)
    return (
      <div className="p-6 text-red-500 font-medium font-mono">
        Error: {error}
      </div>
    );

  // --- DYNAMIC STATS (Corrected Logic) ---
  const stats = {
    total: samples.length,
    pending: samples.filter((s) => s.status === "pending" || s.status === "received").length,
    review: samples.filter((s) => s.status === "review").length,
    completed: samples.filter((s) => s.status === "completed").length,
    imaging: samples.filter((s) => s.status === "imaging").length,
  };

  // --- VIEW 1: DASHBOARD SUMMARY ---
  if (currentView === "dashboard") {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">
            Technician Dashboard
          </h2>
          <span className="text-slate-500 text-sm font-medium">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardContent className="pt-6">
              <div className="text-xs font-bold text-slate-500 uppercase">
                Assigned
              </div>
              <div className="text-3xl font-bold text-slate-800 mt-1">
                {stats.total}
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500 shadow-sm">
            <CardContent className="pt-6">
              <div className="text-xs font-bold text-slate-500 uppercase">
                Pending
              </div>
              <div className="text-3xl font-bold text-slate-800 mt-1">
                {stats.pending}
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500 shadow-sm">
            <CardContent className="pt-6">
              <div className="text-xs font-bold text-slate-500 uppercase">
                In Review
              </div>
              <div className="text-3xl font-bold text-slate-800 mt-1">
                {stats.review}
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500 shadow-sm">
            <CardContent className="pt-6">
              <div className="text-xs font-bold text-slate-500 uppercase">
                Completed
              </div>
              <div className="text-3xl font-bold text-slate-800 mt-1">
                {stats.completed}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Today's Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-sm text-slate-600">
                  {stats.completed} samples completed
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="text-sm text-slate-600">
                  {stats.review} samples in review
                </span>
              </div>
              <div className="flex items-center gap-3 border-t pt-2 mt-2 font-semibold text-slate-800">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-sm">{stats.total} total samples</span>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm bg-slate-50/50">
            <CardHeader>
              <CardTitle className="text-lg text-slate-400 italic font-normal">
                System Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center text-slate-400 py-8 text-sm">
              No critical alerts for today.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // --- VIEW 2: ASSIGNED SAMPLES TABLE (KEPT ORIGINAL UI) ---
  if (currentView === "Assigned Samples" || currentView === "assigned") {
    return (
      <div className="p-6 space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">
          Assigned Samples ({stats.total})
        </h2>
        <Card className="shadow-sm border-none">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-widest border-b">
                    <th className="px-6 py-5">Barcode</th>
                    <th className="px-6 py-5">Patient</th>
                    <th className="px-6 py-5">Test Type</th>
                    <th className="px-6 py-5 text-center">Status</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {samples.map((sample) => (
                    <tr
                      key={sample.id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      <td className="px-6 py-4 font-bold text-blue-600">
                        {sample.barcode}
                      </td>
                      <td className="px-6 py-4 flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-medium text-slate-700">
                          {sample.patient_name || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {sample.sample_type}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge
                          variant="outline"
                          className="px-3 py-1 uppercase text-[10px] font-bold rounded-full"
                        >
                          {sample.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          className="text-blue-600 text-xs font-bold"
                          onClick={() => setCurrentView("imaging")}
                        >
                          View Details
                        </Button>
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
  }

  // --- VIEW 3: SAMPLE PROCESSING (NEW FEATURE) ---
  if (currentView === "Sample Processing" || currentView === "processing") {
    const queue = samples.filter(
      (s) => s.status === "pending" || s.status === "review",
    );
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">
            Processing Queue
          </h2>
          <Badge className="bg-blue-600">{queue.length} Active Tasks</Badge>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {queue.map((sample) => (
            <Card
              key={sample.id}
              className="border-l-4 border-l-blue-500 shadow-sm"
            >
              <CardContent className="p-4 flex flex-col md:flex-row justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-blue-600">
                      {sample.barcode}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] uppercase"
                    >
                      {sample.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 font-medium">
                    {sample.patient_name} • {sample.sample_type}
                  </p>
                </div>
                <div className="flex items-center gap-8 px-8">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      Received
                    </p>
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </div>
                  <div className="w-12 h-px bg-slate-200" />
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      Imaging
                    </p>
                    <Clock
                      className={`h-5 w-5 mx-auto ${sample.status === "pending" ? "text-slate-300" : "text-blue-500"}`}
                    />
                  </div>
                </div>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setCurrentView("imaging")}
                >
                  {sample.status === "pending"
                    ? "Start Imaging"
                    : "Resume Review"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // --- VIEW 4: DIGITAL IMAGING (FIXED UPLOAD) ---
  // --- VIEW 4: DIGITAL IMAGING (TABLE STRUCTURE) ---
  if (currentView === "imaging") {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">
            Digital Imaging Queue
          </h2>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            {
              samples.filter(
                (s) => s.status === "received" || s.status === "imaging",
              ).length
            }{" "}
            Pending Uploads
          </Badge>
        </div>
        <Card className="shadow-sm border-none">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-widest border-b">
                    <th className="px-6 py-5">Patient Details</th>
                    <th className="px-6 py-5">Sample ID / Barcode</th>
                    <th className="px-6 py-5">Test Type</th>
                    <th className="px-6 py-5 text-center">Slide Upload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {samples
                    .filter(
                      (s) => s.status === "received" || s.status === "imaging",
                    )
                    .map((sample) => (
                      <tr
                        key={sample.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">
                            {sample.patient_name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Age/Gender: {sample.age || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono font-bold text-blue-600">
                            {sample.barcode}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            ID: {sample.id}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant="outline"
                            className="bg-slate-50 uppercase text-[10px]"
                          >
                            {sample.sample_type}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {activeSampleId === sample.id.toString() ? (
                            <div className="flex flex-col items-center gap-2 bg-slate-50 p-3 rounded-lg border border-blue-100">
                              {/* Status Indicators */}
                              <div className="flex flex-col gap-1 w-full">
                                <div
                                  className={`text-[10px] flex justify-between ${selectedFile ? "text-green-600" : "text-slate-400"}`}
                                >
                                  <span>
                                    NDPI:{" "}
                                    {selectedFile
                                      ? selectedFile.name
                                      : "Missing"}
                                  </span>
                                  {selectedFile && (
                                    <CheckCircle className="h-3 w-3" />
                                  )}
                                </div>
                                <div
                                  className={`text-[10px] flex justify-between ${selectedNdpa ? "text-green-600" : "text-slate-400"}`}
                                >
                                  <span>
                                    NDPA:{" "}
                                    {selectedNdpa
                                      ? selectedNdpa.name
                                      : "Missing (Optional)"}
                                  </span>
                                  {selectedNdpa && (
                                    <CheckCircle className="h-3 w-3" />
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-2">
                                {!selectedFile && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      fileInputRef.current?.click()
                                    }
                                  >
                                    Pick NDPI
                                  </Button>
                                )}
                                {!selectedNdpa && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      ndpaInputRef.current?.click()
                                    }
                                  >
                                    Pick NDPA
                                  </Button>
                                )}
                                {(selectedFile || selectedNdpa) && (
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 h-8"
                                    onClick={() =>
                                      handleUploadToPathology()
                                    }
                                  >
                                    Confirm Upload
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-red-500"
                                  onClick={() => {
                                    setSelectedFile(null);
                                    setSelectedNdpa(null);
                                    setActiveSampleId("");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-blue-200 text-blue-600 hover:bg-blue-50 gap-2"
                              onClick={() =>
                                setActiveSampleId(sample.id.toString())
                              }
                            >
                              <Beaker className="h-3.5 w-3.5" />
                              Start Upload
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        {/* Hidden file input used by the Browse logic */}
        {/* // Inside TechnicianDashboard.tsx// */}
        {/* Hidden NDPI input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleNdpiChange}
          className="hidden"
          accept=".ndpi,.svs"
        />

        {/* New Hidden NDPA input */}
        <input
          type="file"
          ref={ndpaInputRef}
          onChange={handleNdpaChange}
          className="hidden"
          accept=".ndpa"
        />
      </div>
    );
  }
  if (currentView === "Completed Samples" || currentView === "completed") {
    const completedList = samples.filter((s) => s.status === "completed");

    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Completed Samples
            </h2>
            <p className="text-sm text-slate-500">
              History of processed and finalized pathology slides
            </p>
          </div>
          <Badge className="bg-green-100 text-green-700 border-green-200 px-4 py-1">
            {completedList.length} Total Finalized
          </Badge>
        </div>

        <Card className="shadow-sm border-none">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-widest border-b">
                    <th className="px-6 py-5">Barcode</th>
                    <th className="px-6 py-5">Patient Information</th>
                    <th className="px-6 py-5">Sample Type</th>
                    <th className="px-6 py-5 text-center">Status</th>
                    <th className="px-6 py-5 text-right">Records</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedList.length > 0 ? (
                    completedList.map((sample) => (
                      <tr
                        key={sample.id}
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        <td className="px-6 py-4 font-bold text-slate-700">
                          {sample.barcode}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">
                              {sample.patient_name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              ID: {sample.id}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {sample.sample_type}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center items-center gap-1.5 text-green-600 font-bold text-[10px] uppercase bg-green-50 py-1 px-3 rounded-full border border-green-100 w-fit mx-auto">
                            <CheckCircle className="h-3 w-3" />
                            Finalized
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-slate-600 border-slate-200 hover:bg-slate-100 gap-2"
                            onClick={() => {
                              // Later this could open the completed report preview
                              setCurrentView("reports");
                            }}
                          >
                            <FileText className="h-3.5 w-3.5" />
                            View Log
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center opacity-40">
                          <ClipboardList className="h-12 w-12 mb-2 text-slate-300" />
                          <p className="text-slate-500 italic">
                            No samples have been marked as completed yet.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default TechnicianDashboard;
