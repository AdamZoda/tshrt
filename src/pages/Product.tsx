import React, { useState, Suspense } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingBag, Heart, Share2, Star, Check, Truck, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useProduct } from '../hooks/useProducts';
import { useCart } from '../context/CartContext';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const COLORS = [
  { name: 'Noir', value: '#111111' },
  { name: 'Blanc', value: '#EEEEEE' },
  { name: 'Gris', value: '#A8DADC' },
  { name: 'Rouge', value: '#E63946' },
  { name: 'Or', value: '#D4AF37' },
];

export function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { product, loading } = useProduct(id);
  const { addToCart } = useCart();

  const [activeSize, setActiveSize] = useState('L');
  const [activeColor, setActiveColor] = useState(COLORS[0].value);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleShare = async () => {
    if (!product) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Lien copié dans le presse-papier !');
      }
    } catch (err) {
      console.error('Erreur lors du partage:', err);
    }
  };



  if (loading && !product) {
    return <div className="min-h-screen bg-[#0F0F0F]" />;
  }

  if (!loading && !product) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-4">Produit introuvable</h1>
          <Link to="/explore">
            <Button variant="primary">Retour au catalogue</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart({
      product_id: product.id,
      product_name: product.name,
      size: activeSize,
      color: activeColor,
      quantity,
      unit_price: product.base_price,
      design_data: {
        color: activeColor,
        decals: [] // Empty for base product, Studio handles decals
      }
    });
    // Add small visual feedback or notification here if needed
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-12 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        {/* Breadcrumbs */}
        <nav className="flex text-sm text-white/50 mb-8 gap-2">
          <Link to="/" className="hover:text-white transition-colors">Accueil</Link>
          <span>/</span>
          <Link to="/explore" className="hover:text-white transition-colors">Explorer</Link>
          <span>/</span>
          <span className="text-white">{product.name}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-16">
          {/* Left - 3D Viewer & Images */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-[#181818] relative group">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center transition-all border border-white/10 ${isFavorite ? 'bg-[#E63946] text-white shadow-[0_0_15px_rgba(230,57,70,0.5)]' : 'bg-black/40 text-white hover:bg-white/20'
                    }`}
                >
                  <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={handleShare}
                  className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-white hover:text-black transition-all text-white border border-white/10"
                >
                  <Share2 className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Right - Product Info */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-[#D4AF37]">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <span className="text-white/60 text-sm">(128 Avis)</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">{product.name}</h1>
              <p className="text-3xl font-bold text-[#D4AF37] mb-6">{product.base_price} MAD</p>

              <p className="text-white/70 text-lg leading-relaxed mb-8">
                {product.description || 'Vêtement premium prêt à être personnalisé ou porté tel quel. Coupe moderne, finitions de haute qualité et confort absolu.'}
              </p>
            </div>

            {/* Color Selection */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Couleur</h3>
                <span className="text-white/60 text-sm">{COLORS.find(c => c.value === activeColor)?.name}</span>
              </div>
              <div className="flex gap-4 flex-wrap">
                {COLORS.map(c => (
                  <button
                    key={c.name}
                    onClick={() => setActiveColor(c.value)}
                    className={`w-12 h-12 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${activeColor === c.value ? 'border-[#D4AF37] scale-110' : 'border-white/20 hover:scale-105'
                      }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  >
                    {activeColor === c.value && <Check className={`w-5 h-5 ${c.value === '#EEEEEE' ? 'text-black' : 'text-white'}`} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Taille</h3>
                <button className="text-white/60 text-sm underline hover:text-white transition-colors">Guide des tailles</button>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {(product.sizes || SIZES).map(size => (
                  <button
                    key={size}
                    onClick={() => setActiveSize(size)}
                    className={`py-4 rounded-xl text-sm font-bold transition-all duration-300 ${activeSize === size
                      ? 'bg-white text-black shadow-[0_0_20px_rgba(212,175,55,0.2)] border border-[#D4AF37]'
                      : 'bg-[#181818] text-white/70 hover:bg-white/10 border border-white/10'
                      }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4 mb-12">
              <div className="flex gap-4 h-14">
                <div className="flex items-center bg-[#181818] rounded-xl border border-white/10 p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-bold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    +
                  </button>
                </div>
                <Button
                  onClick={handleAddToCart}
                  className="flex-1 bg-[#D4AF37] text-black hover:bg-white h-full text-lg font-bold transition-all"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" /> Ajouter au panier — {product.base_price * quantity} MAD
                </Button>
              </div>

              <Button
                variant="secondary"
                onClick={() => navigate('/studio')}
                className="w-full border-white/20 hover:border-white h-14 text-white"
              >
                Personnaliser ce produit dans le Studio 3D
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 border-t border-white/10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#181818] flex items-center justify-center shrink-0">
                  <Truck className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Livraison Gratuite</h4>
                  <p className="text-white/50 text-sm">Sur les commandes de plus de 500 MAD partout au Maroc.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#181818] flex items-center justify-center shrink-0">
                  <RotateCcw className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Retours Faciles</h4>
                  <p className="text-white/50 text-sm">Politique de retour de 14 jours pour les articles non personnalisés.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
