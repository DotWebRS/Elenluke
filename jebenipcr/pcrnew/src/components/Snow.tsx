import { useEffect, useRef } from "react";

type Props = { className?: string };

export default function Snow({ className }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const SCALE = 0.55; // internal resolution scale (perf)
    const STEP = 2;

    let w = 0;
    let h = 0;
    let imageData: ImageData;

    const randArray: number[] = [];
    const maxRand = 879;
    for (let i = 0; i < maxRand; i++) randArray.push(Math.random());

    let randStop = 120;
    let randIndex = 0;

    let framePos = 0;
    const frameBorder = 240;
    const frameWidth = 60;

    const resize = () => {
      // viewport size, not document height
      w = Math.floor(window.innerWidth * DPR * SCALE);
      h = Math.floor(window.innerHeight * DPR * SCALE);

      canvas.width = w;
      canvas.height = h;

      // critical: force fullscreen in CSS pixels
      canvas.style.width = "100vw";
      canvas.style.height = "100vh";

      imageData = ctx.createImageData(w, h);
    };

    resize();
    window.addEventListener("resize", resize);

    let raf = 0;

    const tick = () => {
      const yy = (Math.random() * STEP) | 0;
      const xx = (Math.random() * STEP) | 0;

      framePos += 2;
      const data = imageData.data;

      for (let y = yy; y < h; y += STEP) {
        for (let x = xx; x < w; x += STEP) {
          randIndex++;
          if (randIndex > randStop) {
            randStop = (Math.random() * maxRand) | 0;
            randIndex = 0;
          }

          let add = 0;
          if ((y + framePos) % frameBorder < frameWidth) add = -14;

          const idx = 4 * (y * w + x);
          const n = ((randArray[randIndex] * 255) | 0) + add;
          const v = Math.min(170, Math.max(0, n));

          data[idx] = v;
          data[idx + 1] = v;
          data[idx + 2] = v;
          data[idx + 3] = 150;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      if (framePos % 6 === 0) {
        const lines = 2 + ((Math.random() * 3) | 0);
        for (let k = 0; k < lines; k++) {
          const x = (Math.random() * w) | 0;
          const lineW = 1 + ((Math.random() * 2) | 0);
          ctx.fillStyle = "rgba(220,220,220,0.20)";
          ctx.fillRect(x, 0, lineW, h);
        }
      }
      if (framePos % 90 === 0) {
        const x = (Math.random() * w) | 0;
        ctx.fillStyle = "rgba(235,235,235,0.34)";
        ctx.fillRect(x, 0, 2, h);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className={className} />;
}
