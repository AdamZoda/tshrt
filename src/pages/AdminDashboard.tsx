import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, Package, DollarSign, Activity, Search, Filter, MoreVertical, Edit, Trash2, Download, Image as ImageIcon, Star } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useAdminStats, useAdminOrders } from '../hooks/useAdmin';
import { useProducts } from '../hooks/useProducts';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { supabase } from '../lib/supabase';
import { OrderPreviewModal } from '../components/admin/OrderPreviewModal';

export function AdminDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { stats, loading: statsLoading } = useAdminStats();
  const { orders, loading: ordersLoading, updateOrderStatus } = useAdminOrders();
  const { products, loading: productsLoading } = useProducts();

  const [mockDesigns, setMockDesigns] = useState([
    { id: 1, title: 'Cyberpunk City', category: 'T-Shirt Standard', isFeatured: true, image: 'https://picsum.photos/seed/cyber/200/200' },
    { id: 2, title: 'Minimalist Wave', category: 'Hoodie Premium', isFeatured: true, image: 'https://picsum.photos/seed/wave/200/200' },
    { id: 3, title: 'Retro Sunset', category: 'T-Shirt Oversize', isFeatured: false, image: 'https://picsum.photos/seed/retro/200/200' },
    { id: 4, title: 'Abstract Geometric', category: 'T-Shirt Standard', isFeatured: true, image: 'https://picsum.photos/seed/geo/200/200' },
  ]);

  const toggleFeatured = (id: number) => {
    setMockDesigns(designs =>
      designs.map(d => d.id === id ? { ...d, isFeatured: !d.isFeatured } : d)
    );
  };

  const dashboardStats = [
    { title: 'Total Revenue', value: `${stats.totalRevenue.toLocaleString()} MAD`, change: '+12.5%', icon: DollarSign },
    { title: 'Total Orders', value: stats.totalOrders.toString(), change: '+5.2%', icon: Package },
    { title: 'Active Users', value: stats.activeUsers.toString(), change: '+18.1%', icon: Users },
    { title: 'Conversion Rate', value: `${stats.conversionRate}%`, change: '-1.1%', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-[#181818] border-r border-white/10 flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold tracking-tighter text-white">
            BOCHARWIT<span className="text-[#E63946]">.</span>
          </h2>
          <p className="text-xs text-[#D4AF37] font-medium mt-1 uppercase tracking-widest">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            { id: 'overview', icon: Activity, label: 'Vue d\'ensemble' },
            { id: 'orders', icon: Package, label: 'Commandes' },
            { id: 'products', icon: Package, label: 'Produits' },
            { id: 'designs', icon: ImageIcon, label: 'Exemples & Designs' },
            { id: 'users', icon: Users, label: 'Utilisateurs' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === tab.id
                ? 'bg-white text-black font-medium'
                : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0F0F0F] border border-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs uppercase">
              {profile?.first_name?.[0]}{profile?.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.first_name} {profile?.last_name}</p>
              <p className="text-xs text-white/50 truncate">Administrator</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-[#181818] border-b border-white/10 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-2xl font-bold capitalize">{activeTab}</h1>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-[#0F0F0F] border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#FFD60A] transition-colors w-64"
              />
            </div>
            {activeTab === 'products' && (
              <Button variant="primary" size="sm">New Product</Button>
            )}
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-[#181818] p-6 rounded-2xl border border-white/5 animate-pulse h-32" />
                  ))
                ) : (
                  dashboardStats.map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-[#181818] p-6 rounded-2xl border border-white/5"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-lg bg-[#0F0F0F] border border-white/10 flex items-center justify-center">
                          <stat.icon className="w-5 h-5 text-[#FFD60A]" />
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                          {stat.change}
                        </span>
                      </div>
                      <h3 className="text-white/60 text-sm font-medium mb-1">{stat.title}</h3>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Recent Orders Table */}
              <div className="bg-[#181818] rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                  <h2 className="text-lg font-bold">Recent Orders</h2>
                  <Button variant="secondary" size="sm" className="flex items-center gap-2">
                    <Filter className="w-4 h-4" /> Filter
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0F0F0F] text-white/60 text-xs uppercase tracking-wider">
                        <th className="p-4 font-medium">Order ID</th>
                        <th className="p-4 font-medium">Customer</th>
                        <th className="p-4 font-medium">Date</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Total</th>
                        <th className="p-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {ordersLoading ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-white/50">Loading orders...</td>
                        </tr>
                      ) : orders.slice(0, 5).map((order) => (
                        <tr key={order.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-medium text-xs font-mono">{order.id.split('-')[0]}</td>
                          <td className="p-4 text-white/80">
                            {order.profiles?.first_name} {order.profiles?.last_name || order.shipping_address?.firstName}
                          </td>
                          <td className="p-4 text-white/60 text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                          <td className="p-4">
                            <select
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                              className={`px-3 py-1 rounded-full text-xs font-medium bg-transparent border-none focus:ring-0 cursor-pointer ${order.status === 'Expédié' ? 'bg-green-500/10 text-green-400' :
                                order.status === 'En préparation' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' :
                                  order.status === 'Sous la presse' ? 'bg-blue-500/10 text-blue-400' :
                                    order.status === 'nouveau' ? 'bg-purple-500/10 text-purple-400' :
                                      'bg-red-500/10 text-red-400'
                                }`}
                            >
                              <option value="nouveau" className="bg-[#181818] text-white">Nouveau</option>
                              <option value="En préparation" className="bg-[#181818] text-white">En préparation</option>
                              <option value="Sous la presse" className="bg-[#181818] text-white">Sous la presse</option>
                              <option value="Expédié" className="bg-[#181818] text-white">Expédié</option>
                              <option value="Annulé" className="bg-[#181818] text-white">Annulé</option>
                            </select>
                          </td>
                          <td className="p-4 font-bold">{order.total_amount} MAD</td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="p-2 text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium"
                                title="Voir la commande en 3D"
                              >
                                <Package className="w-4 h-4" />
                                <span className="hidden xl:inline">Détails & 3D</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!ordersLoading && orders.length === 0 && (
                    <div className="p-8 text-center text-white/50">Aucune commande récente.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="bg-[#181818] rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-lg font-bold">Toutes les commandes</h2>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="flex items-center gap-2">
                    <Filter className="w-4 h-4" /> Filter
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0F0F0F] text-white/60 text-xs uppercase tracking-wider">
                      <th className="p-4 font-medium">Order ID</th>
                      <th className="p-4 font-medium">Customer</th>
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Total</th>
                      <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {ordersLoading ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-white/50">Loading orders...</td>
                      </tr>
                    ) : orders.map((order) => (
                      <tr key={order.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-medium text-xs font-mono">{order.id.split('-')[0]}</td>
                        <td className="p-4 text-white/80">
                          {order.profiles?.first_name} {order.profiles?.last_name || order.shipping_address?.firstName}
                        </td>
                        <td className="p-4 text-white/60 text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                        <td className="p-4">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className={`px-3 py-1 rounded-full text-xs font-medium bg-transparent border-none focus:ring-0 cursor-pointer ${order.status === 'Expédié' ? 'bg-green-500/10 text-green-400' :
                              order.status === 'En préparation' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' :
                                order.status === 'Sous la presse' ? 'bg-blue-500/10 text-blue-400' :
                                  order.status === 'nouveau' ? 'bg-purple-500/10 text-purple-400' :
                                    'bg-red-500/10 text-red-400'
                              }`}
                          >
                            <option value="nouveau" className="bg-[#181818] text-white">Nouveau</option>
                            <option value="En préparation" className="bg-[#181818] text-white">En préparation</option>
                            <option value="Sous la presse" className="bg-[#181818] text-white">Sous la presse</option>
                            <option value="Expédié" className="bg-[#181818] text-white">Expédié</option>
                            <option value="Annulé" className="bg-[#181818] text-white">Annulé</option>
                          </select>
                        </td>
                        <td className="p-4 font-bold">{order.total_amount} MAD</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="p-2 text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium"
                            >
                              <Package className="w-4 h-4" />
                              <span className="hidden xl:inline">Détails & 3D</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!ordersLoading && orders.length === 0 && (
                  <div className="p-8 text-center text-white/50">Aucune commande.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Produits</h2>
              </div>

              <div className="bg-[#181818] rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0F0F0F] text-white/60 text-xs uppercase tracking-wider">
                      <th className="p-4 font-medium">Nom</th>
                      <th className="p-4 font-medium">Catégorie</th>
                      <th className="p-4 font-medium">Prix de Base</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {productsLoading ? (
                      <tr><td colSpan={5} className="p-8 text-center text-white/50">Loading products...</td></tr>
                    ) : products.map((product) => (
                      <tr key={product.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-medium">{product.name}</td>
                        <td className="p-4 text-white/60 capitalize">{product.category}</td>
                        <td className="p-4 text-[#D4AF37]">{product.base_price} MAD</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs ${product.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-500'}`}>
                            {product.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="p-2 text-white/40 hover:text-white transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'designs' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Exemples & Designs</h2>
                <Button variant="primary" size="sm">Ajouter un Design</Button>
              </div>

              <div className="bg-[#181818] rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0F0F0F] text-white/60 text-xs uppercase tracking-wider">
                      <th className="p-4 font-medium">Design</th>
                      <th className="p-4 font-medium">Catégorie</th>
                      <th className="p-4 font-medium text-center">Afficher à l'accueil (Principal)</th>
                      <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {mockDesigns.map((design) => (
                      <tr key={design.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-[#222] overflow-hidden">
                              <img src={design.image} alt={design.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <span className="font-medium">{design.title}</span>
                          </div>
                        </td>
                        <td className="p-4 text-white/60">{design.category}</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => toggleFeatured(design.id)}
                            className={`p-2 rounded-full transition-colors ${design.isFeatured ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                              }`}
                            title={design.isFeatured ? "Retirer de l'accueil" : "Mettre à l'accueil"}
                          >
                            <Star className={`w-5 h-5 ${design.isFeatured ? 'fill-current' : ''}`} />
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="p-2 text-white/40 hover:text-white transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-white/40 hover:text-red-400 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-[#181818] rounded-2xl border border-white/5 p-8 text-center">
              <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">User Management</h2>
              <p className="text-white/60 mb-6 max-w-md mx-auto">This page connects to `profiles` table to list users. It can block users or promote to admin.</p>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {selectedOrder && (
        <OrderPreviewModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}
