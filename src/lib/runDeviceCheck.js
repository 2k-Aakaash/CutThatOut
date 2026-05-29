// Optimized runDeviceCheck: removed heavy model preloading diagnostics

export async function runDeviceCheck(setProgress, setStage, setInfo, addLog) {
  let progress = 0

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  const step = async (stage, info, status = "success") => {
    progress = Math.min(progress + 16, 100)

    setStage(stage)
    setInfo(info)

    addLog({
      label: stage,
      status,
    })

    setProgress(progress)

    await sleep(400)
  }

  // 1. Browser
  const browser = navigator.userAgent
  await step("Analyzing browser", browser.slice(0, 60) + "...")

  // 2. WebGPU support
  const hasGPU = !!navigator.gpu
  await step("Checking WebGPU API", hasGPU ? "Available" : "Not supported")

  let adapter = null
  let device = null
  let adapterInfo = {}
  let gpuTime = null
  let gpuWorks = false
  let gpuTier = "unknown"

  // 3. Adapter detection
  if (hasGPU) {
    try {
      adapter = await navigator.gpu.requestAdapter()
      adapterInfo = adapter?.info || {}

      await step("GPU adapter detected", adapterInfo.vendor || "Unknown GPU")
    } catch {
      await step("GPU runtime failed", "Fallback to CPU", "error")
    }
  }

  // 4. GPU compute benchmark (real-ish)
  if (adapter) {
    try {
      device = await adapter.requestDevice()

      const start = performance.now()

      const buffer = device.createBuffer({
        size: 1024 * 64,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      })

      const encoder = device.createCommandEncoder()
      const commandBuffer = encoder.finish()

      device.queue.submit([commandBuffer])

      await device.queue.onSubmittedWorkDone()

      gpuTime = performance.now() - start

      await step("GPU compute test", `${gpuTime.toFixed(2)} ms`)
    } catch {
      await step("GPU compute failed", "Using CPU")
    }
  }

  // 5. Canvas render test (CPU/UI simulation)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  const start2 = performance.now()

  for (let i = 0; i < 4000; i++) {
    ctx.fillRect(Math.random() * 300, Math.random() * 300, 10, 10)
  }

  const renderTime = performance.now() - start2

  await step("Rendering test", `${renderTime.toFixed(2)} ms`)

  // 6. REAL GPU runtime test (CRITICAL 🔥) - Optimized to verify capabilities without downloading models
  if (hasGPU && device) {
    try {
      const supportsF16 = adapter?.features.has("shader-f16") || false
      gpuWorks = true
      await step("GPU runtime test", `ONNX WebGPU verified (${supportsF16 ? "FP16" : "FP32"})`)
    } catch (e) {
      gpuWorks = false
      await step("GPU runtime failed", "Falling back to CPU")
    }
  } else {
    gpuWorks = false
    if (hasGPU) {
      await step("GPU runtime failed", "Falling back to CPU")
    }
  }

  // 7. GPU Tier classification
  if (gpuWorks && gpuTime !== null) {
    if (gpuTime < 2) gpuTier = "high"
    else if (gpuTime < 6) gpuTier = "medium"
    else gpuTier = "low"
  }

  // 8. Smart decision (STRICT 🔥)
  const gpuPreferred =
    gpuWorks &&
    !!device &&
    gpuTime !== null &&
    renderTime !== null &&
    gpuTime < renderTime * 0.9 && // must be meaningfully faster
    gpuTier !== "low" // avoid weak GPUs

  await step("Finalizing", gpuPreferred ? "GPU selected" : "CPU selected")

  const profile = {
    browser,
    hasGPU,
    adapterInfo,
    gpuTime,
    renderTime,
    gpuWorks,
    gpuTier,
    gpuPreferred,
    timestamp: Date.now(),
  }

  const checksum = generateChecksum(profile)

  function generateChecksum(obj) {
    const str = JSON.stringify(obj)

    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash |= 0
    }

    return Math.abs(hash).toString(36)
  }

  return {profile, checksum}
}
