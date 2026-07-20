"use client";

import React, { useEffect, useRef } from 'react';

/**
 * Canvas-based Matrix rain background.
 * Uses the Velix teal/cyan palette to match the design system.
 */
export const MatrixRain: React.FC<{ opacity?: number }> = ({ opacity = 0.22 }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);

        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<>/\\*&^%$#@!+-=~'.split('');
        const fontSize = 14;
        const columns = Math.floor(width / fontSize);
        const drops: number[] = Array(columns).fill(1);

        const draw = () => {
            if (!ctx || !canvas) return;

            const isDark = document.documentElement.classList.contains('dark');
            // Adapt blend + trail fade to the active theme so the effect reads
            // as a calm primary-blue rain in both light and dark mode.
            canvas.style.mixBlendMode = isDark ? 'screen' : 'multiply';
            ctx.fillStyle = isDark ? 'rgba(13, 17, 23, 0.06)' : 'rgba(228, 231, 238, 0.07)';
            ctx.fillRect(0, 0, width, height);

            ctx.font = `bold ${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];

                // Primary-blue palette — occasional bright highlight
                const roll = Math.random();
                let color: string;
                if (isDark) {
                    if (roll > 0.985) color = '#d1d5db';
                    else if (roll > 0.96) color = 'rgba(59, 130, 246, 0.5)';
                    else color = 'rgba(59, 130, 246, 0.13)';
                } else {
                    if (roll > 0.985) color = 'rgba(37, 99, 235, 0.45)';
                    else if (roll > 0.96) color = 'rgba(37, 99, 235, 0.28)';
                    else color = 'rgba(37, 99, 235, 0.10)';
                }
                ctx.fillStyle = color;

                const x = i * fontSize;
                const y = drops[i] * fontSize;
                ctx.fillText(text, x, y);

                if (y > height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        const intervalId = setInterval(draw, 33);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-0"
            style={{ opacity, mixBlendMode: 'screen' }}
        />
    );
};
