
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle, 
  FileText, 
  Download, 
  Eye, 
  AlertCircle,
  RefreshCw,
  Send
} from "lucide-react";

interface EnhancedActionPanelProps {
  sampleId: string;
  currentStatus: "pending" | "verified" | "approved";
  onVerifyAnalysis: (notes?: string) => void;
  onApproveAnalysis: (diagnosis: string, recommendations?: string) => void;
  onRequestReview: (reason: string) => void;
  onExportReport: () => void;
}

const EnhancedActionPanel = ({
  sampleId,
  currentStatus,
  onVerifyAnalysis,
  onApproveAnalysis,
  onRequestReview,
  onExportReport
}: EnhancedActionPanelProps) => {
  const [verificationNotes, setVerificationNotes] = useState("");
  const [finalDiagnosis, setFinalDiagnosis] = useState("");
  const [finalRecommendations, setFinalRecommendations] = useState("");
  const [reviewReason, setReviewReason] = useState("");
  const [showFinalForm, setShowFinalForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const getStatusBadge = () => {
    switch (currentStatus) {
      case "verified":
        return <Badge className="bg-blue-100 text-blue-800">Verified - Ready for Final Approval</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved - Report Ready</Badge>;
      default:
        return <Badge variant="outline">Pending Initial Review</Badge>;
    }
  };

  const handleVerify = () => {
    onVerifyAnalysis(verificationNotes);
    setVerificationNotes("");
  };

  const handleApprove = () => {
    if (!finalDiagnosis.trim()) return;
    onApproveAnalysis(finalDiagnosis, finalRecommendations);
    setFinalDiagnosis("");
    setFinalRecommendations("");
    setShowFinalForm(false);
  };

  const handleRequestReview = () => {
    if (!reviewReason.trim()) return;
    onRequestReview(reviewReason);
    setReviewReason("");
    setShowReviewForm(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Diagnostic Actions</CardTitle>
        <div className="mt-2">
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step 1: Verify Analysis (if not yet verified) */}
        {currentStatus === "pending" && (
          <div className="space-y-3 border-l-4 border-blue-400 pl-3 bg-blue-50 p-3 rounded-r">
            <h4 className="font-medium text-blue-800 text-sm">Step 1: Verify AI Analysis</h4>
            <p className="text-xs text-blue-700">
              Review AI findings and mark for preliminary verification. Cases can be re-queued for later review if needed.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="verification-notes" className="text-xs">Verification Notes (Optional)</Label>
              <Textarea
                id="verification-notes"
                placeholder="Add any notes about the AI analysis accuracy..."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                className="text-xs min-h-[60px]"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={handleVerify}
                className="bg-blue-600 hover:bg-blue-700 text-xs"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Verify Analysis
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="text-xs"
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                Request Review
              </Button>
            </div>

            {showReviewForm && (
              <div className="space-y-2 mt-3 p-2 bg-yellow-50 rounded border">
                <Label htmlFor="review-reason" className="text-xs">Reason for Manual Review</Label>
                <Textarea
                  id="review-reason"
                  placeholder="Specify why this case needs manual review..."
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  className="text-xs min-h-[50px]"
                />
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    onClick={handleRequestReview}
                    className="bg-yellow-600 hover:bg-yellow-700 text-xs"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Send for Review
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setShowReviewForm(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Final Approval (if verified) */}
        {currentStatus === "verified" && (
          <div className="space-y-3 border-l-4 border-green-400 pl-3 bg-green-50 p-3 rounded-r">
            <h4 className="font-medium text-green-800 text-sm">Step 2: Final Approval & Report Generation</h4>
            <p className="text-xs text-green-700">
              Case has been verified. Provide final diagnosis following CAP protocol format.
            </p>
            
            <Button 
              onClick={() => setShowFinalForm(!showFinalForm)}
              className="bg-green-600 hover:bg-green-700 text-xs w-full"
            >
              <FileText className="h-3 w-3 mr-1" />
              Finalize Diagnosis
            </Button>

            {showFinalForm && (
              <div className="space-y-3 mt-3 p-3 bg-white rounded border">
                <div className="space-y-2">
                  <Label htmlFor="final-diagnosis" className="text-xs font-medium">
                    Final Diagnosis (CAP Format) *
                  </Label>
                  <Textarea
                    id="final-diagnosis"
                    placeholder="INTERPRETATION: [Specimen adequacy, general categorization, interpretation/result]..."
                    value={finalDiagnosis}
                    onChange={(e) => setFinalDiagnosis(e.target.value)}
                    className="min-h-[100px] text-xs"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="final-recommendations" className="text-xs">
                    Recommendations & Follow-up
                  </Label>
                  <Textarea
                    id="final-recommendations"
                    placeholder="Clinical correlation and follow-up recommendations..."
                    value={finalRecommendations}
                    onChange={(e) => setFinalRecommendations(e.target.value)}
                    className="min-h-[80px] text-xs"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button 
                    onClick={handleApprove}
                    disabled={!finalDiagnosis.trim()}
                    className="bg-green-600 hover:bg-green-700 text-xs"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approve & Generate Report
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowFinalForm(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Completed Actions (if approved) */}
        {currentStatus === "approved" && (
          <div className="space-y-2 border-l-4 border-gray-400 pl-3 bg-gray-50 p-3 rounded-r">
            <h4 className="font-medium text-gray-800 text-sm">Case Completed</h4>
            <p className="text-xs text-gray-700">Final report has been generated and approved.</p>
            
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="text-xs">
                <Eye className="h-3 w-3 mr-1" />
                View Report
              </Button>
              <Button 
                variant="outline" 
                onClick={onExportReport}
                className="text-xs"
              >
                <Download className="h-3 w-3 mr-1" />
                Export PDF
              </Button>
            </div>
          </div>
        )}

        {/* Always available actions */}
        <div className="pt-2 border-t">
          <h5 className="font-medium text-gray-700 text-sm mb-2">Additional Actions</h5>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              View Slides
            </Button>
            <Button variant="outline" className="text-xs">
              <RefreshCw className="h-3 w-3 mr-1" />
              Re-analyze
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedActionPanel;
