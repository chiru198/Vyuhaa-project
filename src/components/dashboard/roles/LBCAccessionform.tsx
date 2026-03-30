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
  ClipboardList,
} from "lucide-react";
import { useLabs } from "@/hooks/useLabs";

interface LBCAccessionFormProps {
  setCurrentView: (view: string) => void;
}

const LBCAccessionForm = ({ setCurrentView }: LBCAccessionFormProps) => {
  const { labs, refreshLabs } = useLabs();

  const [manualPatientName, setManualPatientName] = useState("");
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
      sample_type: sampleType,
      accession_id: loggedInUserUuid,
      doctor_name: doctorName,
      hospital_name: hospitalName,
      clinical_history: clinicalHistory,
      status: "received",
      image1,
      image2,
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
        alert("Sample and Images successfully uploaded to server!");
        setManualPatientName("");
        setBarcode("");
        setLabId("");
        setSelectedLabName("");
        setAge("");
        setGender("");
        setDoctorName("");
        setHospitalName("");
        setClinicalHistory("");
        setImage1(null);
        setImage2(null);
        setSampleType("");
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

  return (
    <div className="max-w-4xl mx-auto py-8 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex items-center justify-between mb-8 border-b pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            LBC Accession
          </h2>
          <p className="text-slate-500 mt-1">
            Register new samples with digital cytology images for the technician queue.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <ClipboardList className="h-6 w-6 text-blue-600" />
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

            {/* SECTION 1: PATIENT IDENTIFICATION */}
            <div className="col-span-full">
              <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4">
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
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
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
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 outline-none"
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
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Gender</Label>
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

            {/* SECTION 2: DIGITAL IMAGES */}
            <div className="col-span-full pt-4 mt-2 border-t border-slate-100">
              <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4">
                Digital Cytology Images (Microscopic View)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image 1 */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Image Slot 01</Label>
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${image1 ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-slate-50"}`}>
                    {image1 ? (
                      <div className="relative group">
                        <img src={image1} className="h-32 w-full object-cover rounded-lg border shadow-sm" alt="Preview 1" />
                        <button onClick={() => setImage1(null)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                      </div>
                    ) : (
                      <div className="py-4">
                        <ImageIcon className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setImage1)} className="text-[10px] block w-full text-slate-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Image 2 */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Image Slot 02</Label>
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${image2 ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-slate-50"}`}>
                    {image2 ? (
                      <div className="relative group">
                        <img src={image2} className="h-32 w-full object-cover rounded-lg border shadow-sm" alt="Preview 2" />
                        <button onClick={() => setImage2(null)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                      </div>
                    ) : (
                      <div className="py-4">
                        <ImageIcon className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setImage2)} className="text-[10px] block w-full text-slate-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: CLINICAL CONTEXT */}
            <div className="col-span-full pt-4 mt-2 border-t border-slate-100">
              <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4">
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
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Collection Date */}
            <div className="col-span-full space-y-2">
              <Label className="text-sm font-bold text-slate-700">Collection Date</Label>
              <div className="grid grid-cols-3 gap-4">
                <select value={day} onChange={(e) => setDay(e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, "0")}>{i + 1}</option>
                  ))}
                </select>

                <select value={month} onChange={(e) => setMonth(e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Month</option>
                  {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
                    <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>
                  ))}
                </select>

                <select value={year} onChange={(e) => setYear(e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Year</option>
                  {Array.from({ length: 5 }, (_, i) => {
                    const y = new Date().getFullYear() - i;
                    return <option key={y} value={y}>{y}</option>;
                  })}
                </select>
              </div>
            </div>

            {/* Clinical History */}
            <div className="col-span-full space-y-2">
              <Label className="text-sm font-bold text-slate-700">Clinical History / Symptoms</Label>
              <textarea
                placeholder="e.g. Perimenopausal, P2 L2, Abnormal Bleeding..."
                value={clinicalHistory}
                onChange={(e) => setClinicalHistory(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] transition-all"
              />
            </div>

            {/* SECTION 4: LOGISTICS */}
            <div className="col-span-full pt-4 mt-2 border-t border-slate-100">
              <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4">
                Logistics & Test Routing
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Destination Lab</Label>
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
                  <option key={lab.id} value={lab.name}>{lab.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Test Type</Label>
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
                !sampleType ||
                !doctorName ||
                !hospitalName ||
                (!image1 && !image2)
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
};

export default LBCAccessionForm;
