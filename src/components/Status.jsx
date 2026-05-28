export default function Status({ gpuSupported, gpuActive, status }) {
  return (
    <div className="p-4 bg-card rounded-xl text-sm">
      <p>WebGPU: {gpuSupported ? "✅" : "❌"}</p>
      <p>Device: {gpuActive ? "🚀 GPU" : "🧠 CPU"}</p>
      <p>{status}</p>
    </div>
  );
}
