import LetterGlitch from './LetterGlitch';

const BackgroundAnimation = () => {
  return (
    <>
      {/* Layer 1: Green & Blue Text Glitch Background - Deepest layer */}
      <div className="fixed inset-0 -z-30 bg-black">
        <LetterGlitch
          glitchColors={['#10b981', '#22c55e', '#34d399', '#14b8a6', '#06b6d4', '#3b82f6', '#60a5fa']}
          glitchSpeed={70}
          centerVignette={false}
          outerVignette={true}
          smooth={true}
          characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789"
        />
      </div>
      
      {/* Layer 2: Light White Glassmorphism Wall - Between glitch and content */}
      <div className="fixed inset-0 -z-20">
        {/* Main white glass layer with strong blur */}
        <div className="absolute inset-0 backdrop-blur-[60px] bg-white/90" />
        
        {/* Extra frosted glass effect */}
        <div className="absolute inset-0 backdrop-saturate-180 bg-white/10" />
        
        {/* Subtle gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-white/85" />
        
        {/* Glass reflection effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(255,255,255,0.8)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(255,255,255,0.6)_0%,_transparent_50%)]" />
        
        {/* Glass edge highlights */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        
        {/* Subtle noise texture for realism */}
        <div 
          className="absolute inset-0 opacity-[0.015] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>
    </>
  );
};

export default BackgroundAnimation;
