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
  Search,
} from "lucide-react";
import StatsCards from "../StatsCards";
import { useToast } from "@/hooks/use-toast";
import { useSamples } from "../../../hooks/useSamples";
import { useLabs } from "@/hooks/useLabs";
import { Label } from "@/components/ui/label";
import HPVAccessionForm from "./HPVAccessionform";
import LBCAccessionForm from "./LBCAccessionform";
import CoTestAccessionForm from "./COTESTAccessionform";

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
  const [trackSearch, setTrackSearch] = useState("");
  const [queueSearch, setQueueSearch] = useState("");
  const [queueStatusFilter, setQueueStatusFilter] = useState("all");
  const [queueTypeFilter, setQueueTypeFilter] = useState("all");
  const [queuePage, setQueuePage] = useState(1);
  const queuePerPage = 10;

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
      return <CoTestAccessionForm setCurrentView={setCurrentView} />;

    case "add-sample":
      return <LBCAccessionForm setCurrentView={setCurrentView} />;
    case "sample-queue": {
      // ── Stats ──────────────────────────────────────────────────────────────
      const qTotal     = samples.length;
      const qReceived  = samples.filter((s: any) => s.status?.toLowerCase() === "received").length;
      const qReview    = samples.filter((s: any) => ["review","imaging"].includes(s.status?.toLowerCase())).length;
      const qCompleted = samples.filter((s: any) => ["completed","archived"].includes(s.status?.toLowerCase())).length;

      // ── Filter + Search ───────────────────────────────────────────────────
      const qFiltered = samples.filter((s: any) => {
        const st = s.status?.toLowerCase() || "";
        const tp = s.sample_type?.toLowerCase() || "";
        const matchStatus =
          queueStatusFilter === "all"       ? true
          : queueStatusFilter === "received"  ? st === "received"
          : queueStatusFilter === "review"    ? ["review","imaging"].includes(st)
          : queueStatusFilter === "completed" ? ["completed","archived"].includes(st)
          : true;
        const matchType =
          queueTypeFilter === "all" ? true : tp === queueTypeFilter;
        const q = queueSearch.toLowerCase();
        const matchSearch =
          !q ||
          s.barcode?.toLowerCase().includes(q) ||
          s.patient_name?.toLowerCase().includes(q) ||
          s.doctor_name?.toLowerCase().includes(q) ||
          s.hospital_name?.toLowerCase().includes(q);
        return matchStatus && matchType && matchSearch;
      });

      const qTotalPages = Math.ceil(qFiltered.length / queuePerPage);
      const qStart      = (queuePage - 1) * queuePerPage;
      const qPageData   = qFiltered.slice(qStart, qStart + queuePerPage);

      const getStatusStyle = (status: string) => {
        const s = status?.toLowerCase();
        if (s === "completed" || s === "archived") return { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Completed" };
        if (s === "review" || s === "imaging") return { dot: "bg-orange-400", badge: "bg-orange-50 text-orange-700 border-orange-200", label: "In Review" };
        return { dot: "bg-blue-400", badge: "bg-blue-50 text-blue-700 border-blue-200", label: "Received" };
      };

      const getTypeStyle = (type: string) => {
        const t = type?.toLowerCase();
        if (t === "hpv")     return "bg-purple-100 text-purple-700 border-purple-200";
        if (t === "co-test") return "bg-teal-100 text-teal-700 border-teal-200";
        return "bg-blue-100 text-blue-700 border-blue-200";
      };

      return (
        <div className="space-y-6 max-w-7xl mx-auto">

          {/* ── Page Header ──────────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-5">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                Sample Queue
              </h2>
              <p className="text-slate-500 text-sm mt-0.5">
                All registered samples and their current lab status
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Live
              </span>
            </div>
          </div>

          {/* ── Stats Row ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total",     value: qTotal,     color: "border-slate-200   text-slate-700",   bg: "bg-white" },
              { label: "Received",  value: qReceived,  color: "border-blue-100    text-blue-700",    bg: "bg-blue-50" },
              { label: "In Review", value: qReview,    color: "border-orange-100  text-orange-700",  bg: "bg-orange-50" },
              { label: "Completed", value: qCompleted, color: "border-emerald-100 text-emerald-700", bg: "bg-emerald-50" },
            ].map((stat) => (
              <div key={stat.label} className={`${stat.bg} border ${stat.color} rounded-2xl p-4 text-center shadow-sm`}>
                <div className={`text-3xl font-black ${stat.color.split(" ")[1]}`}>{stat.value}</div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* ── Search + Filters ─────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search barcode, patient, doctor, hospital..."
                value={queueSearch}
                onChange={(e) => { setQueueSearch(e.target.value); setQueuePage(1); }}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-400 outline-none"
              />
              {queueSearch && (
                <button onClick={() => setQueueSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold">✕</button>
              )}
            </div>

            {/* Status Filter */}
            <select
              value={queueStatusFilter}
              onChange={(e) => { setQueueStatusFilter(e.target.value); setQueuePage(1); }}
              className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white text-slate-700 outline-none focus:ring-2 focus:ring-blue-400 min-w-[150px]"
            >
              <option value="all">All Statuses</option>
              <option value="received">Received</option>
              <option value="review">In Review</option>
              <option value="completed">Completed</option>
            </select>

            {/* Type Filter */}
            <select
              value={queueTypeFilter}
              onChange={(e) => { setQueueTypeFilter(e.target.value); setQueuePage(1); }}
              className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white text-slate-700 outline-none focus:ring-2 focus:ring-blue-400 min-w-[140px]"
            >
              <option value="all">All Types</option>
              <option value="lbc">LBC</option>
              <option value="hpv">HPV</option>
              <option value="co-test">Co-Test</option>
            </select>
          </div>

          {/* ── Table ────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    {["#","Barcode","Patient Name","Age / Sex","Sample Type","Doctor","Hospital","Date Received","Status"].map((h) => (
                      <th key={h} className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {qPageData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-16 text-center text-slate-400 italic text-sm">
                        {queueSearch || queueStatusFilter !== "all" || queueTypeFilter !== "all"
                          ? "No samples match your filters."
                          : "No samples in queue yet."}
                      </td>
                    </tr>
                  ) : (
                    qPageData.map((sample: any, idx: number) => {
                      const st = getStatusStyle(sample.status);
                      return (
                        <tr
                          key={sample.id}
                          className={`border-b border-slate-100 transition-colors hover:bg-blue-50/40 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}
                        >
                          {/* # */}
                          <td className="px-4 py-4 text-xs text-slate-400 font-medium">
                            {qStart + idx + 1}
                          </td>
                          {/* Barcode */}
                          <td className="px-4 py-4">
                            <span className="font-black text-blue-700 text-sm tracking-wide font-mono">
                              {sample.barcode}
                            </span>
                          </td>
                          {/* Patient Name */}
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-black text-slate-500 shrink-0">
                                {(sample.patient_name || "?")[0].toUpperCase()}
                              </div>
                              <span className="font-semibold text-slate-800 text-sm">
                                {sample.patient_name || "—"}
                              </span>
                            </div>
                          </td>
                          {/* Age/Sex */}
                          <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                            {sample.age || "—"} / {sample.gender || "—"}
                          </td>
                          {/* Sample Type */}
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black border ${getTypeStyle(sample.sample_type)}`}>
                              {sample.sample_type?.toUpperCase() || "—"}
                            </span>
                          </td>
                          {/* Doctor */}
                          <td className="px-4 py-4 text-sm text-slate-600">
                            {sample.doctor_name || "—"}
                          </td>
                          {/* Hospital */}
                          <td className="px-4 py-4 text-sm text-slate-600">
                            {sample.hospital_name || "—"}
                          </td>
                          {/* Date */}
                          <td className="px-4 py-4 text-sm text-slate-500 whitespace-nowrap">
                            {sample.collected_at
                              ? new Date(sample.collected_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                              : "—"}
                          </td>
                          {/* Status */}
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border ${st.badge}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                              {st.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ───────────────────────────────────────────── */}
            <div className="bg-white px-6 py-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {qFiltered.length === 0 ? 0 : qStart + 1}–{Math.min(qStart + queuePerPage, qFiltered.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">{qFiltered.length}</span> samples
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQueuePage((p) => p - 1)}
                  disabled={queuePage === 1}
                  className="h-8 px-3 text-xs border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                >
                  ← Previous
                </button>
                <span className="text-xs text-slate-500 px-2">
                  Page {queuePage} of {qTotalPages || 1}
                </span>
                <button
                  onClick={() => setQueuePage((p) => p + 1)}
                  disabled={queuePage === qTotalPages || qTotalPages === 0}
                  className="h-8 px-3 text-xs border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

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

    case "track":
      const filteredSamples = samples.filter((s: any) =>
        s.barcode?.toLowerCase().includes(trackSearch.toLowerCase()) ||
        s.patient_name?.toLowerCase().includes(trackSearch.toLowerCase()) ||
        s.doctor_name?.toLowerCase().includes(trackSearch.toLowerCase()) ||
        s.sample_type?.toLowerCase().includes(trackSearch.toLowerCase())
      );
      return (
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Sample History
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Complete history of all registered samples regardless of status.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800">
              {filteredSamples.length} / {samples.length} Samples
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by barcode, patient, doctor, type..."
              value={trackSearch}
              onChange={(e) => setTrackSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-400 outline-none"
            />
            {trackSearch && (
              <button
                onClick={() => setTrackSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕ Clear
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest">
                      #
                    </th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest">
                      Barcode
                    </th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest">
                      Patient Name
                    </th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest">
                      Age / Sex
                    </th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest">
                      Sample Type
                    </th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest">
                      Doctor
                    </th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest">
                      Date
                    </th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-center">
                      Report Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSamples.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-16 text-center text-slate-400 italic text-sm"
                      >
                        {trackSearch ? `No samples found for "${trackSearch}"` : "No samples found in history."}
                      </td>
                    </tr>
                  ) : (
                    filteredSamples.map((sample: any, idx: number) => {
                      const isFinalized =
                        sample.status?.toLowerCase() === "completed";
                      const isArchived =
                        sample.status?.toLowerCase() === "archived";
                      return (
                        <tr
                          key={sample.id}
                          className={`border-b border-slate-100 transition-colors hover:bg-blue-50/40 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                        >
                          <td className="px-5 py-4 text-xs text-slate-400 font-medium">
                            {idx + 1}
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-bold text-blue-700 text-sm tracking-wide">
                              {sample.barcode}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-semibold text-slate-800 text-sm">
                            {sample.patient_name || "—"}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">
                            {sample.age || "—"} / {sample.gender || "—"}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                sample.sample_type?.toLowerCase() === "hpv"
                                  ? "bg-purple-100 text-purple-700 border-purple-200"
                                  : sample.sample_type?.toLowerCase() ===
                                      "co-test"
                                    ? "bg-teal-100 text-teal-700 border-teal-200"
                                    : "bg-blue-100 text-blue-700 border-blue-200"
                              }`}
                            >
                              {sample.sample_type?.toUpperCase() || "—"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">
                            {sample.doctor_name || "—"}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-500">
                            {sample.collected_at
                              ? new Date(
                                  sample.collected_at,
                                ).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "—"}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black border ${
                                isFinalized || isArchived
                                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                  : "bg-amber-100 text-amber-700 border-amber-200"
                              }`}
                            >
                              {isFinalized || isArchived ? "✓ Completed" : "⏳ Pending"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {filteredSamples.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                No sample history found.
              </div>
            )}
          </div>
        </div>
      );

    default:
      return <div className="p-8 text-center">Section not found.</div>;
  }
};

export default AccessionDashboard;
