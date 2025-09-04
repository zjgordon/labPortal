'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeProps {
  data: string;
  size?: number;
  className?: string;
}

export function QRCodeComponent({
  data,
  size = 128,
  className = '',
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setError('Failed to get canvas context');
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Generate QR code
    QRCode.toCanvas(canvas, data, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    }).catch((err) => {
      console.error('QR Code generation error:', err);
      setError('Failed to generate QR code');
    });
  }, [data, size]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="text-center text-gray-500 text-xs">
          <div className="mb-1">⚠️</div>
          <div>QR Error</div>
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`rounded ${className}`}
    />
  );
}
