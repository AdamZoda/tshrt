import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, User, Heart, Settings, ShoppingBag, LogOut, ChevronRight, Eye, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useUserOrders, useSavedDesigns } from '../hooks/useUser';
import { OrderPreviewModal } from '../components/admin/OrderPreviewModal';

export function UserDashboard() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [saving, setSaving] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { orders, loading: ordersLoading } = useUserOrders();
  const { savedDesigns, loading: savedDesignsLoading, deleteSavedDesign } = useSavedDesigns();

  // Form state for settings
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [city, setCity] = useState(profile?.city || '');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleSaveSettings = async () => {
    if (!profile) return;
    setSaving(true);
    setSuccessMsg('');

    const { error } = await supabase
      .from('profiles')
      .update({ first_name: firstName, last_name: lastName, phone, address, city })
      .eq('id', profile.id);

    if (!error) {
      setSuccessMsg('Informations mises à jour !');
      await refreshProfile();
    }
    setSaving(false);
  };

  const initials = profile?.first_name
    ? `${profile.first_name[0]}${profile.last_name?.[0] || ''}`.toUpperCase()
    : null;

  if (!loading && (!user || !profile?.first_name)) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-6 pt-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[#181818] rounded-3xl border border-white/10 p-10 text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Settings className="w-10 h-10 text-[#D4AF37]" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Espace Client</h1>
          <p className="text-white/60 mb-8 leading-relaxed">
            Veuillez vous connecter pour accéder à vos commandes, vos favoris et vos paramètres de compte.
          </p>
          <div className="flex flex-col gap-3">
            <Button variant="primary" size="lg" className="w-full bg-[#D4AF37] text-black hover:bg-white" onClick={() => navigate('/login')}>
              Se Connecter
            </Button>
            <Button variant="secondary" size="lg" className="w-full border-white/20 hover:border-white" onClick={() => navigate('/register')}>
              Créer un Compte
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-12 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-[#181818] rounded-3xl border border-white/5 p-6 sticky top-28">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#E63946] flex items-center justify-center text-black font-bold text-xl">
                  {initials}
                </div>
                <div>
                  <h3 className="font-bold">{profile?.first_name} {profile?.last_name}</h3>
                  <p className="text-xs text-white/50">{profile?.role === 'admin' ? '👑 Admin' : '👤 Utilisateur'}</p>
                </div>
              </div>

              <nav className="space-y-2">
                {[
                  { id: 'orders', icon: Package, label: 'Mes Commandes' },
                  { id: 'saved', icon: Heart, label: 'Designs Sauvegardés' },
                  { id: 'settings', icon: Settings, label: 'Paramètres' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === tab.id
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                ))}
              </nav>

              <div className="mt-8 pt-8 border-t border-white/10">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-[#E63946]/10 hover:text-[#E63946] transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Déconnexion
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-8">
              {activeTab === 'orders' && 'Mes Commandes'}
              {activeTab === 'saved' && 'Designs Sauvegardés'}
              {activeTab === 'settings' && 'Paramètres du Compte'}
            </h1>

            {activeTab === 'orders' && (
              <div className="space-y-6">
                {ordersLoading ? (
                  <div className="text-center py-12 text-white/50">Chargement de vos commandes...</div>
                ) : orders.length > 0 ? (
                  orders.map((order) => (
                    <div key={order.id} className="bg-[#181818] rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                        <div>
                          <p className="text-sm text-white/50 mb-1">Commande passée le {new Date(order.created_at).toLocaleDateString()}</p>
                          <h3 className="text-lg font-bold font-mono">N° {order.id.split('-')[0].toUpperCase()}</h3>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="font-bold text-[#D4AF37] text-lg">{order.total_amount} MAD</span>
                        </div>
                      </div>

                      {/* Status Stepper or Refusal Message */}
                      <div className="mb-8 px-2">
                        {['cancelled', 'refused'].includes(order.status) ? (
                          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500">
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                              <X className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold">Commande {order.status === 'refused' ? 'Refusée' : 'Annulée'}</p>
                              <p className="text-sm opacity-80">
                                {order.status === 'refused'
                                  ? "Désolé, votre commande a été refusée par l'administration."
                                  : "Cette commande a été annulée."}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between relative">
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2 z-0" />
                            <div
                              className="absolute top-1/2 left-0 h-0.5 bg-[#D4AF37] -translate-y-1/2 z-0 transition-all duration-1000"
                              style={{
                                width: order.status === 'pending' ? '0%' :
                                  order.status === 'confirmed' ? '25%' :
                                    order.status === 'pressing' ? '50%' :
                                      order.status === 'shipped' ? '75%' :
                                        order.status === 'delivered' ? '100%' : '0%'
                              }}
                            />

                            {[
                              { key: 'pending', label: 'Nouveau' },
                              { key: 'confirmed', label: 'Confirmé' },
                              { key: 'pressing', label: 'Préparation' },
                              { key: 'shipped', label: 'Expédié' },
                              { key: 'delivered', label: 'Livré' }
                            ].map((s, idx) => {
                              const statuses = ['pending', 'confirmed', 'pressing', 'shipped', 'delivered'];
                              const currentIdx = statuses.indexOf(order.status);
                              const isCompleted = currentIdx >= idx;
                              const isCurrent = currentIdx === idx;

                              return (
                                <div key={s.key} className="relative z-10 flex flex-col items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full transition-all duration-500 ${isCompleted ? 'bg-[#D4AF37] scale-125 shadow-[0_0_10px_#D4AF37]' : 'bg-[#222] border border-white/10'
                                    }`} />
                                  <span className={`text-[10px] font-medium transition-colors ${isCurrent ? 'text-[#D4AF37]' : isCompleted ? 'text-white/80' : 'text-white/20'
                                    }`}>
                                    {s.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="h-px bg-white/5 mb-6" />

                      <div className="flex flex-col sm:flex-row justify-between gap-6">
                        <div className="flex-1 space-y-4">
                          <p className="text-sm font-medium mb-2">Articles ({order.order_items?.length || 0})</p>
                          {(order.order_items || []).slice(0, 2).map((item: any, idx: number) => (
                            <div key={idx} className="flex gap-4 items-center">
                              <div className="w-12 h-12 rounded bg-[#222] flex items-center justify-center shrink-0 border border-white/10 overflow-hidden relative">
                                <div className="absolute inset-0" style={{ backgroundColor: item.color }} />
                                {item.design_data?.decals?.[0] && (
                                  <img src={item.design_data.decals[0].imageBase64 || item.design_data.decals[0].imageUrl} className="w-8 h-8 object-contain absolute z-10" alt="Design Thumbnail" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold truncate">{item.product_name || 'Article personnalisé'} ({item.quantity}x)</p>
                                <p className="text-xs text-white/50">Taille: {item.size} • Couleur: {item.color}</p>
                              </div>
                            </div>
                          ))}
                          {order.order_items?.length > 2 && (
                            <p className="text-xs text-white/40 italic">... et {order.order_items.length - 2} autres articles</p>
                          )}
                        </div>

                        <div className="shrink-0 flex items-end">
                          <Button variant="secondary" onClick={() => setSelectedOrder(order)} className="w-full sm:w-auto flex items-center gap-2 text-sm border-white/10 hover:bg-white/5">
                            <Eye className="w-4 h-4" /> Voir Détails & 3D
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-[#181818] rounded-2xl border border-white/5 p-12 text-center">
                    <Package className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Pas encore de commandes</h2>
                    <p className="text-white/60 mb-6 max-w-sm mx-auto">Vos commandes apparaîtront ici une fois passées. Découvrez nos produits ou créez un design unique !</p>
                    <Button variant="primary" onClick={() => navigate('/studio')}>Créer mon premier design</Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'saved' && (
              <div className="space-y-6">
                {savedDesignsLoading ? (
                  <div className="text-center py-12 text-white/50">Chargement de vos favoris...</div>
                ) : savedDesigns.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedDesigns.map((design) => (
                      <div key={design.id} className="bg-[#181818] rounded-2xl border border-white/5 p-4 flex flex-col group hover:border-[#D4AF37]/50 transition-colors">
                        <div className="aspect-square rounded-xl bg-[#222] mb-4 relative overflow-hidden border border-white/10 flex items-center justify-center">
                          <div className="absolute inset-0 opacity-80 mix-blend-multiply" style={{ backgroundColor: design.color }} />
                          {design.design_data?.decals?.[0] ? (
                            <img
                              src={design.design_data.decals[0].imageBase64 || design.design_data.decals[0].imageUrl}
                              className="w-2/3 h-2/3 object-contain relative z-10 drop-shadow-xl"
                              alt="Design preview"
                            />
                          ) : (
                            <div className="z-10 text-white/20 w-1/2 h-1/2 rounded bg-white/5" />
                          )}
                        </div>
                        <h3 className="font-bold text-lg mb-1 truncate">{design.name}</h3>
                        <p className="text-white/50 text-xs mb-4">Sauvegardé le {new Date(design.created_at).toLocaleDateString()}</p>
                        <div className="flex gap-2 mt-auto">
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1 bg-[#D4AF37] text-black hover:bg-white border-transparent text-xs"
                            onClick={() => {
                              localStorage.setItem('PRINTS BY LILY_load_design', JSON.stringify({
                                product_id: design.product_id,
                                color: design.color,
                                design_data: design.design_data
                              }));
                              navigate('/studio');
                            }}
                          >
                            Recharger
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-transparent text-xs"
                            onClick={() => deleteSavedDesign(design.id)}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#181818] rounded-2xl border border-white/5 p-8 text-center">
                    <Heart className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Aucun design sauvegardé</h2>
                    <p className="text-white/60 mb-6">Sauvegardez vos créations du Studio pour les retrouver ici.</p>
                    <Button variant="primary" onClick={() => navigate('/studio')}>Aller au Studio</Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-[#181818] rounded-3xl border border-white/5 p-8">
                {successMsg && (
                  <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
                    {successMsg}
                  </div>
                )}
                <div className="space-y-6 max-w-xl">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/60">Prénom</label>
                      <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/60">Nom</label>
                      <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/60">Téléphone</label>
                    <div className="flex">
                      <div className="bg-[#0A0A0A] border border-r-0 border-white/10 rounded-l-xl px-4 py-3 text-white/40 flex items-center text-sm font-mono">
                        +212
                      </div>
                      <input
                        type="tel"
                        pattern="[0-9]{9}"
                        maxLength={9}
                        placeholder="612345678"
                        value={phone.replace('+212', '')}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                          setPhone(val ? `+212${val}` : '');
                        }}
                        className="flex-1 bg-[#0F0F0F] border border-white/10 rounded-r-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                      />
                    </div>
                    <p className="text-[10px] text-white/30 italic">Format: +212 suivi de 9 chiffres (ex: 699214728)</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/60">Adresse</label>
                    <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors resize-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/60">Ville</label>
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors" />
                  </div>
                  <Button type="button" variant="primary" className="w-full sm:w-auto mt-4"
                    onClick={handleSaveSettings} disabled={saving}>
                    {saving ? 'Enregistrement...' : 'Sauvegarder'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Details Modal for User */}
      {selectedOrder && (
        <OrderPreviewModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}
