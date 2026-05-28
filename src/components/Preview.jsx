import { useState } from "react";

export default function Preview({ result, original }) {
  const [slider, setSlider] = useState(50);

  return (
    <div className="bg-[#111411] p-5 rounded-xl border border-[#1f2a1f] h-full flex flex-col">

      <h2 className="text-lg mb-3">Preview</h2>

      <div className="flex-1 flex items-center justify-center">
        {result ? (
          <div className="relative w-full max-w-[400px] mx-auto">

            {/* AFTER IMAGE */}
            <img
              src={result}
              className="rounded-lg w-full max-h-[300px] object-contain"
            />

            {/* BEFORE (only if exists) */}
            {original && (
              <div
                className="absolute top-0 left-0 h-full overflow-hidden rounded-lg"
                style={{ width: `${slider}%` }}
              >
                <img
                  src={original}
                  className="w-full max-h-[300px] object-contain"
                />
              </div>
            )}

            {/* SLIDER only if original exists */}
            {original && (
              <>
                <div
                  className="absolute top-0 bottom-0"
                  style={{ left: `${slider}%` }}
                >
                  <div className="w-[2px] h-full bg-white relative">
                    <div className="w-4 h-4 bg-white rounded-full absolute -left-1.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={slider}
                  onChange={(e) => setSlider(e.target.value)}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                />

                <div className="absolute top-2 left-2 text-xs bg-black/60 px-2 py-1 rounded">
                  Before
                </div>

                <div className="absolute top-2 right-2 text-xs bg-black/60 px-2 py-1 rounded">
                  After
                </div>
              </>
            )}

          </div>
        ) : (
          <p className="opacity-50">No image yet</p>
        )}
      </div>

      {result && (
        <a
          href={result}
          download
          className="mt-4 bg-[#76b900] text-black text-center py-2 rounded-lg"
        >
          Download
        </a>
      )}
    </div>
  );
}
