import { useState, useRef, useEffect } from "react";
import OpenSeadragon from "openseadragon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ZoomIn, ZoomOut, RotateCw, Move, Home, 
  Square, Circle, Ruler, MousePointer 
} from "lucide-react";

interface SlideViewerProps {
  imagingUrl: string; // Passed from AISlideViewer.tsx
}

const SlideViewer = ({ imagingUrl }: SlideViewerProps) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [osdViewer, setOsdViewer] = useState<OpenSeadragon.Viewer | null>(null);
  const [tool, setTool] = useState<'pointer' | 'move' | 'rectangle' | 'circle' | 'ruler'>('pointer');

  useEffect(() => {
    if (!viewerRef.current || !imagingUrl) return;

    // 1. Extract filename for the Python API
    const slideName = imagingUrl.split('/').pop();

    // 2. Initialize OpenSeadragon
    const viewer = OpenSeadragon({
      element: viewerRef.current,
      prefixUrl: "https://openseadragon.github.io/openseadragon/images/",
      tileSources: {
        width: 100000, // High dummy value, Python server handles real dimensions
        height: 100000,
        tileSize: 254,
        tileOverlap: 1,
        getTileUrl: (level, x, y) => 
          `http://localhost:8000/tile/${slideName}/${level}/${x}_${y}.jpg`
      },
      // UI Settings
      showNavigationControl: false, // We use your custom toolbar instead
      showNavigator: true,
      navigatorPosition: "BOTTOM_RIGHT",
      maxZoomPixelRatio: 10,
      animationTime: 0.5,
      blendTime: 0.1,
      constrainDuringPan: true,
    });

    setOsdViewer(viewer);

    return () => viewer.destroy();
  }, [imagingUrl]);

  // --- BRIDGE: Your Toolbar Buttons connected to OpenSeadragon ---
  const handleZoomIn = () => osdViewer?.viewport.zoomBy(1.2);
  const handleZoomOut = () => osdViewer?.viewport.zoomBy(0.8);
  const handleZoomFit = () => osdViewer?.viewport.goHome();
  const handleRotate = () => {
    const currentRotation = osdViewer?.viewport.getRotation() || 0;
    osdViewer?.viewport.setRotation(currentRotation + 90);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Toolbar - Reusing your existing UI structure */}
      <div className="flex items-center justify-between p-2 bg-white border-b z-20">
        <div className="flex items-center space-x-2">
          <Button variant={tool === 'pointer' ? 'default' : 'outline'} size="sm" onClick={() => setTool('pointer')}>
            <MousePointer className="h-4 w-4" />
          </Button>
          <Button variant={tool === 'move' ? 'default' : 'outline'} size="sm" onClick={() => setTool('move')}>
            <Move className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm"><Square className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm"><Circle className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm"><Ruler className="h-4 w-4" /></Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}><ZoomOut className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={handleZoomIn}><ZoomIn className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={handleZoomFit}><Home className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={handleRotate}><RotateCw className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* The Viewer Engine */}
      <div className="flex-1 relative overflow-hidden">
        <div 
          ref={viewerRef} 
          className="w-full h-full" 
          style={{ backgroundColor: '#0f172a' }} // Matches bg-slate-900
        />

        {/* Floating AI Status Overlay */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <Badge className="bg-red-500/90 text-white border-none shadow-lg px-3 py-1">
            HSIL Detection (92%)
          </Badge>
          <Badge className="bg-yellow-500/90 text-white border-none shadow-lg px-3 py-1">
            LSIL (78%)
          </Badge>
        </div>

        {/* Coordinates overlay */}
        <div className="absolute bottom-4 left-4 z-10 bg-black/70 text-white text-[10px] px-2 py-1 rounded backdrop-blur-md">
          OpenSlide Engine Active | Port: 8000
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between p-2 bg-slate-50 border-t text-[11px] font-medium text-slate-600">
        <div className="flex items-center space-x-4">
          <span>Objective: 40x</span>
          <span>Field: Digital Pathology</span>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-100">HSIL: High Risk</Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">Satisfactory Specimen</Badge>
        </div>
      </div>
    </div>
  );
};

export default SlideViewer;