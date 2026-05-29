import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Check, Trash2, Cpu, FileImage, Sliders, Image, Sparkles, Undo, Redo } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ContextPanel({
  config,
  setConfig,
  gpuSupported,
  gpuBrand,
  gpuActive,
  activeBgType,
  setActiveBgType,
  bgVal,
  setBgVal,
  historyList,
  setHistoryList,
  onReloadHistoryItem,
  onRunTest,
  gpuF16Supported = true,
  inspectorOpen,
  setInspectorOpen,
  activeRetouchTool,
  setActiveRetouchTool,
  brushRadius,
  setBrushRadius,
  brushMode,
  setBrushMode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  telemetry
}) {
  const [cachedModels, setCachedModels] = useState({
    isnet: false,
    isnet_fp16: false,
    isnet_quint8: false
  });

  useEffect(() => {
    const checkCache = async () => {
      if (typeof window === 'undefined' || !window.caches) return;
      try {
        const cacheNames = await window.caches.keys();
        const imglyCacheName = cacheNames.find(name => name.includes("background-removal") || name.includes("imgly"));
        
        let hasIsnet = false;
        let hasIsnetFp16 = false;
        let hasIsnetQuint8 = false;

        if (imglyCacheName) {
          const cache = await window.caches.open(imglyCacheName);
          const requests = await cache.keys();
          const urls = requests.map(req => req.url);
          
          hasIsnet = urls.some(url => url.includes("isnet.onnx"));
          hasIsnetFp16 = urls.some(url => url.includes("isnet_fp16.onnx"));
          hasIsnetQuint8 = urls.some(url => url.includes("isnet_quint8.onnx"));
        }
        
        setCachedModels({
          isnet: hasIsnet,
          isnet_fp16: hasIsnetFp16,
          isnet_quint8: hasIsnetQuint8
        });
      } catch (err) {
        console.warn("Failed to check cache:", err);
      }
    };

    checkCache();
    const interval = setInterval(checkCache, 3500);
    return () => clearInterval(interval);
  }, []);




  const isMac = typeof window !== 'undefined' && /Mac|iPad|iPhone|iPod/.test(window.navigator.userAgent || window.navigator.platform || "");

  const solidColors = [
    "#ffffff", "#000000", "#3f3f46", "#ef4444", "#3b82f6", 
    "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#76b900"
  ];

  const gradients = [
    { name: "Sunset Neon", css: "linear-gradient(135deg, #f97316 0%, #ec4899 100%)" },
    { name: "Forest Aurora", css: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)" },
    { name: "Deep Space", css: "linear-gradient(135deg, #1e1b4b 0%, #311042 100%)" },
    { name: "Cyberpunk", css: "linear-gradient(135deg, #d946ef 0%, #06b6d4 100%)" },
    { name: "Vivid Coral", css: "linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)" },
    { name: "Apex Gold", css: "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)" },
  ];

  // Professional royalty-free high-res studio backdrops
  const backgroundPresets = [
    { name: "Modern Studio", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60" },
    { name: "Cozy Office", url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&auto=format&fit=crop&q=60" },
    { name: "Neon Cyber", url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=500&auto=format&fit=crop&q=60" },
    { name: "Nature Bokeh", url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=500&auto=format&fit=crop&q=60" },
    { name: "Luxury Interior", url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=500&auto=format&fit=crop&q=60" }
  ];

  const clearHistory = () => {
    localStorage.removeItem("bg_history");
    setHistoryList([]);
  };

  return (
    <>
      {/* Mobile Inspector Drawer Overlay */}
      {inspectorOpen && (
        <div
          onClick={() => setInspectorOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      {/* Inspector Container */}
      <div
        className={`
          fixed lg:relative top-14 lg:top-0 bottom-0 left-0 z-40 w-[280px] border-r border-border bg-card flex flex-col p-4 shrink-0 overflow-y-auto transition-transform duration-300 lg:translate-x-0 lg:bg-card/15 lg:backdrop-blur-md space-y-5
          ${inspectorOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Title */}
        <div className="flex items-center gap-1.5 border-b border-border pb-3 shrink-0">
          <Sliders className="size-4 text-primary" />
          <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase">
            AI Control Panel
          </h3>
        </div>

        {/* Section 1: AI Settings */}
        <div className="space-y-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            <h4 className="text-[10px] font-black tracking-wider uppercase text-zinc-400">AI Neural Engine</h4>
          </div>

          <div className="space-y-3 bg-zinc-950/20 border border-zinc-800/40 p-3 rounded-lg">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">AI Neural Model</label>
              <Select value={config.model} onValueChange={(val) => setConfig({ ...config, model: val })}>
                <SelectTrigger className="w-full bg-card border border-border text-xs rounded-lg h-9">
                  <SelectValue placeholder="Select Neural Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="isnet_quint8">isnet_quint8 (Ultra-Lightweight: ~17.6MB)</SelectItem>
                  <SelectItem value="isnet_fp16" disabled={!gpuF16Supported}>
                    isnet_fp16 (Compressed: ~30MB) {!gpuF16Supported && "(FP16 Unsupported)"}
                  </SelectItem>
                  <SelectItem value="isnet">isnet (Standard Size: ~30MB)</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Dynamic Cache Status Badges */}
              <div className="flex items-center justify-between text-[9px] bg-zinc-950/40 p-1.5 rounded border border-zinc-800/40 mt-1 select-none font-mono">
                <span className="text-muted-foreground">Cache Status:</span>
                {cachedModels[config.model] ? (
                  <span className="text-emerald-400 font-extrabold flex items-center gap-0.5">
                    <Check className="size-2.5" /> CACHED ⚡
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold flex items-center gap-0.5 animate-pulse">
                    ⬇️ DOWNLOAD NEEDED (~{config.model === "isnet_quint8" ? "17" : "30"}MB)
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Output Type</label>
              <Select
                value={config.output.type}
                onValueChange={(val) =>
                  setConfig({
                    ...config,
                    output: { ...config.output, type: val }
                  })
                }
              >
                <SelectTrigger className="w-full bg-card border border-border text-xs rounded-lg h-9">
                  <SelectValue placeholder="Select Output Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="foreground">Foreground Only (Cutout)</SelectItem>
                  <SelectItem value="background">Background Only (Extracted)</SelectItem>
                  <SelectItem value="mask">Alpha Matte Mask</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Processing Core</label>
              <div className="flex gap-2">
                <Button
                  variant={config.device === "gpu" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs h-8 font-semibold"
                  disabled={!gpuSupported}
                  onClick={() => setConfig({ ...config, device: "gpu" })}
                >
                  GPU
                </Button>
                <Button
                  variant={config.device === "cpu" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs h-8 font-semibold"
                  onClick={() => setConfig({ ...config, device: "cpu" })}
                >
                  CPU
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Manual Retouch & Erase */}
        <div className="space-y-3 shrink-0 border-t border-border pt-3.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            <h4 className="text-[10px] font-black tracking-wider uppercase text-zinc-400">Manual Retouch</h4>
          </div>

          <div className="space-y-3 bg-zinc-950/20 border border-zinc-800/40 p-3 rounded-lg">
            <div className="flex gap-2">
              <Button
                variant={activeRetouchTool ? "default" : "outline"}
                size="sm"
                className="w-full text-xs font-semibold h-8 gap-1.5"
                onClick={() => setActiveRetouchTool(activeRetouchTool ? null : "brush")}
              >
                <Sparkles className="size-3.5 text-primary-foreground" />
                <span>{activeRetouchTool ? "Deactivate Brush" : "Activate Magic Brush"}</span>
              </Button>
            </div>

            {activeRetouchTool && (
              <>
                <div className="flex gap-2 mb-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-[11px] h-8 gap-1 font-semibold border-zinc-800 bg-zinc-950/20 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    disabled={!canUndo}
                    onClick={onUndo}
                    title={isMac ? "Undo (⌘Z)" : "Undo (Ctrl+Z)"}
                  >
                    <Undo className="size-3.5" />
                    <span>Undo</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-[11px] h-8 gap-1 font-semibold border-zinc-800 bg-zinc-950/20 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    disabled={!canRedo}
                    onClick={onRedo}
                    title={isMac ? "Redo (⌘⇧Z)" : "Redo (Ctrl+Y)"}
                  >
                    <Redo className="size-3.5" />
                    <span>Redo</span>
                  </Button>
                </div>
                <div className="text-[9px] text-muted-foreground/60 text-center font-medium leading-none mb-1.5">
                  Shortcuts: {isMac ? "⌘Z" : "Ctrl+Z"} (Undo) • {isMac ? "⌘⇧Z" : "Ctrl+Y"} (Redo)
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Brush Mode</label>
                  <div className="flex gap-1 bg-zinc-950/40 p-0.5 rounded border border-zinc-800">
                    <button
                      onClick={() => setBrushMode("erase")}
                      className={`flex-1 py-1 text-[8px] font-bold rounded capitalize transition duration-150 ${brushMode === "erase" ? "bg-zinc-800 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      title="Smart Erase (Make foreground pixels transparent)"
                    >
                      Erase
                    </button>
                    <button
                      onClick={() => setBrushMode("recover")}
                      className={`flex-1 py-1 text-[8px] font-bold rounded capitalize transition duration-150 ${brushMode === "recover" ? "bg-zinc-800 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      title="Recover Background (Restore original pixels by painting)"
                    >
                      Recover
                    </button>
                    <button
                      onClick={() => setBrushMode("inpaint")}
                      className={`flex-1 py-1 text-[8px] font-bold rounded capitalize transition duration-150 ${brushMode === "inpaint" ? "bg-zinc-800 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      title="Smart Inpaint (AI fill/object removal on source image)"
                    >
                      Inpaint
                    </button>
                  </div>
                </div>

                <div className="text-[9px] text-muted-foreground bg-zinc-950/20 p-1.5 rounded border border-zinc-800/40 font-medium leading-normal select-none">
                  {brushMode === "erase" && "✏️ Erase: Paints transparent pixels to clean up cutout edges."}
                  {brushMode === "recover" && "🔄 Recover: Paints original background pixels back into the cutout."}
                  {brushMode === "inpaint" && "🪄 Inpaint: Fills the selected area using surrounding pixel structures."}
                </div>


                <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                    <span>Brush Size</span>
                    <span className="text-primary">{brushRadius}px</span>
                  </div>
                  <Slider
                    value={[brushRadius]}
                    min={5}
                    max={120}
                    step={1}
                    onValueChange={(val) => setBrushRadius(val[0])}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Section 2: Background Compositor */}
        <div className="space-y-3 shrink-0 border-t border-border pt-3.5">
          <div className="flex items-center gap-1.5">
            <Image className="size-3.5 text-primary" />
            <h4 className="text-[10px] font-black tracking-wider uppercase text-zinc-400">Backdrop Compositor</h4>
          </div>

          <div className="space-y-3">
            {/* BG Type Select */}
            <div className="flex gap-0.5 bg-zinc-950/40 p-1 rounded-lg border border-zinc-800">
              {["transparent", "color", "gradient", "image"].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setActiveBgType(type);
                    if (type === "transparent") setBgVal("transparent");
                    else if (type === "color") setBgVal(solidColors[0]);
                    else if (type === "gradient") setBgVal(gradients[0].css);
                    else if (type === "image") setBgVal(backgroundPresets[0].url);
                  }}
                  className={`
                    flex-1 py-1 text-[9px] font-bold rounded capitalize transition duration-150
                    ${activeBgType === type ? "bg-zinc-800 text-foreground shadow" : "text-muted-foreground hover:text-foreground"}
                  `}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Solid Color Palette */}
            {activeBgType === "color" && (
              <div className="space-y-2">
                <div className="grid grid-cols-5 gap-2 bg-zinc-950/20 border border-zinc-800/40 p-2 rounded-lg">
                  {solidColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setBgVal(color)}
                      style={{ backgroundColor: color }}
                      className="size-7 rounded border border-white/10 shadow relative flex items-center justify-center hover:scale-105 transition"
                    >
                      {bgVal === color && <Check className={`size-3.5 ${color === "#ffffff" ? "text-black" : "text-white"}`} />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Gradient Palette */}
            {activeBgType === "gradient" && (
              <div className="space-y-2">
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1 bg-zinc-950/20 border border-zinc-800/40 p-2 rounded-lg">
                  {gradients.map((grad, idx) => (
                    <button
                      key={idx}
                      onClick={() => setBgVal(grad.css)}
                      style={{ background: grad.css }}
                      className="w-full h-7 rounded border border-white/10 flex items-center justify-between px-2 text-[10px] font-bold text-white shadow hover:opacity-90 transition"
                    >
                      <span>{grad.name}</span>
                      {bgVal === grad.css && <Check className="size-3 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Image Presets */}
            {activeBgType === "image" && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 bg-zinc-950/20 border border-zinc-800/40 p-2 rounded-lg">
                  {backgroundPresets.map((bg, idx) => (
                    <button
                      key={idx}
                      onClick={() => setBgVal(bg.url)}
                      className={`
                        relative aspect-video rounded overflow-hidden border shadow hover:opacity-90 transition
                        ${bgVal === bg.url ? "border-primary ring-1 ring-primary" : "border-white/10"}
                      `}
                    >
                      <img src={bg.url} alt={bg.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-end p-1">
                        <span className="text-[8px] font-medium text-white truncate w-full text-left">
                          {bg.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: GPU Hardware Info */}
        <div className="space-y-3 border-t border-border pt-3.5 shrink-0">
          <div className="flex items-center gap-1.5">
            <Cpu className="size-3.5 text-primary" />
            <h4 className="text-[10px] font-black tracking-wider uppercase text-zinc-400">Accelerator Info</h4>
          </div>
          <div className="bg-zinc-950/20 border border-zinc-800/40 p-3 rounded-lg space-y-2.5">
            <div className="text-[10px] space-y-1 text-muted-foreground">
              <p>• WebGPU Support: <span className="font-bold text-foreground">{gpuSupported ? "Yes" : "No"}</span></p>
              <p>• GPU Acceleration: <span className="font-bold text-foreground">{gpuActive ? "Enabled" : "Disabled"}</span></p>
              <p>• Chipset Profile: <span className="font-bold text-foreground">{gpuBrand.toUpperCase()}</span></p>
            </div>
            <Button
              className="w-full text-[10px] h-7 font-semibold"
              variant="outline"
              size="sm"
              onClick={onRunTest}
            >
              Run Benchmark Test
            </Button>
          </div>
        </div>

        {/* Section 4: History log */}
        <div className="flex-1 flex flex-col min-h-[160px] border-t border-border pt-3.5">
          <div className="flex justify-between items-center mb-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <FileImage className="size-3.5 text-primary" />
              <h4 className="text-[10px] font-black tracking-wider uppercase text-zinc-400">Recent Saved exports</h4>
            </div>
            {historyList.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-[9px] text-red-400 hover:text-red-500 flex items-center gap-0.5"
              >
                <Trash2 className="size-3" />
                Clear
              </button>
            )}
          </div>

          {historyList.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 border border-dashed border-zinc-800 rounded-lg bg-zinc-950/10">
              <FileImage className="size-6 text-muted-foreground/30 mb-1" />
              <p className="text-[9px] text-center text-muted-foreground">
                No recent removal logs in library.
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto space-y-1.5 max-h-36 pr-1 flex-1">
              {historyList.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onReloadHistoryItem(item)}
                  className="group relative border border-zinc-900 bg-zinc-950/20 hover:bg-zinc-950/40 rounded-lg p-1.5 hover:border-primary/50 cursor-pointer transition flex gap-2 items-center"
                >
                  <div className="size-9 rounded bg-muted overflow-hidden shrink-0 border border-zinc-800/40 relative">
                    <div className="absolute inset-0 ps-grid opacity-30" />
                    <img src={item.result} className="w-full h-full object-contain relative z-10" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-bold text-foreground truncate">
                      {item.name || `Session_image_${idx + 1}`}
                    </p>
                    <p className="text-[8px] text-muted-foreground">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
