import { Eye, EyeOff, Layers, Lock, Plus, Trash2, ArrowUpDown } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LayerDock({
  original,
  result,
  layersVisibility,
  setLayersVisibility,
  layersOpacity,
  setLayersOpacity,
  activeBgType,
  bgVal,
  layersOpen,
  setLayersOpen
}) {
  const toggleVisibility = (layerId) => {
    setLayersVisibility((prev) => ({
      ...prev,
      [layerId]: !prev[layerId],
    }));
  };

  const handleOpacityChange = (layerId, value) => {
    setLayersOpacity((prev) => ({
      ...prev,
      [layerId]: value[0],
    }));
  };

  // Get background style for the thumbnail rendering
  const getBgStyle = () => {
    if (activeBgType === "transparent" || !bgVal) return { background: "transparent" };
    if (activeBgType === "color") return { backgroundColor: bgVal };
    if (activeBgType === "gradient") return { background: bgVal };
    if (activeBgType === "image") return { backgroundImage: `url(${bgVal})`, backgroundSize: "cover" };
    return { background: "transparent" };
  };

  return (
    <>
      {/* Mobile Layers Drawer Overlay */}
      {layersOpen && (
        <div
          onClick={() => setLayersOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      {/* Layers Container */}
      <div
        className={`
          fixed lg:relative top-14 lg:top-0 bottom-0 right-0 z-40 w-[260px] border-l border-border bg-card flex flex-col p-4 shrink-0 overflow-y-auto transition-transform duration-300 lg:translate-x-0 lg:bg-card/15 lg:backdrop-blur-md
          ${layersOpen ? "translate-x-0 shadow-2xl" : "translate-x-full lg:translate-x-0"}
        `}
      >
      {/* Title */}
      <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
        <div className="flex items-center gap-1.5">
          <Layers className="size-4 text-primary" />
          <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase">
            Layers Panel
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition">
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Blend Mode Selection */}
      <div className="mb-4">
        <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Blend Mode</label>
        <Select defaultValue="normal">
          <SelectTrigger className="w-full bg-card border border-border text-xs rounded h-8">
            <SelectValue placeholder="Blend Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="multiply" disabled>Multiply (Pro)</SelectItem>
            <SelectItem value="screen" disabled>Screen (Pro)</SelectItem>
            <SelectItem value="overlay" disabled>Overlay (Pro)</SelectItem>
            <SelectItem value="soft-light" disabled>Soft Light (Pro)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* LAYERS LIST */}
      <div className="space-y-2 flex-1 overflow-y-auto">
        
        {/* Layer 1: AI Foreground Cutout */}
        <div className={`
          border bg-secondary/20 rounded-lg p-2.5 flex flex-col gap-2 transition duration-200 hover:border-primary/40
          ${layersVisibility.foreground ? "border-primary/20 shadow-md shadow-primary/5" : "border-red-500/10 opacity-60"}
        `}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleVisibility("foreground")}
                className="text-muted-foreground hover:text-foreground transition outline-none"
              >
                {layersVisibility.foreground ? <Eye className="size-4" /> : <EyeOff className="size-4 text-red-500" />}
              </button>

              {/* Thumbnail */}
              <div className="size-9 rounded bg-muted/50 border border-border/40 overflow-hidden shrink-0 relative flex items-center justify-center">
                <div className="absolute inset-0 ps-grid opacity-25" />
                {result ? (
                  <img src={result} className="w-full h-full object-contain relative z-10" />
                ) : (
                  <div className="text-[9px] text-muted-foreground relative z-10 font-mono">PNG</div>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">Layer 1: AI Foreground</p>
                <p className="text-[9px] text-muted-foreground">Cutout Mask • {Math.round(layersOpacity.foreground * 100)}%</p>
              </div>
            </div>

            <Lock className="size-3.5 text-muted-foreground/30 shrink-0" />
          </div>

          {layersVisibility.foreground && (
            <div className="pl-6 flex items-center gap-2">
              <span className="text-[9px] text-muted-foreground">Opacity</span>
              <Slider
                value={[layersOpacity.foreground]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={(val) => handleOpacityChange("foreground", val)}
                className="py-1"
              />
            </div>
          )}
        </div>

        {/* Layer 2: Custom Background Fill */}
        <div className={`
          border bg-secondary/20 rounded-lg p-2.5 flex flex-col gap-2 transition duration-200 hover:border-primary/40
          ${layersVisibility.background ? "border-primary/20 shadow-md shadow-primary/5" : "border-red-500/10 opacity-60"}
        `}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleVisibility("background")}
                className="text-muted-foreground hover:text-foreground transition outline-none"
              >
                {layersVisibility.background ? <Eye className="size-4" /> : <EyeOff className="size-4 text-red-500" />}
              </button>

              {/* Thumbnail */}
              <div className="size-9 rounded bg-muted/50 border border-border/40 overflow-hidden shrink-0 relative">
                <div className="absolute inset-0 ps-grid opacity-25" />
                <div style={getBgStyle()} className="w-full h-full relative z-10 border border-black/10" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">Layer 2: Custom Backdrop</p>
                <p className="text-[9px] text-muted-foreground uppercase">{activeBgType} • {Math.round(layersOpacity.background * 100)}%</p>
              </div>
            </div>

            <ArrowUpDown className="size-3.5 text-muted-foreground/30 shrink-0" />
          </div>

          {layersVisibility.background && (
            <div className="pl-6 flex items-center gap-2">
              <span className="text-[9px] text-muted-foreground">Opacity</span>
              <Slider
                value={[layersOpacity.background]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={(val) => handleOpacityChange("background", val)}
                className="py-1"
              />
            </div>
          )}
        </div>

        {/* Layer 0: Original Photo Reference */}
        <div className={`
          border bg-secondary/20 rounded-lg p-2.5 flex flex-col gap-2 transition duration-200 hover:border-primary/40
          ${layersVisibility.original ? "border-primary/20 shadow-md shadow-primary/5" : "border-red-500/10 opacity-60"}
        `}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleVisibility("original")}
                className="text-muted-foreground hover:text-foreground transition outline-none"
              >
                {layersVisibility.original ? <Eye className="size-4" /> : <EyeOff className="size-4 text-red-500" />}
              </button>

              {/* Thumbnail */}
              <div className="size-9 rounded bg-muted/50 border border-border/40 overflow-hidden shrink-0 relative flex items-center justify-center">
                <div className="absolute inset-0 ps-grid opacity-25" />
                {original ? (
                  <img src={original} className="w-full h-full object-contain relative z-10" />
                ) : (
                  <div className="text-[9px] text-muted-foreground relative z-10 font-mono">JPG</div>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">Layer 0: Original Reference</p>
                <p className="text-[9px] text-muted-foreground">Reference Image • {Math.round(layersOpacity.original * 100)}%</p>
              </div>
            </div>

            <Lock className="size-3.5 text-muted-foreground/30 shrink-0" />
          </div>

          {layersVisibility.original && (
            <div className="pl-6 flex items-center gap-2">
              <span className="text-[9px] text-muted-foreground">Opacity</span>
              <Slider
                value={[layersOpacity.original]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={(val) => handleOpacityChange("original", val)}
                className="py-1"
              />
            </div>
          )}
        </div>

      </div>

      {/* FOOTER */}
      <div className="mt-4 pt-3 border-t border-border flex justify-between text-[10px] text-muted-foreground font-semibold">
        <span>3 Layers</span>
        <span>Composite Active</span>
      </div>
    </div>
    </>
  );
}
