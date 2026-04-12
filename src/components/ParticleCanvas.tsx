import { useRef, useEffect } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  hue: number;
}

interface Props {
  intensity?: number; // 0-1, controls animation energy
  speaking?: boolean;
}

export default function ParticleCanvas({ intensity = 0, speaking = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    // Init particles
    const count = 120;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    particlesRef.current = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 200 + 40;
      return {
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.6 + 0.2,
        hue: 130 + Math.random() * 30,
      };
    });

    const draw = () => {
      frameRef.current++;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const centerX = w / 2;
      const centerY = h / 2;
      const t = frameRef.current * 0.01;
      const energy = speaking ? 0.8 : intensity;

      ctx.clearRect(0, 0, w, h);

      // Central glow
      const glowRadius = 80 + energy * 60 + Math.sin(t * 2) * 10;
      const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
      grad.addColorStop(0, `hsla(145, 80%, 50%, ${0.15 + energy * 0.2})`);
      grad.addColorStop(0.4, `hsla(145, 80%, 42%, ${0.05 + energy * 0.1})`);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Outer ambient glow
      const outerGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 300);
      outerGrad.addColorStop(0, `hsla(145, 60%, 40%, ${0.03 + energy * 0.04})`);
      outerGrad.addColorStop(1, "transparent");
      ctx.fillStyle = outerGrad;
      ctx.fillRect(0, 0, w, h);

      const particles = particlesRef.current;

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 100 + energy * 50;
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.15 * (1 + energy);
            ctx.strokeStyle = `hsla(145, 70%, 45%, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Update and draw particles
      for (const p of particles) {
        // Orbit around center
        const dx = p.x - centerX;
        const dy = p.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Gentle orbit
        const orbitSpeed = 0.002 + energy * 0.004;
        p.x = centerX + Math.cos(angle + orbitSpeed) * dist;
        p.y = centerY + Math.sin(angle + orbitSpeed) * dist;

        // Breathing
        const targetDist = 120 + Math.sin(t + angle * 2) * 40 + energy * 60;
        const drift = (targetDist - dist) * 0.002;
        p.x += Math.cos(angle) * drift + p.vx;
        p.y += Math.sin(angle) * drift + p.vy;

        // Draw particle
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * (3 + energy * 2));
        glow.addColorStop(0, `hsla(${p.hue}, 80%, 55%, ${p.opacity * (0.8 + energy * 0.5)})`);
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (3 + energy * 2), 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.fillStyle = `hsla(${p.hue}, 90%, 70%, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Center core orb
      const coreSize = 6 + energy * 4 + Math.sin(t * 3) * 2;
      const coreGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreSize * 4);
      coreGrad.addColorStop(0, `hsla(145, 90%, 65%, ${0.9 + energy * 0.1})`);
      coreGrad.addColorStop(0.3, `hsla(145, 80%, 50%, 0.4)`);
      coreGrad.addColorStop(1, "transparent");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreSize * 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `hsla(145, 90%, 80%, 0.95)`;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreSize * 0.6, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, [intensity, speaking]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
    />
  );
}
