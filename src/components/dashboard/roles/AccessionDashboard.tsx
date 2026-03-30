import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ClipboardList,
  User,
  Building2,
  Barcode,
  Stethoscope,
  PlusCircle,
  Beaker,
  Badge,
  Activity,
  Hospital,
  ImageIcon,
} from "lucide-react";
import StatsCards from "../StatsCards";
import { useToast } from "@/hooks/use-toast";
import { useSamples } from "../../../hooks/useSamples";
import { useLabs } from "@/hooks/useLabs";
import { Label } from "@/components/ui/label";
import HPVAccessionForm from "./HPVAccessionform";
import LBCAccessionForm from "./LBCAccessionform";

interface AccessionDashboardProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

interface PendingPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  customer_id: string;
  clinic_name: string;
}

const AccessionDashboard = ({
  currentView,
  setCurrentView,
}: AccessionDashboardProps) => {
  // Hooks for existing data
  const {
    samples,
    loading: samplesLoading,
    error,
    // refreshSamples, // Removed since not returned by useSamples
  } = useSamples();
  const { labs, refreshLabs } = useLabs();
  const { toast } = useToast();

  const [manualPatientName, setManualPatientName] = useState("");
  // Keep your existing states
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [barcode, setBarcode] = useState("");
  const [sampleType, setSampleType] = useState("");
  const [labId, setLabId] = useState<string>("");
  const [selectedLabName, setSelectedLabName] = useState<string>("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [clinicalHistory, setClinicalHistory] = useState("");
  const [image1, setImage1] = useState<string | null>(null);
  const [image2, setImage2] = useState<string | null>(null);

  // Fetch only patients who don't have a barcode assigned yet
  // const fetchPendingPatients = async () => {
  //   setFetchingPatients(true);
  //   try {
  //     const res = await fetch(
  //       "http://localhost:5000/api/accession/pending-patients",
  //     );
  //     if (res.ok) {
  //       const data = await res.json();
  //       setPendingPatients(data);
  //     }
  //   } catch (err) {
  //     console.error("Error fetching pending patients", err);
  //   } finally {
  //     setFetchingPatients(false);
  //   }
  // };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await refreshLabs();
      } catch (err) {
        console.error("Failed to fetch labs:", err);
      }
    };

    loadInitialData();
  }, []); // Empty brackets means "Run once on page load"

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };
  const handleCreateSample = async () => {
    const loggedInUserUuid = localStorage.getItem("user_id");
    const formattedCollectionDate = `${year}-${month}-${day}`;

    // 1. Prepare the payload including the Base64 image strings
    const payload = {
      barcode: barcode,
      patient_name: manualPatientName,
      age: age,
      gender: gender,
      lab_id: labId,
      sample_type: sampleType,
      accession_id: loggedInUserUuid,
      doctor_name: doctorName,
      hospital_name: hospitalName,
      clinical_history: clinicalHistory,
      status: "received",
      // ✅ CRITICAL: Add the images here
      image1: image1,
      image2: image2,
      collected_at: formattedCollectionDate,
    };

    try {
      // 2. Use your EC2 IP if working remotely, or localhost for local testing
      const response = await fetch(
        "http://localhost:5000/api/accession/add-sample",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (response.ok) {
        alert("Sample and Images successfully uploaded to server!");

        // 3. Clear all states including the images
        setManualPatientName("");
        setBarcode("");
        setLabId("");
        setSelectedLabName("");
        setAge("");
        setGender("");
        setDoctorName("");
        setHospitalName("");
        setClinicalHistory("");
        setImage1(null); // Clear image 1 preview
        setImage2(null); // Clear image 2 preview
      } else {
        const errorData = await response.json();
        alert("Error: " + (errorData.details || "Upload failed"));
      }
    } catch (error) {
      console.error("Network Error:", error);
      alert(
        "Failed to connect to the server. Check if the backend is running.",
      );
    }
  };
  // --- THE FIX IS HERE ---
  // Only show loading if the DATA is missing, NOT if the VIEW is 'add-sample'
  if (samplesLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="ml-2 mt-4 text-slate-500 font-medium">
          Initializing Laboratory Systems...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4 text-center">
        <p className="text-red-600 font-bold">Connection Error</p>
        <p className="text-red-500 text-sm">
          Please ensure the Node.js backend is running on port 5000.
        </p>
      </div>
    );
  }

  switch (currentView) {
    case "dashboard":
      // Logic Calculations:
      // 1. Pending: Just received, no slide yet
      const pendingCount = samples.filter(
        (s) => s.status === "received",
      ).length;
      // 2. Imaging & Review: Slide uploaded, ready for Pathologist
      const reviewCount = samples.filter(
        (s) => s.status === "imaging" || s.status === "review",
      ).length;
      // 3. Completed: Report finalized
      const completedCount = samples.filter(
        (s) => s.status === "completed",
      ).length;
      // 4. Total: Everything in the system
      const totalCount = samples.length;

      return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-6xl mx-auto p-4">
          {/* 1. Simplified Header */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
                Vyuhaa Accession Dashboard
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  Live Lab Monitor
                </span>
              </div>
            </div>
            <div className="text-right font-mono text-xs text-slate-400">
              {new Date().toLocaleTimeString()}
            </div>
          </div>

          {/* 2. Professional Light Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* TOTAL SAMPLES */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Samples
              </span>
              <div className="text-4xl font-black text-slate-800 mt-2">
                {totalCount}
              </div>
            </div>

            {/* PENDING */}
            <div className="bg-white border border-blue-100 p-6 rounded-3xl shadow-sm">
              <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wider">
                Pending
              </span>
              <div className="text-4xl font-black text-blue-600 mt-2">
                {pendingCount}
              </div>
            </div>

            {/* IMAGING & REVIEW */}
            <div className="bg-white border border-orange-100 p-6 rounded-3xl shadow-sm">
              <span className="text-[11px] font-bold text-orange-500 uppercase tracking-wider">
                Imaging & Review
              </span>
              <div className="text-4xl font-black text-orange-600 mt-2">
                {reviewCount}
              </div>
            </div>

            {/* COMPLETED */}
            <div className="bg-white border border-emerald-100 p-6 rounded-3xl shadow-sm">
              <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">
                Completed
              </span>
              <div className="text-4xl font-black text-emerald-600 mt-2">
                {completedCount}
              </div>
            </div>
          </div>

          {/* 3. Primary Navigation Action */}
          <div className="flex flex-col items-center py-20 bg-slate-50/50 rounded-[40px] border border-dashed border-slate-200">
            <Button
              onClick={() => setCurrentView("select-sample-type")}
              className="group bg-blue-600 hover:bg-blue-700 text-white font-bold py-8 px-20 rounded-2xl shadow-xl shadow-blue-100 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-4 text-2xl"
            >
              <PlusCircle className="h-7 w-7 transition-transform group-hover:rotate-90" />
              Register New Sample
            </Button>
            <p className="mt-6 text-slate-400 text-sm font-medium">
              Click to add patient details, age, gender, and assign a barcode.
            </p>
          </div>
        </div>
      );
    case "select-sample-type":
      return (
        <div className="max-w-3xl mx-auto py-12 animate-in fade-in duration-500">
          <div className="flex items-center justify-between mb-10 border-b pb-6">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Select Sample Type
              </h2>
              <p className="text-slate-500 mt-1">
                Choose the type of test to register a new sample.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentView("dashboard")}
              className="text-slate-500"
            >
              ← Back
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* LBC Option */}
            <div
              onClick={() => setCurrentView("add-sample")}
              className="cursor-pointer group border-2 border-blue-200 hover:border-blue-500 bg-white hover:bg-blue-50 rounded-2xl p-8 flex flex-col items-center gap-4 shadow-md transition-all hover:scale-[1.03]"
            >
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-all">
                <Beaker className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">LBC</h3>
              <p className="text-slate-500 text-sm text-center">
                Liquid Based Cytology test for cervical cancer screening.
              </p>
              <span className="mt-2 text-blue-600 font-semibold text-sm group-hover:underline">
                Select →
              </span>
            </div>

            {/* HPV Option */}
            <div
              onClick={() => setCurrentView("add-sample-hpv")}
              className="cursor-pointer group border-2 border-purple-200 hover:border-purple-500 bg-white hover:bg-purple-50 rounded-2xl p-8 flex flex-col items-center gap-4 shadow-md transition-all hover:scale-[1.03]"
            >
              <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-all">
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">HPV</h3>
              <p className="text-slate-500 text-sm text-center">
                Human Papillomavirus test for high-risk HPV detection.
              </p>
              <span className="mt-2 text-purple-600 font-semibold text-sm group-hover:underline">
                Select →
              </span>
            </div>

            {/* Co-Test Option */}
            <div
              onClick={() => setCurrentView("add-sample-cotest")}
              className="cursor-pointer group border-2 border-emerald-200 hover:border-emerald-500 bg-white hover:bg-emerald-50 rounded-2xl p-8 flex flex-col items-center gap-4 shadow-md transition-all hover:scale-[1.03]"
            >
              <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center group-hover:bg-emerald-200 transition-all">
                <ClipboardList className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Co-Test</h3>
              <p className="text-slate-500 text-sm text-center">
                Combined LBC + HPV co-testing for comprehensive screening.
              </p>
              <span className="mt-2 text-emerald-600 font-semibold text-sm group-hover:underline">
                Select →
              </span>
            </div>
          </div>
        </div>
      );

    case "add-sample-hpv":
      return <HPVAccessionForm setCurrentView={setCurrentView} />;

    case "add-sample-cotest":
      return (
        <div className="max-w-4xl mx-auto py-8 animate-in fade-in duration-500">
          <div className="flex items-center justify-between mb-8 border-b pb-6">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Co-Test Accession
              </h2>
              <p className="text-slate-500 mt-1">
                Co-Test form — coming soon.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentView("select-sample-type")}
              className="text-slate-500"
            >
              ← Back
            </Button>
          </div>
          <div className="flex items-center justify-center h-48 text-slate-400 text-lg font-medium border-2 border-dashed rounded-2xl">
            Co-Test Form — Coming Soon
          </div>
        </div>
      );

    case "add-sample":
      return <LBCAccessionForm setCurrentView={setCurrentView} />;
    case "sample-queue":
      return (
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Sample Queue
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {samples.length} Samples
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Barcode
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {samples.map((sample: any) => (
                    <tr
                      key={sample.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {sample.barcode}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {sample.patient_name || "Unassigned"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold border ${
                            sample.status?.toLowerCase() === "completed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-amber-50 text-amber-700 border-amber-100"
                          }`}
                        >
                          {sample.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {samples.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                Queue is empty.
              </div>
            )}
          </div>
        </div>
      );

    case "rejected-samples":
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-red-600">Rejected Samples</h2>
          {samples
            .filter((s: any) => s.status === "rejected")
            .map((s: any) => (
              <Card key={s.id}>
                <CardContent className="p-4">
                  <div className="font-semibold">{s.barcode}</div>
                </CardContent>
              </Card>
            ))}
        </div>
      );

    case "track-samples":
      return (
        <div className="p-6">
          <h2 className="text-2xl font-bold">Track Samples</h2>
          <p className="text-slate-500 mt-2">
            Use the search bar above to track specific specimens.
          </p>
        </div>
      );

    default:
      return <div className="p-8 text-center">Section not found.</div>;
  }
};

export default AccessionDashboard;
