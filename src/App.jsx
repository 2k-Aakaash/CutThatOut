import { useState, useEffect } from "react";
import { preload } from "@imgly/background-removal";
import { processImage } from "./lib/bgRemove";

import Header from "./components/Header";
import ContextPanel from "./components/ContextPanel";
import Workspace from "./components/Workspace";
import LayerDock from "./components/LayerDock";
import DeviceTester from "./components/DeviceTester";

const transcodeToPng = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width || 800;
        canvas.height = img.naturalHeight || img.height || 600;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(objectUrl);
          if (blob) {
            const newName = file.name.replace(/\.[^/.]+$/, "") + ".png";
            const pngFile = new File([blob], newName, { type: "image/png" });
            resolve(pngFile);
          } else {
            reject(new Error("Canvas export failed"));
          }
        }, "image/png");
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to decode this image format in browser."));
    };
    img.src = objectUrl;
  });
};

const processUploadedFile = async (file) => {
  const fileType = (file.type || "").toLowerCase();
  const fileName = (file.name || "").toLowerCase();

  // 1. Skip transcoding if it's already a standard format natively supported by background removal
  if (
    (fileType === "image/png" || fileType === "image/jpeg" || fileType === "image/jpg") &&
    !fileName.endsWith(".heic") &&
    !fileName.endsWith(".heif") &&
    !fileName.endsWith(".avif")
  ) {
    return file;
  }

  // 2. Handle Apple HEIC/HEIF images via dynamic heic2any loading
  if (
    fileType === "image/heic" ||
    fileType === "image/heif" ||
    fileName.endsWith(".heic") ||
    fileName.endsWith(".heif")
  ) {
    if (!window.heic2any) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js";
        script.onload = resolve;
        script.onerror = () => reject(new Error("Failed to load HEIC decoder library. Check internet connectivity."));
        document.head.appendChild(script);
      });
    }

    if (window.heic2any) {
      const convertedBlob = await window.heic2any({
        blob: file,
        toType: "image/png",
      });
      const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      const newName = file.name.replace(/\.[^/.]+$/, "") + ".png";
      return new File([blob], newName, { type: "image/png" });
    } else {
      throw new Error("HEIC converter library could not be loaded.");
    }
  }

  // 3. For all other formats (AVIF, WebP, SVG, BMP, ICO), transcode to PNG
  return await transcodeToPng(file);
};

let currentPreloadChain = Promise.resolve();
const preloadedKeys = new Set();

const safeSequentialPreload = (preloadConfig) => {
  const key = `${preloadConfig.device}-${preloadConfig.model}`;
  if (preloadedKeys.has(key)) {
    return Promise.resolve();
  }

  currentPreloadChain = currentPreloadChain
    .then(async () => {
      if (preloadedKeys.has(key)) return;
      console.log(`[Preloader] Preloading config: ${key}`);
      await preload(preloadConfig);
      preloadedKeys.add(key);
      console.log(`[Preloader] Preload complete: ${key}`);
    })
    .catch((err) => {
      console.warn(`[Preloader] Preload failed for ${key}:`, err);
      throw err;
    });

  return currentPreloadChain;
};

