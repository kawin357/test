import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import companyLogo from '@/assets/company-logo.png';
import ModelSelector, { AIModel } from './ModelSelector';

interface WelcomeScreenProps {
  user: any;
  onSendMessage: (message: string) => void;
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
}

const WelcomeScreen = ({ user, onSendMessage, selectedModel, onModelChange }: WelcomeScreenProps) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const userName = user?.email?.split('@')[0] || 'Guest';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 px-4 relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl w-full relative z-10"
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-6 sm:mb-8"
        >
          <img
            src={companyLogo}
            alt="Company Logo"
            className="w-20 h-20 sm:w-28 sm:h-28 mx-auto drop-shadow-2xl"
          />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-emerald-700 via-blue-700 to-cyan-700 bg-clip-text text-transparent px-2"
        >
          {user ? `Welcome ${userName}!` : 'Welcome to chatz.IO'}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-base sm:text-lg md:text-xl text-slate-800 mb-6 sm:mb-8 px-2 font-semibold"
        >
          Your AI Study Assistant - Homework Help, Exam Prep & More
        </motion.p>

        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-xs sm:text-sm text-slate-700 mb-6 sm:mb-8 px-2 font-semibold"
          >
            <p>Ask questions, get homework help, prepare for exams, or research any topic</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mb-4"
        >
          <ModelSelector selectedModel={selectedModel} onModelChange={onModelChange} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="w-full"
        >
          <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <motion.input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about your studies..."
                className="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl border-2 border-slate-400/40 bg-white/80 backdrop-blur-sm text-slate-900 placeholder:text-slate-600 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all duration-200 text-sm sm:text-base font-medium shadow-lg"
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              />
              <motion.button
                type="submit"
                disabled={!input.trim()}
                className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-r from-emerald-600 via-blue-600 to-cyan-600 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 flex-shrink-0"
                whileHover={{ scale: input.trim() ? 1.05 : 1 }}
                whileTap={{ scale: input.trim() ? 0.95 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Send size={18} className="sm:w-5 sm:h-5" />
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
