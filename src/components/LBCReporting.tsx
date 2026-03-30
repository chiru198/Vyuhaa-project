import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  History,
  CheckSquare,
  CheckCircle2,
  ArrowLeft,
  Eye,
  AlertTriangle,
  Microscope,
  Stethoscope,
  Printer,
  ArrowUpRight,
  CheckCircle,
} from "lucide-react";

const LBCReporting = ({ selectedSample, onBack }) => {
  // --- 1. STATE MANAGEMENT ---
  const [specimenAdequacyText, setSpecimenAdequacyText] = useState(
    "Satisfactory for evaluation.",
  );

  // Microscopy Findings (5 Points)
  const [selectedSquamous, setSelectedSquamous] = useState([]);
  const [otherSquamous, setOtherSquamous] = useState("");
  const [endocervicalStatus, setEndocervicalStatus] = useState("");
  const [inflammationLevel, setInflammationLevel] = useState("None");
  const [epithelialNotes, setEpithelialNotes] = useState("");
  const [selectedOrganisms, setSelectedOrganisms] = useState([]);

  // Clinical Impression
  const [showImpression, setShowImpression] = useState(true);
  const [impressionCategory, setImpressionCategory] = useState("Squamous");
  const [selectedResults, setSelectedResults] = useState([]);
  const [glandularResults, setGlandularResults] = useState([]);

  const [showFollowUp, setShowFollowUp] = useState(false);
  // Inside State Management section
  const [otherMicroscopy, setOtherMicroscopy] = useState("");
  const [selectedFollowUps, setSelectedFollowUps] = useState([]);

  const [clinicalHistory, setClinicalHistory] = useState("");
  const [microscopyDescription, setMicroscopyDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const EC2_IP = "http://localhost:5000"; // Updated to your EC2 IP

  useEffect(() => {
    if (selectedSample?.clinical_history) {
      setClinicalHistory(selectedSample.clinical_history);
    }
  }, [selectedSample]);

  // --- SQUAMOUS FULL FORMS ---
  const squamousFullForms: Record<string, string> = {
    "ASC-US": "ASC-US (Atypical Squamous Cells of Undetermined Significance)",
    "ASC-H": "ASC-H (Atypical Squamous Cells, cannot exclude HSIL)",
    "LSIL": "LSIL (Low-grade Squamous Intraepithelial Lesion)",
    "HSIL": "HSIL (High-grade Squamous Intraepithelial Lesion)",
    "LSIL-H": "LSIL-H (Low-grade SIL, cannot exclude High-grade)",
    "SCC": "SCC (Squamous Cell Carcinoma)",
  };

  const expandSquamousResult = (results: string[]) =>
    results.map((r) => squamousFullForms[r] ?? r).join(", ");

  // --- HELPERS ---
  const toggleMultiSelect = (currentItems, setFunction, item) => {
    if (currentItems.includes(item)) {
      setFunction(currentItems.filter((i) => i !== item));
    } else {
      setFunction([...currentItems, item]);
    }
  };

  const formatArray = (arr) => (arr && arr.length > 0 ? arr.join(", ") : "");

  // --- PREVIEW LOGIC ---
  const getReportSections = () => {
    return [
      { label: "SPECIMEN ADEQUACY", value: specimenAdequacyText },
      {
        label: "CLINICAL IMPRESSION",
        value: selectedResults.includes(
          "NILM ( Negative for Intraepithelial Lesion or Malignancy )",
        )
          ? "NEGATIVE FOR INTRAEPITHELIAL LESION OR MALIGNANCY (NILM)."
          : showImpression &&
              (selectedResults.length > 0 || glandularResults.length > 0)
            ? `${impressionCategory}: ${formatArray(impressionCategory === "Squamous" ? selectedResults : glandularResults)}.`
            : "NEGATIVE FOR INTRAEPITHELIAL LESION OR MALIGNANCY (NILM).",
      },
      {
        label: "MICROSCOPIC DESCRIPTION",
        value: (
          <ul className="text-[10px] space-y-1 pl-4 list-disc font-medium mt-1">
            <li>
              Squamous:{" "}
              {[...selectedSquamous, otherSquamous]
                .filter(Boolean)
                .join(", ") || "None"}
            </li>
            <li>
              Glandular: Endocervical cells {endocervicalStatus || "not found"}
            </li>
            <li>Inflammation: {inflammationLevel}</li>
            <li>Abnormalities: {epithelialNotes || "Absent"}</li>
            <li>Organisms: {selectedOrganisms.join(", ") || "Not detected"}</li>
            {/* ADD THIS NEW ITEM */}
            <li>Other findings: {otherMicroscopy}</li>
          </ul>
        ),
      },
      { label: "CLINICAL HISTORY", value: clinicalHistory || "None provided." },
      {
        label: "FOLLOW-UP",
        value:
          showFollowUp && selectedFollowUps.length > 0
            ? selectedFollowUps.join(", ")
            : "Routine screening.",
      },
    ];
  };

  // --- DATA PREPARATION ---
  const prepareReportData = () => {
    const microscopyList = [
      `Squamous Epithelial cells: ${[...selectedSquamous, otherSquamous].filter(Boolean).join(", ") || "None"}`,
      `Glandular cells: Endocervical cells ${endocervicalStatus || "not identified"}`,
      `Inflammation: ${inflammationLevel}`,
      `Epithelial cell abnormalities: ${epithelialNotes || "Absent"}`,
      `Organisms: ${selectedOrganisms.length > 0 ? selectedOrganisms.join(", ") : "Not detected"}`,
      `Other findings: ${otherMicroscopy || "None"}`,
    ];

    return {
      barcode: selectedSample?.barcode,
      mr_number: selectedSample?.barcode,
      patient_name: selectedSample?.patient_name,
      age: selectedSample?.age,
      gender: selectedSample?.gender,
      doctor_name: selectedSample?.doctor_name,
      hospital_name: selectedSample?.hospital_name,
      specimen_type: selectedSample?.sample_type || "LBC",
      collection_date: selectedSample?.collected_at
        ? new Date(selectedSample.collected_at).toLocaleDateString("en-GB")
        : "N/A",
      clinical_history: clinicalHistory || "None provided.",
      microscopy_description: microscopyDescription,
      specimen_adequacy: specimenAdequacyText,
      microscopy_list: microscopyList,
      result: selectedResults.includes("NILM")
        ? "NILM(Negative for Intraepithelial Lesion or Malignancy)"
        : impressionCategory === "Squamous"
          ? `Squamous: ${expandSquamousResult(selectedResults)}`
          : `${impressionCategory}: ${glandularResults.join(", ")}`,
      recommendations_list:
        showFollowUp && selectedFollowUps.length > 0
          ? selectedFollowUps
          : ["Routine screening."],
      image1_path: selectedSample?.image1_path,
      image2_path: selectedSample?.image2_path,
    };
  };

  // --- API ACTIONS ---
  const handlePreview = async () => {
    try {
      setIsLoading(true);
      const reportData = prepareReportData();
      const response = await fetch(`${EC2_IP}/api/report/preview`, {
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

  const handleFinalizeReport = async () => {
    try {
      setIsLoading(true);
      const reportData = prepareReportData();
      const response = await fetch(`${EC2_IP}/api/report/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData),
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Report_${selectedSample.barcode}.pdf`);
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

  const ActionButton = ({ label, active, onClick, color: _color = "blue" }) => (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={`rounded-full h-8 px-4 text-[10px] font-bold transition-all border ${
        active
          ? "bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300"
          : "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600"
      }`}
    >
      {active && <span className="mr-1 text-[10px]">✓</span>}
      {label}
    </Button>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 w-full overflow-hidden">
      {/* HEADER BAR */}
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
              { label: "Specimen", value: "LBC" },
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

      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader className="py-4 px-6 border-b bg-white font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-blue-500" /> Diagnostic
              Actions
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="space-y-3">
                <Label className="text-xs font-black text-slate-900 uppercase">
                  Specimen Adequacy
                </Label>
                <textarea
                  className="w-full p-3 text-xs border rounded-lg bg-slate-50 h-16"
                  value={specimenAdequacyText}
                  onChange={(e) => setSpecimenAdequacyText(e.target.value)}
                />
              </div>

              {/* CLINICAL IMPRESSION */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    <AlertTriangle className="h-4 w-4 text-blue-600" /> Clinical
                    Impression
                  </Label>
                  <Switch
                    checked={showImpression}
                    onCheckedChange={setShowImpression}
                  />
                </div>
                {showImpression && (
                  <div className="space-y-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                    <div className="flex gap-2 p-1 bg-slate-200/50 rounded-lg w-fit">
                      {["NILM", "Squamous", "Glandular"].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            setImpressionCategory(cat);
                            setSelectedResults(cat === "NILM" ? ["NILM"] : []);
                          }}
                          className={`px-6 py-1.5 rounded-md text-[11px] font-black ${impressionCategory === cat ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {impressionCategory === "Squamous" &&
                        [
                          "ASC-US",
                          "ASC-H",
                          "LSIL",
                          "HSIL",
                          "LSIL-H",
                          "SCC",
                        ].map((opt) => (
                          <ActionButton
                            key={opt}
                            label={opt}
                            active={selectedResults.includes(opt)}
                            onClick={() =>
                              toggleMultiSelect(
                                selectedResults,
                                setSelectedResults,
                                opt,
                              )
                            }
                          />
                        ))}
                      {impressionCategory === "Glandular" &&
                        [
                          "Atyp. Endocervical NOS",
                          "Atyp. Glandular NOS",
                          "Atyp. Endocervical - Favor Neoplastic",
                          "Endocervical AIS",
                          "Endocervical Adeno.",
                          "Endometrial Adeno.",
                        ].map((opt) => (
                          <ActionButton
                            key={opt}
                            label={opt}
                            active={glandularResults.includes(opt)}
                            onClick={() =>
                              toggleMultiSelect(
                                glandularResults,
                                setGlandularResults,
                                opt,
                              )
                            }
                            color="orange"
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* MICROSCOPIC DESCRIPTION */}
              <div className="space-y-6 pt-4 border-t">
                <Label className="text-sm font-black text-blue-700 uppercase">
                  Microscopic Description
                </Label>
                <div className="space-y-3 pl-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">
                    1. Squamous Epithelial Cells
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Superficial",
                      "Intermediate",
                      "Parabasal",
                      "Metaplastic",
                    ].map((opt) => (
                      <ActionButton
                        key={opt}
                        label={opt}
                        active={selectedSquamous.includes(opt)}
                        onClick={() =>
                          toggleMultiSelect(
                            selectedSquamous,
                            setSelectedSquamous,
                            opt,
                          )
                        }
                      />
                    ))}
                  </div>
                  <input
                    className="w-full mt-1 p-2 text-xs border-b bg-transparent outline-none italic"
                    placeholder="Others..."
                    value={otherSquamous}
                    onChange={(e) => setOtherSquamous(e.target.value)}
                  />
                </div>
                <div className="space-y-2 pl-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">
                    2. Glandular Cells (Endocervical)
                  </Label>
                  <div className="flex gap-2">
                    {["Present", "Numerous", "Occasional", "Absent"].map((opt) => (
                      <ActionButton
                        key={opt}
                        label={opt}
                        active={endocervicalStatus === opt}
                        onClick={() => setEndocervicalStatus(opt)}
                        color="emerald"
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2 pl-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">
                    3. Inflammation
                  </Label>
                  <div className="flex gap-2">
                    {["None", "Mild", "Moderate", "Severe"].map((opt) => (
                      <ActionButton
                        key={opt}
                        label={opt}
                        active={inflammationLevel === opt}
                        onClick={() => setInflammationLevel(opt)}
                        color="orange"
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2 pl-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">
                    4. Epithelial Cell Abnormalities (Manual)
                  </Label>
                  <textarea
                    className="w-full h-12 p-2 text-xs border rounded bg-white"
                    value={epithelialNotes}
                    onChange={(e) => setEpithelialNotes(e.target.value)}
                  />
                </div>
                <div className="space-y-2 pl-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">
                    5. Organisms
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Candida",
                      "Trichomonas",
                      "BV Flora",
                      "Actinomyces",
                      "HSV",
                      "Doderlein Bacilli",
                    ].map((opt) => (
                      <ActionButton
                        key={opt}
                        label={opt}
                        active={selectedOrganisms.includes(opt)}
                        onClick={() =>
                          toggleMultiSelect(
                            selectedOrganisms,
                            setSelectedOrganisms,
                            opt,
                          )
                        }
                        color="indigo"
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2 pl-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">
                    6. Other Microscopic Findings
                  </Label>
                  <textarea
                    className="w-full h-12 p-2 text-xs border rounded bg-white"
                    placeholder="Type any other observations here..."
                    value={otherMicroscopy}
                    onChange={(e) => setOtherMicroscopy(e.target.value)}
                  />
                </div>
              </div>

              {/* FOLLOW-UP */}
              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black text-slate-900 uppercase">
                    Follow-up Required
                  </Label>
                  <Switch
                    checked={showFollowUp}
                    onCheckedChange={setShowFollowUp}
                  />
                </div>
                {showFollowUp && (
                  <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-xl mt-3">
                    {[
                      "Repeat smear",
                      "HPV triage",
                      "Colposcopy",
                      "Urgent colposcopy",
                      "Biopsy",
                      "Oncology referral",
                    ].map((opt) => (
                      <ActionButton
                        key={opt}
                        label={opt}
                        active={selectedFollowUps.includes(opt)}
                        onClick={() =>
                          toggleMultiSelect(
                            selectedFollowUps,
                            setSelectedFollowUps,
                            opt,
                          )
                        }
                        color="emerald"
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* TEXT AREAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
            <Card className="p-4">
              <Label className="text-[11px] font-black uppercase text-blue-600">
                Clinical History
              </Label>
              <textarea
                className="w-full h-32 mt-2 p-3 text-xs border rounded bg-white"
                value={clinicalHistory}
                onChange={(e) => setClinicalHistory(e.target.value)}
              />
            </Card>
            <Card className="p-4">
              <Label className="text-[11px] font-black uppercase text-blue-600">
                Microscopy Narrative
              </Label>
              <textarea
                className="w-full h-32 mt-2 p-3 text-xs border rounded bg-white"
                value={microscopyDescription}
                onChange={(e) => setMicroscopyDescription(e.target.value)}
              />
            </Card>
          </div>
        </div>

        {/* PREVIEW SIDEBAR */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 border-none shadow-xl bg-white flex flex-col min-h-[600px]">
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

export default LBCReporting;
