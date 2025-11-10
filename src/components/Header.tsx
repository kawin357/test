import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, MessageCircle, Plus, History, Settings } from 'lucide-react';
import { signOut } from 'firebase/auth';

import { auth } from '@/lib/firebase';
import companyLogo from '@/assets/company-logo.png';
import ContactDialog from './ContactDialog';
import ThemeToggle from './ThemeToggle';
import { ChatSession } from '@/types/chat';
import { getChatHistory } from '@/services/chatHistory';

interface HeaderProps {
  user: any;
  onAuthClick: () => void;
  onGoToWelcome?: () => void;
  isTransparent?: boolean;
  isHidden?: boolean;
  isChatActive?: boolean;
  onNewChat?: () => void;
  onOpenHistory?: () => void;
  isWelcomeScreen?: boolean;
  onContactOpen?: (isOpen: boolean) => void;
}

const Header = ({ user, onAuthClick, onGoToWelcome, isChatActive, onNewChat, onOpenHistory, isWelcomeScreen, isHidden, onContactOpen }: HeaderProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onGoToWelcome?.();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isHidden) return null;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        isChatActive
          ? 'border-t border-border dark:border-purple-500/30 bg-card/30 dark:bg-gradient-to-r dark:from-purple-900/20 dark:via-slate-800/20 dark:to-blue-900/20 backdrop-blur-sm dark:shadow-lg dark:shadow-purple-500/10'
          : isWelcomeScreen
          ? scrolled
            ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200/50 shadow-md'
            : 'bg-transparent'
          : scrolled
          ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200/50 shadow-md'
          : 'bg-white'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 flex items-center justify-between">
        {/* Logo and Brand - Left Side */}
        <div className="flex items-center space-x-3">
          <motion.button
            onClick={onGoToWelcome}
            className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3 cursor-pointer hover:opacity-80 transition-opacity duration-200"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img
              src={companyLogo}
              alt="Company Logo"
              className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 object-contain"
              loading="eager"
            />
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 bg-clip-text text-transparent">
              chatz.IO
            </h1>
          </motion.button>
        </div>

        {/* Right Side Actions */}
        <motion.div
          className="flex items-center space-x-1 sm:space-x-2 md:space-x-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Settings Menu - Desktop & Mobile */}
          <div className="relative">
            <motion.button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-full transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Settings"
            >
              <Settings size={18} className="sm:w-5 sm:h-5 text-slate-700" />
            </motion.button>

            <AnimatePresence>
              {showSettingsMenu && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[95]"
                    onClick={() => setShowSettingsMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute top-full right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden z-[96] min-w-[220px]"
                  >
                    {/* New Chat */}
                    {isChatActive && onNewChat && (
                      <motion.button
                        onClick={() => {
                          onNewChat();
                          setShowSettingsMenu(false);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3.5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 text-left"
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Plus size={20} className="text-blue-500" />
                        <span className="text-sm font-semibold text-slate-700">New Chat</span>
                      </motion.button>
                    )}

                    {/* History - available both in chat and welcome screen */}
                    {onOpenHistory && (
                      <motion.button
                        onClick={() => {
                          onOpenHistory();
                          setShowSettingsMenu(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3.5 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-300 text-left ${isChatActive ? 'border-t border-slate-200/50' : ''}`}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <History size={20} className="text-purple-500" />
                        <span className="text-sm font-semibold text-slate-700">History</span>
                      </motion.button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {user ? (
            <>
              {/* Contact Button */}
              <ContactDialog onOpenChange={onContactOpen}>
                <motion.button
                  className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-full transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Contact"
                >
                  <MessageCircle size={18} className="sm:w-5 sm:h-5 text-slate-700" />
                </motion.button>
              </ContactDialog>

              {/* User Info */}
              <div className="hidden sm:flex items-center space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-100">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-r from-emerald-500 to-indigo-600 flex items-center justify-center">
                  <User size={12} className="sm:w-3.5 sm:h-3.5 text-white" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-slate-700 max-w-20 sm:max-w-32 truncate">
                  {user.email}
                </span>
              </div>

              {/* Logout Button */}
              <motion.button
                onClick={handleSignOut}
                className="p-1.5 sm:p-2 hover:bg-red-50 rounded-full transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Sign Out"
              >
                <LogOut size={18} className="sm:w-5 sm:h-5 text-red-600" />
              </motion.button>
            </>
          ) : (
            <>
              {/* Contact Button */}
              <ContactDialog onOpenChange={onContactOpen}>
                <motion.button
                  className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-full transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Contact"
                >
                  <MessageCircle size={18} className="sm:w-5 sm:h-5 text-slate-700" />
                </motion.button>
              </ContactDialog>

              {/* Login Button */}
              <motion.button
                onClick={onAuthClick}
                className="bg-gradient-to-r from-emerald-500 to-indigo-600 text-white rounded-lg px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 text-sm sm:text-base font-medium shadow-md hover:shadow-lg transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Login
              </motion.button>
            </>
          )}
        </motion.div>
      </div>
    </header>
  );
};

export default Header;
