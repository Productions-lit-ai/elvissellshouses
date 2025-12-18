import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Home, Building2, Award, Users, TrendingUp } from 'lucide-react';
import elvis1 from '@/assets/elvis-1.jpg';
import elvis2 from '@/assets/elvis-2.jpg';

const HeroPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative hero-gradient min-h-[90vh] flex items-center overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-32 h-32 border border-primary-foreground rounded-full" />
          <div className="absolute top-40 right-20 w-48 h-48 border border-primary-foreground rounded-full" />
          <div className="absolute bottom-20 left-1/4 w-24 h-24 border border-primary-foreground rounded-full" />
        </div>

        <div className="container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="text-center lg:text-left pt-16 md:pt-0">
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-primary-foreground mb-6 animate-fade-in">
                ELVIS<br />
                <span className="text-accent">SELLS</span><br />
                HOUSES
              </h1>
              <p className="text-lg sm:text-xl text-primary-foreground/80 mb-8 max-w-lg mx-auto lg:mx-0 animate-fade-in stagger-1" style={{ opacity: 0 }}>
                Your trusted partner in real estate. Whether you're buying your dream home or selling your property, I'm here to guide you every step of the way.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in stagger-2" style={{ opacity: 0 }}>
                <Link to="/buy">
                  <Button variant="hero" size="xl" className="w-full sm:w-auto">
                    Buy a Home
                    <ArrowRight size={20} />
                  </Button>
                </Link>
                <Link to="/sell">
                  <Button variant="hero-outline" size="xl" className="w-full sm:w-auto">
                    Sell Your House
                    <Building2 size={20} />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Image */}
            <div className="relative flex justify-center lg:justify-end animate-fade-in stagger-3" style={{ opacity: 0 }}>
              <div className="relative">
                <div className="absolute -inset-4 bg-accent/20 rounded-3xl blur-2xl" />
                <img
                  src={elvis1}
                  alt="Elvis - Your Real Estate Expert"
                  className="relative rounded-2xl shadow-2xl w-full max-w-md object-cover aspect-[3/4]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Why Choose Elvis?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              With dedication, expertise, and a client-first approach, I make real estate simple.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Award,
                title: 'Expert Guidance',
                description: 'Years of experience in the real estate market to help you make informed decisions.',
              },
              {
                icon: Users,
                title: 'Client-Focused',
                description: 'Your needs come first. I listen, understand, and deliver results that exceed expectations.',
              },
              {
                icon: TrendingUp,
                title: 'Market Knowledge',
                description: 'Deep understanding of local market trends to get you the best deals.',
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="bg-card rounded-2xl p-8 card-elevated text-center group"
              >
                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-accent/20 transition-colors">
                  <feature.icon className="w-8 h-8 text-accent" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-card-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img
                src={elvis2}
                alt="What you're really paying for in a home"
                className="rounded-2xl shadow-xl w-full max-w-lg mx-auto"
              />
            </div>
            <div className="text-center lg:text-left">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Ready to Make Your Move?
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Whether you're a first-time buyer looking for your dream home or ready to sell your property for top dollar, I'm here to make the process smooth and stress-free.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/signup">
                  <Button variant="accent" size="lg">
                    Get Started Today
                    <ArrowRight size={18} />
                  </Button>
                </Link>
                <Link to="/about">
                  <Button variant="outline" size="lg">
                    Learn More About Me
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HeroPage;
