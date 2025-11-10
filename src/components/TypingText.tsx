import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TypingTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

const TypingText = ({ text, speed = 0.3, onComplete }: TypingTextProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (onComplete && currentIndex === text.length && text.length > 0) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  const formatTextWithHeaders = (content: string): JSX.Element => {
    // Remove ** markers but keep the bold styling
    const lines = content.split('\n');

    return (
      <>
        {lines.map((line, index) => {
          // Remove ** markers from the line
          const cleanLine = line.replace(/\*\*/g, '');
          
          // Check if line is a heading (starts with # or contains typical heading patterns)
          const isHeading = cleanLine.match(/^(#+\s|Example:|Note:|Step \d+:|Summary:|Conclusion:|Heading:|Subheading:)/i) || 
                           line.includes('**');
          
          const headerWithColonMatch = cleanLine.match(/^(.+?):\s*(.*)$/);
          if (headerWithColonMatch && isHeading) {
            return (
              <div key={index} className="my-1">
                <strong className="font-extrabold text-slate-900 dark:text-white">
                  {headerWithColonMatch[1]}:
                </strong>
                {headerWithColonMatch[2] && <span> {headerWithColonMatch[2]}</span>}
              </div>
            );
          }

          const headerWithDashMatch = cleanLine.match(/^-\s+(.+)$/);
          if (headerWithDashMatch) {
            return (
              <div key={index} className="my-1">
                <strong className="font-semibold text-slate-900 dark:text-white">
                  - {headerWithDashMatch[1]}
                </strong>
              </div>
            );
          }

          if (isHeading) {
            return (
              <div key={index} className="my-1 font-extrabold text-slate-900 dark:text-white">
                {cleanLine}
              </div>
            );
          }

          const numberedMatch = cleanLine.match(/^(\d+)\.\s+(.+)$/);
          if (numberedMatch) {
            return (
              <div key={index} className="my-0.5">
                <strong className="font-bold">{numberedMatch[1]}.</strong> {numberedMatch[2]}
              </div>
            );
          }

          const starMatch = cleanLine.match(/^[★\*]\s+(.+)$/);
          if (starMatch && !headerWithDashMatch) {
            return (
              <div key={index} className="my-0.5">
                <strong className="font-bold">★</strong> {starMatch[1]}
              </div>
            );
          }

          if (!cleanLine.trim()) {
            return <br key={index} />;
          }

          return <div key={index} className="my-0.5">{cleanLine}</div>;
        })}
      </>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="break-words"
    >
      {formatTextWithHeaders(displayedText)}
      {currentIndex < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-0.5 h-4 bg-current ml-0.5 align-middle"
        />
      )}
    </motion.div>
  );
};

export default TypingText;
