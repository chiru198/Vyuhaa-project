
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, Target, AlertTriangle } from "lucide-react";

interface AIAnalysisData {
  status: string;
  confidence: number;
  findings: Array<{
    type: string;
    probability: number;
    location: string;
    coordinates: { x: number; y: number };
  }>;
  cellsAnalyzed: number;
  suspiciousCells: number;
  recommendations: string;
}

interface CompactAIAnalysisProps {
  aiAnalysis: AIAnalysisData;
}

const CompactAIAnalysis = ({ aiAnalysis }: CompactAIAnalysisProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center">
          <Brain className="h-4 w-4 mr-2" />
          AI Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Confidence and Key Metrics */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-blue-50 rounded">
            <p className="text-xs text-gray-600">Confidence</p>
            <p className="font-bold text-blue-600">{aiAnalysis.confidence}%</p>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <p className="text-xs text-gray-600">Cells</p>
            <p className="font-bold">{aiAnalysis.cellsAnalyzed.toLocaleString()}</p>
          </div>
          <div className="p-2 bg-red-50 rounded">
            <p className="text-xs text-gray-600">Suspicious</p>
            <p className="font-bold text-red-600">{aiAnalysis.suspiciousCells}</p>
          </div>
        </div>

        <Separator />

        {/* Findings - Compact Layout */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Target className="h-3 w-3 mr-1" />
            Key Findings
          </p>
          <div className="grid grid-cols-1 gap-1">
            {aiAnalysis.findings.map((finding, index) => (
              <div key={index} className="flex items-center justify-between p-1.5 bg-gray-50 rounded text-xs">
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={finding.probability > 80 ? "destructive" : "secondary"}
                    className="text-xs px-1.5 py-0.5"
                  >
                    {finding.type}
                  </Badge>
                  <span className="text-gray-600">{finding.location}</span>
                </div>
                <span className="font-bold">{finding.probability}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendation - Compact */}
        {aiAnalysis.recommendations && (
          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="h-3 w-3 text-yellow-600 mt-0.5 mr-1 flex-shrink-0" />
              <p className="text-xs text-yellow-800">{aiAnalysis.recommendations}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompactAIAnalysis;
