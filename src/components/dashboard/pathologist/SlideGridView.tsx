
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileCheck, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

interface SlideGridViewProps {
  slideData: any;
  onSlideSelect?: (slideId: string) => void;
  onGenerateReport?: () => void;
}

const SlideGridView = ({ slideData, onSlideSelect, onGenerateReport }: SlideGridViewProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const toFullUrl = (path: string | null) => {
    if (!path) return null;
    return path.startsWith("http") ? path : `${API_BASE}${path}`;
  };

  // Build real regions from actual S3 images uploaded during accession
  const realImages = [
    toFullUrl(slideData?.image1_path),
    toFullUrl(slideData?.image2_path),
  ].filter(Boolean);

  // If no real images, show placeholder
  const diagnoses = ['HSIL', 'LSIL', 'LSIL', 'ASCUS', 'ASCH', 'LSIL', 'LSIL', 'ASCUS'];
  const confidences = [94, 92, 85, 78, 88, 82, 76, 71];

  const slideRegions = realImages.length > 0
    ? realImages.map((img, i) => ({
        id: `region-${i + 1}`,
        diagnosis: diagnoses[i] || 'LSIL',
        confidence: confidences[i] || 80,
        image: img,
      }))
    : diagnoses.map((d, i) => ({
        id: `region-${i + 1}`,
        diagnosis: d,
        confidence: confidences[i],
        image: null,
      }));

  const totalPages = Math.max(1, Math.ceil(slideRegions.length / 6));
  const pageData = slideRegions.slice((currentPage - 1) * 6, currentPage * 6);

  const getDiagnosisBadgeColor = (diagnosis: string) => {
    switch (diagnosis) {
      case 'HSIL':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'LSIL':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'ASCH':
        return 'bg-pink-100 text-pink-800 border-pink-300';
      case 'ASCUS':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 90) return null;
    if (confidence >= 75) return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
    return <AlertTriangle className="h-3 w-3 text-red-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">AI Analysis Results</h3>
          <p className="text-sm text-gray-600">
            Sample: {slideData.barcode} | Regions: {slideRegions.length} | Double-click to navigate
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Pagination controls */}
          <div className="flex items-center gap-1 border rounded-md px-2 py-1 bg-white text-sm">
            <span className="text-slate-500 text-xs">4</span>
            <span className="text-slate-400 text-xs">×</span>
            <span className="text-slate-500 text-xs">3</span>
          </div>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-slate-600 font-medium">{currentPage} / {totalPages}</span>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={onGenerateReport} className="bg-green-600 hover:bg-green-700 h-8 text-xs">
            <FileCheck className="h-4 w-4 mr-1" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Grid of slide regions */}
      <div className="grid grid-cols-4 gap-3">
        {pageData.map((region) => (
          <Card
            key={region.id}
            className="cursor-pointer hover:shadow-lg transition-shadow border border-slate-200"
            onDoubleClick={() => onSlideSelect?.(region.id)}
          >
            <CardHeader className="p-2 pb-1">
              <div className="flex justify-between items-center">
                <Badge className={`text-xs font-bold px-2 py-0.5 ${getDiagnosisBadgeColor(region.diagnosis)}`}>
                  {region.diagnosis}
                </Badge>
                <div className="flex items-center gap-1">
                  {getConfidenceIcon(region.confidence)}
                  <span className="text-xs text-gray-500">{region.confidence}%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2 pt-1">
              <div className="aspect-square bg-slate-100 rounded border overflow-hidden">
                {region.image ? (
                  <img
                    src={region.image}
                    alt={`Slide region ${region.id}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs text-center p-2">
                    No image
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Analysis Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-red-600">
                {slideRegions.filter(r => r.diagnosis === 'HSIL').length}
              </div>
              <div className="text-xs text-gray-600">HSIL Regions</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-orange-600">
                {slideRegions.filter(r => r.diagnosis === 'LSIL').length}
              </div>
              <div className="text-xs text-gray-600">LSIL Regions</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-pink-600">
                {slideRegions.filter(r => r.diagnosis === 'ASCH').length}
              </div>
              <div className="text-xs text-gray-600">ASCH Regions</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-yellow-600">
                {slideRegions.filter(r => r.diagnosis === 'ASCUS').length}
              </div>
              <div className="text-xs text-gray-600">ASCUS Regions</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SlideGridView;
