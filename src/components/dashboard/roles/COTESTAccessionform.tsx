import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  User,
  Barcode,
  Stethoscope,
  Hospital,
  ImageIcon,
  PlusCircle,
  FlaskConical,
} from "lucide-react";
import { useLabs } from "@/hooks/useLabs";

interface CoTestAccessionFormProps {
  setCurrentView: (view: string) => void;
}

const CoTestAccessionForm = ({ setCurrentView }: CoTestAccessionFormProps) => {
  const { labs, refreshLabs } = useLabs();

  // ── Common fields ──
  const [manualPatientName, setManualPatientName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [labId, setLabId] = useState<string>("");
  const [selectedLabName, setSelectedLabName] = useState<string>("");

  // ── LBC specific ──
  const [image1, setImage1] = useState<string | null>(null);
  const [image2, setImage2] = useState<string | null>(null);
  const [clinicalHistory, setClinicalHistory] = useState("");

  // ── HPV specific ──
  const [image3, setImage3] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    refreshLabs();
  }, []);

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
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

    const payload = {
      barcode,
      patient_name: manualPatientName,
      age,
      gender,
      lab_id: labId,
      sample_type: "CO-TEST",
      accession_id: loggedInUserUuid,
      doctor_name: doctorName,
      hospital_name: hospitalName,
      clinical_history: clinicalHistory,
      notes: notes,
      status: "received",
      image1,
      image2,
      image3,
      collected_at: formattedCollectionDate,
    };

    try {
      const response = await fetch(
        "http://localhost:5000/api/accession/add-sample",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        alert("Co-Test Sample successfully uploaded!");
        setManualPatientName("");
        setBarcode("");
        setLabId("");
        setSelectedLabName("");
        setAge("");
        setGender("");
        setDoctorName("");
        setHospitalName("");
        setClinicalHistory("");
        setNotes("");
        setImage1(null);
        setImage2(null);
        setImage3(null);
        setDay("");
        setMonth("");
        setYear(new Date().getFullYear().toString());
      } else {
        const errorData = await response.json();
        alert("Error: " + (errorData.details || "Upload failed"));
      }
    } catch (error) {
      console.error("Network Error:", error);
      alert("Failed to connect to the server. Check if the backend is running.");
    }
  };

  // Reusable image slot component
  const ImageSlot = ({
    image,
    onSet,
    onClear,
    label,
    ringColor,
    fileColor,
  }: {
    image: string | null;
    onSet: (val: string) => void;
    onClear: () => void;
    label: string;
    ringColor: string;
    fileColor: string;
  }) => (
    <div className="space-y-2">
      <Label className="text-xs font-bold text-slate-500 uppercase">{label}</Label>
      <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${image ? `${ringColor} bg-opacity-10` : "border-slate-200 bg-slate-50"}`}>
        {image ? (
          <div className="relative group">
            <img src={image} className="h-32 w-full object-cover rounded-lg border shadow-sm" alt={label} />
            <button
              onClick={onClear}
              className="absolute top-1 right-1 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            >×</button>
          </div>
        ) : (
          <div className="py-4">
            <ImageIcon className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, onSet)}
              className={`text-[10px] block w-full text-slate-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs ${fileColor}`}
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Co-Test Accession
          </h2>
          <p className="text-slate-500 mt-1">
            Register combined LBC + HPV sample with patient details and images.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-teal-100 rounded-xl flex items-center justify-center">
            <FlaskConical className="h-6 w-6 text-teal-600" />
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentView("select-sample-type")}
            className="text-slate-500"
          >
            ← Back
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-2xl ring-1 ring-slate-200">
        <CardContent className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

            {/* ── SECTION 1: PATIENT IDENTIFICATION (COMMON) ── */}
            <div className="col-span-full">
              <p className="text-[11px] font-black text-teal-600 uppercase tracking-[0.2em] mb-4">
                Patient Identification
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Patient Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  placeholder="Enter Name"
                  value={manualPatientName}
                  onChange={(e) => setManualPatientName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Barcode / Sample ID</Label>
              <div className="relative">
                <Barcode className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  placeholder="e.g. VMD00225"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Age</Label>
              <input
                type="number"
                placeholder="Years"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Gender</Label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="">Select Gender...</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* ── SECTION 2: LBC IMAGES ── */}
            <div className="col-span-full pt-4 mt-2 border-t border-slate-100">
              <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">
                LBC — Digital Cytology Images
              </p>
              <p className="text-xs text-slate-400 mb-4">
                Two microscopic images for Liquid Based Cytology
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImageSlot
                  image={image1}
                  onSet={setImage1}
                  onClear={() => setImage1(null)}
                  label="LBC Image Slot 01"
                  ringColor="border-blue-400"
                  fileColor="file:bg-blue-50 file:text-blue-700"
                />
                <ImageSlot
                  image={image2}
                  onSet={setImage2}
                  onClear={() => setImage2(null)}
                  label="LBC Image Slot 02"
                  ringColor="border-blue-400"
                  fileColor="file:bg-blue-50 file:text-blue-700"
                />
              </div>
            </div>

            {/* LBC Clinical History */}
            <div className="col-span-full space-y-2">
              <Label className="text-sm font-bold text-slate-700">
                Clinical History / Symptoms
                <span className="ml-2 text-xs font-normal text-blue-500">(for LBC report)</span>
              </Label>
              <textarea
                placeholder="e.g. Perimenopausal, P2 L2, Abnormal Bleeding..."
                value={clinicalHistory}
                onChange={(e) => setClinicalHistory(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[90px] transition-all"
              />
            </div>

            {/* ── SECTION 3: HPV IMAGE ── */}
            <div className="col-span-full pt-4 mt-2 border-t border-slate-100">
              <p className="text-[11px] font-black text-purple-600 uppercase tracking-[0.2em] mb-1">
                HPV — PCR Amplification Plot
              </p>
              <p className="text-xs text-slate-400 mb-4">
                One image for HPV DNA Real Time PCR report
              </p>
              <div className="max-w-sm">
                <ImageSlot
                  image={image3}
                  onSet={setImage3}
                  onClear={() => setImage3(null)}
                  label="HPV Image Slot 01"
                  ringColor="border-purple-400"
                  fileColor="file:bg-purple-50 file:text-purple-700"
                />
              </div>
            </div>

            {/* HPV Notes */}
            <div className="col-span-full space-y-2">
              <Label className="text-sm font-bold text-slate-700">
                Notes
                <span className="ml-2 text-xs font-normal text-purple-500">(for HPV report)</span>
              </Label>
              <textarea
                placeholder="Add any relevant notes about the HPV sample..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none min-h-[90px] transition-all"
              />
            </div>

            {/* ── SECTION 4: CLINICAL CONTEXT (COMMON) ── */}
            <div className="col-span-full pt-4 mt-2 border-t border-slate-100">
              <p className="text-[11px] font-black text-teal-600 uppercase tracking-[0.2em] mb-4">
                Clinical Context
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Referring Doctor</Label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  placeholder="Dr. Name"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Hospital / Clinic</Label>
              <div className="relative">
                <Hospital className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  placeholder="Sudha Hospital"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>

            {/* Collection Date */}
            <div className="col-span-full space-y-2">
              <Label className="text-sm font-bold text-slate-700">Collection Date</Label>
              <div className="grid grid-cols-3 gap-4">
                <select value={day} onChange={(e) => setDay(e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none">
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, "0")}>{i + 1}</option>
                  ))}
                </select>
                <select value={month} onChange={(e) => setMonth(e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none">
                  <option value="">Month</option>
                  {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
                    <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>
                  ))}
                </select>
                <select value={year} onChange={(e) => setYear(e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none">
                  <option value="">Year</option>
                  {Array.from({ length: 5 }, (_, i) => {
                    const y = new Date().getFullYear() - i;
                    return <option key={y} value={y}>{y}</option>;
                  })}
                </select>
              </div>
            </div>

            {/* ── SECTION 5: LOGISTICS (COMMON) ── */}
            <div className="col-span-full pt-4 mt-2 border-t border-slate-100">
              <p className="text-[11px] font-black text-teal-600 uppercase tracking-[0.2em] mb-4">
                Logistics & Test Routing
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Destination Lab</Label>
              <select
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
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
                  <option key={lab.id} value={lab.name}>{lab.name}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Submit Button */}
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
                !doctorName ||
                !hospitalName ||
                (!image1 && !image2 && !image3)
              }
              className="w-full py-7 text-lg font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xl transition-transform active:scale-95 disabled:bg-slate-300"
            >
              <PlusCircle className="mr-2 h-6 w-6" /> Complete Co-Test Accession
            </Button>
            <p className="text-center text-slate-400 text-[11px] mt-4 uppercase tracking-widest font-semibold">
              Pushes LBC + HPV data to Pathologist Queue & Patient Database
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CoTestAccessionForm;
