import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Instagram, Facebook, Twitter, Linkedin, Youtube, LucideIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SocialLink {
  id: string;
  url: string;
  enabled: boolean;
}

const socialIcons: Record<string, LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
};

const Footer: React.FC = () => {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    const fetchSocialLinks = async () => {
      const { data } = await supabase
        .from('social_links')
        .select('*')
        .eq('enabled', true);
      
      if (data) {
        // Only show links that have a URL set
        setSocialLinks(data.filter(link => link.url && link.url.trim() !== ''));
      }
    };

    fetchSocialLinks();
  }, []);

  return (
    <footer className="bg-[hsl(222,47%,11%)] text-white">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="font-serif text-2xl font-bold mb-4">
              ELVIS<span className="text-accent"> SELLS</span> HOUSES
            </h3>
            <p className="text-white/70 leading-relaxed">
              Your trusted partner in finding the perfect home or selling your property with confidence.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <nav className="space-y-2">
              <Link to="/" className="block text-white/70 hover:text-accent transition-colors">
                Home
              </Link>
              <Link to="/buy" className="block text-white/70 hover:text-accent transition-colors">
                Buy a Home
              </Link>
              <Link to="/sell" className="block text-white/70 hover:text-accent transition-colors">
                Sell Your House
              </Link>
              <Link to="/about" className="block text-white/70 hover:text-accent transition-colors">
                About Us
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Contact</h4>
            <div className="space-y-3">
              <a href="tel:+16318352299" className="flex items-center gap-3 text-white/70 hover:text-accent transition-colors rounded-sm">
                <Phone size={18} />
                <span className="text-base">(631) 835-2299</span>
              </a>
              <a href="mailto:elvissellshouses@gmail.com" className="flex items-center gap-3 text-white/70 hover:text-accent transition-colors">
                <Mail size={18} />
                <span className="text-base">elvissellshouses@gmail.com</span>
              </a>
              <div className="flex items-center gap-3 text-white/70">
                <MapPin size={18} />
                <span className="text-base">Brentwood, NY</span>
              </div>
              {/* Social Media Icons */}
              {socialLinks.length > 0 && (
                <div className="flex items-center gap-4 pt-2">
                  {socialLinks.map((link) => {
                    const Icon = socialIcons[link.id];
                    if (!Icon) return null;
                    return (
                      <a 
                        key={link.id}
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-white/70 hover:text-accent hover:scale-110 hover:-translate-y-1 transition-all duration-300"
                        aria-label={link.id}
                      >
                        <Icon size={22} />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/20 text-center text-white/60 text-sm">
          <p>&copy; {new Date().getFullYear()} Elvis Sells Houses. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
