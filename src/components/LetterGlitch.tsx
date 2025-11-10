import { useRef, useEffect, useCallback } from 'react';

interface Letter {
  char: string;
  nextChar: string;
  charProgress: number;
  color: string;
  targetColor: string;
  colorProgress: number;
  opacity: number;
  targetOpacity: number;
  wave: number;
  glowIntensity: number;
}

const LetterGlitch = ({
  glitchColors = ['#10b981', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'],
  glitchSpeed = 60,
  smooth = true,
  waveEffect = true,
  glowEffect = true,
  flowPattern = 'wave',
  centerVignette = false,
  outerVignette = true,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789'
}: {
  glitchColors?: string[];
  glitchSpeed?: number;
  smooth?: boolean;
  waveEffect?: boolean;
  glowEffect?: boolean;
  flowPattern?: 'wave' | 'random' | 'cascade' | 'ripple';
  centerVignette?: boolean;
  outerVignette?: boolean;
  characters?: string;
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const letters = useRef<Letter[]>([]);
  const grid = useRef({ columns: 0, rows: 0 });
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const lastGlitchTime = useRef(Date.now());
  const time = useRef(0);

  const lettersAndSymbols = characters.split('');
  const fontSize = 16;
  const charWidth = 10;
  const charHeight = 20;

  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const getRandomChar = useCallback(() => {
    return lettersAndSymbols[Math.floor(Math.random() * lettersAndSymbols.length)];
  }, [lettersAndSymbols]);

  const getRandomColor = useCallback(() => {
    return glitchColors[Math.floor(Math.random() * glitchColors.length)];
  }, [glitchColors]);

  const hexToRgb = (hex: string) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (_m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
      : null;
  };

  const interpolateColor = (
    start: { r: number; g: number; b: number },
    end: { r: number; g: number; b: number },
    factor: number
  ) => {
    const easedFactor = easeInOutCubic(factor);
    return {
      r: Math.round(start.r + (end.r - start.r) * easedFactor),
      g: Math.round(start.g + (end.g - start.g) * easedFactor),
      b: Math.round(start.b + (end.b - start.b) * easedFactor)
    };
  };

  const calculateGrid = (width: number, height: number) => {
    const columns = Math.ceil(width / charWidth);
    const rows = Math.ceil(height / charHeight);
    return { columns, rows };
  };

  const initializeLetters = useCallback((columns: number, rows: number) => {
    grid.current = { columns, rows };
    const totalLetters = columns * rows;
    letters.current = Array.from({ length: totalLetters }, (_, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      return {
        char: getRandomChar(),
        nextChar: getRandomChar(),
        charProgress: 1,
        color: getRandomColor(),
        targetColor: getRandomColor(),
        colorProgress: 1,
        opacity: 0.3 + Math.random() * 0.4,
        targetOpacity: 0.3 + Math.random() * 0.4,
        wave: (col + row) * 0.08,
        glowIntensity: Math.random()
      };
    });
  }, [getRandomChar, getRandomColor]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    if (context.current) {
      context.current.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const { columns, rows } = calculateGrid(rect.width, rect.height);
    initializeLetters(columns, rows);
  }, [initializeLetters]);

  const drawLetters = useCallback(() => {
    if (!context.current || letters.current.length === 0) return;
    const ctx = context.current;
    const { width, height } = canvasRef.current!.getBoundingClientRect();
    
    ctx.clearRect(0, 0, width, height);
    ctx.font = `${fontSize}px "Courier New", monospace`;
    ctx.textBaseline = 'top';

    letters.current.forEach((letter, index) => {
      const col = index % grid.current.columns;
      const row = Math.floor(index / grid.current.columns);
      const x = col * charWidth;
      const y = row * charHeight;

      let finalOpacity = letter.opacity;
      if (waveEffect) {
        const wave = Math.sin(time.current * 0.0008 + letter.wave) * 0.2 + 0.8;
        finalOpacity *= wave;
      }

      if (glowEffect && letter.glowIntensity > 0.85) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = letter.color;
      } else {
        ctx.shadowBlur = 0;
      }

      const rgb = hexToRgb(letter.color);
      if (rgb) {
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${finalOpacity})`;
      }

      ctx.fillText(letter.char, x, y);
    });

    ctx.shadowBlur = 0;
  }, [waveEffect, glowEffect]);

  const updateLetters = useCallback(() => {
    if (!letters.current || letters.current.length === 0) return;

    const { columns, rows } = grid.current;
    const updateCount = Math.max(1, Math.floor(letters.current.length * 0.05));

    const updateSingleLetter = (index: number) => {
      if (!letters.current[index]) return;

      letters.current[index].nextChar = getRandomChar();
      letters.current[index].targetColor = getRandomColor();
      letters.current[index].targetOpacity = 0.3 + Math.random() * 0.4;
      letters.current[index].glowIntensity = Math.random();

      if (smooth) {
        letters.current[index].charProgress = 0;
        letters.current[index].colorProgress = 0;
      } else {
        letters.current[index].char = letters.current[index].nextChar;
        letters.current[index].color = letters.current[index].targetColor;
        letters.current[index].opacity = letters.current[index].targetOpacity;
        letters.current[index].charProgress = 1;
        letters.current[index].colorProgress = 1;
      }
    };

    if (flowPattern === 'wave') {
      for (let i = 0; i < updateCount; i++) {
        const col = Math.floor(Math.random() * columns);
        const waveOffset = Math.sin(time.current * 0.002 + col * 0.3) * rows * 0.25;
        const row = Math.floor(rows / 2 + waveOffset);
        if (row >= 0 && row < rows) {
          const index = row * columns + col;
          updateSingleLetter(index);
        }
      }
    } else if (flowPattern === 'ripple') {
      const centerX = columns / 2;
      const centerY = rows / 2;
      const rippleRadius = (Math.sin(time.current * 0.002) * 0.5 + 0.5) * Math.max(columns, rows) * 0.7;
      
      for (let i = 0; i < updateCount * 1.5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const col = Math.floor(centerX + Math.cos(angle) * rippleRadius);
        const row = Math.floor(centerY + Math.sin(angle) * rippleRadius);
        if (col >= 0 && col < columns && row >= 0 && row < rows) {
          const index = row * columns + col;
          updateSingleLetter(index);
        }
      }
    } else if (flowPattern === 'cascade') {
      const cascadeRow = Math.floor((time.current / 80) % rows);
      for (let col = 0; col < columns; col++) {
        if (Math.random() > 0.6) {
          const index = cascadeRow * columns + col;
          updateSingleLetter(index);
        }
      }
    } else {
      for (let i = 0; i < updateCount; i++) {
        const index = Math.floor(Math.random() * letters.current.length);
        updateSingleLetter(index);
      }
    }
  }, [flowPattern, getRandomChar, getRandomColor, smooth]);

  const handleSmoothTransitions = useCallback(() => {
    let needsRedraw = false;
    const transitionSpeed = 0.08;

    letters.current.forEach(letter => {
      if (letter.colorProgress < 1) {
        letter.colorProgress = Math.min(1, letter.colorProgress + transitionSpeed);
        const startRgb = hexToRgb(letter.color);
        const endRgb = hexToRgb(letter.targetColor);
        if (startRgb && endRgb) {
          const interpolated = interpolateColor(startRgb, endRgb, letter.colorProgress);
          letter.color = `rgb(${interpolated.r}, ${interpolated.g}, ${interpolated.b})`;
          needsRedraw = true;
        }
      }

      if (letter.charProgress < 1) {
        letter.charProgress = Math.min(1, letter.charProgress + transitionSpeed * 1.5);
        if (letter.charProgress > 0.5 && letter.char !== letter.nextChar) {
          letter.char = letter.nextChar;
          needsRedraw = true;
        }
      }

      const opacityDiff = letter.targetOpacity - letter.opacity;
      if (Math.abs(opacityDiff) > 0.001) {
        letter.opacity += opacityDiff * 0.05;
        needsRedraw = true;
      }
    });

    return needsRedraw;
  }, []);

  const animate = useCallback(() => {
    time.current += 16;
    const now = Date.now();

    if (now - lastGlitchTime.current >= glitchSpeed) {
      updateLetters();
      lastGlitchTime.current = now;
    }

    const needsRedraw = smooth ? handleSmoothTransitions() : false;
    
    if (needsRedraw || waveEffect) {
      drawLetters();
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [glitchSpeed, smooth, waveEffect, updateLetters, handleSmoothTransitions, drawLetters]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    context.current = canvas.getContext('2d', { alpha: true });
    resizeCanvas();
    animationRef.current = requestAnimationFrame(animate);

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        resizeCanvas();
        animationRef.current = requestAnimationFrame(animate);
      }, 150);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [animate, resizeCanvas]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      <canvas ref={canvasRef} className="block w-full h-full" />
      {outerVignette && (
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,_transparent_50%,_rgba(0,0,0,0.7)_100%)]" />
      )}
      {centerVignette && (
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,_rgba(0,0,0,0.6)_0%,_transparent_40%)]" />
      )}
    </div>
  );
};

export default LetterGlitch;
