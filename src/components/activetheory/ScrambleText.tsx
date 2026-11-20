import React, { useState, useEffect, useRef } from 'react';

interface ScrambleTextProps {
  text: string;
  className?: string;
  scrambleOnHover?: boolean;
  trigger?: unknown;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\#%+=-_';

export const ScrambleText: React.FC<ScrambleTextProps> = ({
  text,
  className = '',
  scrambleOnHover = true,
  trigger,
}) => {
  const [displayed, setDisplayed] = useState(text);
  const frameRef = useRef<number | null>(null);

  const runScramble = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    let iteration = 0;

    const step = () => {
      setDisplayed(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration) return text[index];
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('')
      );

      iteration += Math.max(0.5, text.length / 18);
      if (iteration < text.length) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        setDisplayed(text);
      }
    };

    frameRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    runScramble();
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, trigger]);

  return (
    <span
      className={className}
      onMouseEnter={scrambleOnHover ? runScramble : undefined}
    >
      {displayed}
    </span>
  );
};

export default ScrambleText;
