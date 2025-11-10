import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CodeCanvas from './CodeCanvas';
import { parseMessageForCode } from '@/utils/codeParser';

// Helper function to render text with links properly
const renderTextWithLinks = (text: string) => {
  // Fix HTML entities first
  let processedText = text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&');

  // Handle HTML <a> tags first - render as actual clickable links
  if (processedText.includes('<a href=')) {
    return (
      <span 
        className="inline-block"
        dangerouslySetInnerHTML={{ __html: processedText }}
        style={{
          // Ensure links are styled properly
          color: 'inherit'
        }}
      />
    );
  }

  // Simple regex to detect URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = processedText.split(urlRegex);

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline font-semibold"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

interface TypingMessageProps {
  content: string;
  onComplete?: () => void;
  speed?: number;
  showThinking?: boolean;
  isChatGPTStyle?: boolean;
}

const TypingMessage = ({ content, onComplete, speed = 2, showThinking = false, isChatGPTStyle = true }: TypingMessageProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [isThinking, setIsThinking] = useState(showThinking);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const [thinkingComplete, setThinkingComplete] = useState(false);

  // Scroll to bottom when text updates
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedText]);

  // Thinking phase
  useEffect(() => {
    if (showThinking && isChatGPTStyle && !thinkingComplete) {
      const thinkingTimer = setTimeout(() => {
        setIsThinking(false);
        setThinkingComplete(true);
      }, 1200); // Short thinking time
      return () => clearTimeout(thinkingTimer);
    } else if (!showThinking) {
      setThinkingComplete(true);
    }
  }, [showThinking, isChatGPTStyle, thinkingComplete]);

  // Typing effect
  useEffect(() => {
    if (!thinkingComplete || isTypingComplete) return;

    let timer: number;
    
    if (currentIndex < content.length) {
      const nextChar = content[currentIndex];
      
      // Variable speed based on character type (much faster now)
      const charSpeed = 
        nextChar === ' ' ? speed * 0.3 :
        /[.!?]/.test(nextChar) ? speed * 1.5 :
        /[,;:]/.test(nextChar) ? speed * 1 :
        /[\n]/.test(nextChar) ? speed * 1 :
        speed;

      timer = window.setTimeout(() => {
        setDisplayedText(prev => prev + nextChar);
        setCurrentIndex(prev => prev + 1);
      }, Math.max(1, charSpeed));
    } else {
      setIsTypingComplete(true);
      setShowCursor(false);
      onComplete?.();
    }

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [currentIndex, content, speed, onComplete, thinkingComplete, isTypingComplete]);

  // Reset state when content changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsTypingComplete(false);
    setShowCursor(true);
    setIsThinking(showThinking && isChatGPTStyle);
    setThinkingComplete(!showThinking);
  }, [content, showThinking, isChatGPTStyle]);

  // Format text with emojis and better styling
  const formatTextContent = (text: string): JSX.Element => {
    // Fix HTML entities FIRST before splitting
    let processedText = text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&amp;/g, '&');
    
    const lines = processedText.split('\n');
    
    return (
      <>
        {lines.map((line, index) => {
          // Check for HTML links FIRST before any other processing
          if (line.includes('<a href=')) {
            return (
              <div 
                key={index} 
                className="my-1 inline-block"
                dangerouslySetInnerHTML={{ __html: line }}
                style={{
                  // Style links with proper colors
                  wordBreak: 'break-word'
                }}
              />
            );
          }
          
          // Remove ** from text and make it bold
          let processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          
          // Handle headers (remove # and make bold with emoji)
          const headerMatch = line.match(/^#{1,6}\s+(.+)$/);
          if (headerMatch) {
            return (
              <div key={index} className="font-bold text-lg text-slate-900 dark:text-white my-3 flex items-center">
                <span className="mr-2">📋</span>
                <span>{headerMatch[1]}</span>
              </div>
            );
          }
          
          // Handle steps with colon (make bold with emoji)
          const stepMatch = line.match(/^(Step \d+|\d+\.)\s*:?\s*(.+)$/i);
          if (stepMatch) {
            return (
              <div key={index} className="my-2 flex items-start">
                <span className="mr-2 text-blue-600">⭐</span>
                <div>
                  <strong className="font-bold text-slate-900 dark:text-white">{stepMatch[1].replace(':', '')}: </strong>
                  <span>{stepMatch[2]}</span>
                </div>
              </div>
            );
          }
          
          // Handle numbered lists
          const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
          if (numberedMatch) {
            return (
              <div key={index} className="my-2 flex items-start">
                <span className="mr-2 font-bold text-blue-600">{numberedMatch[1]}.</span>
                <span className="font-medium">{numberedMatch[2]}</span>
              </div>
            );
          }
          
          // Handle bullet points
          const bulletMatch = line.match(/^[-*]\s+(.+)$/);
          if (bulletMatch) {
            return (
              <div key={index} className="my-1 flex items-start ml-4">
                <span className="mr-2 text-blue-500">⭐</span>
                <span className="font-medium">{bulletMatch[1]}</span>
              </div>
            );
          }
          
          // Handle special sections with colon (but not if it's a URL)
          const colonMatch = line.match(/^(.+?):\s*(.*)$/);
          if (colonMatch && !line.includes('http') && !line.includes('<strong>') && colonMatch[1].length < 30) {
            return (
              <div key={index} className="my-2">
                <strong className="font-bold text-slate-900 dark:text-white">{colonMatch[1]}:</strong>
                {colonMatch[2] && <span className="ml-1">{colonMatch[2]}</span>}
              </div>
            );
          }
          
          if (!line.trim()) {
            return <br key={index} />;
          }
          
          // Handle bold text
          if (processedLine.includes('<strong>')) {
            return (
              <div 
                key={index} 
                className="my-1"
                dangerouslySetInnerHTML={{ __html: processedLine }}
              />
            );
          }
          
          return (
            <div key={index} className="my-1">
              {line}
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className="space-y-3 w-full">
      {/* Thinking indicator */}
      <AnimatePresence>
        {isThinking && showThinking && isChatGPTStyle && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-3 py-2 sm:px-4 sm:py-3 rounded-2xl shadow-md bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 border-l-4 border-l-blue-400 shadow-lg backdrop-blur-xl"
            style={{
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
            }}
          >
            <div className="flex items-center space-x-2">
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                className="w-1.5 h-1.5 bg-slate-400 rounded-full"
              />
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                className="w-1.5 h-1.5 bg-slate-400 rounded-full"
              />
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                className="w-1.5 h-1.5 bg-slate-400 rounded-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main typing content with code parsing */}
      {thinkingComplete && displayedText && (() => {
        const parsed = parseMessageForCode(displayedText);
        
        return (
          <div className="space-y-3 w-full">
            {parsed.segments.map((segment, idx) => {
              if (segment.type === 'text') {
                return (
                  <motion.div
                    key={`text-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-3 py-2 sm:px-4 sm:py-3 rounded-2xl shadow-md bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 border-l-4 border-l-blue-400 shadow-lg backdrop-blur-xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.6)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                    }}
                  >
                    <div className="text-sm sm:text-base leading-relaxed break-words">
                      {formatTextContent(segment.content)}
                      {showCursor && idx === parsed.segments.length - 1 && (
                        <motion.span
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                          className="inline-block w-0.5 h-4 bg-slate-600 ml-0.5"
                        />
                      )}
                    </div>
                  </motion.div>
                );
              }
              
              return (
                <motion.div
                  key={`code-${idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full bg-white rounded-2xl border border-slate-200 border-l-4 border-l-blue-400 shadow-lg overflow-hidden"
                >
                  <CodeCanvas
                    code={segment.content}
                    language={segment.language}
                  />
                </motion.div>
              );
            })}
            <div ref={messageEndRef} />
          </div>
        );
      })()}
    </div>
  );
};

export default TypingMessage;