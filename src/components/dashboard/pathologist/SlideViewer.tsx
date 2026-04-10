import React, { useState, useRef, useEffect, useCallback } from "react";
import OpenSeadragon from "openseadragon";
import { Button } from "@/components/ui/button";
import {
  ZoomIn, ZoomOut, RotateCw, Move, Home,
  Square, Circle, Ruler, MousePointer,
  Maximize2, Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Annotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "rectangle" | "circle" | "measurement";
  color: string;
  startPoint?: { x: number; y: number };
  endPoint?: { x: number; y: number };
  distance?: number;
}

interface SlideViewerProps {
  imagingUrl: string;
  sampleData?: any;
}

const SlideViewer = ({ imagingUrl, sampleData }: SlideViewerProps) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [osdViewer, setOsdViewer] = useState<OpenSeadragon.Viewer | null>(null);
  const [tool, setTool] = useState<'pointer' | 'move' | 'rectangle' | 'circle' | 'ruler'>('pointer');
  const [zoom, setZoom] = useState(100);
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 });
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const { toast } = useToast();

  // Build full image URL — handles local /uploads/ paths and full S3 URLs
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const rawImage = sampleData?.image1_path || imagingUrl;
  const imageSource = rawImage
    ? rawImage.startsWith("http")
      ? rawImage
      : `${API_BASE}${rawImage}`
    : null;

  useEffect(() => {
    if (!viewerRef.current) return;

    const viewer = OpenSeadragon({
      element: viewerRef.current,
      prefixUrl: "https://openseadragon.github.io/openseadragon/images/",
      tileSources: "http://localhost:8000/slide.dzi",
      showNavigationControl: false,
      showNavigator: true,
      navigatorPosition: "BOTTOM_RIGHT",
      navigatorSizeRatio: 0.2,
      maxZoomPixelRatio: 20,
      minZoomImageRatio: 0.5,
      animationTime: 0.4,
      blendTime: 0.1,
      constrainDuringPan: true,
      visibilityRatio: 0.5,
    });

    viewer.addHandler("zoom", (e) => {
      setZoom(Math.round(e.zoom * 100));
    });

    viewer.addHandler("pan", (e) => {
      setPosition({ x: parseFloat(e.center.x.toFixed(3)), y: parseFloat(e.center.y.toFixed(3)) });
    });

    setOsdViewer(viewer);
    return () => viewer.destroy();
  }, [imageSource]);

  // --- BRIDGE: Your Toolbar Buttons connected to OpenSeadragon ---
  const handleZoomIn = () => osdViewer?.viewport.zoomBy(1.2);
  const handleZoomOut = () => osdViewer?.viewport.zoomBy(0.8);
  const handleZoomFit = () => osdViewer?.viewport.goHome();
  const handleRotate = () => {
    const currentRotation = osdViewer?.viewport.getRotation() || 0;
    osdViewer?.viewport.setRotation(currentRotation + 90);
  };

  // Disable OSD pan when annotation tool is active
  useEffect(() => {
    if (!osdViewer) return;
    if (tool === "pointer" || tool === "move") {
      osdViewer.setMouseNavEnabled(true);
    } else {
      osdViewer.setMouseNavEnabled(false);
    }
  }, [tool, osdViewer]);

  // --- ANNOTATION HANDLERS ---
  const handleOverlayMouseDown = useCallback((e: React.MouseEvent) => {
    if (tool === "pointer" || tool === "move") return;
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(true);
    setDrawStart({ x, y });
    const color = tool === "rectangle" ? "#ef4444" : tool === "circle" ? "#3b82f6" : "#22c55e";
    setCurrentAnnotation({
      id: `ann-${Date.now()}`,
      x, y, width: 0, height: 0,
      type: tool === "ruler" ? "measurement" : tool,
      color,
      startPoint: { x, y },
    });
  }, [tool]);

  const handleOverlayMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !drawStart || !currentAnnotation) return;
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = Math.abs(x - drawStart.x);
    const height = Math.abs(y - drawStart.y);
    const minX = Math.min(x, drawStart.x);
    const minY = Math.min(y, drawStart.y);
    if (currentAnnotation.type === "measurement") {
      const dx = x - drawStart.x;
      const dy = y - drawStart.y;
      const distance = Math.round((Math.sqrt(dx * dx + dy * dy) * 500) / zoom);
      setCurrentAnnotation({ ...currentAnnotation, endPoint: { x, y }, distance });
    } else {
      setCurrentAnnotation({ ...currentAnnotation, x: minX, y: minY, width, height });
    }
  }, [isDrawing, drawStart, currentAnnotation, zoom]);

  const handleOverlayMouseUp = useCallback(() => {
    if (!isDrawing || !currentAnnotation) return;
    setIsDrawing(false);
    if (currentAnnotation.type === "measurement") {
      if (currentAnnotation.distance && currentAnnotation.distance > 0) {
        setAnnotations(prev => [...prev, currentAnnotation]);
        toast({ title: "Measurement Added", description: `Distance: ${currentAnnotation.distance}μm` });
      }
    } else if (currentAnnotation.width > 5 && currentAnnotation.height > 5) {
      setAnnotations(prev => [...prev, currentAnnotation]);
      toast({ title: "Annotation Added", description: `${currentAnnotation.type} annotation created` });
    }
    setCurrentAnnotation(null);
    setDrawStart(null);
  }, [isDrawing, currentAnnotation, toast]);

  const clearAnnotations = () => {
    setAnnotations([]);
    toast({ title: "Annotations Cleared" });
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white border-b z-20">
        <div className="flex items-center gap-1">
          <Button variant={tool === 'pointer' ? 'default' : 'ghost'} size="sm" className="h-8 w-8 p-0" onClick={() => setTool('pointer')}>
            <MousePointer className="h-4 w-4" />
          </Button>
          <Button variant={tool === 'move' ? 'default' : 'ghost'} size="sm" className="h-8 w-8 p-0" onClick={() => setTool('move')}>
            <Move className="h-4 w-4" />
          </Button>
          <div className="h-5 w-px bg-slate-200 mx-1" />
          <Button variant={tool === 'rectangle' ? 'default' : 'ghost'} size="sm" className="h-8 w-8 p-0" onClick={() => setTool('rectangle')}>
            <Square className="h-4 w-4" />
          </Button>
          <Button variant={tool === 'circle' ? 'default' : 'ghost'} size="sm" className="h-8 w-8 p-0" onClick={() => setTool('circle')}>
            <Circle className="h-4 w-4" />
          </Button>
          <Button variant={tool === 'ruler' ? 'default' : 'ghost'} size="sm" className="h-8 w-8 p-0" onClick={() => setTool('ruler')}>
            <Ruler className="h-4 w-4" />
          </Button>
          {annotations.length > 0 && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={clearAnnotations}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleZoomOut}><ZoomOut className="h-4 w-4" /></Button>
          <span className="text-xs font-mono text-slate-600 w-14 text-center">{zoom}%</span>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleZoomIn}><ZoomIn className="h-4 w-4" /></Button>
          <div className="h-5 w-px bg-slate-200 mx-1" />
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleZoomFit}><Home className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleRotate}><RotateCw className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => viewerRef.current?.requestFullscreen()}><Maximize2 className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* OpenSeadragon Viewer */}
      <div className="flex-1 relative overflow-hidden">
        {!imageSource ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            No image available for this sample.
          </div>
        ) : (
          <div ref={viewerRef} className="w-full h-full" style={{ backgroundColor: '#0f172a' }} />
        )}

        {/* Annotation Overlay */}
        <div
          ref={overlayRef}
          className="absolute inset-0 w-full h-full"
          style={{
            pointerEvents: tool !== "pointer" && tool !== "move" ? "auto" : "none",
            cursor: tool === "rectangle" || tool === "circle" || tool === "ruler" ? "crosshair" : "default",
            zIndex: 10,
          }}
          onMouseDown={handleOverlayMouseDown}
          onMouseMove={handleOverlayMouseMove}
          onMouseUp={handleOverlayMouseUp}
          onMouseLeave={handleOverlayMouseUp}
        >
          {/* Saved annotations */}
          {annotations.map((ann) => (
            <React.Fragment key={ann.id}>
              {ann.type === "rectangle" && (
                <div className="absolute border-2 pointer-events-none"
                  style={{ left: ann.x, top: ann.y, width: ann.width, height: ann.height, borderColor: ann.color, backgroundColor: `${ann.color}20` }} />
              )}
              {ann.type === "circle" && (
                <div className="absolute border-2 rounded-full pointer-events-none"
                  style={{ left: ann.x, top: ann.y, width: ann.width, height: ann.height, borderColor: ann.color, backgroundColor: `${ann.color}20` }} />
              )}
              {ann.type === "measurement" && ann.startPoint && ann.endPoint && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line x1={ann.startPoint.x} y1={ann.startPoint.y} x2={ann.endPoint.x} y2={ann.endPoint.y} stroke={ann.color} strokeWidth="2" />
                  <circle cx={ann.startPoint.x} cy={ann.startPoint.y} r="4" fill={ann.color} />
                  <circle cx={ann.endPoint.x} cy={ann.endPoint.y} r="4" fill={ann.color} />
                  <text x={(ann.startPoint.x + ann.endPoint.x) / 2} y={(ann.startPoint.y + ann.endPoint.y) / 2 - 10}
                    fill={ann.color} fontSize="12" fontWeight="bold" textAnchor="middle">{ann.distance}μm</text>
                </svg>
              )}
            </React.Fragment>
          ))}

          {/* Current annotation being drawn */}
          {currentAnnotation && (
            <>
              {currentAnnotation.type === "rectangle" && (
                <div className="absolute border-2 pointer-events-none"
                  style={{ left: currentAnnotation.x, top: currentAnnotation.y, width: currentAnnotation.width, height: currentAnnotation.height, borderColor: currentAnnotation.color, backgroundColor: `${currentAnnotation.color}20`, borderStyle: "dashed" }} />
              )}
              {currentAnnotation.type === "circle" && (
                <div className="absolute border-2 rounded-full pointer-events-none"
                  style={{ left: currentAnnotation.x, top: currentAnnotation.y, width: currentAnnotation.width, height: currentAnnotation.height, borderColor: currentAnnotation.color, backgroundColor: `${currentAnnotation.color}20`, borderStyle: "dashed" }} />
              )}
              {currentAnnotation.type === "measurement" && currentAnnotation.startPoint && currentAnnotation.endPoint && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line x1={currentAnnotation.startPoint.x} y1={currentAnnotation.startPoint.y} x2={currentAnnotation.endPoint.x} y2={currentAnnotation.endPoint.y} stroke={currentAnnotation.color} strokeWidth="2" strokeDasharray="5,5" />
                  <circle cx={currentAnnotation.startPoint.x} cy={currentAnnotation.startPoint.y} r="4" fill={currentAnnotation.color} />
                  <circle cx={currentAnnotation.endPoint.x} cy={currentAnnotation.endPoint.y} r="4" fill={currentAnnotation.color} />
                  {currentAnnotation.distance && (
                    <text x={(currentAnnotation.startPoint.x + currentAnnotation.endPoint.x) / 2} y={(currentAnnotation.startPoint.y + currentAnnotation.endPoint.y) / 2 - 10}
                      fill={currentAnnotation.color} fontSize="12" fontWeight="bold" textAnchor="middle">{currentAnnotation.distance}μm</text>
                  )}
                </svg>
              )}
            </>
          )}
        </div>

        {/* Status overlay bottom-left */}
        <div className="absolute bottom-3 left-3 z-20 bg-black/70 text-white text-[10px] px-2 py-1 rounded backdrop-blur-md font-mono">
          Zoom: {zoom}% | Position: ({position.x}, {position.y}) | Tool: {tool}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border-t text-[11px] font-medium text-slate-600">
        <div className="flex items-center space-x-4">
          <span>Objective: 20x</span>
          <span>Pixel Size: 0.5μm/pixel</span>
          <span>Field: 500μm</span>
        </div>
        <div className="flex items-center space-x-2 text-[10px] text-slate-400">
          <span>{annotations.filter(a => a.type === "rectangle").length} Rectangles</span>
          <span>{annotations.filter(a => a.type === "circle").length} Circles</span>
          <span>{annotations.filter(a => a.type === "measurement").length} Measurements</span>
        </div>
      </div>
    </div>
  );
};

export default SlideViewer;