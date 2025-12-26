import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Instagram } from 'lucide-react';
const Footer: React.FC = () => {
  return <footer className="bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="font-serif text-2xl font-bold mb-4">
              ELVIS<span className="text-accent"> SELLS</span> HOUSES
            </h3>
            <p className="text-primary-foreground/70 leading-relaxed">
              Your trusted partner in finding the perfect home or selling your property with confidence.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <nav className="space-y-2">
              <Link to="/" className="block text-primary-foreground/70 hover:text-accent transition-colors">
                Home
              </Link>
              <Link to="/buy" className="block text-primary-foreground/70 hover:text-accent transition-colors">
                Buy a Home
              </Link>
              <Link to="/sell" className="block text-primary-foreground/70 hover:text-accent transition-colors">
                Sell Your House
              </Link>
              <Link to="/about" className="block text-primary-foreground/70 hover:text-accent transition-colors">
                About Us
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Contact</h4>
            <div className="space-y-3">
              <a href="tel:+16318352299" className="flex items-center gap-3 text-primary-foreground/70 hover:text-accent transition-colors rounded-sm">
                <Phone size={18} />
                <span>(631) 835-2299</span>
              </a>
              <a href="mailto:elvissellshouses@gmail.com" className="flex items-center gap-3 text-primary-foreground/70 hover:text-accent transition-colors">
                <Mail size={18} />
                <span>elvissellshouses@gmail.com</span>
              </a>
              <div className="flex items-center gap-3 text-primary-foreground/70">
                <MapPin size={18} />
                <span>Brentwood, NY</span>
              </div>
              <a href="https://instagram.com/elvissellshouses" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-primary-foreground/70 hover:text-accent transition-colors">
                <Instagram size={18} />
                <span>@elvissellshouses</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/20 text-center text-primary-foreground/60 text-sm">
          <p>&copy; {new Date().getFullYear()} Elvis Sells Houses. All rights reserved.</p>
        </div>
      </div>
    </footer>;
};
export default Footer;