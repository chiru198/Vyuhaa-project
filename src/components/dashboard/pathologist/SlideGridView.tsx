
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileCheck, AlertTriangle } from "lucide-react";

interface SlideGridViewProps {
  slideData: any;
  onSlideSelect?: (slideId: string) => void;
  onGenerateReport?: () => void;
}

const SlideGridView = ({ slideData, onSlideSelect, onGenerateReport }: SlideGridViewProps) => {
  // Mock data for multiple slide regions based on the uploaded image
  const slideRegions = [
    { id: 'region-1', diagnosis: 'LSIL', confidence: 92, image: '/lovable-uploads/6c7d7a37-3a62-424b-ad2a-253187c4902b.png' },
    { id: 'region-2', diagnosis: 'LSIL', confidence: 85, image: '/lovable-uploads/6c7d7a37-3a62-424b-ad2a-253187c4902b.png' },
    { id: 'region-3', diagnosis: 'ASCUS', confidence: 78, image: '/lovable-uploads/6c7d7a37-3a62-424b-ad2a-253187c4902b.png' },
    { id: 'region-4', diagnosis: 'ASCH', confidence: 88, image: '/lovable-uploads/6c7d7a37-3a62-424b-ad2a-253187c4902b.png' },
    { id: 'region-5', diagnosis: 'LSIL', confidence: 76, image: '/lovable-uploads/6c7d7a37-3a62-424b-ad2a-253187c4902b.png' },
    { id: 'region-6', diagnosis: 'LSIL', confidence: 82, image: '/lovable-uploads/6c7d7a37-3a62-424b-ad2a-253187c4902b.png' },
    { id: 'region-7', diagnosis: 'ASCUS', confidence: 71, image: '/lovable-uploads/6c7d7a37-3a62-424b-ad2a-253187c4902b.png' },
    { id: 'region-8', diagnosis: 'HSIL', confidence: 94, image: '/lovable-uploads/6c7d7a37-3a62-424b-ad2a-253187c4902b.png' },
  ];

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">AI Analysis Results</h3>
          <p className="text-sm text-gray-600">
            Sample: {slideData.barcode} | Regions Analyzed: {slideRegions.length}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={onGenerateReport} className="bg-green-600 hover:bg-green-700">
            <FileCheck className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Grid of slide regions */}
      <div className="grid grid-cols-4 gap-4">
        {slideRegions.map((region) => (
          <Card 
            key={region.id} 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onSlideSelect?.(region.id)}
          >
            <CardHeader className="p-2">
              <div className="flex justify-between items-center">
                <Badge className={`text-xs font-semibold ${getDiagnosisBadgeColor(region.diagnosis)}`}>
                  {region.diagnosis}
                </Badge>
                <div className="flex items-center space-x-1">
                  {getConfidenceIcon(region.confidence)}
                  <span className="text-xs text-gray-600">{region.confidence}%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              <div className="aspect-square bg-gray-100 rounded border overflow-hidden">
                <img 
                  src={region.image} 
                  alt={`Slide region ${region.id}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-2 flex justify-center">
                <Button variant="outline" size="sm" className="text-xs">
                  <Eye className="h-3 w-3 mr-1" />
                  View Details
                </Button>
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
