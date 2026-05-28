import { Slider } from "@/components/ui/slider";

export default function Controls({ config, setConfig, gpuSupported }) {
  return (
    <div className="bg-[#111411] p-4 md:p-5 rounded-xl border border-[#1f2a1f] space-y-4 md:space-y-5">

      <h2 className="text-lg font-semibold">Settings</h2>

      {/* Device */}
      <div>
        <p className="text-sm mb-1">Device</p>
        <select
          className="w-full bg-black border border-[#1f2a1f] p-2 rounded"
          value={config.device}
          onChange={(e) =>
            setConfig({ ...config, device: e.target.value })
          }
        >
          <option value="cpu">CPU</option>
          <option value="gpu" disabled={!gpuSupported}>GPU</option>
        </select>
      </div>

      {/* Model */}
      <div>
        <p className="text-sm mb-1">Model</p>
        <select
          className="w-full bg-black border border-[#1f2a1f] p-2 rounded"
          value={config.model}
          onChange={(e) =>
            setConfig({ ...config, model: e.target.value })
          }
        >
          <option value="isnet">isnet</option>
          <option value="isnet_fp16">fp16</option>
          <option value="isnet_quint8">quint8</option>
        </select>
      </div>

      {/* Quality Slider */}
      <div>
        <p className="text-sm mb-2">
          Quality: {config.output.quality}
        </p>
        <Slider
          value={[config.output.quality]}
          min={0.1}
          max={1}
          step={0.1}
          onValueChange={(val) =>
            setConfig({
              ...config,
              output: {
                ...config.output,
                quality: val[0],
              },
            })
          }
        />
      </div>

      {/* Output Type */}
      <div>
        <p className="text-sm mb-1">Output</p>
        <select
          className="w-full bg-black border border-[#1f2a1f] p-2 rounded"
          value={config.output.type}
          onChange={(e) =>
            setConfig({
              ...config,
              output: { ...config.output, type: e.target.value },
            })
          }
        >
          <option value="foreground">Foreground</option>
          <option value="background">Background</option>
          <option value="mask">Mask</option>
        </select>
      </div>

    </div>
  );
}
