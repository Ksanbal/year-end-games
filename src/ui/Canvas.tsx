import { useLayoutEffect, useRef, type ReactNode } from "react";
import "./canvas.css";

const FRAME_W = 1920;
const FRAME_H = 1080;

export function Canvas({ children }: { children: ReactNode }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    const fit = () => {
      const scale = Math.min(stage.clientWidth / FRAME_W, stage.clientHeight / FRAME_H);
      canvas.style.transform = `translate(-50%, -50%) scale(${scale})`;
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="stage" ref={stageRef}>
      <div className="canvas" ref={canvasRef}>
        {children}
      </div>
    </div>
  );
}
