import { useEffect, useRef } from "react";

const INFINITY =
  "M400,200 C470,110 560,70 620,70 C710,70 760,130 760,200 C760,270 710,330 620,330 C560,330 470,290 400,200 C330,110 240,70 180,70 C90,70 40,130 40,200 C40,270 90,330 180,330 C240,330 330,290 400,200 Z";

export function NeonMark() {
  const boxRef = useRef(null);
  const canvasRef = useRef(null);
  const pathRef = useRef(null);

  useEffect(() => {
    const box = boxRef.current;
    const cv = canvasRef.current;
    const path = pathRef.current;
    if (!box || !cv || !path) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const ctx = cv.getContext("2d");
    const length = path.getTotalLength();
    const particles = [];
    let width = 0;
    let height = 0;
    let scale = 1;
    let dpr = 1;
    let frame = 0;

    function fit() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = box.clientWidth;
      height = box.clientHeight;
      cv.width = width * dpr;
      cv.height = height * dpr;
      scale = width / 800;
    }

    function spawn() {
      const point = path.getPointAtLength(Math.random() * length);
      particles.push({
        x: point.x,
        y: point.y,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -(0.15 + Math.random() * 0.45),
        r: 14 + Math.random() * 22,
        life: 0,
        max: 140 + Math.random() * 120,
        ph: Math.random() * 6.28,
      });
    }

    function tick() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";
      if (particles.length < 70 && Math.random() < 0.6) spawn();
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const q = particles[i];
        q.life += 1;
        q.x += q.vx + Math.sin(q.life / 28 + q.ph) * 0.3;
        q.y += q.vy;
        q.r += 0.12;
        const u = q.life / q.max;
        if (u >= 1) {
          particles.splice(i, 1);
          continue;
        }
        const alpha = Math.sin(Math.PI * u) * 0.2;
        const radius = q.r * scale;
        const x = q.x * scale;
        const y = q.y * scale;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
        glow.addColorStop(0, `rgba(60,255,80,${alpha})`);
        glow.addColorStop(1, "rgba(60,255,80,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 6.283);
        ctx.fill();
      }
      frame = requestAnimationFrame(tick);
    }

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    tick();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="neon" ref={boxRef}>
      <svg viewBox="0 0 800 400" role="img" aria-label="Flipur animated neon infinity logo">
        <defs>
          <filter id="gl" x="-20%" y="-30%" width="140%" height="160%">
            <feGaussianBlur stdDeviation="7" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="gs" x="-20%" y="-30%" width="140%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <path ref={pathRef} id="inf" pathLength="1000" d={INFINITY} />
        </defs>
        <use href="#inf" fill="none" stroke="#06200f" strokeWidth="58" strokeLinejoin="round" />
        <use href="#inf" fill="none" stroke="#1cff66" strokeWidth="44" opacity="0.28" filter="url(#gl)" className="pulse" />
        <use href="#inf" fill="none" stroke="#0c4a24" strokeWidth="40" />
        <use href="#inf" fill="none" stroke="#2dff6a" strokeWidth="20" filter="url(#gl)" className="pulse" />
        <use href="#inf" fill="none" stroke="#c9ffd6" strokeWidth="5" opacity="0.85" />
        <use href="#inf" fill="none" stroke="#b6ffb0" strokeWidth="16" strokeLinecap="round" filter="url(#gs)" className="mv" />
      </svg>
      <canvas ref={canvasRef} />
    </div>
  );
}
