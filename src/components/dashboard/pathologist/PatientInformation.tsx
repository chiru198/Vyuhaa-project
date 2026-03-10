
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronUp, User, Calendar, FileText, AlertTriangle } from "lucide-react";

interface PatientInformationProps {
  patientData: {
    id: string;
    name: string;
    age: number;
    gender?: string;
    contactNumber?: string;
    address?: string;
    medicalHistory?: string;
    lastMenstrualPeriod?: string;
    contraceptiveUse?: string;
    pregnancyHistory?: string;
    previousCytology?: Array<{
      date: string;
      result: string;
      recommendation: string;
    }>;
    previousBiopsy?: Array<{
      date: string;
      result: string;
      histology: string;
    }>;
    clinicalHistory?: string;
    symptoms?: string;
    riskFactors?: string[];
  };
  sampleData: {
    barcode: string;
    testType: string;
    collectionDate: string;
    clinicalIndication?: string;
    specimenAdequacy?: string;
  };
}

const PatientInformation = ({ patientData, sampleData }: PatientInformationProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base flex items-center">
            <User className="h-4 w-4 mr-2" />
            Patient Information
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Summary
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Full Details
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {/* Always visible summary */}
        <div className="space-y-2">
          <div>
            <p className="font-medium text-gray-700">Patient</p>
            <p className="font-semibold">{patientData.name}</p>
            <p className="text-gray-600">{patientData.age} years, {patientData.gender || 'Not specified'}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="font-medium text-gray-700">Sample ID</p>
              <p className="font-mono text-xs">{sampleData.barcode}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Test Type</p>
              <Badge variant="outline">{sampleData.testType}</Badge>
            </div>
          </div>

          <div>
            <p className="font-medium text-gray-700">Collection Date</p>
            <p>{sampleData.collectionDate}</p>
          </div>

          {/* Critical clinical indicators - always visible */}
          {patientData.riskFactors && patientData.riskFactors.length > 0 && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
              <div className="flex items-start">
                <AlertTriangle className="h-3 w-3 text-yellow-600 mt-0.5 mr-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-yellow-800 text-xs">Risk Factors</p>
                  <p className="text-xs text-yellow-700">{patientData.riskFactors.join(", ")}</p>
                </div>
              </div>
            </div>
          )}

          {/* Previous abnormal results - always visible if present */}
          {patientData.previousCytology && patientData.previousCytology.length > 0 && (
            <div className="p-2 bg-red-50 border border-red-200 rounded">
              <p className="font-medium text-red-800 text-xs mb-1">Previous Abnormal Cytology</p>
              <p className="text-xs text-red-700">
                {patientData.previousCytology[0].date}: {patientData.previousCytology[0].result}
              </p>
            </div>
          )}
        </div>

        {/* Expandable comprehensive details */}
        {isExpanded && (
          <>
            <Separator />
            <div className="space-y-3">
              <div>
                <p className="font-medium text-gray-700 mb-1">Clinical History</p>
                <p className="text-xs bg-gray-50 p-2 rounded">
                  {patientData.clinicalHistory || "No clinical history provided"}
                </p>
              </div>

              {patientData.symptoms && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">Current Symptoms</p>
                  <p className="text-xs">{patientData.symptoms}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="font-medium text-gray-700">LMP</p>
                  <p className="text-xs">{patientData.lastMenstrualPeriod || "Not provided"}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Contraception</p>
                  <p className="text-xs">{patientData.contraceptiveUse || "Not specified"}</p>
                </div>
              </div>

              {patientData.pregnancyHistory && (
                <div>
                  <p className="font-medium text-gray-700">Pregnancy History</p>
                  <p className="text-xs">{patientData.pregnancyHistory}</p>
                </div>
              )}

              {sampleData.clinicalIndication && (
                <div>
                  <p className="font-medium text-gray-700">Clinical Indication</p>
                  <p className="text-xs bg-blue-50 p-2 rounded">{sampleData.clinicalIndication}</p>
                </div>
              )}

              {/* Previous Cytology History */}
              {patientData.previousCytology && patientData.previousCytology.length > 0 && (
                <div>
                  <p className="font-medium text-gray-700 mb-2 flex items-center">
                    <FileText className="h-3 w-3 mr-1" />
                    Previous LBC Reports
                  </p>
                  <div className="space-y-2">
                    {patientData.previousCytology.map((report, index) => (
                      <div key={index} className="text-xs bg-gray-50 p-2 rounded border-l-2 border-blue-400">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium">{report.date}</span>
                          <Badge variant="outline" className="text-xs">{report.result}</Badge>
                        </div>
                        <p className="text-gray-600">{report.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Previous Biopsy History */}
              {patientData.previousBiopsy && patientData.previousBiopsy.length > 0 && (
                <div>
                  <p className="font-medium text-gray-700 mb-2 flex items-center">
                    <FileText className="h-3 w-3 mr-1" />
                    Previous Biopsy Reports
                  </p>
                  <div className="space-y-2">
                    {patientData.previousBiopsy.map((biopsy, index) => (
                      <div key={index} className="text-xs bg-red-50 p-2 rounded border-l-2 border-red-400">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium">{biopsy.date}</span>
                          <Badge variant="destructive" className="text-xs">{biopsy.result}</Badge>
                        </div>
                        <p className="text-gray-600">{biopsy.histology}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {patientData.contactNumber && (
                <div>
                  <p className="font-medium text-gray-700">Contact</p>
                  <p className="text-xs">{patientData.contactNumber}</p>
                </div>
              )}

              {patientData.address && (
                <div>
                  <p className="font-medium text-gray-700">Address</p>
                  <p className="text-xs">{patientData.address}</p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientInformation;
