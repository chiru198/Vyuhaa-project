import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  CheckCircle,
  CheckSquare,
  Eye,
  Printer,
  FlaskConical,
  AlertTriangle,
} from "lucide-react";

const CoTestReporting = ({ selectedSample, onBack }) => {
  const EC2_IP = "http://localhost:5000";

  // ── LBC States (full — same as LBCReporting) ──
  const [specimenAdequacyText, setSpecimenAdequacyText] = useState(
    "Satisfactory for evaluation."
  );
  const [selectedSquamous, setSelectedSquamous] = useState<string[]>([]);
  const [otherSquamous, setOtherSquamous] = useState("");
  const [endocervicalStatus, setEndocervicalStatus] = useState("");
  const [inflammationLevel, setInflammationLevel] = useState("None");
  const [epithelialNotes, setEpithelialNotes] = useState("");
  const [selectedOrganisms, setSelectedOrganisms] = useState<string[]>([]);
  const [otherMicroscopy, setOtherMicroscopy] = useState("");
  const [showImpression, setShowImpression] = useState(true);
  const [impressionCategory, setImpressionCategory] = useState("Squamous");
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [glandularResults, setGlandularResults] = useState<string[]>([]);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [selectedFollowUps, setSelectedFollowUps] = useState<string[]>([]);
  const [clinicalHistory, setClinicalHistory] = useState("");
  const [microscopyDescription, setMicroscopyDescription] = useState("");

  // ── HPV States ──
  const [hpv16, setHpv16] = useState("Not Detected");
  const [hpv18, setHpv18] = useState("Not Detected");
  const [hrHpv, setHrHpv] = useState("Not Detected");
  const [notes, setNotes] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  // Auto-fill
  useEffect(() => {
    if (selectedSample?.clinical_history) setClinicalHistory(selectedSample.clinical_history);
    if (selectedSample?.notes) setNotes(selectedSample.notes);
  }, [selectedSample]);

  // ── Helpers ──
  const toggleMultiSelect = (currentItems: string[], setFunction: (v: string[]) => void, item: string) => {
    setFunction(currentItems.includes(item)
      ? currentItems.filter((i) => i !== item)
      : [...currentItems, item]);
  };

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

  // ── Prepare data ──
  const prepareReportData = () => {
    const microscopyList = [
      `Squamous Epithelial cells: ${[...selectedSquamous, otherSquamous].filter(Boolean).join(", ") || "None"}`,
      `Glandular cells: Endocervical cells ${endocervicalStatus || "not identified"}`,
      `Inflammation: ${inflammationLevel}`,
      `Epithelial cell abnormalities: ${epithelialNotes || "Absent"}`,
      `Organisms: ${selectedOrganisms.length > 0 ? selectedOrganisms.join(", ") : "Not detected"}`,
      `Other findings: ${otherMicroscopy || "None"}`,
    ];

    const lbcResult = selectedResults.includes("NILM")
      ? "NILM (Negative for Intraepithelial Lesion or Malignancy)"
      : impressionCategory === "Squamous"
        ? `Squamous: ${expandSquamousResult(selectedResults)}`
        : `${impressionCategory}: ${glandularResults.join(", ")}`;

    return {
      barcode: selectedSample?.barcode,
      mr_number: selectedSample?.barcode,
      patient_name: selectedSample?.patient_name,
      age: selectedSample?.age,
      gender: selectedSample?.gender,
      doctor_name: selectedSample?.doctor_name,
      hospital_name: selectedSample?.hospital_name,
      collection_date: selectedSample?.collected_at
        ? new Date(selectedSample.collected_at).toLocaleDateString("en-GB")
        : "N/A",
      // LBC fields
      specimen_type: "CO-TEST",
      specimen_adequacy: specimenAdequacyText,
      microscopy_list: microscopyList,
      result: lbcResult,
      recommendations_list:
        showFollowUp && selectedFollowUps.length > 0
          ? selectedFollowUps
          : ["Routine screening."],
      clinical_history: clinicalHistory || "None provided.",
      image1_path: selectedSample?.image1_path,
      image2_path: selectedSample?.image2_path,
      // HPV fields
      hpv16,
      hpv18,
      hr_hpv: hrHpv,
      notes: notes,
      image3_path: selectedSample?.image3_path,
    };
  };

  // ── Preview ──
  const handlePreview = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${EC2_IP}/api/report/cotest/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prepareReportData()),
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

  // ── Finalize ──
  const handleFinalizeReport = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${EC2_IP}/api/report/cotest/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prepareReportData()),
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `COTEST_Report_${selectedSample.barcode}.pdf`);
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

  // ── Action Button (shared) ──
  const ActionButton = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
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

  // ── HPV Result Button ──
  const HPVButton = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`px-5 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
        active
          ? "bg-purple-600 text-white border-purple-700 shadow-md ring-2 ring-purple-300"
          : "bg-white text-slate-600 border-slate-200 hover:border-purple-400 hover:text-purple-600"
      }`}
    >
      {active && <span className="mr-1">✓</span>}
      {label}
    </button>
  );

  // ── Live preview helper ──
  const lbcResultPreview = selectedResults.includes("NILM")
    ? "NILM"
    : impressionCategory === "Squamous" && selectedResults.length > 0
      ? `Squamous: ${selectedResults.join(", ")}`
      : glandularResults.length > 0
        ? `Glandular: ${glandularResults.join(", ")}`
        : "—";

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
              { label: "Age / Sex", value: `${selectedSample?.age || "N/A"} / ${selectedSample?.gender || "N/A"}` },
              { label: "Specimen", value: "CO-TEST" },
            ].map((info) => (
              <div key={info.label} className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{info.label}</span>
                <span className="font-bold text-slate-900 text-sm">{info.value}</span>
              </div>
            ))}
          </div>
          <span className="ml-4 px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
            <FlaskConical className="h-3 w-3" /> LBC + HPV Co-Test
          </span>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto">
        <div className="lg:col-span-2 space-y-6">

          {/* ══ LBC SECTION ══ */}
          <Card className="border-none shadow-sm ring-1 ring-blue-200">
            <div className="py-4 px-6 border-b bg-blue-50 font-black text-blue-800 uppercase tracking-tight flex items-center gap-2 text-sm">
              <CheckSquare className="h-4 w-4 text-blue-500" /> LBC — Liquid Based Cytology
            </div>
            <CardContent className="p-6 space-y-8">

              {/* 1. Specimen Adequacy */}
              <div className="space-y-3">
                <Label className="text-xs font-black text-slate-900 uppercase">Specimen Adequacy</Label>
                <textarea
                  className="w-full p-3 text-xs border rounded-lg bg-slate-50 h-16"
                  value={specimenAdequacyText}
                  onChange={(e) => setSpecimenAdequacyText(e.target.value)}
                />
              </div>

              {/* 2. Clinical Impression */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-blue-600" /> Clinical Impression
                  </Label>
                  <Switch checked={showImpression} onCheckedChange={setShowImpression} />
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
                        ["ASC-US", "ASC-H", "LSIL", "HSIL", "LSIL-H", "SCC"].map((opt) => (
                          <ActionButton
                            key={opt}
                            label={opt}
                            active={selectedResults.includes(opt)}
                            onClick={() => toggleMultiSelect(selectedResults, setSelectedResults, opt)}
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
                            onClick={() => toggleMultiSelect(glandularResults, setGlandularResults, opt)}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Microscopic Description */}
              <div className="space-y-6 pt-4 border-t">
                <Label className="text-sm font-black text-blue-700 uppercase">Microscopic Description</Label>

                <div className="space-y-3 pl-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">1. Squamous Epithelial Cells</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Superficial", "Intermediate", "Parabasal", "Metaplastic"].map((opt) => (
                      <ActionButton
                        key={opt}
                        label={opt}
                        active={selectedSquamous.includes(opt)}
                        onClick={() => toggleMultiSelect(selectedSquamous, setSelectedSquamous, opt)}
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
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">2. Glandular Cells (Endocervical)</Label>
                  <div className="flex gap-2">
                    {["Present", "Numerous", "Occasional", "Absent"].map((opt) => (
                      <ActionButton
                        key={opt}
                        label={opt}
                        active={endocervicalStatus === opt}
                        onClick={() => setEndocervicalStatus(opt)}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pl-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">3. Inflammation</Label>
                  <div className="flex gap-2">
                    {["None", "Mild", "Moderate", "Severe"].map((opt) => (
                      <ActionButton
                        key={opt}
                        label={opt}
                        active={inflammationLevel === opt}
                        onClick={() => setInflammationLevel(opt)}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pl-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">4. Epithelial Cell Abnormalities (Manual)</Label>
                  <textarea
                    className="w-full h-12 p-2 text-xs border rounded bg-white"
                    value={epithelialNotes}
                    onChange={(e) => setEpithelialNotes(e.target.value)}
                  />
                </div>

                <div className="space-y-2 pl-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">5. Organisms</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Candida", "Trichomonas", "BV Flora", "Actinomyces", "HSV", "Doderlein Bacilli"].map((opt) => (
                      <ActionButton
                        key={opt}
                        label={opt}
                        active={selectedOrganisms.includes(opt)}
                        onClick={() => toggleMultiSelect(selectedOrganisms, setSelectedOrganisms, opt)}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pl-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">6. Other Microscopic Findings</Label>
                  <textarea
                    className="w-full h-12 p-2 text-xs border rounded bg-white"
                    placeholder="Type any other observations here..."
                    value={otherMicroscopy}
                    onChange={(e) => setOtherMicroscopy(e.target.value)}
                  />
                </div>
              </div>

              {/* 4. Follow-up */}
              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black text-slate-900 uppercase">Follow-up Required</Label>
                  <Switch checked={showFollowUp} onCheckedChange={setShowFollowUp} />
                </div>
                {showFollowUp && (
                  <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-xl mt-3">
                    {["Repeat smear", "HPV triage", "Colposcopy", "Urgent colposcopy", "Biopsy", "Oncology referral"].map((opt) => (
                      <ActionButton
                        key={opt}
                        label={opt}
                        active={selectedFollowUps.includes(opt)}
                        onClick={() => toggleMultiSelect(selectedFollowUps, setSelectedFollowUps, opt)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* LBC text areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4">
              <Label className="text-[11px] font-black uppercase text-blue-600">Clinical History</Label>
              <textarea
                className="w-full h-32 mt-2 p-3 text-xs border rounded bg-white"
                value={clinicalHistory}
                onChange={(e) => setClinicalHistory(e.target.value)}
              />
            </Card>
            <Card className="p-4">
              <Label className="text-[11px] font-black uppercase text-blue-600">Microscopy Narrative</Label>
              <textarea
                className="w-full h-32 mt-2 p-3 text-xs border rounded bg-white"
                value={microscopyDescription}
                onChange={(e) => setMicroscopyDescription(e.target.value)}
              />
            </Card>
          </div>

          {/* ══ HPV SECTION ══ */}
          <Card className="border-none shadow-sm ring-1 ring-purple-200">
            <div className="py-4 px-6 border-b bg-purple-50 font-black text-purple-800 uppercase tracking-tight flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-purple-500" /> HPV — DNA Real Time PCR
            </div>
            <CardContent className="p-6 space-y-6">

              {/* HPV-16 */}
              <div className="space-y-2 border-b pb-4">
                <Label className="text-[11px] font-bold text-slate-600 uppercase">HPV-16</Label>
                <div className="flex gap-3">
                  {["Detected", "Not Detected"].map((opt) => (
                    <HPVButton key={opt} label={opt} active={hpv16 === opt} onClick={() => setHpv16(opt)} />
                  ))}
                </div>
              </div>

              {/* HPV-18 */}
              <div className="space-y-2 border-b pb-4">
                <Label className="text-[11px] font-bold text-slate-600 uppercase">HPV-18</Label>
                <div className="flex gap-3">
                  {["Detected", "Not Detected"].map((opt) => (
                    <HPVButton key={opt} label={opt} active={hpv18 === opt} onClick={() => setHpv18(opt)} />
                  ))}
                </div>
              </div>

              {/* HR HPV */}
              <div className="space-y-2 border-b pb-4">
                <Label className="text-[11px] font-bold text-slate-600 uppercase">HR HPV (High Risk)</Label>
                <div className="flex gap-3">
                  {["Detected", "Not Detected"].map((opt) => (
                    <HPVButton key={opt} label={opt} active={hrHpv === opt} onClick={() => setHrHpv(opt)} />
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2 pt-2">
                <Label className="text-[11px] font-black uppercase text-purple-600">Notes</Label>
                <textarea
                  className="w-full h-24 mt-1 p-3 text-xs border rounded bg-white focus:ring-2 focus:ring-purple-400 outline-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any relevant notes about the HPV sample..."
                />
              </div>

            </CardContent>
          </Card>
        </div>

        {/* RIGHT — LIVE REPORT PREVIEW */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 border-none shadow-xl bg-white flex flex-col min-h-[600px]">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center gap-2">
              <Printer className="h-4 w-4 text-teal-400" />
              <span className="text-[11px] font-black uppercase tracking-widest">Live Report Preview</span>
            </div>
            <CardContent className="p-6 space-y-4 flex-1 overflow-y-auto">

              {/* LBC summary */}
              <div>
                <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2">Page 1 — LBC</h4>
                <div className="text-xs text-slate-700 space-y-1 pl-2 border-l-2 border-blue-300">
                  <p><span className="font-bold">Adequacy:</span> {specimenAdequacyText}</p>
                  <p><span className="font-bold">Impression:</span> {lbcResultPreview}</p>
                  <p><span className="font-bold">Squamous:</span> {[...selectedSquamous, otherSquamous].filter(Boolean).join(", ") || "—"}</p>
                  <p><span className="font-bold">Glandular:</span> {endocervicalStatus || "—"}</p>
                  <p><span className="font-bold">Inflammation:</span> {inflammationLevel}</p>
                  <p><span className="font-bold">Organisms:</span> {selectedOrganisms.join(", ") || "Not detected"}</p>
                  <p><span className="font-bold">Follow-up:</span> {showFollowUp && selectedFollowUps.length > 0 ? selectedFollowUps.join(", ") : "Routine screening."}</p>
                  <p><span className="font-bold">Clinical History:</span> {clinicalHistory || "None"}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-[10px] font-black text-purple-700 uppercase tracking-widest mb-2">Page 2 — HPV</h4>
                <div className="text-xs text-slate-700 space-y-1 pl-2 border-l-2 border-purple-300">
                  <p><span className="font-bold">HPV-16:</span> {hpv16}</p>
                  <p><span className="font-bold">HPV-18:</span> {hpv18}</p>
                  <p><span className="font-bold">HR HPV:</span> {hrHpv}</p>
                  <p><span className="font-bold">Notes:</span> {notes || "None"}</p>
                </div>
              </div>

              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-[10px] text-teal-700 font-semibold">
                📄 2-page PDF will be generated — Page 1: LBC Report, Page 2: HPV Report
              </div>

            </CardContent>
            <div className="p-4 border-t space-y-3">
              {isLoading && (
                <div className="flex items-center justify-center gap-2 py-2 text-teal-600">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  <span className="text-xs font-bold uppercase">Generating Report...</span>
                </div>
              )}
              <Button
                variant="outline"
                className="w-full py-6 border-teal-600 text-teal-600 font-bold uppercase text-[11px]"
                onClick={handlePreview}
                disabled={isLoading}
              >
                <Eye className="mr-2 h-4 w-4" /> Preview 2-Page Report
              </Button>
              <Button
                className="w-full py-6 bg-teal-600 hover:bg-teal-700 text-white font-bold uppercase text-[11px]"
                onClick={handleFinalizeReport}
                disabled={isLoading}
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Finalize Co-Test Report
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CoTestReporting;
