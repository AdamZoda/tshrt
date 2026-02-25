import React, { Suspense } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useCart } from '../context/CartContext';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ShirtModel, StudioLights } from '../components/3d/ShirtModel';

export function Cart() {
  const { items, removeFromCart, updateQuantity, subtotal } = useCart();

  const shipping = subtotal > 0 && subtotal < 500 ? 50 : 0;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-12 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-12">Votre Panier</h1>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Cart Items */}
          <div className="w-full lg:w-2/3">
            {items.length > 0 ? (
              <div className="space-y-6">
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col sm:flex-row gap-6 p-6 bg-[#181818] rounded-2xl border border-white/5 relative group"
                    >
                      {/* 2D Thumbnail Preview (Performant) */}
                      <div className="w-full sm:w-40 aspect-square rounded-xl overflow-hidden bg-[#222] shrink-0 relative flex items-center justify-center border border-white/10">
                        <div className="absolute inset-0 opacity-80 mix-blend-multiply" style={{ backgroundColor: item.color }} />
                        {item.design_data?.decals?.[0] ? (
                          <img
                            src={item.design_data.decals[0].imageBase64 || (item.design_data.decals[0] as any).imageUrl}
                            className="w-2/3 h-2/3 object-contain absolute z-10 drop-shadow-xl"
                            alt="Design Thumbnail"
                          />
                        ) : (
                          <div className="z-10 text-white/20 w-1/2 h-1/2 rounded bg-white/5" />
                        )}
                        <div className="absolute bottom-2 inset-x-0 text-center pointer-events-none z-20">
                          <span className="text-[9px] uppercase tracking-widest text-white/40 bg-black/60 px-2 py-0.5 rounded-full">Aperçu 2D</span>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4 gap-4">
                          <div>
                            <h3 className="text-xl font-bold mb-1 line-clamp-2">{item.product_name}</h3>
                            <p className="text-white/50 text-sm">
                              Taille: {item.size} | Couleur: <span className="inline-block w-3 h-3 rounded-full ml-1 align-middle border border-white/20" style={{ backgroundColor: item.color }} title={item.color} />
                            </p>
                            {item.design_data.decals && item.design_data.decals.length > 0 && (
                              <p className="text-[#D4AF37] text-xs mt-2 border border-[#D4AF37]/30 bg-[#D4AF37]/5 px-2 py-1 rounded-md inline-block">
                                Design Personnalisé Inclus (+{50 * item.design_data.decals.length} MAD)
                              </p>
                            )}
                          </div>
                          <p className="text-xl font-bold text-[#D4AF37] whitespace-nowrap">{item.unit_price * item.quantity} MAD</p>
                        </div>

                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center bg-[#0F0F0F] rounded-lg border border-white/10 p-1">
                            <button
                              onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                            >
                              -
                            </button>
                            <span className="w-10 text-center font-medium text-sm">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-white/40 hover:text-[#E63946] hover:bg-[#E63946]/10 rounded-lg transition-colors p-2 flex items-center gap-2"
                          >
                            <span className="text-xs uppercase font-bold hidden sm:block">Retirer</span>
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-24 bg-[#181818] rounded-2xl border border-white/5 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <Trash2 className="w-8 h-8 text-white/20" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Votre panier est vide</h3>
                <p className="text-white/50 mb-8 max-w-sm">
                  Découvrez nos produits premium ou personnalisez votre propre design dans notre Studio 3D.
                </p>
                <Link to="/explore">
                  <Button variant="primary" size="lg" className="w-auto px-8">Continuer vos achats</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-1/3">
            <div className="bg-[#181818] rounded-2xl border border-white/5 p-8 sticky top-28">
              <h2 className="text-2xl font-bold mb-6">Résumé de la commande</h2>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-white/70">
                  <span>Sous-total</span>
                  <span>{subtotal} MAD</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Livraison {subtotal >= 500 && <span className="text-green-400 text-xs ml-2 uppercase font-bold tracking-wider px-2 py-0.5 bg-green-400/10 rounded">Gratuite</span>}</span>
                  <span>{subtotal >= 500 ? '0' : shipping} MAD</span>
                </div>
                {subtotal > 0 && subtotal < 500 && (
                  <p className="text-xs text-[#D4AF37]">
                    Plus que {500 - subtotal} MAD pour la livraison gratuite.
                  </p>
                )}
                <div className="h-px bg-white/10 my-4" />
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-[#D4AF37]">{total} MAD</span>
                </div>
              </div>

              <Link to="/checkout" className="block w-full" onClick={(e) => items.length === 0 && e.preventDefault()}>
                <Button
                  className="w-full bg-[#D4AF37] text-black hover:bg-white flex items-center justify-center gap-2"
                  size="lg"
                  disabled={items.length === 0}
                >
                  Passer à la caisse <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>

              <p className="text-white/40 text-xs text-center mt-6">
                Taxes incluses. Livraison calculée au Maroc.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
