import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Copy, Check, Mic, MicOff, Volume2, VolumeX, AlertCircle, Edit2, X as CloseIcon, X } from 'lucide-react';
import { Message } from '@/types/chat';
import botLogo from '@/assets/bot-logo.png';
import CodeCanvas from './CodeCanvas';
import { parseMessageForCode } from '@/utils/codeParser';
import ModelSelector, { AIModel } from './ModelSelector';
import TypingMessage from './TypingMessage';
import { useToast } from '@/hooks/use-toast';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChatInterfaceProps {
  onSendMessage: (message: string) => void;
  messages: Message[];
  isLoading: boolean;
  isAuthenticated: boolean;
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
  onNewChat: () => void;
  onStopResponse?: () => void;
}

const ChatInterface = ({ onSendMessage, messages, isLoading, isAuthenticated, selectedModel, onModelChange, onNewChat, onStopResponse }: ChatInterfaceProps) => {
  const [input, setInput] = useState('');
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [clickedMessageId, setClickedMessageId] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState('thinking...');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const { isListening, transcript, isSupported: isSpeechRecognitionSupported, permissionDenied, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const { speak, stop: stopSpeaking, isSpeaking, isSupported: isSpeechSynthesisSupported } = useSpeechSynthesis();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cycle loading text
  useEffect(() => {
    if (!isLoading) {
      setLoadingText('thinking...');
      return;
    }
    
    const texts = ['thinking...', 'computing...', 'fetching...', 'searching...', 'processing...', 'analyzing...', 'executing...', 'loading...'];
    let index = 0;
    
    const interval = setInterval(() => {
      index = (index + 1) % texts.length;
      setLoadingText(texts[index]);
    }, 1200);
    
    return () => clearInterval(interval);
  }, [isLoading]);



  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
      resetTranscript();
      // Clear any potential cached responses
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      if (!isSpeechRecognitionSupported) {
        toast({
          title: "Not Supported",
          description: "Voice input is not supported in your browser. Try using Chrome or Safari on mobile.",
          variant: "destructive",
        });
        return;
      }
      
      if (permissionDenied) {
        toast({
          title: "Permission Required",
          description: "Please allow microphone access in your browser settings to use voice input.",
          variant: "destructive",
        });
        return;
      }
      
      startListening();
    }
  };


  const handleSpeak = (messageId: string, text: string) => {
    if (!isSpeechSynthesisSupported) {
      toast({
        title: "Not Supported",
        description: "Text-to-speech is not available in your browser. Please try Chrome, Safari, or Edge.",
        variant: "destructive",
      });
      return;
    }

    if (speakingMessageId === messageId) {
      stopSpeaking();
      setSpeakingMessageId(null);
    } else {
      stopSpeaking();
      setSpeakingMessageId(messageId);

      const parsed = parseMessageForCode(text);
      const cleanText = parsed.segments
        .filter((segment) => segment.type === 'text')
        .map((segment) => segment.content)
        .join('\n')
        .replace(/[*_~`#]/g, '');

      speak(cleanText);

      const checkSpeaking = setInterval(() => {
        if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
          setSpeakingMessageId(null);
          clearInterval(checkSpeaking);
        }
      }, 200);

      setTimeout(() => {
        clearInterval(checkSpeaking);
        if (speakingMessageId === messageId) {
          setSpeakingMessageId(null);
        }
      }, 60000);
    }
  };

  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      const parsed = parseMessageForCode(content);
      const combinedText = parsed.segments
        .map((segment) => segment.content)
        .filter(Boolean)
        .join('\n\n');
      await navigator.clipboard.writeText(combinedText);
      setCopiedMessageId(messageId);
      
      setTimeout(() => {
        setCopiedMessageId(current => current === messageId ? null : current);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditText(content);
  };

  const handleSaveEdit = (messageId: string) => {
    if (editText.trim() && editText !== messages.find(m => m.id === messageId)?.content) {
      onSendMessage(editText.trim());
    }
    setEditingMessageId(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText('');
  };

  const formatAIResponse = (content: string): JSX.Element => {
    let processedContent = content
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^#{1,6}\s+(.+)$/gm, '<strong>$1</strong>')
      // Fix HTML entities in links
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&amp;/g, '&');

    const lines = processedContent.split('\n');

    return (
      <>
        {lines.map((line, index) => {
          // Check if line contains HTML tags (links, strong, etc.)
          if (line.includes('<a href=') || line.includes('<strong>')) {
            return (
              <div
                key={index}
                className="my-1 inline-block"
                dangerouslySetInnerHTML={{ __html: line }}
                style={{
                  wordBreak: 'break-word',
                  maxWidth: '100%'
                }}
              />
            );
          }

          const headerWithColonMatch = line.match(/^(.+?):\s*(.*)$/);
          if (headerWithColonMatch && !line.includes('<strong>')) {
            return (
              <div key={index} className="my-1">
                <strong className="font-bold text-slate-900 dark:text-white">
                  {headerWithColonMatch[1]}:
                </strong>
                {headerWithColonMatch[2] && <span> {headerWithColonMatch[2]}</span>}
              </div>
            );
          }

          const headerWithDashMatch = line.match(/^-\s+(.+)$/);
          if (headerWithDashMatch) {
            return (
              <div key={index} className="my-1">
                <strong className="font-bold text-slate-900 dark:text-white">
                  - {headerWithDashMatch[1]}
                </strong>
              </div>
            );
          }

          const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
          if (numberedMatch) {
            return (
              <div key={index} className="my-0.5">
                {numberedMatch[1]}. {numberedMatch[2]}
              </div>
            );
          }

          const starMatch = line.match(/^[★\*]\s+(.+)$/);
          if (starMatch && !headerWithDashMatch) {
            return (
              <div key={index} className="my-0.5">
                ★ {starMatch[1]}
              </div>
            );
          }

          if (!line.trim()) {
            return <br key={index} />;
          }

          return <div key={index} className="my-0.5">{line}</div>;
        })}
      </>
    );
  };

  return (
    <div className="chat-container relative min-h-screen w-full overflow-x-hidden" style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Content Container */}
      <div className="relative z-10 h-full flex flex-col overflow-x-hidden" style={{ height: '100%' }}>
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 pb-40 sm:pb-40 scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-transparent w-full relative" style={{ WebkitOverflowScrolling: 'touch', paddingTop: '6rem' }}>
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            <AnimatePresence>
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-64 text-center space-y-4"
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 flex items-center justify-center shadow-lg">
                    <img src={botLogo} alt="AI" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" loading="eager" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-2">
                      Start a conversation
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 px-4 font-medium">
                      Ask me anything and I'll help you with detailed responses
                    </p>
                  </div>
                </motion.div>
              )}


              {messages.map((message, index) => {
                // Check if this is the last AI message
                const isLastAIMessage = message.type === 'ai' && index === messages.length - 1;
                
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                      delay: index * 0.05
                    }}
                    className="flex justify-center"
                  >
                    <div
                      className={`flex items-start space-x-2 sm:space-x-3 w-full max-w-4xl ${
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.type === 'ai' && (
                        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm">
                          <img src={botLogo} alt="AI" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" loading="eager" />
                        </div>
                      )}
                      
                      {/* User message edit button - positioned on the left */}
                      
                      <div
                        className={`group flex flex-col max-w-[85%] sm:max-w-[75%] ${message.type === 'user' ? 'items-end' : 'items-start'} relative`}
                        onMouseEnter={() => setHoveredMessageId(message.id)}
                        onMouseLeave={() => setHoveredMessageId(null)}
                        onClick={() => {
                          if (isMobile && message.type === 'user') {
                            setClickedMessageId(clickedMessageId === message.id ? null : message.id);
                          }
                        }}
                      >
                        {/* Use TypingMessage for last AI message, regular display for others */}
                         {isLastAIMessage && isLoading === false ? (
                          <TypingMessage
                            key={`typing-${message.id}`}
                            content={message.content}
                            speed={4}
                            showThinking={false}
                            isChatGPTStyle={true}
                          />
                        ) : (
                          <>
                            {(() => {
                              // Regular rendering for completed messages
                              const parsed = parseMessageForCode(message.content);

                              return (
                                <div className="space-y-3 w-full">
                            {parsed.segments.map((segment, idx) => {
                              if (segment.type === 'text') {
                                return (
                                  <motion.div
                                    key={`msg-${message.id}-txt-${idx}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                     className={`px-3 py-2 sm:px-4 sm:py-3 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 relative ${
                                      message.type === 'user'
                                        ? 'bg-white text-slate-900 ml-auto border-l-4 border-blue-500'
                                        : 'bg-white/70 text-slate-900 backdrop-blur-xl border-l-4 border-blue-500 border-2 border-blue-500/40'
                                    }`}
                                      style={message.type === 'ai' ? {
                                        background: 'rgba(255, 255, 255, 0.7)',
                                        backdropFilter: 'blur(12px)',
                                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
                                      } : {}}
                                    whileHover={{ scale: 1.01 }}
                                  >
                                    <div className="text-sm sm:text-base leading-relaxed break-words whitespace-pre-wrap">
                                      {message.type === 'ai' ? formatAIResponse(segment.content) : segment.content}
                                    </div>
                                  </motion.div>
                                );
                              }

                              return (
                                <motion.div
                                  key={`msg-${message.id}-code-${idx}`}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.15 }}
                                  className="w-full bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden"
                                >
                                  <CodeCanvas
                                    code={segment.content}
                                    language={segment.language}
                                  />
                                </motion.div>
                              );
                            })}
                                  </div>
                                );
                              })()}
                            </>
                          )}
                        {/* Action buttons for AI messages */}
                        {message.type === 'ai' && (
                          <div className="mt-2">
                            {/* Desktop: Show on hover */}
                            {!isMobile && hoveredMessageId === message.id && (
                              <motion.div 
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex space-x-1"
                              >
                                <button
                                  onClick={() => handleSpeak(message.id, message.content)}
                                  className="p-1.5 hover:bg-blue-50 rounded-lg transition-all duration-200 text-slate-500 hover:text-blue-600 border border-slate-200 bg-white shadow-sm"
                                  title="Speak message"
                                >
                                  {speakingMessageId === message.id ? (
                                    <VolumeX size={16} className="text-blue-500" />
                                  ) : (
                                    <Volume2 size={16} />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleCopyMessage(message.content, message.id)}
                                  className="p-1.5 hover:bg-blue-50 rounded-lg transition-all duration-200 text-slate-500 hover:text-blue-600 border border-slate-200 bg-white shadow-sm"
                                  title="Copy message"
                                >
                                  {copiedMessageId === message.id ? (
                                    <Check size={16} className="text-green-500" />
                                  ) : (
                                    <Copy size={16} />
                                  )}
                                </button>
                              </motion.div>
                            )}
                            
                            {/* Mobile: Always visible */}
                            {isMobile && (
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleSpeak(message.id, message.content)}
                                  className="mobile-action-btn"
                                  title="Speak message"
                                >
                                  {speakingMessageId === message.id ? (
                                    <VolumeX size={16} className="text-blue-500" />
                                  ) : (
                                    <Volume2 size={16} />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleCopyMessage(message.content, message.id)}
                                  className="mobile-action-btn"
                                  title="Copy message"
                                >
                                  {copiedMessageId === message.id ? (
                                    <Check size={16} className="text-green-500" />
                                  ) : (
                                    <Copy size={16} />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Hover edit button for desktop, click for mobile */}
                        {message.type === 'user' && (
                          (hoveredMessageId === message.id && !isMobile) ||
                          (clickedMessageId === message.id && isMobile)
                        ) && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditMessage(message.id, message.content);
                              setClickedMessageId(null);
                            }}
                            className="absolute -left-8 top-2 p-1.5 hover:bg-blue-50 rounded-lg transition-all duration-200 text-slate-500 hover:text-blue-600 border border-slate-200 bg-white shadow-sm"
                            title="Edit message"
                          >
                            <Edit2 size={14} />
                          </motion.button>
                        )}
                        <span className="text-xs text-slate-400 mt-1 px-1">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      
                      {message.type === 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center shadow-sm">
                          <User size={14} className="sm:w-4 sm:h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Edit Modal */}
              <AnimatePresence>
                {editingMessageId && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                    onClick={handleCancelEdit}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 w-full max-w-md mx-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-4 sm:mb-5">
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white">Edit Message</h3>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all"
                        >
                          <CloseIcon size={20} className="text-slate-600 dark:text-slate-300" />
                        </button>
                      </div>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full min-h-[120px] sm:min-h-[150px] md:min-h-[180px] p-3 sm:p-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-sm sm:text-base text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2 sm:gap-3 mt-4 sm:mt-5">
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(editingMessageId)}
                          className="px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base bg-gradient-to-r from-primary to-secondary text-white rounded-lg shadow-md hover:shadow-lg transition-all font-medium"
                        >
                          Send
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center"
                >
                  <div className="flex items-start space-x-2 sm:space-x-3 w-full max-w-4xl">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm">
                      <img src={botLogo} alt="AI" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" loading="eager" />
                    </div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="px-3 py-2 sm:px-4 sm:py-3 rounded-2xl shadow-md bg-white text-slate-800 border border-slate-200 shadow-lg"
                      style={{
                        background: 'white',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      }}
                    >
                      <div className="flex flex-col space-y-1">
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
                        <motion.p 
                          animate={{ opacity: [0.5, 0.8, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="text-[10px] text-slate-400 mt-1"
                        >
                          {loadingText}
                        </motion.p>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Floating Input Area */}
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-20 p-2 sm:p-4 bg-gradient-to-t from-black/5 to-transparent"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 30 }}
          style={{ WebkitUserSelect: 'none' }}
        >
          <div className="max-w-4xl mx-auto w-full">
            {/* Floating Container with Glassmorphism */}
            <div 
              className="bg-white/30 backdrop-blur-[40px] backdrop-saturate-[180%] rounded-3xl border border-white/40 shadow-2xl shadow-black/10 p-2 sm:p-4"
              style={{
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                backdropFilter: 'blur(40px) saturate(180%)',
              }}
            >
              {/* Permission Warning for Mobile */}
              {!isSpeechRecognitionSupported && (
                <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    Voice features work best in Chrome or Safari
                  </p>
                </div>
              )}
              
              {/* Input Form with Model Selector */}
              <form onSubmit={handleSubmit} className="relative">
                <div className="flex flex-col sm:flex-row items-stretch gap-1.5 sm:gap-2">
                  <div className="hidden sm:flex flex-shrink-0 items-center">
                    <ModelSelector selectedModel={selectedModel} onModelChange={onModelChange} />
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 bg-white/90 backdrop-blur-xl border-2 border-blue-500 p-1.5 sm:p-2 rounded-2xl shadow-lg flex-1 hover:border-blue-600 focus-within:border-blue-700 transition-all duration-300">
                    <div className="flex-shrink-0 sm:hidden">
                      <ModelSelector selectedModel={selectedModel} onModelChange={onModelChange} />
                    </div>

                    <div className="flex-1 relative">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isListening ? "Listening..." : "Type your message..."}
                        className="w-full bg-white text-sm sm:text-base text-left text-slate-700 placeholder:text-slate-400 outline-none px-2 py-2 sm:px-3 sm:py-2.5 rounded-lg resize-none scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent"
                        style={{
                          fontSize: '16px',
                          minHeight: '44px',
                          maxHeight: '140px',
                          overflowY: (input.match(/\n/g)?.length ?? 0) + 1 > 5 ? 'auto' : 'hidden',
                          height: `${Math.min(((input.match(/\n/g)?.length ?? 0) + 1), 5) * 24 + 20}px`
                        }}
                        disabled={isLoading}
                        rows={Math.min(((input.match(/\n/g)?.length ?? 0) + 1), 5)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (input.trim()) {
                              handleSubmit(e);
                            }
                          }
                        }}
                      />
                      
                      {/* Professional loader animation */}
                    </div>

                    <div className="flex items-center gap-1">
                      <motion.button
                        type="button"
                        onClick={toggleVoiceInput}
                        disabled={isLoading}
                        className={`flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 ${
                          isListening
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-white/70 hover:bg-white/90 text-slate-600'
                        } rounded-lg sm:rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        {isListening ? (
                          <MicOff size={14} className="sm:w-[18px] sm:h-[18px]" />
                        ) : (
                          <Mic size={14} className="sm:w-[18px] sm:h-[18px]" />
                        )}
                      </motion.button>

                      {isLoading ? (
                        <motion.button
                          type="button"
                          onClick={() => {
                            onStopResponse?.();
                          }}
                          className="flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-11 sm:h-11 bg-red-500 hover:bg-red-600 text-white rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          title="Stop response"
                        >
                          <X size={14} className="sm:w-5 sm:h-5" />
                        </motion.button>
                      ) : (
                        <motion.button
                          type="submit"
                          disabled={!input.trim() || isLoading}
                          className="flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-11 sm:h-11 bg-gradient-to-r from-primary to-secondary text-white rounded-lg sm:rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 relative overflow-hidden"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <Send size={14} className="sm:w-5 sm:h-5 transform transition-transform duration-200" />
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-lg sm:rounded-xl"
                            animate={{
                              x: ['-100%', '100%']
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: 3,
                              ease: "easeInOut"
                            }}
                          />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ChatInterface;