import { useState, useEffect } from "react";
import { Sun, Moon, Sparkles, Cpu, Menu, X, Sliders, Layers } from "lucide-react";

export default function Header({
  gpuBrand,
  deviceMode,
  inspectorOpen,
  setInspectorOpen,
  layersOpen,
  setLayersOpen
}) {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

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

        <div className="hidden sm:block">
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
