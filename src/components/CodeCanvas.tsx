 import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Code } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';

interface CodeCanvasProps {
  code: string;
  language?: string;
  enableTyping?: boolean;
}

const CodeCanvas = ({ code, language = 'javascript', enableTyping = false }: CodeCanvasProps) => {
  const [copied, setCopied] = useState(false);
  const [displayedCode, setDisplayedCode] = useState(enableTyping ? '' : code);
  const { toast } = useToast();
  const { theme } = useTheme();

  useEffect(() => {
    if (!enableTyping) {
      setDisplayedCode(code);
      return;
    }

    let currentIndex = 0;
    setDisplayedCode('');

    const interval = setInterval(() => {
      if (currentIndex < code.length) {
        setDisplayedCode(code.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 0.5);

    return () => clearInterval(interval);
  }, [code, enableTyping]);

  const handleCopy = async () => {
    try {
      // Always copy the full code, not just displayed code
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // Determine border color for Python and C code blocks
  const isSpecialLanguage = ['python', 'c'].includes(language.toLowerCase());
  const borderClass = isSpecialLanguage ? 'border-blue-700 dark:border-blue-500' : 'border-slate-200 dark:border-slate-700';
  const headerClass = 'bg-black text-white';
  const copyButtonClass = 'text-white hover:bg-slate-700';
  const iconClass = 'text-white';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`w-full max-w-full overflow-hidden rounded-xl border-2 ${borderClass} bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 shadow-xl hover:shadow-2xl transition-all duration-300`}
      style={{
        background: theme === 'dark' 
          ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Header with Prominent Separator and Gradient */}
      <div 
        className={`flex items-center justify-between px-2 py-1 sm:px-3 sm:py-1.5 ${headerClass} relative overflow-hidden`}
        style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.3)'
        }}
      >
        {/* Animated background glow */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10"
          animate={{
            x: ['-100%', '100%']
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <div className="flex items-center space-x-2 relative z-10">
          <motion.div 
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center border border-blue-400/30"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Code size={14} className={`sm:w-4 sm:h-4 text-blue-300`} />
          </motion.div>
          <span className="text-sm sm:text-base font-semibold capitalize text-white bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
            {language}
          </span>
        </div>
        <motion.button
          onClick={handleCopy}
          className={`flex items-center space-x-1 px-2 py-1 text-xs ${copyButtonClass} rounded-lg transition-all duration-200 relative z-10 border border-slate-600/50 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500`}
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {copied ? (
            <>
              <Check size={12} className="text-green-500" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Code Content with Enhanced Background */}
      <div className="relative overflow-x-auto">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full bg-[linear-gradient(to_right,#3b82f620_1px,transparent_1px),linear-gradient(to_bottom,#3b82f620_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        </div>
        
        <SyntaxHighlighter
          language={language}
          style={theme === 'dark' ? oneDark : oneLight}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '0.9rem',
            lineHeight: '1.6',
            backgroundColor: 'transparent',
            borderRadius: 0,
            fontWeight: '500',
            position: 'relative',
            zIndex: 10
          }}
          codeTagProps={{
            style: {
              fontSize: '0.9rem',
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
              fontWeight: '500',
              textShadow: theme === 'dark' ? '0 1px 2px rgba(0,0,0,0.5)' : 'none'
            }
          }}
          wrapLines={true}
          wrapLongLines={true}
          showLineNumbers={false}
        >
          {displayedCode}
        </SyntaxHighlighter>
      </div>
    </motion.div>
  );
};

export default CodeCanvas;
