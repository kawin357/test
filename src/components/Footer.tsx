import { motion } from 'framer-motion';
import logo from '@/assets/logo.png';
interface FooterProps {
  isVisible: boolean;
}

const Footer = ({ isVisible }: FooterProps) => {
  if (!isVisible) return null;

  return (
    <footer className="border-t border-slate-300/40 relative">
      <div className="absolute inset-0 bg-white/60 backdrop-blur-xl" />

      <motion.div
        className="max-w-6xl mx-auto px-4 sm:px-6 py-2 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-center space-x-2">
          <p className="text-xs md:text-sm bg-gradient-to-r from-emerald-700 to-blue-700 bg-clip-text text-transparent font-bold">
            Powered By
          </p>
          <img
            src={logo}
            alt="Company Logo"
            className="w-10 h-8 md:w-12 md:h-10 object-contain"
            loading="eager"
          />
        </div>
      </motion.div>
    </footer>
  );
};

export default Footer;