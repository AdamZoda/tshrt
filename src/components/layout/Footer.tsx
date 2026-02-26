import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, Mail, Phone } from 'lucide-react';
import { useSiteSettings } from '../../hooks/useSiteSettings';

export function Footer() {
  const { value: footer } = useSiteSettings('footer');
  const { value: navbar } = useSiteSettings('navbar');

  return (
    <footer className="bg-[#181818] text-white/70 py-16 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div>
          <div className="flex items-center gap-3 mb-6 group cursor-default">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
            <h3 className="text-2xl font-bold text-white tracking-tighter uppercase">
              {navbar?.logo_text || 'PRINTS BY LILY'}
            </h3>
          </div>
          <p className="text-sm mb-6 max-w-xs">
            {footer?.description || 'Premium custom clothing brand based in Morocco. Bring your designs to life with our state-of-the-art heat press technology.'}
          </p>
          <div className="flex gap-4">
            <a href={footer?.socials?.instagram || '#'} className="hover:text-[#D4AF37] transition-colors"><Instagram className="w-5 h-5" /></a>
            <a href={footer?.socials?.twitter || '#'} className="hover:text-[#D4AF37] transition-colors"><Twitter className="w-5 h-5" /></a>
            <a href={footer?.socials?.facebook || '#'} className="hover:text-[#D4AF37] transition-colors"><Facebook className="w-5 h-5" /></a>
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-6">Explore</h4>
          <ul className="space-y-4 text-sm">
            <li><Link to="/explore" className="hover:text-white transition-colors">All Designs</Link></li>
            <li><Link to="/studio" className="hover:text-white transition-colors">Custom Studio</Link></li>
            <li><Link to="/products/tshirts" className="hover:text-white transition-colors">T-Shirts</Link></li>
            <li><Link to="/products/hoodies" className="hover:text-white transition-colors">Hoodies</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-6">Support</h4>
          <ul className="space-y-4 text-sm">
            <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
            <li><Link to="/shipping" className="hover:text-white transition-colors">Shipping & Returns</Link></li>
            <li><Link to="/track" className="hover:text-white transition-colors">Track Order</Link></li>
            <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-6">Contact</h4>
          <ul className="space-y-4 text-sm">
            <li className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-[#D4AF37]" />
              <span>{footer?.email || 'hello@PRINTS BY LILY.ma'}</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-[#D4AF37]" />
              <span>{footer?.phone || '+212 600 000 000'}</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/10 text-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <p>&copy; {new Date().getFullYear()} PRINTS BY LILY. All rights reserved.</p>
        <div className="flex gap-6">
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
