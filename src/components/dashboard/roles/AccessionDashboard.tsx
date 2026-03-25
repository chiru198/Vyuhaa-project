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
              // Navigates to the manual entry form
              onClick={() => setCurrentView("add-sample")}
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
    case "add-sample":
      return (
        <div className="max-w-4xl mx-auto py-8 animate-in fade-in duration-500">
          {/* Header Area */}
          <div className="flex items-center justify-between mb-8 border-b pb-6">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Lab Accession
              </h2>
              <p className="text-slate-500 mt-1">
                Register new samples with digital cytology images for the
                technician queue.
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <ClipboardList className="h-6 w-6 text-blue-600" />
            </div>
          </div>

          <Card className="border-none shadow-2xl ring-1 ring-slate-200">
            <CardContent className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* --- SECTION 1: PRIMARY PATIENT DATA --- */}
                <div className="col-span-full">
                  <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4">
                    Patient Identification
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">
                    Patient Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      placeholder="Enter Name"
                      value={manualPatientName}
                      onChange={(e) => setManualPatientName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">
                    Barcode / Sample ID
                  </Label>
                  <div className="relative">
                    <Barcode className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      placeholder="e.g. VMD00225"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">
                    Age
                  </Label>
                  <input
                    type="number"
                    placeholder="Years"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">
                    Gender
                  </Label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Gender...</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* --- SECTION 2: DIGITAL IMAGES (SIDE BY SIDE) --- */}
                <div className="col-span-full pt-4 mt-2 border-t border-slate-100">
                  <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4">
                    Digital Cytology Images (Microscopic View)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Image 1 Upload */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase">
                        Image Slot 01
                      </Label>
                      <div
                        className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${image1 ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-slate-50"}`}
                      >
                        {image1 ? (
                          <div className="relative group">
                            <img
                              src={image1}
                              className="h-32 w-full object-cover rounded-lg border shadow-sm"
                              alt="Preview 1"
                            />
                            <button
                              onClick={() => setImage1(null)}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="py-4">
                            <ImageIcon className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, setImage1)}
                              className="text-[10px] block w-full text-slate-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Image 2 Upload */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase">
                        Image Slot 02
                      </Label>
                      <div
                        className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${image2 ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-slate-50"}`}
                      >
                        {image2 ? (
                          <div className="relative group">
                            <img
                              src={image2}
                              className="h-32 w-full object-cover rounded-lg border shadow-sm"
                              alt="Preview 2"
                            />
                            <button
                              onClick={() => setImage2(null)}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="py-4">
                            <ImageIcon className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, setImage2)}
                              className="text-[10px] block w-full text-slate-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- SECTION 3: MEDICAL CONTEXT --- */}
                <div className="col-span-full pt-4 mt-2 border-t border-slate-100">
                  <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4">
                    Clinical Context
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">
                    Referring Doctor
                  </Label>
                  <div className="relative">
                    <Stethoscope className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      placeholder="Dr. Name"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">
                    Hospital / Clinic
                  </Label>
                  <div className="relative">
                    <Hospital className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      placeholder="Sudha Hospital"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div className="col-span-full space-y-2">
                  <Label className="text-sm font-bold text-slate-700">
                    Collection Date
                  </Label>
                  <div className="grid grid-cols-3 gap-4">
                    {/* Day Select */}
                    <select
                      value={day}
                      onChange={(e) => setDay(e.target.value)}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Day</option>
                      {Array.from({ length: 31 }, (_, i) => (
                        <option
                          key={i + 1}
                          value={String(i + 1).padStart(2, "0")}
                        >
                          {i + 1}
                        </option>
                      ))}
                    </select>

                    {/* Month Select */}
                    <select
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Month</option>
                      {[
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "May",
                        "Jun",
                        "Jul",
                        "Aug",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Dec",
                      ].map((m, i) => (
                        <option key={m} value={String(i + 1).padStart(2, "0")}>
                          {m}
                        </option>
                      ))}
                    </select>

                    {/* Year Select */}
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Year</option>
                      {Array.from({ length: 5 }, (_, i) => {
                        const y = new Date().getFullYear() - i;
                        return (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div className="col-span-full space-y-2">
                  <Label className="text-sm font-bold text-slate-700">
                    Clinical History / Symptoms
                  </Label>
                  <textarea
                    placeholder="e.g. Perimenopausal, P2 L2, Abnormal Bleeding..."
                    value={clinicalHistory}
                    onChange={(e) => setClinicalHistory(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] transition-all"
                  />
                </div>

                {/* --- SECTION 4: LOGISTICS --- */}
                <div className="col-span-full pt-4 mt-2 border-t border-slate-100">
                  <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4">
                    Logistics & Test Routing
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">
                    Destination Lab
                  </Label>
                  <select
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={selectedLabName}
                    onChange={(e) => {
                      const name = e.target.value;
                      setSelectedLabName(name);
                      const foundLab = labs.find((l: any) => l.name === name);
                      if (foundLab) setLabId(foundLab.id);
                    }}
                  >
                    <option value="">Select Lab...</option>
                    {labs.map((lab: any) => (
                      <option key={lab.id} value={lab.name}>
                        {lab.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">
                    Test Type
                  </Label>
                  <select
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={sampleType}
                    onChange={(e) => setSampleType(e.target.value)}
                  >
                    <option value="">Select Test...</option>
                    <option value="LBC">LBC (Liquid Based Cytology)</option>
                    <option value="HPV">HPV Testing</option>
                    <option value="CO-TEST">CO-TEST (LBC + HPV)</option>
                  </select>
                </div>
              </div>

              {/* Submission Action */}
              <div className="mt-12">
                <Button
                  onClick={handleCreateSample}
                  disabled={
                    !manualPatientName ||
                    !barcode ||
                    !day ||
                    !month ||
                    !year ||
                    !labId ||
                    !sampleType ||
                    !doctorName ||
                    !hospitalName ||
                    (!image1 && !image2) // Require at least one image
                  }
                  className="w-full py-7 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xl transition-transform active:scale-95 disabled:bg-slate-300"
                >
                  <PlusCircle className="mr-2 h-6 w-6" /> Complete Accession
                </Button>
                <p className="text-center text-slate-400 text-[11px] mt-4 uppercase tracking-widest font-semibold">
                  Pushes data to Technician Imaging Queue & Patient Database
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
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
