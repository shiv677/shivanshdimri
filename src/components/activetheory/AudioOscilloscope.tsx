import React, { useRef, useEffect } from 'react';
import { soundEngine } from './SoundEngine';

interface AudioOscilloscopeProps {
  width?: number;
  height?: number;
  className?: string;
  active?: boolean;
}

export const AudioOscilloscope: React.FC<AudioOscilloscopeProps> = ({
  width = 64,
  height = 18,
  className = '',
  active = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const buffer = new Uint8Array(32);

    const render = () => {
      soundEngine.getWaveformData(buffer);

      ctx.clearRect(0, 0, width, height);

      // Draw subtle grid center line
      ctx.beginPath();
      ctx.strokeStyle = active ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Draw Oscilloscope waveform line
      ctx.beginPath();
      ctx.strokeStyle = active ? '#00f0ff' : 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.25;
      ctx.shadowColor = active ? '#00f0ff' : 'transparent';
      ctx.shadowBlur = active ? 6 : 0;

      const sliceWidth = width / buffer.length;
      let x = 0;

      for (let i = 0; i < buffer.length; i++) {
        // buffer[i] is 0..255, with 128 as middle
        const v = buffer[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.stroke();
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [width, height, active]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`rounded pointer-events-none select-none ${className}`}
    />
  );
};

export default AudioOscilloscope;
