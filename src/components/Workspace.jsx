import { useState, useRef, useEffect, useCallback } from "react";
import { Download, RefreshCw, Upload, Sparkles, Image, Check, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { eraseRegion, inpaintImage, recoverRegion } from "../lib/inpaint";

export default function Workspace({
  image,
  setImage,
  original,
  result,
  isProcessing,
  activeBgType,
  bgVal,
  layersVisibility,
  layersOpacity,
  handleProcess,
  preloading,
  preloadProgress,
  activeRetouchTool,
  setActiveRetouchTool,
  brushRadius,
  brushMode,
  setResult
}) {
  const [dragActive, setDragActive] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const [isSliding, setIsSliding] = useState(false);
  const containerRef = useRef(null);

  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const originalCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, visible: false });

  // Zoom & Pan state (for Magic Brush canvas)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOrigin = useRef({ x: 0, y: 0 });
  const spaceHeld = useRef(false);
  const canvasWrapperRef = useRef(null);

  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 4;
  const ZOOM_STEP = 0.15;

  const clampZoom = (z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

  const zoomIn  = () => setZoom((z) => clampZoom(parseFloat((z + ZOOM_STEP).toFixed(2))));
  const zoomOut = () => setZoom((z) => clampZoom(parseFloat((z - ZOOM_STEP).toFixed(2))));
  const resetZoom = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // Initialize and redraw image on active canvas
  useEffect(() => {
    if (activeRetouchTool) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        
        // Setup offscreen mask canvas
        const mCanvas = document.createElement("canvas");
        mCanvas.width = img.naturalWidth;
        mCanvas.height = img.naturalHeight;
        maskCanvasRef.current = mCanvas;
        
        const maskCtx = mCanvas.getContext("2d");
        maskCtx.fillStyle = "#000000";
        maskCtx.fillRect(0, 0, mCanvas.width, mCanvas.height);
      };
      // For "erase" and "recover" modes, load the cutout (result). For "inpaint", load original.
      img.src = (brushMode === "erase" || brushMode === "recover") ? result : original;

      // Load original image into offscreen canvas for background recovery
      const origImg = new window.Image();
      origImg.crossOrigin = "anonymous";
      origImg.onload = () => {
        const origCanvas = document.createElement("canvas");
        origCanvas.width = origImg.naturalWidth;
        origCanvas.height = origImg.naturalHeight;
        const origCtx = origCanvas.getContext("2d");
        origCtx.drawImage(origImg, 0, 0);
        originalCanvasRef.current = origCanvas;
      };
      origImg.src = original;
    }
  }, [activeRetouchTool, brushMode, original, result]);

  // Reset zoom/pan when switching tools
  useEffect(() => {
    if (!activeRetouchTool) { setZoom(1); setPan({ x: 0, y: 0 }); }
  }, [activeRetouchTool]);

  // Ctrl+Wheel zoom handler globally registered when activeRetouchTool is open
  useEffect(() => {
    if (!activeRetouchTool) return;

    const onWheel = (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      setZoom((z) => clampZoom(parseFloat((z + delta).toFixed(2))));
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [activeRetouchTool]);

  // Space key for pan cursor
  useEffect(() => {
    const onKeyDown = (e) => { if (e.code === "Space") { e.preventDefault(); spaceHeld.current = true; } };
    const onKeyUp   = (e) => { if (e.code === "Space") spaceHeld.current = false; };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup",   onKeyUp);
    return () => { window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); };
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    
    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: x * scaleX,
      y: y * scaleY
    };
  };

  // Pan pointer handlers
  const handlePanStart = (e) => {
    if (!spaceHeld.current && e.button !== 1) return;
    e.preventDefault();
    isPanning.current = true;
    panStart.current  = { x: e.clientX, y: e.clientY };
    panOrigin.current = { ...pan };
  };

  const handlePanMove = (e) => {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setPan({ x: panOrigin.current.x + dx, y: panOrigin.current.y + dy });
  };

  const handlePanEnd = () => { isPanning.current = false; };

  const startDrawing = (e) => {
    e.preventDefault();
    const pos = getCoordinates(e);
    if (!pos) return;
    
    setIsDrawing(true);
    setLastPos(pos);
    drawStroke(pos, pos);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const pos = getCoordinates(e);
    if (!pos) return;
    
    drawStroke(lastPos, pos);
    setLastPos(pos);
  };

  const drawStroke = (start, end) => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !maskCanvas) return;
    
    // Dynamically calculate scale ratio between internal canvas resolution and screen display box
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const canvasBrushWidth = brushRadius * scaleX;
    
    const maskCtx = maskCanvas.getContext("2d");
    
    // 1. Draw solid white stroke on mask canvas (used for processing)
    maskCtx.strokeStyle = "#ffffff";
    maskCtx.lineJoin = "round";
    maskCtx.lineCap = "round";
    maskCtx.lineWidth = canvasBrushWidth;
    maskCtx.beginPath();
    maskCtx.moveTo(start.x, start.y);
    maskCtx.lineTo(end.x, end.y);
    maskCtx.stroke();
    
    // 2. Draw red preview on OVERLAY canvas only — never touches image pixels
    if (overlayCanvas) {
      // Sync overlay dimensions with main canvas
      if (overlayCanvas.width !== canvas.width || overlayCanvas.height !== canvas.height) {
        overlayCanvas.width  = canvas.width;
        overlayCanvas.height = canvas.height;
      }
      const oCtx = overlayCanvas.getContext("2d");
      oCtx.strokeStyle = "rgba(239, 68, 68, 0.55)";
      oCtx.lineJoin = "round";
      oCtx.lineCap = "round";
      oCtx.lineWidth = canvasBrushWidth;
      oCtx.beginPath();
      oCtx.moveTo(start.x, start.y);
      oCtx.lineTo(end.x, end.y);
      oCtx.stroke();
    }
  };

  const endDrawing = async () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !maskCanvas) return;
    
    // Clear the red preview overlay immediately — it was only visual feedback
    if (overlayCanvas) {
      overlayCanvas.getContext("2d").clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    }
    
    const ctx = canvas.getContext("2d");
    const maskCtx = maskCanvas.getContext("2d");
    
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    
    if (brushMode === "erase") {
      eraseRegion(imgData, maskData, canvas.width, canvas.height);
      ctx.putImageData(imgData, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const newUrl = URL.createObjectURL(blob);
          setResult(newUrl);
        }
      }, "image/png");
    } else if (brushMode === "recover") {
      const origCanvas = originalCanvasRef.current;
      if (origCanvas) {
        const origCtx = origCanvas.getContext("2d");
        const origData = origCtx.getImageData(0, 0, origCanvas.width, origCanvas.height);
        
        recoverRegion(imgData, origData, maskData);
        ctx.putImageData(imgData, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const newUrl = URL.createObjectURL(blob);
            setResult(newUrl);
          }
        }, "image/png");
      }
    } else {
      inpaintImage(imgData, maskData, canvas.width, canvas.height, 5);
      ctx.putImageData(imgData, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const newFile = new File([blob], image.name, { type: "image/png" });
          setImage(newFile);
        }
      }, "image/png");
    }
  };


  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setImage(file);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
    }
  };

  // Split-slider drag handlers
  const handleTouchMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (touchX / rect.width) * 100));
    setSliderPos(percentage);
  };

  const handleMouseMove = (e) => {
    if (!isSliding || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (mouseX / rect.width) * 100));
    setSliderPos(percentage);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsSliding(false);
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  // Compositor download helper
  const handleCompositeDownload = () => {
    if (!result) return;

    // If transparent background is toggled
    if (activeBgType === "transparent" || !layersVisibility.background) {
      const link = document.createElement("a");
      link.href = result;
      link.download = "apex_cutout.png";
      link.click();
      return;
    }

    const imgFg = new window.Image();
    imgFg.crossOrigin = "anonymous";
    imgFg.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = imgFg.naturalWidth;
      canvas.height = imgFg.naturalHeight;
      const ctx = canvas.getContext("2d");

      const drawForeground = () => {
        if (layersVisibility.foreground) {
          ctx.globalAlpha = layersOpacity.foreground;
          ctx.drawImage(imgFg, 0, 0, canvas.width, canvas.height);
        }

        // Trigger browser download
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = "apex_composite.png";
        link.click();
      };

      // Draw background layer
      if (activeBgType === "color") {
        ctx.fillStyle = bgVal;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawForeground();
      } else if (activeBgType === "gradient") {
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        if (bgVal.includes("#f97316")) {
          grad.addColorStop(0, "#f97316"); grad.addColorStop(1, "#ec4899");
        } else if (bgVal.includes("#10b981")) {
          grad.addColorStop(0, "#10b981"); grad.addColorStop(1, "#06b6d4");
        } else if (bgVal.includes("#1e1b4b")) {
          grad.addColorStop(0, "#1e1b4b"); grad.addColorStop(1, "#311042");
        } else if (bgVal.includes("#d946ef")) {
          grad.addColorStop(0, "#d946ef"); grad.addColorStop(1, "#06b6d4");
        } else if (bgVal.includes("#ff7e5f")) {
          grad.addColorStop(0, "#ff7e5f"); grad.addColorStop(1, "#feb47b");
        } else if (bgVal.includes("#f59e0b")) {
          grad.addColorStop(0, "#f59e0b"); grad.addColorStop(1, "#b45309");
        } else {
          grad.addColorStop(0, "#2c3e50"); grad.addColorStop(1, "#3498db");
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawForeground();
      } else if (activeBgType === "image") {
        const imgBg = new window.Image();
        imgBg.crossOrigin = "anonymous";
        imgBg.onload = () => {
          ctx.drawImage(imgBg, 0, 0, canvas.width, canvas.height);
          drawForeground();
        };
        imgBg.src = bgVal;
      }
    };
    imgFg.src = result;
  };

  // Get inline background styling for container
  const getBgStyle = () => {
    if (!layersVisibility.background || activeBgType === "transparent") return {};
    if (activeBgType === "color") return { backgroundColor: bgVal, opacity: layersOpacity.background };
    if (activeBgType === "gradient") return { background: bgVal, opacity: layersOpacity.background };
    if (activeBgType === "image") {
      return {
        backgroundImage: `url(${bgVal})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        opacity: layersOpacity.background
      };
    }
    return {};
  };

  return (
    <div className="flex-1 bg-background p-6 flex flex-col justify-between items-center relative overflow-hidden select-none min-w-0">
      
      {/* 1. Drag & Drop Upload Initial Zone */}
      {!original && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`
            w-full max-w-[640px] aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition duration-300 relative my-auto group
            ${
              dragActive
                ? "border-primary bg-primary/5 shadow-2xl shadow-primary/10 scale-[1.02]"
                : "border-border bg-card/25 hover:border-primary/30 hover:bg-primary/5"
            }
          `}
        >
          <div className="size-16 rounded-2xl bg-secondary border border-primary/10 flex items-center justify-center mb-4 shadow-lg shadow-primary/5 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition duration-300">
            <Upload className="size-8 text-primary" />
          </div>
          <h2 className="text-lg font-black tracking-wide mb-2 text-foreground uppercase">
            Drag & Drop Your Image
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm mb-6 leading-relaxed">
            Drag photo anywhere here, or browse local folders to isolate focus layers automatically. Supports JPG, PNG, and WebP.
          </p>

          <label className="relative">
            <Button className="font-semibold text-xs" size="default">
              Browse Files
            </Button>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>
        </div>
      )}

      {/* 2. Photoshop Canvas Workspace */}
      {original && (
        <div className="w-full flex-1 flex flex-col items-center justify-center min-h-0">
          
          {/* Main Photo Editor */}
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="w-full max-w-[680px] aspect-[4/3] rounded-xl overflow-hidden border border-primary/20 hover:border-primary/40 transition duration-300 relative ps-grid shadow-2xl shadow-primary/5 bg-card"
          >
            {/* Background Compositing Layer */}
            {layersVisibility.background && (
              <div
                style={getBgStyle()}
                className="absolute inset-0 z-0 transition-all duration-300"
              />
            )}

            {/* Neural AI Scanner Line Overlay */}
            {isProcessing && (
              <>
                <div className="absolute inset-0 bg-primary/5 animate-shimmer z-20 pointer-events-none" />
                <div className="scanner-bar" />
              </>
            )}

            {/* Canvas Image Nodes */}
            <div className="absolute inset-0 flex items-center justify-center p-4 z-10">
              
              {activeRetouchTool ? (
                <div
                  ref={canvasWrapperRef}
                  className="relative w-full h-full flex items-center justify-center overflow-hidden"
                  style={{ cursor: spaceHeld.current ? (isPanning.current ? "grabbing" : "grab") : "none" }}
                  onMouseDown={(e) => { handlePanStart(e); }}
                  onMouseMove={(e) => {
                    handlePanMove(e);
                    const rect = e.currentTarget.getBoundingClientRect();
                    setMousePos({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                      visible: true
                    });
                  }}
                  onMouseUp={handlePanEnd}
                  onMouseLeave={() => { handlePanEnd(); setMousePos((prev) => ({ ...prev, visible: false })); }}
                >
                  {/* Zoomed + panned canvas */}
                  <div
                    style={{
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                      transformOrigin: "center center",
                      transition: (isPanning.current || isDrawing) ? "none" : "transform 0.05s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    {/* Aspect-perfect overlay wrapper container div */}
                    <div className="relative max-w-full max-h-full flex items-center justify-center">
                      <canvas
                        ref={canvasRef}
                        onMouseDown={(e) => { if (!spaceHeld.current && e.button !== 1) startDrawing(e); }}
                        onMouseMove={(e) => { if (!spaceHeld.current) draw(e); }}
                        onMouseUp={(e) => { endDrawing(); }}
                        onMouseLeave={endDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={endDrawing}
                        className="max-w-full max-h-full object-contain shadow-2xl select-none"
                        style={{ touchAction: "none", cursor: "none" }}
                      />
                      {/* Red brush preview overlay — synced down to the exact pixel */}
                      <canvas
                        ref={overlayCanvasRef}
                        className="absolute inset-0 w-full h-full pointer-events-none select-none"
                        style={{ touchAction: "none" }}
                      />
                    </div>
                  </div>


                  {/* Brush cursor overlay */}
                  {mousePos.visible && !spaceHeld.current && (
                    <div
                      className="absolute rounded-full border border-white mix-blend-difference pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${mousePos.x}px`,
                        top: `${mousePos.y}px`,
                        width: `${brushRadius * zoom}px`,
                        height: `${brushRadius * zoom}px`,
                      }}
                    />
                  )}

                  {/* ── Zoom Controls Overlay ── */}
                  <div className="absolute bottom-3 right-3 flex flex-col items-center gap-1 z-50 select-none">
                    {/* Zoom percentage badge */}
                    <button
                      onClick={resetZoom}
                      title="Reset zoom"
                      className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-black/70 text-white border border-white/15 hover:bg-primary/80 transition-colors backdrop-blur-sm cursor-pointer"
                    >
                      {Math.round(zoom * 100)}%
                    </button>

                    {/* + button */}
                    <button
                      onClick={zoomIn}
                      title="Zoom in (Ctrl + Scroll)"
                      className="size-7 flex items-center justify-center rounded-lg bg-black/70 border border-white/15 text-white hover:bg-primary/80 hover:border-primary/60 transition-all backdrop-blur-sm cursor-pointer"
                    >
                      <ZoomIn className="size-3.5" />
                    </button>

                    {/* Vertical zoom track */}
                    <div className="relative flex flex-col items-center">
                      <div className="w-1.5 rounded-full bg-white/10 border border-white/10"
                        style={{ height: "80px" }}
                      >
                        <div
                          className="w-full rounded-full bg-primary transition-all"
                          style={{
                            height: `${((zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100}%`,
                            marginTop: `${(1 - (zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100}%`,
                          }}
                        />
                      </div>
                      {/* Draggable thumb */}
                      <input
                        type="range"
                        min={MIN_ZOOM * 100}
                        max={MAX_ZOOM * 100}
                        step={ZOOM_STEP * 100}
                        value={Math.round(zoom * 100)}
                        onChange={(e) => setZoom(clampZoom(parseFloat((e.target.value / 100).toFixed(2))))}
                        title="Zoom slider"
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        style={{ writingMode: "vertical-lr", direction: "rtl", WebkitAppearance: "slider-vertical" }}
                      />
                    </div>

                    {/* - button */}
                    <button
                      onClick={zoomOut}
                      title="Zoom out (Ctrl + Scroll)"
                      className="size-7 flex items-center justify-center rounded-lg bg-black/70 border border-white/15 text-white hover:bg-primary/80 hover:border-primary/60 transition-all backdrop-blur-sm cursor-pointer"
                    >
                      <ZoomOut className="size-3.5" />
                    </button>

                    {/* Hint */}
                    <span className="text-[9px] text-white/40 font-mono mt-0.5">Ctrl+⇕</span>
                  </div>
                </div>
              ) : result ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  
                  {/* LAYER 1: Cutout Foreground PNG */}
                  {layersVisibility.foreground && (
                    <img
                      src={result}
                      alt="Cutout foreground"
                      style={{ opacity: layersOpacity.foreground }}
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-2xl z-10 transition-opacity"
                    />
                  )}

                  {/* LAYER 0: Original Photo Reference (Slider clipped via clip-path) */}
                  {layersVisibility.original && (
                    <img
                      src={original}
                      alt="Original reference"
                      style={{
                        opacity: layersOpacity.original,
                        clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`
                      }}
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none filter brightness-90 z-20 select-none"
                    />
                  )}

                  {/* SLIDER VERTICAL HANDLE DRAG-LINE */}
                  {layersVisibility.original && (
                    <>
                      <div
                        className="absolute inset-y-0 w-1 bg-white cursor-ew-resize z-30 flex items-center justify-center shadow-lg"
                        style={{ left: `${sliderPos}%` }}
                        onMouseDown={() => setIsSliding(true)}
                        onTouchMove={handleTouchMove}
                      >
                        <div className="size-6 bg-white hover:bg-primary hover:text-primary-foreground rounded-full shadow-2xl flex items-center justify-center border-2 border-primary/50 text-foreground select-none pointer-events-auto transition duration-200">
                          <span className="text-[10px] font-black font-mono select-none">↔</span>
                        </div>
                      </div>

                      {/* Text badges for reference orientation */}
                      <span className="absolute top-3 left-3 text-[10px] font-bold bg-black/60 text-white border border-white/10 px-2 py-0.5 rounded backdrop-blur-md z-30 pointer-events-none">
                        Before
                      </span>
                      <span className="absolute top-3 right-3 text-[10px] font-bold bg-black/60 text-white border border-white/10 px-2 py-0.5 rounded backdrop-blur-md z-30 pointer-events-none">
                        After
                      </span>
                    </>
                  )}

                </div>
              ) : (
                /* Unprocessed loaded original image */
                <img
                  src={original}
                  alt="Original load"
                  className="max-w-full max-h-full object-contain pointer-events-none filter brightness-95"
                />
              )}
            </div>
          </div>

          {/* Quick Buttons Panel */}
          <div className="flex gap-4 items-center mt-5 shrink-0">
            {!result ? (
              <Button
                onClick={handleProcess}
                disabled={isProcessing || preloading}
                className="font-semibold text-xs px-6 gap-2 animate-pulse"
              >
                {preloading ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    <span>
                      {preloadProgress !== null && preloadProgress > 0 && preloadProgress < 100
                        ? `Downloading AI (${preloadProgress}%)`
                        : "Initializing Engine..."}
                    </span>
                  </>
                ) : isProcessing ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    <span>Scanning Layers...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5 text-primary-foreground" />
                    <span>Remove Background</span>
                  </>
                )}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleCompositeDownload}
                  className="font-semibold text-xs px-6 gap-2"
                >
                  <Download className="size-3.5" />
                  <span>Download Composite</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleProcess}
                  disabled={isProcessing || preloading}
                  className="font-semibold text-xs px-4 gap-2 border border-zinc-800 bg-zinc-950/20 hover:bg-zinc-800 text-zinc-300 transition duration-150"
                  title="Re-run background removal with the currently selected model"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin text-primary" />
                      <span>Re-processing...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="size-3.5 text-zinc-400" />
                      <span>Re-run AI</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              size="default"
              onClick={() => {
                setImage(null);
              }}
              className="text-xs font-semibold"
            >
              Clear Canvas
            </Button>
          </div>
        </div>
      )}

      {/* Dynamic Background Glowing Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[320px] h-[320px] bg-primary/10 rounded-full blur-[100px] pointer-events-none transition duration-500 animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[320px] h-[320px] bg-primary/10 rounded-full blur-[100px] pointer-events-none transition duration-500" />
    </div>
  );
}
