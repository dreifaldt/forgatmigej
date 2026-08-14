"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Ritar en kod som byts varje sekund, precis som en animerad BankID-QR gör.
 * Mönstret är pseudoslumpat ur sekunden — det är ingen giltig kod och ska inte vara det.
 */
function drawFrame(canvas: HTMLCanvasElement, tick: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const modules = 25;
  const size = canvas.width / modules;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000000";

  let seed = (tick + 1) * 2654435761;
  const next = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  for (let y = 0; y < modules; y++) {
    for (let x = 0; x < modules; x++) {
      if (next() > 0.5) ctx.fillRect(x * size, y * size, size, size);
    }
  }

  for (const [ox, oy] of [
    [0, 0],
    [modules - 7, 0],
    [0, modules - 7],
  ] as const) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(ox * size, oy * size, 7 * size, 7 * size);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect((ox + 1) * size, (oy + 1) * size, 5 * size, 5 * size);
    ctx.fillStyle = "#000000";
    ctx.fillRect((ox + 2) * size, (oy + 2) * size, 3 * size, 3 * size);
  }
}

type Stage = "idle" | "scanning" | "form" | "confirmed";

export function MockBankId({ signAfterMs }: { signAfterMs: number }) {
  const [stage, setStage] = useState<Stage>("idle");
  const [agreed, setAgreed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (stage !== "scanning") return;
    let tick = 0;
    const draw = () => {
      if (canvasRef.current) drawFrame(canvasRef.current, tick++);
    };
    draw();
    const interval = setInterval(draw, 1000);
    // Härmar att användaren skannat och signerat.
    const timer = setTimeout(() => setStage("form"), signAfterMs);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [stage, signAfterMs]);

  if (stage === "confirmed") {
    return (
      <div className="mt-10 rounded-2xl border border-[var(--color-line)] bg-surface p-8">
        <p className="font-serif text-2xl">Din begäran är mottagen</p>
        <p className="mt-2 text-stem">Dina uppgifter döljs inom kort.</p>
      </div>
    );
  }

  // Steget efter inloggningen: det som den dolda webbläsaren ska klara utan användaren.
  if (stage === "form") {
    return (
      <div className="mt-10 rounded-2xl border border-[var(--color-line)] bg-surface p-8">
        <p className="font-serif text-xl">Du är inloggad</p>
        <p className="mt-2 text-stem">Bekräfta att du vill ta bort dina uppgifter.</p>

        <label className="mt-5 flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="samtycke"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          Jag vill dölja mina uppgifter i det publika söket
        </label>

        <button
          type="button"
          disabled={!agreed}
          onClick={() => setStage("confirmed")}
          className="mt-6 rounded-full bg-blue-deep px-6 py-3 font-medium text-ring disabled:opacity-40"
        >
          Bekräfta borttagning
        </button>
      </div>
    );
  }

  if (stage === "idle") {
    return (
      <button
        type="button"
        onClick={() => setStage("scanning")}
        className="mt-10 rounded-full bg-blue-deep px-6 py-3 font-medium text-ring"
      >
        Ta bort dig
      </button>
    );
  }

  return (
    <div className="mt-10">
      <p className="mb-4 text-sm text-stem">Skanna koden med din app.</p>
      <canvas
        ref={canvasRef}
        width={250}
        height={250}
        className="rounded-xl border border-[var(--color-line)]"
      />
    </div>
  );
}
