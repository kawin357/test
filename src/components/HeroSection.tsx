import { Button } from "@/components/ui/button";
import { ArrowUpRight, Play, CheckCircle } from "lucide-react";
import heroImage from "@/assets/hero-pumps.jpg";

const HeroSection = () => {
  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-orange-400 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-400 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-orange-300 rounded-full blur-2xl animate-bounce"></div>
      </div>

      <div className="container mx-auto px-4 py-20 flex items-center min-h-screen">
        <div className="grid md:grid-cols-2 gap-12 items-center w-full">
          {/* Content */}
          <div className="space-y-8 z-10 animate-fade-in">
            <div className="flex items-center gap-3 text-orange-600 font-bold">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              </div>
              <span className="text-lg">Now Exporting Worldwide</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-bold leading-tight text-gray-900">
                Smart Pumping
                <span className="block">Solutions by</span>
                <span className="block bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">FloQ Pumps</span>
              </h1>
              
              <div className="flex items-center gap-3 text-xl">
                <ArrowUpRight className="h-6 w-6 text-blue-600" />
                <span className="text-gray-600 font-medium">floqpump.com</span>
              </div>
            </div>

            <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
              FLOQ is your trusted destination for complete fluid handling solutions, 
              delivering performance driven pumps for a wide range of industries.
            </p>

            <div className="flex items-center gap-4 mb-8">
              {[
                "9+ Years Experience",
                "ISO Certified",
                "2-Year Warranty"
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">{item}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-lg font-semibold"
                onClick={() => window.location.href = '/products'}
              >
                View All Products
                <ArrowUpRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-6 text-lg font-semibold transition-all duration-300"
                onClick={() => window.location.href = '/contact'}
              >
                <Play className="mr-2 h-5 w-5" />
                Get In Touch
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative overflow-hidden transition-all duration-500 group">
              <img 
                src={heroImage} 
                alt="Professional pump systems and engineering" 
                className="w-full h-[600px] object-cover group-hover:scale-105 transition-transform duration-700 rounded-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/10 to-transparent"></div>
              
              <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">9+</div>
                  <div className="text-sm text-gray-600">Years Experience</div>
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-orange-400 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-400/20 rounded-full blur-xl animate-pulse delay-500"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;