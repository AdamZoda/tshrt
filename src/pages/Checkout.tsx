import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, Truck, ShieldCheck, ChevronRight, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';

type Step = 'shipping' | 'payment' | 'success';

export function Checkout() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const [step, setStep] = useState<Step>('shipping');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [shippingData, setShippingData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });

  // Pre-fill user data
  useEffect(() => {
    if (profile) {
      setShippingData(prev => ({
        ...prev,
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: user?.email || '',
        phone: profile.phone || '',
      }));
    }
  }, [profile, user]);

  const shippingCost = subtotal > 0 && subtotal < 500 ? 50 : 0;
  const total = subtotal + shippingCost;

  // Protect empty cart
  useEffect(() => {
    if (items.length === 0 && step !== 'success') {
      navigate('/cart');
    }
  }, [items, step, navigate]);

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Create order
      const { data: orderParams, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null, // Allow guest orders if user is null
          total_amount: total,
          shipping_address: shippingData,
          payment_method: 'Paiement à la livraison', // Simplified for this demo
          status: 'nouveau'
        })
        .select('id')
        .single();

      if (orderError) throw orderError;

      // 2. Create order items
      const orderItems = items.map(item => ({
        order_id: orderParams.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        size: item.size,
        color: item.color,
        design_data: item.design_data
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 3. Success
      clearCart();
      setStep('success');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Une erreur est survenue lors de la création de la commande.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#0F0F0F] pt-24 pb-32 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full mx-auto px-6 text-center"
        >
          <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/30">
            <Check className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">Commande Confirmée</h1>
          <p className="text-white/60 mb-8 leading-relaxed">
            Merci pour votre achat ! Nous avons commencé à traiter votre commande.
            Vous recevrez bientôt un email de confirmation avec les détails de livraison.
          </p>
          <div className="flex flex-col gap-4">
            <Button onClick={() => navigate('/dashboard')} variant="secondary" className="w-full h-14 bg-[#181818] border-white/10 hover:border-[#D4AF37]">
              Suivre ma commande
            </Button>
            <Button onClick={() => navigate('/explore')} className="w-full bg-[#D4AF37] text-black hover:bg-white h-14 font-bold">
              Continuer vos achats
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-12 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        {/* Steps */}
        <div className="flex items-center text-sm font-medium text-white/40 mb-12">
          <Link to="/cart" className="hover:text-white transition-colors">Panier</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className={step === 'shipping' ? 'text-[#D4AF37]' : 'text-white'}>Expédition</span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className={step === 'payment' ? 'text-[#D4AF37]' : ''}>Paiement</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-16">
          {/* Main Form Area */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {step === 'shipping' && (
                <motion.div
                  key="shipping"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <h2 className="text-3xl font-bold tracking-tight mb-8">Adresse de livraison</h2>
                  <form onSubmit={handleShippingSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">Prénom</label>
                        <input required type="text"
                          value={shippingData.firstName} onChange={(e) => setShippingData({ ...shippingData, firstName: e.target.value })}
                          className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">Nom</label>
                        <input required type="text"
                          value={shippingData.lastName} onChange={(e) => setShippingData({ ...shippingData, lastName: e.target.value })}
                          className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70">Email</label>
                      <input required type="email"
                        value={shippingData.email} onChange={(e) => setShippingData({ ...shippingData, email: e.target.value })}
                        className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70">Téléphone</label>
                      <input required type="tel"
                        value={shippingData.phone} onChange={(e) => setShippingData({ ...shippingData, phone: e.target.value })}
                        className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70">Adresse complète</label>
                      <input required type="text"
                        value={shippingData.address} onChange={(e) => setShippingData({ ...shippingData, address: e.target.value })}
                        className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors" />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">Ville</label>
                        <input required type="text"
                          value={shippingData.city} onChange={(e) => setShippingData({ ...shippingData, city: e.target.value })}
                          className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">Code Postal</label>
                        <input required type="text"
                          value={shippingData.postalCode} onChange={(e) => setShippingData({ ...shippingData, postalCode: e.target.value })}
                          className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors" />
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-14 bg-[#D4AF37] text-black hover:bg-white text-lg font-bold mt-8">
                      Continuer vers le paiement
                    </Button>
                  </form>
                </motion.div>
              )}

              {step === 'payment' && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2 className="text-3xl font-bold tracking-tight mb-8">Paiement</h2>
                  <form onSubmit={handlePaymentSubmit} className="space-y-8">
                    {/* Payment Method Selector (Demo static for now) */}
                    <div className="space-y-4">
                      <label className="flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-colors border-[#D4AF37] bg-white/5">
                        <input type="radio" name="payment" defaultChecked className="hidden" />
                        <div className="w-5 h-5 rounded-full border-2 border-[#D4AF37] flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
                        </div>
                        <Truck className="hidden sm:block text-white/60" />
                        <span className="font-medium text-lg">Paiement à la livraison</span>
                      </label>
                      <label className="flex items-center gap-4 p-4 border rounded-xl cursor-not-allowed transition-colors border-white/10 opacity-50">
                        <input type="radio" name="payment" disabled className="hidden" />
                        <div className="w-5 h-5 rounded-full border-2 border-white/20" />
                        <CreditCard className="hidden sm:block text-white/60" />
                        <span className="font-medium text-lg text-white/50">Carte Bancaire (Bientôt)</span>
                      </label>
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl text-sm">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-4 pt-4">
                      <Button type="button" variant="secondary" onClick={() => setStep('shipping')} className="h-14 px-8 border-white/10" disabled={isSubmitting}>
                        Retour
                      </Button>
                      <Button type="submit" className="flex-1 h-14 bg-[#D4AF37] text-black hover:bg-white text-lg font-bold" disabled={isSubmitting}>
                        {isSubmitting ? 'Traitement...' : `Confirmer la commande — ${total} MAD`}
                      </Button>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-white/40 text-xs mt-8">
                      <ShieldCheck className="w-4 h-4" />
                      Paiement 100% sécurisé et protégé
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Real Order Summary */}
          <div className="w-full lg:w-[400px]">
            <div className="bg-[#181818] rounded-2xl border border-white/5 p-8 sticky top-28">
              <h3 className="text-xl font-bold mb-6">Résumé</h3>

              <div className="space-y-4 mb-6">
                {items.map((item, i) => (
                  <div key={`${item.id}-${i}`} className="flex gap-4">
                    <div className="w-16 h-16 bg-[#222] rounded-lg shrink-0 overflow-hidden relative border border-white/10">
                      {/* Using static color box for simple cart summary to save performance parsing 3D here */}
                      <div className="absolute inset-0" style={{ backgroundColor: item.color }} />
                      {item.design_data.decals && item.design_data.decals.length > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <img src={item.design_data.decals[0]?.imageBase64} className="w-8 h-8 object-contain" alt="Design" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{item.product_name}</h4>
                      <p className="text-white/50 text-xs">{item.size} • Qté: {item.quantity}</p>
                      <p className="text-[#D4AF37] text-sm font-medium mt-1">{item.unit_price * item.quantity} MAD</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="h-px bg-white/10 mb-6" />

              <div className="space-y-4 text-sm font-medium">
                <div className="flex justify-between text-white/70">
                  <span>Sous-total</span>
                  <span>{subtotal} MAD</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Livraison</span>
                  <span>{shippingCost === 0 ? 'Gratuite' : `${shippingCost} MAD`}</span>
                </div>
                <div className="h-px bg-white/10 my-2" />
                <div className="flex justify-between text-xl font-bold text-white">
                  <span>Total</span>
                  <span className="text-[#D4AF37]">{total} MAD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
