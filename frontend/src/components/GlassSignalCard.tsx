import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const VIDEO_ID = "app-bg-video";
const DUP_PIXEL_RATIO = 1;

export function GlassSignalCard() {
  const cardRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let frame = 0;
    let lastWidth = 0;
    let lastHeight = 0;

    const draw = () => {
      frame = window.requestAnimationFrame(draw);

      const card = cardRef.current;
      const container = containerRef.current;
      const canvas = canvasRef.current;
      const video = document.getElementById(VIDEO_ID) as HTMLVideoElement | null;
      if (!card || !container || !canvas || !video || !video.videoWidth || !video.videoHeight) {
        return;
      }

      const rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return;
      }

      const viewportWidth = document.documentElement.clientWidth;
      const viewportHeight = document.documentElement.clientHeight;
      if (!viewportWidth || !viewportHeight) {
        return;
      }

      container.style.left = `${-rect.left}px`;
      container.style.top = `${-rect.top}px`;
      container.style.width = `${viewportWidth}px`;
      container.style.height = `${viewportHeight}px`;

      const targetWidth = Math.round(viewportWidth * DUP_PIXEL_RATIO);
      const targetHeight = Math.round(viewportHeight * DUP_PIXEL_RATIO);
      if (targetWidth !== lastWidth || targetHeight !== lastHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        canvas.style.width = `${viewportWidth}px`;
        canvas.style.height = `${viewportHeight}px`;
        lastWidth = targetWidth;
        lastHeight = targetHeight;
      }

      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      const cover = Math.max(viewportWidth / video.videoWidth, viewportHeight / video.videoHeight);
      const sourceWidth = viewportWidth / cover;
      const sourceHeight = viewportHeight / cover;
      const sourceX = (video.videoWidth - sourceWidth) / 2;
      const sourceY = (video.videoHeight - sourceHeight) / 2;

      try {
        context.drawImage(
          video,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          targetWidth,
          targetHeight
        );
      } catch {
        // A frame can be unavailable while the browser is still decoding the video.
      }
    };

    frame = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <aside className="glass-card group" data-glass-card aria-label="Live settlement signal" ref={cardRef}>
      <div className="glass-card__duplicate" ref={containerRef}>
        <canvas className="glass-card__canvas" ref={canvasRef} />
      </div>
      <div className="glass-card__frost" aria-hidden="true" />

      <div className="glass-card__head">
        <h2 className="glass-card__title">Canonical workflow signal</h2>
        <span className="mono">//02</span>
      </div>

      <div className="glass-card__body">
        <div className="finding">
          <h3 className="finding__title">Evidence coverage locked</h3>
          <p className="finding__text">
            Validators inspect signed, bounded artifacts against the canonical workflow objective.
          </p>
        </div>
        <div className="finding">
          <h3 className="finding__title">Settlement reads onchain</h3>
          <p className="finding__text">
            Final outcomes are refreshed from the deployed TraceSettle contract after finality.
          </p>
        </div>
      </div>

      <svg className="glass-card__wave" viewBox="0 0 220 50" fill="none" aria-hidden="true">
        <path
          d="M0 30 C10 30 12 45 18 45 C24 45 26 10 34 10 C42 10 44 40 52 40 C60 40 62 5 70 5 C78 5 80 42 88 42 C96 42 98 15 106 15 C114 15 116 38 124 38 C132 38 134 20 142 20 C150 20 152 35 160 35 C168 35 170 22 178 22 C186 22 188 32 196 32 C204 32 210 28 220 28"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>

      <div className="glass-card__actions">
        <Link className="glass-card__link" to="/workflows">
          Review assigned steps
        </Link>
      </div>
    </aside>
  );
}
