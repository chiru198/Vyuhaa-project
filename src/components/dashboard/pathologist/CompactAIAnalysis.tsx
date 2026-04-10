import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, CheckCircle } from "lucide-react";

interface CompactAIAnalysisProps {
  aiAnalysis?: any;
}

const CompactAIAnalysis = ({ aiAnalysis }: CompactAIAnalysisProps) => {
  const confidence = aiAnalysis?.confidence ?? null;
  const status = aiAnalysis?.status ?? "pending";
  const findings = aiAnalysis?.findings ?? [];
  const cellsAnalyzed = aiAnalysis?.cellsAnalyzed ?? null;
  const suspiciousCells = aiAnalysis?.suspiciousCells ?? null;

  const isNegative = !findings.length && status !== "positive";

  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-blue-600" />
          AI Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">

        {/* Main result badge — matches screenshot */}
        <div className={`rounded-lg p-4 flex flex-col items-center justify-center gap-1 ${isNegative ? "bg-blue-50 border border-blue-100" : "bg-red-50 border border-red-100"}`}>
          <CheckCircle className={`h-6 w-6 ${isNegative ? "text-blue-500" : "text-red-500"}`} />
          <p className={`text-lg font-bold tracking-wide ${isNegative ? "text-blue-700" : "text-red-700"}`}>
            {isNegative ? "NEGATIVE" : "POSITIVE"}
          </p>
          <p className="text-xs text-slate-500">
            {isNegative ? "No abnormalities detected" : "Abnormalities detected"}
          </p>
        </div>

        {/* Metrics — only show if AI data available */}
        {(confidence !== null || cellsAnalyzed !== null) && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-blue-50 rounded">
              <p className="text-[10px] text-gray-500">Confidence</p>
              <p className="font-bold text-blue-600 text-sm">{confidence ?? "--"}%</p>
            </div>
            <div className="p-2 bg-slate-50 rounded">
              <p className="text-[10px] text-gray-500">Cells</p>
              <p className="font-bold text-sm">{cellsAnalyzed?.toLocaleString() ?? "--"}</p>
            </div>
            <div className="p-2 bg-red-50 rounded">
              <p className="text-[10px] text-gray-500">Suspicious</p>
              <p className="font-bold text-red-600 text-sm">{suspiciousCells ?? "--"}</p>
            </div>
          </div>
        )}

        {/* Findings list */}
        {findings.length > 0 && (
          <div className="space-y-1">
            {findings.map((finding: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-1.5 bg-gray-50 rounded text-xs">
                <span className="font-medium text-slate-700">{finding.type}</span>
                <span className="font-bold text-slate-600">{finding.probability}%</span>
              </div>
            ))}
          </div>
        )}

      </CardContent>
    </Card>
  );
};

export default CompactAIAnalysis;
