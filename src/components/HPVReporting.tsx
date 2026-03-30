import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Eye, Printer } from "lucide-react";

const HPVReporting = ({ selectedSample, onBack }) => {
  // --- STATE ---
  const [hpv16, setHpv16] = useState("Not Detected");
  const [hpv18, setHpv18] = useState("Not Detected");
  const [hrHpv, setHrHpv] = useState("Not Detected");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const EC2_IP = "http://localhost:5000";

  // Auto-fill notes from clinical_history
  useEffect(() => {
    if (selectedSample?.clinical_history) {
      setNotes(selectedSample.clinical_history);
    }
  }, [selectedSample]);

  // --- LIVE PREVIEW SECTIONS ---
  const getReportSections = () => [
    {
      label: "TEST DESCRIPTION",
      value: (
        <ul className="text-[10px] space-y-1 pl-4 list-disc font-medium mt-1">
          <li>HPV-16: {hpv16}</li>
          <li>HPV-18: {hpv18}</li>
          <li>HR HPV: {hrHpv}</li>
        </ul>
      ),
    },
    { label: "NOTES", value: notes || "None provided." },
  ];

  // --- PREPARE DATA FOR BACKEND ---
  const prepareReportData = () => ({
    barcode: selectedSample?.barcode,
    mr_number: selectedSample?.barcode,
    patient_name: selectedSample?.patient_name,
    age: selectedSample?.age,
    gender: selectedSample?.gender,
    doctor_name: selectedSample?.doctor_name,
    hospital_name: selectedSample?.hospital_name,
    specimen_type: "HPV",
    collection_date: selectedSample?.collected_at
      ? new Date(selectedSample.collected_at).toLocaleDateString("en-GB")
      : "N/A",
    clinical_history: notes || "None provided.",
    hpv16,
    hpv18,
    hr_hpv: hrHpv,
    image1_path: selectedSample?.image1_path,
  });

  // --- PREVIEW ---
  const handlePreview = async () => {
    try {
      setIsLoading(true);
      const reportData = prepareReportData();
      const response = await fetch(`${EC2_IP}/api/report/hpv/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData),
      });
      if (response.ok) {
        const blob = await response.blob();
        window.open(window.URL.createObjectURL(blob), "_blank");
      } else {
        alert("Preview failed.");
      }
    } catch (err) {
      alert("Server connection error.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- FINALIZE ---
  const handleFinalizeReport = async () => {
    try {
      setIsLoading(true);
      const reportData = prepareReportData();
      const response = await fetch(`${EC2_IP}/api/report/hpv/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData),
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `HPV_Report_${selectedSample.barcode}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert("Finalization failed.");
      }
    } catch (err) {
      alert("Server connection error.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- RESULT BUTTON ---
  const ResultButton = ({ label, active, onClick }) => (
    <button
      onClick={onClick}
      className={`px-5 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
        active
          ? "bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300"
          : "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600"
      }`}
    >
      {active && <span className="mr-1">✓</span>}
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 w-full overflow-hidden">
      {/* HEADER */}
      <div className="bg-white border-b p-4 flex items-center justify-between shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex gap-10">
            {[
              { label: "Patient Name", value: selectedSample?.patient_name },
              { label: "Barcode", value: selectedSample?.barcode },
              {
                label: "Age / Sex",
                value: `${selectedSample?.age || "N/A"} / ${selectedSample?.gender || "N/A"}`,
              },
              { label: "Specimen", value: "HPV" },
            ].map((info) => (
              <div key={info.label} className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  {info.label}
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {info.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto">
        {/* LEFT — DIAGNOSTIC ACTIONS */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-slate-200">
            <div className="py-4 px-6 border-b bg-white font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-500" /> Diagnostic Actions
            </div>
            <CardContent className="p-6 space-y-8">

              {/* TEST DESCRIPTION */}
              <div className="space-y-5">
                <Label className="text-sm font-black text-blue-700 uppercase">
                  Test Description
                </Label>

                {/* HPV-16 */}
                <div className="space-y-2 pl-2 border-b pb-4">
                  <Label className="text-[11px] font-bold text-slate-600 uppercase">
                    HPV-16
                  </Label>
                  <div className="flex gap-3">
                    {["Detected", "Not Detected"].map((opt) => (
                      <ResultButton
                        key={opt}
                        label={opt}
                        active={hpv16 === opt}
                        onClick={() => setHpv16(opt)}
                      />
                    ))}
                  </div>
                </div>

                {/* HPV-18 */}
                <div className="space-y-2 pl-2 border-b pb-4">
                  <Label className="text-[11px] font-bold text-slate-600 uppercase">
                    HPV-18
                  </Label>
                  <div className="flex gap-3">
                    {["Detected", "Not Detected"].map((opt) => (
                      <ResultButton
                        key={opt}
                        label={opt}
                        active={hpv18 === opt}
                        onClick={() => setHpv18(opt)}
                      />
                    ))}
                  </div>
                </div>

                {/* HR HPV */}
                <div className="space-y-2 pl-2">
                  <Label className="text-[11px] font-bold text-slate-600 uppercase">
                    HR HPV (High Risk HPV)
                  </Label>
                  <div className="flex gap-3">
                    {["Detected", "Not Detected"].map((opt) => (
                      <ResultButton
                        key={opt}
                        label={opt}
                        active={hrHpv === opt}
                        onClick={() => setHrHpv(opt)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* NOTES */}
              <div className="space-y-2 pt-4 border-t">
                <Label className="text-[11px] font-black uppercase text-blue-600">
                  Notes
                </Label>
                <textarea
                  className="w-full h-28 mt-2 p-3 text-xs border rounded bg-white"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

            </CardContent>
          </Card>
        </div>

        {/* RIGHT — LIVE REPORT PREVIEW */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 border-none shadow-xl bg-white flex flex-col min-h-[500px]">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center gap-2">
              <Printer className="h-4 w-4 text-blue-400" />
              <span className="text-[11px] font-black uppercase tracking-widest">
                Live Report Preview
              </span>
            </div>
            <CardContent className="p-6 space-y-6 flex-1 overflow-y-auto">
              {getReportSections().map((section, idx) => (
                <div key={idx} className="space-y-1">
                  <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                    {section.label}
                  </h4>
                  <div className="text-xs font-semibold text-slate-900 italic leading-relaxed">
                    {section.value}
                  </div>
                </div>
              ))}
            </CardContent>
            <div className="p-4 border-t space-y-3">
              {isLoading && (
                <div className="flex items-center justify-center gap-2 py-2 text-blue-600">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  <span className="text-xs font-bold uppercase">Generating Report...</span>
                </div>
              )}
              <Button
                variant="outline"
                className="w-full py-6 border-blue-600 text-blue-600 font-bold uppercase text-[11px]"
                onClick={handlePreview}
                disabled={isLoading}
              >
                <Eye className="mr-2 h-4 w-4" /> Report Preview in Browser
              </Button>
              <Button
                className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-[11px]"
                onClick={handleFinalizeReport}
                disabled={isLoading}
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Finalize Report
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HPVReporting;