export default function App() {
  // Navigation & Tools
  const [activeRetouchTool, setActiveRetouchTool] = useState(null);
  const [brushRadius, setBrushRadius] = useState(25);
  const [brushMode, setBrushMode] = useState("erase");

  // Undo/Redo Performance Stack
  const [historyState, setHistoryState] = useState({
    stack: [],
    index: -1
  });

  const pushToHistoryStack = (newOriginal, newResult) => {
    setHistoryState((prev) => {
      const nextIndex = prev.index + 1;
      const cleanStack = prev.stack.slice(0, nextIndex);
      return {
        stack: [...cleanStack, { original: newOriginal, result: newResult }],
        index: nextIndex
      };
    });
  };

  const handleUndo = () => {
    if (historyState.index > 0) {
      const nextIndex = historyState.index - 1;
      const state = historyState.stack[nextIndex];
      setHistoryState((prev) => ({ ...prev, index: nextIndex }));
      setOriginal(state.original);
      setResult(state.result);
    }
  };

  const handleRedo = () => {
    if (historyState.index < historyState.stack.length - 1) {
      const nextIndex = historyState.index + 1;
      const state = historyState.stack[nextIndex];
      setHistoryState((prev) => ({ ...prev, index: nextIndex }));
      setOriginal(state.original);
      setResult(state.result);
    }
  };

  const handleUpdateResult = (newUrl) => {
    setResult(newUrl);
    pushToHistoryStack(original, newUrl);
  };

  // Mobile responsive layout states
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);

  // Hardwares & Accelerator profile
  const [gpuBrand, setGpuBrand] = useState("generic");
  const [gpuSupported, setGpuSupported] = useState(false);
  const [gpuActive, setGpuActive] = useState(false);
  const [showTester, setShowTester] = useState(false);
  const [gpuF16Supported, setGpuF16Supported] = useState(false);

  // Image & Canvas state
  const [image, setImage] = useState(null);
  const [original, setOriginal] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preloading, setPreloading] = useState(true);

  // Layers states
  const [layersVisibility, setLayersVisibility] = useState({
    foreground: true,
    background: true,
    original: true
  });

  const [layersOpacity, setLayersOpacity] = useState({
    foreground: 1.0,
    background: 1.0,
    original: 1.0
  });

  // Background Compositor options
  const [activeBgType, setActiveBgType] = useState("transparent");
  const [bgVal, setBgVal] = useState("transparent");

  // History session tracker
  const [historyList, setHistoryList] = useState([]);

  // AI Configurations
  const [config, setConfig] = useState({
    device: "cpu",
    model: "isnet_fp16",
    output: {
      format: "image/png",
      quality: 1.0,
      type: "foreground",
    },
  });

  // 🔹 Dynamic GPU brand and capability instant check
  useEffect(() => {
    const initGpu = async () => {
      let vendor = "";
      let renderer = "";
      let supportsF16 = false;

      // 1. Check via WebGPU if supported
      if (navigator.gpu) {
        try {
          const adapter = await navigator.gpu.requestAdapter();
          if (adapter) {
            if (adapter.info) {
              vendor = (adapter.info.vendor || "").toLowerCase();
              renderer = (adapter.info.architecture || adapter.info.description || "").toLowerCase();
            }
            supportsF16 = adapter.features.has("shader-f16");
          }
        } catch (e) {
          console.warn("WebGPU info failed:", e);
        }
      }

      // 2. WebGL secondary lookup (cross-browser compatible)
      if (!vendor) {
        try {
          const canvas = document.createElement("canvas");
          const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
          if (gl) {
            const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
            if (debugInfo) {
              const unmaskedRenderer = (gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "").toLowerCase();
              renderer = unmaskedRenderer;
              if (unmaskedRenderer.includes("nvidia") || unmaskedRenderer.includes("geforce")) {
                vendor = "nvidia";
              } else if (unmaskedRenderer.includes("amd") || unmaskedRenderer.includes("radeon") || unmaskedRenderer.includes("ati")) {
                vendor = "amd";
              } else if (unmaskedRenderer.includes("intel")) {
                vendor = "intel";
              }
            }
          }
        } catch (e) {
          console.warn("WebGL lookup failed:", e);
        }
      }

      // Map to finalized class
      let detectedBrand = "generic";
      if (vendor.includes("nvidia") || renderer.includes("nvidia") || renderer.includes("geforce")) {
        detectedBrand = "nvidia";
      } else if (vendor.includes("amd") || vendor.includes("ati") || renderer.includes("amd") || renderer.includes("radeon")) {
        detectedBrand = "amd";
      } else if (vendor.includes("intel") || renderer.includes("intel")) {
        detectedBrand = "intel";
      }

      setGpuBrand(detectedBrand);
      setGpuSupported(!!navigator.gpu);
      setGpuF16Supported(supportsF16);

      // Apply dynamic CSS variables brand overrides to root
      document.body.classList.remove("theme-nvidia", "theme-amd", "theme-intel", "theme-generic");
      document.body.classList.add(`theme-${detectedBrand}`);

      // Auto-select device path
      const saved = localStorage.getItem("deviceProfile");
      if (!saved) {
        setConfig((prev) => ({
          ...prev,
          device: navigator.gpu ? "gpu" : "cpu",
          model: supportsF16 ? "isnet_fp16" : "isnet",
        }));
      } else {
        try {
          const parsed = JSON.parse(saved);
          setConfig((prev) => ({
            ...prev,
            device: parsed?.userChoice || (parsed?.gpuPreferred && navigator.gpu ? "gpu" : "cpu"),
            model: supportsF16 ? "isnet_fp16" : "isnet",
          }));
        } catch {
          setConfig((prev) => ({ ...prev, device: "cpu", model: "isnet" }));
        }
      }
    };

    initGpu();
  }, []);

  // 🔹 Safe model preloader
  useEffect(() => {
    let cancelled = false;

    const runPreload = async () => {
      setPreloading(true);
      try {
        if (config.device === "gpu" && navigator.gpu) {
          if (config.model === "isnet_fp16" && !gpuF16Supported) {
            console.warn("shader-f16 feature is not supported by your GPU. Switching to standard 'isnet' model.");
            if (!cancelled) {
              setConfig((prev) => ({
                ...prev,
                model: "isnet"
              }));
            }
            return;
          }
          await safeSequentialPreload(config);
        } else {
          await safeSequentialPreload({ ...config, device: "cpu" });
        }
      } catch (err) {
        console.warn("GPU Preloading fallback to CPU:", err);
        try {
          await safeSequentialPreload({ ...config, device: "cpu" });
          if (!cancelled) {
            setConfig((prev) => ({
              ...prev,
              device: "cpu",
            }));
          }
        } catch (cpuErr) {
          console.error("CPU Preloading also failed:", cpuErr);
        }
      }
      if (!cancelled) setPreloading(false);
    };

    runPreload();

    return () => {
      cancelled = true;
    };
  }, [config.device, config.model, gpuF16Supported]);

  // 🔹 Auto-Trigger Background Removal on drop/load
  useEffect(() => {
    if (image && !result && !loading && !preloading) {
      handleProcess();
    }
  }, [image]);

  // 🔹 Keyboard Shortcuts for Undo (Ctrl/Cmd + Z) and Redo (Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") {
        return;
      }

      const isMac = /Mac|iPad|iPhone|iPod/.test(navigator.userAgent || navigator.platform || "");
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl) {
        if (e.key.toLowerCase() === "z") {
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
        } else if (e.key.toLowerCase() === "y") {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [historyState]);

  // 🔹 Process image pipeline
  const handleProcess = async () => {
    if (!image || preloading) return;

    setLoading(true);
    try {
      // 1. Attempt GPU Core first
      if (config.device === "gpu" && navigator.gpu) {
        try {
          const blob = await processImage(image, {
            ...config,
            device: "gpu",
          });
          setGpuActive(true);
          const objUrl = URL.createObjectURL(blob);
          setResult(objUrl);
          addToHistory(image.name, objUrl, original);
          pushToHistoryStack(original, objUrl);
          return;
        } catch (e) {
          console.warn("Compute GPU channel failed. Falling back to CPU WASM:", e);
        }
      }

      // 2. WASM CPU Fallback Core
      const blob = await processImage(image, {
        ...config,
        device: "cpu",
      });
      setGpuActive(false);
      const objUrl = URL.createObjectURL(blob);
      setResult(objUrl);
      addToHistory(image.name, objUrl, original);
      pushToHistoryStack(original, objUrl);
    } catch (err) {
      console.error("Layer extraction processing failed:", err);
      alert("Failed to process background layers.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) {
      setImage(null);
      setOriginal(null);
      setResult(null);
      setHistoryState({ stack: [], index: -1 });
      return;
    }

    setLoading(true);
    try {
      const processedFile = await processUploadedFile(file);
      setImage(processedFile);
      const objUrl = URL.createObjectURL(processedFile);
      setOriginal(objUrl);
      setResult(null);
      setHistoryState({
        stack: [{ original: objUrl, result: null }],
        index: 0
      });
    } catch (err) {
      console.error("Failed to prepare image for background removal:", err);
      alert(`Unable to load this image format. Details: ${err.message || err}`);
      setImage(null);
      setOriginal(null);
      setResult(null);
      setHistoryState({ stack: [], index: -1 });
    } finally {
      setLoading(false);
    }
  };

  const addToHistory = (name, resultUrl, originalUrl) => {
    const item = {
      name,
      result: resultUrl,
      original: originalUrl,
      timestamp: Date.now()
    };
    setHistoryList((prev) => [item, ...prev]);
  };

  const handleReloadHistoryItem = (item) => {
    setOriginal(item.original);
    setResult(item.result);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* 🔹 Background Benchmark diagnostics overlay */}
      {showTester && (
        <DeviceTester
          setConfig={setConfig}
          onComplete={() => setShowTester(false)}
        />
      )}

      {/* Header navbar */}
      <Header
        gpuBrand={gpuBrand}
        deviceMode={config.device}
        inspectorOpen={inspectorOpen}
        setInspectorOpen={setInspectorOpen}
        layersOpen={layersOpen}
        setLayersOpen={setLayersOpen}
      />

      {/* Main body layouts */}
      <div className="flex flex-1 overflow-hidden min-w-0">

        {/* Col 1: Contextual Inspector Panel */}
        <ContextPanel
          config={config}
          setConfig={setConfig}
          gpuSupported={gpuSupported}
          gpuBrand={gpuBrand}
          gpuActive={gpuActive}
          activeBgType={activeBgType}
          setActiveBgType={setActiveBgType}
          bgVal={bgVal}
          setBgVal={setBgVal}
          historyList={historyList}
          setHistoryList={setHistoryList}
          onReloadHistoryItem={handleReloadHistoryItem}
          onRunTest={() => setShowTester(true)}
          gpuF16Supported={gpuF16Supported}
          inspectorOpen={inspectorOpen}
          setInspectorOpen={setInspectorOpen}
          activeRetouchTool={activeRetouchTool}
          setActiveRetouchTool={setActiveRetouchTool}
          brushRadius={brushRadius}
          setBrushRadius={setBrushRadius}
          brushMode={brushMode}
          setBrushMode={setBrushMode}
          canUndo={historyState.index > 0}
          canRedo={historyState.index < historyState.stack.length - 1}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />

        {/* Col 3: Canvas Workspace area */}
        <Workspace
          image={image}
          setImage={handleImageUpload}
          original={original}
          result={result}
          isProcessing={loading}
          activeBgType={activeBgType}
          bgVal={bgVal}
          layersVisibility={layersVisibility}
          layersOpacity={layersOpacity}
          handleProcess={handleProcess}
          preloading={preloading}
          activeRetouchTool={activeRetouchTool}
          setActiveRetouchTool={setActiveRetouchTool}
          brushRadius={brushRadius}
          brushMode={brushMode}
          setResult={handleUpdateResult}
        />

        {/* Col 4: Layers sidebar panel */}
        <LayerDock
          original={original}
          result={result}
          layersVisibility={layersVisibility}
          setLayersVisibility={setLayersVisibility}
          layersOpacity={layersOpacity}
          setLayersOpacity={setLayersOpacity}
          activeBgType={activeBgType}
          bgVal={bgVal}
          layersOpen={layersOpen}
          setLayersOpen={setLayersOpen}
        />

      </div>
    </div>
  );
}
