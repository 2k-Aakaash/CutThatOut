export default function StatsCard({ gpuSupported, gpuActive }) {
  return (
    <div className="bg-[#111411] p-5 rounded-xl border border-[#1f2a1f]">
      <h3 className="text-sm opacity-70 mb-2">System</h3>

      <div className="text-2xl font-bold text-[#76b900]">
        {gpuActive ? "GPU Active" : "CPU Mode"}
      </div>

      <p className="text-xs opacity-60 mt-2">
        WebGPU: {gpuSupported ? "Supported" : "Not Supported"}
      </p>
    </div>
  );
}
