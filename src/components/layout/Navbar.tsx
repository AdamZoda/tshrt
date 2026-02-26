import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingCart, User, Menu, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useSiteSettings } from '../../hooks/useSiteSettings';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  const { totalItems } = useCart();
  const { value: navSettings } = useSiteSettings('navbar');

  const links = [
    { name: 'Accueil', path: '/' },
    { name: 'Studio 3D', path: '/studio' },
    { name: 'T-Shirts', path: '/explore?category=tshirt' },
    { name: 'Hoodies', path: '/explore?category=hoodie' },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F0F0F]/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" />
          <span className="text-2xl font-bold tracking-tighter text-white group-hover:text-[#D4AF37] transition-colors uppercase">
            {navSettings?.logo_text || 'PRINTS BY LILY'}
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => {
            const hasQuery = link.path.includes('?');
            const isActive = hasQuery
              ? location.pathname === link.path.split('?')[0] && location.search.includes(link.path.split('?')[1])
              : location.pathname === link.path;

            return (
              <Link
                key={link.path}
                to={link.path}
                className="relative text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                {link.name}
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute -bottom-2 left-0 right-0 h-0.5 bg-[#D4AF37]"
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {/* Admin badge */}
          {isAdmin && (
            <Link
              to="/admin"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-bold rounded-full hover:bg-[#D4AF37]/20 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </Link>
          )}

          {/* Cart */}
          <Link to="/cart" className="p-2 text-white/80 hover:text-white transition-colors relative">
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-[#D4AF37] text-black text-[10px] font-bold flex items-center justify-center rounded-full">
                {totalItems}
              </span>
            )}
          </Link>

          {/* User account */}
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#181818] border border-white/10 rounded-full hover:border-[#D4AF37] transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#E63946] flex items-center justify-center text-black font-bold text-[10px]">
                  {profile?.first_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-xs font-medium text-white/80 max-w-[100px] truncate">
                  {profile?.first_name || 'Mon compte'}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-white/40 hover:text-[#E63946] transition-colors"
                title="Déconnexion"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link to="/login">
              <button className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-black text-sm font-medium rounded-full hover:bg-white transition-colors">
                <User className="w-4 h-4" />
                <span className="hidden md:inline">Connexion</span>
              </button>
            </Link>
          )}

          <button className="md:hidden p-2 text-white">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </nav>
  );
}
