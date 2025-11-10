import { useEffect, useState } from 'react';
import BackgroundAnimation from '@/components/BackgroundAnimation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { ExternalLink, HelpCircle, Mail, MapPin, Clock, MessageCircle, Send } from 'lucide-react';
import companyLogo from '@/assets/logo.png';

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Contact - chatz.IO Student Support';

    const metaDesc = document.querySelector("meta[name='description']");
    const description = 'Contact chatz.IO student support. Get help with homework, study, exam prep.';
    if (metaDesc) metaDesc.setAttribute('content', description);
    else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = description;
      document.head.appendChild(m);
    }

    const canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    const href = window.location.origin + '/contact';
    if (canonical) canonical.href = href; else {
      const link = document.createElement('link');
      link.rel = 'canonical';
      link.href = href;
      document.head.appendChild(link);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const recipientEmail = 'integer.io.ai@gmail.com';
      const subject = encodeURIComponent(`Contact Form: Message from ${formData.name}`);
      const body = encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}\n\n---\nSent via chatz.IO Contact Page`
      );
      const mailtoLink = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
      window.location.href = mailtoLink;
      toast({ title: 'Success!', description: 'Opening your email client...', duration: 3000 });
      setTimeout(() => { setFormData({ name: '', email: '', message: '' }); setIsSubmitting(false); }, 1000);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to open email client. Please try again.', duration: 3000 });
      setIsSubmitting(false);
    }
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent("Hi, I'm a student and need help with chatz.IO");
    window.open(`https://wa.me/918015355914?text=${message}`, '_blank');
  };
  const handleVisitWebsite = () => { window.open('https://integer-io.netlify.app/', '_blank'); };

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-slate-950">
      <BackgroundAnimation />
      <main className="relative z-10 container mx-auto px-4 py-8 sm:py-12 pt-24">
        <section className="w-full sm:w-[600px] mx-auto">
          <div
            className="w-full max-w-2xl overflow-visible border-2 border-white/40 rounded-3xl p-0 shadow-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              backdropFilter: 'blur(40px) saturate(180%)',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
            }}
          >
            <header className="relative bg-transparent px-6 sm:px-8 pt-6 pb-4 border-b border-slate-200/30 rounded-t-3xl">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                Student Support
              </h1>
              <p className="text-sm sm:text-base text-slate-700 mt-2">
                Need help with your studies? We're here to assist students 24/7
              </p>
            </header>

            <div className="space-y-4 sm:space-y-5 px-6 sm:px-8 pb-6 bg-transparent">
              {/* Company Information Card */}
              <motion.div 
                className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 rounded-2xl p-4 sm:p-5 border-2 border-blue-200 shadow-lg"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Company Header */}
                <div className="flex items-center space-x-4 mb-4 pb-4 border-b-2 border-blue-100">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-00 to-emerald-500 rounded-2xl blur-md opacity-50" />
                    <img 
                      src={companyLogo} 
                      alt="Integer-IO Logo" 
                      className="w-14 h-14 sm:w-16 sm:h-16 object-contain relative z-10 drop-shadow-2xl rounded-xl" 
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent mb-1">
                      Integer-IO
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                       Your AI-powered learning companion. We help students with homework, research, exam preparation, and academic support. Available 24/7 for all your educational needs.
                    </p>
                  </div>
                </div>

                {/* Company Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div className="flex items-start space-x-3 p-3 bg-white/70 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <MapPin size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-600 mb-0.5">Location</p>
                      <p className="text-xs sm:text-sm text-slate-800 font-medium">India</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-white/70 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                      <Clock size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-600 mb-0.5">Response Time</p>
                      <p className="text-xs sm:text-sm text-slate-800 font-medium">Within 24 hours</p>
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div className="space-y-2 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse" />
                    <span className="text-xs sm:text-sm text-slate-700">
                      <span className="font-bold text-blue-600">Platform:</span> chatz.IO - Student AI Assistant
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 animate-pulse" />
                    <span className="text-xs sm:text-sm text-slate-700">
                      <span className="font-bold text-emerald-600">Features:</span> Homework Help, Study Support, Exam Prep
                    </span>
                  </div>
                </div>

                {/* Visit Website Button */}
                <motion.button
                  onClick={handleVisitWebsite}
                  className="w-full p-3 sm:p-4 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 transition-all duration-300 flex items-center justify-center space-x-2 text-white font-semibold shadow-lg hover:shadow-xl group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Visit Official Website</span>
                  <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              </motion.div>

              {/* Quick Contact Options */}
              <div className="grid grid-cols-1 gap-3">
                {/* WhatsApp Contact */}
                <motion.button
                  onClick={handleWhatsApp}
                  className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 transition-all duration-300 flex items-center space-x-3 sm:space-x-4 border-2 border-emerald-200 hover:border-emerald-300 shadow-md hover:shadow-lg group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
                    <MessageCircle size={20} className="sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-sm sm:text-base text-slate-800">Student Support Chat</div>
                    <div className="text-xs sm:text-sm text-slate-600">Get instant help - Available 24/7</div>
                  </div>
                  <Send size={18} className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>

                {/* Email Direct */}
                <motion.a
                  href="mailto:integer.io.ai@gmail.com"
                  className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 transition-all duration-300 flex items-center space-x-3 sm:space-x-4 border-2 border-blue-200 hover:border-blue-300 shadow-md hover:shadow-lg group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md">
                    <Mail size={20} className="sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-sm sm:text-base text-slate-800">Email Support</div>
                    <div className="text-xs sm:text-sm text-slate-600">student.support@chatz.io</div>
                  </div>
                  <ExternalLink size={18} className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.a>
              </div>

              {/* Email Contact Form */}
              <div className="space-y-3 p-4 sm:p-5 bg-white/70 rounded-2xl border-2 border-slate-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Send size={16} className="text-white" />
                  </div>
                  <h4 className="font-bold text-base sm:text-lg text-slate-800">Send us a Message</h4>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-3">
                  <Input
                    placeholder="Student Name *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-white border-2 border-slate-300 focus:border-blue-500 transition-colors text-slate-900 placeholder:text-slate-500 h-11"
                    required
                    disabled={isSubmitting}
                  />
                  <Input
                    type="email"
                    placeholder="Student Email *"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-white border-2 border-slate-300 focus:border-blue-500 transition-colors text-slate-900 placeholder:text-slate-500 h-11"
                    required
                    disabled={isSubmitting}
                  />
                  <Textarea
                    placeholder="How can we help with your studies? *"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="min-h-[100px] bg-white border-2 border-slate-300 focus:border-blue-500 transition-colors resize-none text-slate-900 placeholder:text-slate-500"
                    required
                    disabled={isSubmitting}
                  />
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-12 bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 hover:from-blue-700 hover:via-cyan-700 hover:to-emerald-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center space-x-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Sending...</span>
                        </span>
                      ) : (
                        <>
                          <Send size={18} className="mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Contact;
