import { useState, useEffect } from "react";
import { runDeviceCheck } from "../lib/runDeviceCheck";

export default function DeviceTester({ onComplete, setConfig }) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [info, setInfo] = useState("");
  const [logs, setLogs] = useState([]);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canChoose, setCanChoose] = useState(false);

  // ✅ structured logs
  const addLog = ({ label, status = "success" }) => {
    setLogs((prev) => {
      // prevent duplicates (same label back-to-back)
      if (prev.length && prev[prev.length - 1].label === label) {
        return prev;
      }
      return [...prev, { label, status }];
    });
  };

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const { profile, checksum } = await runDeviceCheck(
          setProgress,
          setStage,
          setInfo,
          addLog
        );

        if (!isMounted) return;

        setResult({ profile, checksum });
        setLoading(false);
      } catch (err) {
        console.error("Device test failed:", err);

        setResult({
          profile: { gpuPreferred: false },
          checksum: null,
        });

        setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // delay selection (UX polish)
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setCanChoose(true), 1200);
      return () => clearTimeout(t);
    }
  }, [loading]);

  const handleSelect = (device) => {
    if (!result) return;

    const { profile, checksum } = result;

    localStorage.setItem(
      "deviceProfile",
      JSON.stringify({
        ...profile,
        checksum,
        verified: true,
        userChoice: device,
      })
    );

    setConfig((prev) => ({
      ...prev,
      device,
    }));

    onComplete();
  };

  const recommended = result?.profile?.gpuPreferred ? "gpu" : "cpu";

  // ✅ derive step from progress (no bugs now)
  const currentStep = Math.min(Math.ceil(progress / 16), 6);

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="bg-card border border-border p-4 md:p-6 rounded-2xl w-[90%] md:w-[500px] shadow-xl">

        {/* Header */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold">
            Hardware Diagnostics
          </h2>
          <p className="text-xs text-muted-foreground">
            Benchmarking your system (~5–8 seconds)
          </p>
        </div>

        {/* PROGRESS */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span>Step {currentStep} / 6</span>
            <span>{progress}%</span>
          </div>

          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* CURRENT STAGE */}
        <div className="mb-3">
          <p className="text-sm font-medium">{stage}</p>
          <p className="text-xs text-muted-foreground">{info}</p>
        </div>

        {/* LOGS */}
        <div className="space-y-1 text-xs max-h-32 overflow-auto mb-4">
          {logs.map((log, i) => (
            <div key={i} className="flex justify-between">
              <span>{log.label}</span>

              <span
                className={
                  log.status === "error"
                    ? "text-red-500"
                    : log.status === "info"
                    ? "text-yellow-400"
                    : "text-green-500"
                }
              >
                {log.status === "error"
                  ? "✖"
                  : log.status === "info"
                  ? "…"
                  : "✔"}
              </span>
            </div>
          ))}
        </div>

        {/* RESULT */}
        {!loading && result && (
          <>
            <div className="mb-4 text-sm border-t border-border pt-3">
              <p className="mb-1">
                Recommended:
                <span className="ml-2 font-semibold text-green-400">
                  {recommended.toUpperCase()}
                </span>
              </p>

              <p className="text-xs text-muted-foreground">
                {recommended === "gpu"
                  ? "Your GPU performed faster in compute tasks."
                  : "CPU is more stable or faster on your system."}
              </p>

              <p className="text-[11px] text-muted-foreground mt-2">
                GPU:{" "}
                {result.profile.gpuTime
                  ? `${result.profile.gpuTime.toFixed(2)} ms`
                  : "N/A"}{" "}
                • Render: {result.profile.renderTime.toFixed(2)} ms
              </p>

              <p className="text-[11px] text-muted-foreground mt-1">
                You can change this later in settings.
              </p>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-3">
              <button
                disabled={!canChoose}
                onClick={() => handleSelect("gpu")}
                className={`flex-1 py-2 rounded-xl ${
                  recommended === "gpu"
                    ? "bg-green-600"
                    : "bg-muted"
                } ${!canChoose ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Use GPU
              </button>

              <button
                disabled={!canChoose}
                onClick={() => handleSelect("cpu")}
                className={`flex-1 py-2 rounded-xl ${
                  recommended === "cpu"
                    ? "bg-green-600"
                    : "bg-muted"
                } ${!canChoose ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Use CPU
              </button>
            </div>

            {/* RERUN */}
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-xs text-yellow-400 underline"
            >
              Re-run diagnostics
            </button>
          </>
        )}
      </div>
    </div>
  );
}
