import { useState, useEffect } from "react";
import { Sun, Moon, Sparkles, Cpu, Menu, X, Sliders, Layers } from "lucide-react";

export default function Header({
  gpuBrand,
  gpuName = "Generic GPU",
  cpuName = "Intel Core Processor",
  deviceMode,
  inspectorOpen,
  setInspectorOpen,
  layersOpen,
  setLayersOpen,
  telemetry
}) {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [hoveredStat, setHoveredStat] = useState(null);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const getHardwareBadge = () => {
    const brandName =
      gpuBrand === "nvidia"
        ? "NVIDIA"
        : gpuBrand === "amd"
        ? "AMD Radeon"
        : gpuBrand === "intel"
        ? "Intel HD Graphics"
        : "Generic GPU";

    if (deviceMode === "gpu") {
      return (
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
          <Cpu className="size-4 animate-pulse" />
          <div className="flex flex-col text-left">
            <span className="text-[9px] text-muted-foreground/80 font-bold uppercase tracking-widest leading-none mb-0.5">Removal Method</span>
            <span className="leading-tight font-black">{brandName} (WebGPU Accelerated)</span>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-500">
          <Cpu className="size-4" />
          <div className="flex flex-col text-left">
            <span className="text-[9px] text-muted-foreground/80 font-bold uppercase tracking-widest leading-none mb-0.5">Removal Method</span>
            <span className="leading-tight font-black">WASM CPU Fallback</span>
          </div>
        </div>
      );
    }
  };

  return (
    <header className="flex justify-between items-center px-6 h-14 bg-card/60 backdrop-blur-md border-b border-border z-10 shrink-0">
      {/* LEFT: Logo and workspace breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-tr from-primary to-primary/60 text-primary-foreground font-black shadow-lg shadow-primary/25">
            <Sparkles className="size-4 text-black" />
          </div>
          <span className="font-extrabold text-base tracking-wider bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
            Cut That Out
          </span>
        </div>
        <div className="hidden md:block w-px h-5 bg-border" />
        <span className="hidden md:block text-xs font-bold tracking-wider text-muted-foreground uppercase">
          WORKSPACE • AI LAYER ISOLATION
        </span>
      </div>

      {/* RIGHT: GPU Status and Theme Toggle */}
      <div className="flex items-center gap-2.5">
        {/* Mobile Panels Toggles */}
        <button
          onClick={() => {
            setInspectorOpen(!inspectorOpen);
            setLayersOpen(false);
          }}
          className="lg:hidden flex items-center justify-center size-8 rounded-lg border border-border hover:bg-secondary text-foreground transition duration-200"
          title="Toggle Inspector"
        >
          <Sliders className={`size-4 ${inspectorOpen ? "text-primary" : ""}`} />
        </button>

        <button
          onClick={() => {
            setLayersOpen(!layersOpen);
            setInspectorOpen(false);
          }}
          className="lg:hidden flex items-center justify-center size-8 rounded-lg border border-border hover:bg-secondary text-foreground transition duration-200"
          title="Toggle Layers"
        >
          <Layers className={`size-4 ${layersOpen ? "text-primary" : ""}`} />
        </button>

        {/* Unified Hardware Badge and Telemetry HUD */}
        <div className="hidden sm:flex items-center gap-2.5">
          {telemetry && (
            <div className="flex items-center gap-4 px-3.5 py-1.5 rounded-lg bg-zinc-950/40 border border-zinc-800/40 text-[10px] font-mono text-zinc-400 select-none shadow-sm">
              {/* GPU Core */}
              <div 
                className="relative flex items-center gap-1.5 border-r border-zinc-800/40 pr-3.5 cursor-help"
                onMouseEnter={() => setHoveredStat("gpu")}
                onMouseLeave={() => setHoveredStat(null)}
              >
                <span className="font-bold text-[8px] text-primary">GPU</span>
                <span className="font-semibold text-foreground">{telemetry.gpuUsage}%</span>
                <span className="text-zinc-500">|</span>
                <span className={telemetry.gpuTemp > 60 ? "text-amber-400 font-bold" : "text-zinc-300 font-semibold"}>
                  {telemetry.gpuTemp}°C
                </span>

                {hoveredStat === "gpu" && (
                  <div className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 z-50 w-52 p-2.5 rounded-md border border-border bg-popover text-popover-foreground shadow-md text-left pointer-events-none select-none">
                    <div className="text-[10px] font-bold text-foreground mb-1.5 truncate border-b border-border pb-1">
                      {gpuName}
                    </div>
                    <div className="space-y-1 text-[9px]">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Usage Load:</span>
                        <span className="font-bold text-foreground font-mono">{telemetry.gpuUsage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Temperature:</span>
                        <span className="font-bold text-foreground font-mono">{telemetry.gpuTemp}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Engine:</span>
                        <span className="font-bold text-primary">{deviceMode === "gpu" ? "WebGPU Active" : "Idle Fallback"}</span>
                      </div>
                    </div>
                    <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-popover border-l border-t border-border" />
                  </div>
                )}
              </div>

              {/* CPU Core */}
              <div 
                className="relative flex items-center gap-1.5 border-r border-zinc-800/40 pr-3.5 cursor-help"
                onMouseEnter={() => setHoveredStat("cpu")}
                onMouseLeave={() => setHoveredStat(null)}
              >
                <span className="font-bold text-[8px] text-primary">CPU</span>
                <span className="font-semibold text-foreground">{telemetry.cpuUsage}%</span>
                <span className="text-zinc-500">|</span>
                <span className={telemetry.cpuTemp > 65 ? "text-amber-400 font-bold" : "text-zinc-300 font-semibold"}>
                  {telemetry.cpuTemp}°C
                </span>

                {hoveredStat === "cpu" && (
                  <div className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 z-50 w-52 p-2.5 rounded-md border border-border bg-popover text-popover-foreground shadow-md text-left pointer-events-none select-none">
                    <div className="text-[10px] font-bold text-foreground mb-1.5 truncate border-b border-border pb-1">
                      {cpuName}
                    </div>
                    <div className="space-y-1 text-[9px]">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Core Usage:</span>
                        <span className="font-bold text-foreground font-mono">{telemetry.cpuUsage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Temperature:</span>
                        <span className="font-bold text-foreground font-mono">{telemetry.cpuTemp}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Logical Cores:</span>
                        <span className="font-bold text-foreground font-mono">{(typeof navigator !== "undefined" && navigator.hardwareConcurrency) || 8} Threads</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Execution:</span>
                        <span className="font-bold text-amber-500">WASM Multi-thread</span>
                      </div>
                    </div>
                    <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-popover border-l border-t border-border" />
                  </div>
                )}
              </div>

              {/* RAM */}
              <div 
                className="relative flex items-center gap-1.5 border-r border-zinc-800/40 pr-3.5 cursor-help"
                onMouseEnter={() => setHoveredStat("ram")}
                onMouseLeave={() => setHoveredStat(null)}
              >
                <span className="font-bold text-[8px] text-primary">RAM</span>
                <span className="font-semibold text-foreground">{telemetry.ramUsed} / {telemetry.ramTotal} GB</span>

                {hoveredStat === "ram" && (
                  <div className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 z-50 w-52 p-2.5 rounded-md border border-border bg-popover text-popover-foreground shadow-md text-left pointer-events-none select-none">
                    <div className="text-[10px] font-bold text-foreground mb-1.5 truncate border-b border-border pb-1">
                      System Memory (RAM)
                    </div>
                    <div className="space-y-1 text-[9px]">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Active Used:</span>
                        <span className="font-bold text-foreground font-mono">{telemetry.ramUsed} GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Capacity:</span>
                        <span className="font-bold text-foreground font-mono">{telemetry.ramTotal} GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Memory Status:</span>
                        <span className="font-bold text-emerald-400">Stable</span>
                      </div>
                    </div>
                    <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-popover border-l border-t border-border" />
                  </div>
                )}
              </div>

              {/* Net Traffic */}
              <div 
                className="relative flex items-center gap-1.5 cursor-help"
                onMouseEnter={() => setHoveredStat("net")}
                onMouseLeave={() => setHoveredStat(null)}
              >
                <span className="font-bold text-[8px] text-primary">NET</span>
                <span className="font-semibold text-foreground truncate max-w-[55px]">
                  {telemetry.networkSpeed}
                </span>

                {hoveredStat === "net" && (
                  <div className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 z-50 w-52 p-2.5 rounded-md border border-border bg-popover text-popover-foreground shadow-md text-left pointer-events-none select-none">
                    <div className="text-[10px] font-bold text-foreground mb-1.5 truncate border-b border-border pb-1">
                      Network Diagnostics
                    </div>
                    <div className="space-y-1 text-[9px]">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Network Speed:</span>
                        <span className="font-bold text-foreground font-mono">{telemetry.networkSpeed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Latency Profile:</span>
                        <span className="font-bold text-foreground font-mono">Synchronized</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="font-bold text-emerald-400">Online</span>
                      </div>
                    </div>
                    <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-popover border-l border-t border-border" />
                  </div>
                )}
              </div>
            </div>
          )}
          {getHardwareBadge()}
        </div>


        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center justify-center size-8 rounded-lg border border-border hover:bg-secondary text-foreground/80 hover:text-foreground transition duration-200"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
      </div>
    </header>
  );
}
