import React, { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  History,
  CheckSquare,
  FileText,
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
  // --- 1. GENERAL PORTAL STATE ---
  const [isAdequate, setIsAdequate] = useState(true);
  const [showAbnormality, setShowAbnormality] = useState(false);
  const [abnormalityCategory, setAbnormalityCategory] = useState("Squamous");
  const [showInflammatory, setShowInflammatory] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);

  // --- 2. MULTI-SELECT ARRAYS (The Critical Change) ---
  // We use arrays [] so you can select multiple buttons at once
  const [tZone, setTZone] = useState<string[]>([]);
  const [obscuringFactors, setObscuringFactors] = useState<string[]>([]);
  const [selectedResults, setSelectedResults] = useState<string[]>([]); // For Squamous
  const [glandularResults, setGlandularResults] = useState<string[]>([]); // For Glandular
  const [selectedNonNeoplastic, setSelectedNonNeoplastic] = useState<string[]>(
    [],
  );
  const [selectedOrganisms, setSelectedOrganisms] = useState<string[]>([]);
  const [selectedFollowUps, setSelectedFollowUps] = useState<string[]>([]);

  // --- 3. TEXT FIELDS ---
  const [microscopyDescription, setMicroscopyDescription] = useState(
    "Cytopathology report shows features of Negative for Intraepithelial Lesion or Malignancy (NILM). Reactive cellular changes are seen.",
  );
  const [clinicalComment, setClinicalComment] = useState("");
  const toggleMultiSelect = (
    currentItems: string[],
    setFunction: (val: string[]) => void,
    item: string,
  ) => {
    if (currentItems.includes(item)) {
      // If already selected, remove it
      setFunction(currentItems.filter((i) => i !== item));
    } else {
      // If not selected, add it
      setFunction([...currentItems, item]);
    }
  };
  const toggleSelection = (
    list: string[],
    setList: (val: string[]) => void,
    item: string,
  ) => {
    if (list.includes(item)) {
      // If it's already selected, remove it
      setList(list.filter((i) => i !== item));
    } else {
      // If it's not selected, add it to the list
      setList([...list, item]);
    }
  };

  // Ensure showFollowUpOptions and selectedFollowUp already exist from your previous code

  // --- 2. REPORT GENERATION LOGIC ---
  // Replace your old generateDiagnosis with this:
  const getReportSections = () => {
    // Helper to join array items with a comma or return "None"
    const formatArray = (arr: string[]) =>
      arr.length > 0 ? arr.join(", ") : "None";

    return [
      {
        label: "SPECIMEN ADEQUACY",
        value: isAdequate
          ? "Satisfactory for evaluation."
          : "Unsatisfactory for evaluation.",
      },
      {
        label: "QUALITY INDICATORS",
        // Grouping both into one section for the preview
        value: `Transformation zone: ${formatArray(tZone)}. Obscuring factors: ${formatArray(obscuringFactors)}.`,
      },
      {
        label: "INTERPRETATION / RESULT",
        value: showAbnormality
          ? `${abnormalityCategory}: ${formatArray(abnormalityCategory === "Squamous" ? selectedResults : glandularResults)}.`
          : "Negative for Intraepithelial Lesion or Malignancy (NILM).",
      },
      {
        label: "NON-NEOPLASTIC FINDINGS",
        value: showInflammatory
          ? `Findings: ${formatArray(selectedNonNeoplastic)}. Organisms: ${formatArray(selectedOrganisms)}.`
          : "None identified.",
      },
      {
        label: "FOLLOW-UP RECOMMENDATION",
        value:
          showFollowUp && selectedFollowUps.length > 0
            ? selectedFollowUps.join(", ")
            : "Routine screening.",
      },
    ];
  };
  // --- 3. API ACTIONS (SignOut/Preview kept from your original) ---
  const handleSignOut = async () => {
    const payload = {
      diagnosis: getReportSections(),
      recommendations:
        selectedFollowUps.length > 0
          ? selectedFollowUps.join(", ")
          : "Routine screening.",
      microscopy_description: microscopyDescription,
      clinical_comment: clinicalComment,
    };
    try {
      const res = await fetch(
        `http://localhost:5000/api/reports/finalize/${selectedSample.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (res.ok) {
        alert("Report Finalized Successfully!");
        onBack();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePreviewPDF = async () => {
    /* Kept your existing logic */
  };

  // --- 4. RENDER HELPER ---
  const ActionButton = ({ label, active, onClick, color = "blue" }) => (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={`rounded-full h-8 px-4 text-[11px] font-bold transition-all ${
        active
          ? `bg-${color}-600 text-white border-${color}-600 shadow-sm`
          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
      }`}
    >
      {label}
    </Button>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-in fade-in duration-500 w-full">
      {/* HEADER SECTION (Top Bar) */}
      <div className="bg-white border-b p-4 flex items-center justify-between w-full shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="hover:bg-slate-100"
          >
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
              { label: "Specimen", value: selectedSample?.sample_type },
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
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">
          <History className="h-3 w-3 mr-1" /> Prior: NILM (2025)
        </Badge>
      </div>

      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 w-full overflow-y-auto">
        {/* LEFT COLUMN: DIAGNOSTIC FORM */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader className="py-4 px-6 border-b flex flex-row items-center justify-between bg-white rounded-t-xl">
              <div className="flex items-center gap-2 font-black text-slate-800 uppercase tracking-tight">
                <CheckSquare className="h-5 w-5 text-blue-500" /> Diagnostic
                Actions
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              {/* 1. ADEQUACY SECTION */}
              <div className="space-y-4">
                {/* The Main "Turn On/Off" and Adequacy Label */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Specimen Adequacy
                  </Label>
                  <Switch
                    checked={isAdequate}
                    onCheckedChange={(val) => {
                      setIsAdequate(val);
                      // Optional: Clear sub-selections if turned off
                      if (!val) {
                        setTZone([]);
                        setObscuringFactors([]);
                      }
                    }}
                  />
                </div>

                {/* Satisfactory / Unsatisfactory Buttons */}
                <div className="flex flex-wrap gap-2">
                  <ActionButton
                    label="Satisfactory"
                    active={isAdequate}
                    onClick={() => setIsAdequate(true)}
                    color="emerald"
                  />
                  <ActionButton
                    label="Unsatisfactory"
                    active={!isAdequate}
                    onClick={() => setIsAdequate(false)}
                    color="red"
                  />
                </div>

                {/* These sections only appear if "Satisfactory" (isAdequate) is true */}
                {isAdequate && (
                  <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                    <Separator className="opacity-50" />

                    {/* Transformation Zone Component */}
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-slate-400">
                        Transformation Zone Component
                      </Label>
                      <div className="flex gap-2">
                        {["Present", "Absent", "Cannot be assessed"].map(
                          (opt) => (
                            <ActionButton
                              key={opt}
                              label={opt}
                              active={tZone.includes(opt)}
                              onClick={() =>
                                toggleMultiSelect(tZone, setTZone, opt)
                              }
                              color="emerald"
                            />
                          ),
                        )}
                      </div>
                    </div>

                    {/* Obscuring Factors */}
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-slate-400">
                        Obscuring Factors (50-75%)
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Blood",
                          "Inflammation",
                          "Lubricant",
                          "Thick Smear",
                        ].map((opt) => (
                          <ActionButton
                            key={opt}
                            label={opt}
                            active={obscuringFactors.includes(opt)}
                            onClick={() =>
                              toggleMultiSelect(
                                obscuringFactors,
                                setObscuringFactors,
                                opt,
                              )
                            }
                            color="emerald"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* 2. ABNORMALITY SECTION (Squamous / Glandular) */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                    <AlertTriangle className="h-4 w-4 text-red-500" />{" "}
                    Epithelial / Glandular Abnormality
                  </Label>
                  <Switch
                    checked={showAbnormality}
                    onCheckedChange={(v) => {
                      setShowAbnormality(v);
                      // ✅ FIX: Clear the ARRAYS when the switch is turned off
                      if (!v) {
                        setSelectedResults([]); // Clears Squamous selections
                        setGlandularResults([]); // Clears Glandular selections
                      }
                    }}
                  />
                </div>

                {showAbnormality && (
                  <div className="space-y-6 animate-in slide-in-from-top-2 duration-300 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <div className="flex gap-2 p-1 bg-slate-200/50 rounded-lg w-fit">
                      {["Squamous", "Glandular"].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            setAbnormalityCategory(cat);
                            // ✅ CLEAR ARRAYS: Wipe out both Squamous and Glandular selections
                            // to ensure the report starts fresh for the new category.
                            setSelectedResults([]);
                            setGlandularResults([]);
                          }}
                          className={`px-6 py-1.5 rounded-md text-[11px] font-black transition-all ${
                            abnormalityCategory === cat
                              ? "bg-white text-blue-600 shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {abnormalityCategory === "Squamous" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black text-slate-400 uppercase">
                            Atypical - NOS
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {["ASC-US", "ASC-H", "LSIL", "HSIL", "LSIL-H"].map(
                              (btn) => (
                                <ActionButton
                                  key={btn}
                                  label={btn}
                                  // ✅ Check if this button is inside the array
                                  active={selectedResults.includes(btn)}
                                  // ✅ Toggle the selection in the array
                                  onClick={() =>
                                    toggleMultiSelect(
                                      selectedResults,
                                      setSelectedResults,
                                      btn,
                                    )
                                  }
                                />
                              ),
                            )}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black text-slate-400 uppercase">
                            Neoplastic
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {["SCC"].map((btn) => (
                              <ActionButton
                                key={btn}
                                label={btn}
                                active={selectedResults.includes(btn)}
                                onClick={() =>
                                  toggleMultiSelect(
                                    selectedResults,
                                    setSelectedResults,
                                    btn,
                                  )
                                }
                                color="red"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6 animate-in fade-in">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase">
                              Atypical - NOS
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {[
                                "Atyp. Endocervical NOS",
                                "Atyp. Glandular NOS",
                              ].map((btn) => (
                                <ActionButton
                                  key={btn}
                                  label={btn}
                                  // ✅ Uses the glandularResults array for multi-selection
                                  active={glandularResults.includes(btn)}
                                  // ✅ Uses the toggle helper to add/remove findings
                                  onClick={() =>
                                    toggleMultiSelect(
                                      glandularResults,
                                      setGlandularResults,
                                      btn,
                                    )
                                  }
                                />
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase">
                              Favor Neoplastic
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {[
                                "Atyp. Endocervical - Favor Neoplastic",
                                "Atyp. Glandular - Favor Neoplastic",
                              ].map((btn) => (
                                <ActionButton
                                  key={btn}
                                  label={btn}
                                  // ✅ Uses glandularResults array to check if active
                                  active={glandularResults.includes(btn)}
                                  // ✅ Uses the multi-select toggle helper
                                  onClick={() =>
                                    toggleMultiSelect(
                                      glandularResults,
                                      setGlandularResults,
                                      btn,
                                    )
                                  }
                                  color="orange"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-slate-200">
                          <Label className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                            Adenocarcinoma Spectrum
                          </Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {[
                              "Endocervical AIS",
                              "Endocervical Adenocarcinoma",
                              "Endometrial Adenocarcinoma",
                              "Extrauterine Adenocarcinoma",
                              "Adenocarcinoma - NOS",
                            ].map((btn) => (
                              <ActionButton
                                key={btn}
                                label={btn}
                                // ✅ Check if the finding is in the glandular results array
                                active={glandularResults.includes(btn)}
                                // ✅ Toggle the finding in/out of the array
                                onClick={() =>
                                  toggleMultiSelect(
                                    glandularResults,
                                    setGlandularResults,
                                    btn,
                                  )
                                }
                                color="red"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. INFLAMMATORY / INFECTIVE CHANGES (The Fixed Section) */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                    <Microscope className="h-4 w-4 text-slate-600" />{" "}
                    Inflammatory / Infective Changes
                  </Label>
                  <Switch
                    checked={showInflammatory}
                    onCheckedChange={setShowInflammatory}
                  />
                </div>

                {showInflammatory && (
                  <div className="space-y-6 animate-in slide-in-from-top-2 duration-300 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Non-Neoplastic Changes
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Inflammation",
                          "Atrophy",
                          "Reactive/Reparative",
                          "Radiation change",
                          "IUD effect",
                        ].map((opt) => (
                          <ActionButton
                            key={opt}
                            label={opt}
                            // ✅ Check if the option exists in the array
                            active={selectedNonNeoplastic.includes(opt)}
                            // ✅ Add or remove the option using the toggle helper
                            onClick={() =>
                              toggleMultiSelect(
                                selectedNonNeoplastic,
                                setSelectedNonNeoplastic,
                                opt,
                              )
                            }
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Organisms
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Candida",
                          "Trichomonas",
                          "Bacterial vaginosis flora",
                          "Actinomyces",
                          "HSV",
                          "CMV",
                          "Doderlein Bacilli",
                        ].map((opt) => (
                          <ActionButton
                            key={opt}
                            label={opt}
                            // ✅ Uses the array to check if the button should be blue
                            active={selectedOrganisms.includes(opt)}
                            // ✅ Uses the toggle helper to add/remove from the array
                            onClick={() =>
                              toggleMultiSelect(
                                selectedOrganisms,
                                setSelectedOrganisms,
                                opt,
                              )
                            }
                            color="blue"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. FOLLOW-UP SECTION */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                    <ArrowUpRight className="h-4 w-4 text-blue-600" /> Follow-up
                    Required
                  </Label>
                  <Switch
                    checked={showFollowUp}
                    onCheckedChange={setShowFollowUp}
                  />
                </div>
                {showFollowUp && (
                  <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 animate-in slide-in-from-top-2">
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Repeat smear",
                        "HPV triage",
                        "Colposcopy",
                        "Urgent colposcopy",
                        "Oncology referral",
                        "Biopsy",
                      ].map((opt) => (
                        <ActionButton
                          key={opt}
                          label={opt}
                          // ✅ Check if the option is in the multi-select array
                          active={selectedFollowUps.includes(opt)}
                          // ✅ Toggle the selection using the helper function
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
                  </div>
                )}
              </div>
            </CardContent>{" "}
          </Card>

          {/* NOTES SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm ring-1 ring-slate-200">
              <CardHeader className="py-3 px-4 border-b flex items-center gap-2 text-xs font-black uppercase text-slate-500">
                <Microscope className="h-4 w-4" /> Microscopy Findings
              </CardHeader>
              <CardContent className="p-4">
                <textarea
                  className="w-full h-32 p-3 text-xs border rounded-lg bg-slate-50/50 focus:ring-2 focus:ring-blue-500 outline-none resize-none font-medium leading-relaxed"
                  value={microscopyDescription}
                  onChange={(e) => setMicroscopyDescription(e.target.value)}
                />
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm ring-1 ring-slate-200">
              <CardHeader className="py-3 px-4 border-b flex items-center gap-2 text-xs font-black uppercase text-slate-500">
                <Stethoscope className="h-4 w-4" /> Clinical Comments
              </CardHeader>
              <CardContent className="p-4">
                <textarea
                  className="w-full h-32 p-3 text-xs border rounded-lg bg-slate-50/50 focus:ring-2 focus:ring-blue-500 outline-none resize-none font-medium"
                  placeholder="Additional patient clinical history..."
                  value={clinicalComment}
                  onChange={(e) => setClinicalComment(e.target.value)}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RIGHT COLUMN: PREVIEW & FINALIZATION */}
        {/* RIGHT COLUMN: PREVIEW & FINALIZATION */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <Card className="border-none shadow-xl ring-1 ring-slate-200 overflow-hidden bg-white flex flex-col min-h-[600px]">
              <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
                <span className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Printer className="h-4 w-4 text-blue-400" /> Live Report
                  Preview
                </span>
              </div>

              <CardContent className="p-6 space-y-6 flex-1 text-sm overflow-y-auto">
                {getReportSections().map((section, idx) => (
                  <div key={idx} className="space-y-1">
                    <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                      {section.label}
                    </h4>
                    <p className="text-xs font-semibold text-slate-900 leading-relaxed italic">
                      {section.value}
                    </p>
                  </div>
                ))}

                {/* FOOTER DISCLAIMER */}
                <div className="pt-4 border-t border-dashed">
                  <p className="text-[9px] text-slate-400 italic leading-tight">
                    Pre-analytical and analytical quality parameters including
                    specimen identification, preparation, and staining quality
                    were verified prior to cytologic interpretation.
                  </p>
                </div>
              </CardContent>

              {/* NEW SECTION: REPORT ACTIONS */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3 shrink-0">
                <Button
                  variant="outline"
                  className="w-full py-6 border-blue-600 text-blue-600 font-bold hover:bg-blue-50 transition-colors uppercase tracking-widest text-[11px]"
                  onClick={() => {
                    // This will trigger the PDF generation logic we discussed
                    console.log("Opening PDF Preview...");
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Report Preview
                </Button>

                <Button
                  className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg transition-all uppercase tracking-widest text-[11px]"
                  onClick={() => {
                    // This will finalize and save the report data
                    console.log("Finalizing Report...");
                  }}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Finalize Report
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LBCReporting;
