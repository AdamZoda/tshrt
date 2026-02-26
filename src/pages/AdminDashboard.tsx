import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Package, DollarSign, Activity, Search, Filter, MoreVertical, Edit, Trash2, Download, Image as ImageIcon, Star, Home, Settings, Save, History, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useAdminStats, useAdminOrders, useAdminUsers } from '../hooks/useAdmin';
import { useProducts } from '../hooks/useProducts';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { supabase } from '../lib/supabase';
import { OrderPreviewModal } from '../components/admin/OrderPreviewModal';
import { ProductModal } from '../components/admin/ProductModal';
import { DesignModal } from '../components/admin/DesignModal';
import { useFeaturedDesigns, type FeaturedDesign } from '../hooks/useSiteSettings';
import type { Product } from '../hooks/useProducts';

export function AdminDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const { stats, loading: statsLoading } = useAdminStats();
  const { orders, loading: ordersLoading, updateOrderStatus } = useAdminOrders();
  const { products, loading: productsLoading, addProduct, updateProduct, deleteProduct, refresh: refreshProducts } = useProducts();
  const { designs, addDesign, updateDesign, deleteDesign, refresh: refreshDesigns } = useFeaturedDesigns();
  const { users, loading: usersLoading } = useAdminUsers();

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState<FeaturedDesign | null>(null);

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
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <div>
              <h2 className="text-lg font-bold tracking-tighter text-white">
                PRINTS BY LILY
              </h2>
              <p className="text-[10px] text-[#D4AF37] font-medium uppercase tracking-widest">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            { id: 'overview', icon: Activity, label: 'Vue d\'ensemble' },
            { id: 'orders', icon: Package, label: 'Commandes' },
            { id: 'history', icon: History, label: 'Historique' },
            { id: 'products', icon: Package, label: 'Produits' },
            { id: 'designs', icon: ImageIcon, label: 'Exemples & Designs' },
            { id: 'users', icon: Users, label: 'Utilisateurs' },
            { id: 'settings', icon: Settings, label: 'Configuration' },
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

          <div className="pt-4 mt-4 border-t border-white/10">
            <Link
              to="/"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-colors group"
            >
              <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Retour au site</span>
            </Link>
          </div>
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
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#0F0F0F] border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-colors w-64"
              />
            </div>
            {activeTab === 'products' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }}
              >
                New Product
              </Button>
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
                  <div className="flex gap-2">
                    <select
                      value={activeFilter}
                      onChange={(e) => setActiveFilter(e.target.value)}
                      className="bg-[#0F0F0F] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-[#D4AF37]"
                    >
                      <option value="all">Tous les statuts</option>
                      <option value="pending">Nouveau</option>
                      <option value="confirmed">Confirmé</option>
                      <option value="pressing">En préparation</option>
                    </select>
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
                      ) : orders
                        .filter(o => activeFilter === 'all' || o.status === activeFilter)
                        .filter(o => {
                          const q = searchQuery.toLowerCase();
                          const name = `${o.profiles?.first_name || ''} ${o.profiles?.last_name || ''}`.toLowerCase();
                          const address = (typeof o.shipping_address === 'string' ? o.shipping_address : '').toLowerCase();
                          return o.id.toLowerCase().includes(q) || name.includes(q) || address.includes(q);
                        })
                        .slice(0, 5)
                        .map((order) => (
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
                                className={`px-3 py-1 rounded-full text-xs font-medium bg-transparent border-none focus:ring-0 cursor-pointer ${order.status === 'shipped' ? 'bg-green-500/10 text-green-400' :
                                  order.status === 'confirmed' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' :
                                    order.status === 'pressing' ? 'bg-blue-500/10 text-blue-400' :
                                      order.status === 'pending' ? 'bg-purple-500/10 text-purple-400' :
                                        order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400' :
                                          'bg-red-500/10 text-red-400'
                                  }`}
                              >
                                <option value="pending" className="bg-[#181818] text-white">Nouveau</option>
                                <option value="confirmed" className="bg-[#181818] text-white">Confirmé</option>
                                <option value="pressing" className="bg-[#181818] text-white">En préparation</option>
                                <option value="shipped" className="bg-[#181818] text-white">Expédié</option>
                                <option value="delivered" className="bg-[#181818] text-white">Livré</option>
                                <option value="cancelled" className="bg-[#181818] text-white">Annulé</option>
                                <option value="refused" className="bg-[#181818] text-white">Refusée</option>
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
                <h2 className="text-lg font-bold text-blue-400">Commandes Actives</h2>
                <div className="flex gap-2">
                  <select
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                    className="bg-[#0F0F0F] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-[#D4AF37]"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="pending">Nouveau</option>
                    <option value="confirmed">Confirmé</option>
                    <option value="pressing">En préparation</option>
                  </select>
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
                    ) : orders
                      .filter(o => ['pending', 'confirmed', 'pressing'].includes(o.status))
                      .filter(o => activeFilter === 'all' || o.status === activeFilter)
                      .filter(o => {
                        const q = searchQuery.toLowerCase();
                        const name = `${o.profiles?.first_name || ''} ${o.profiles?.last_name || ''}`.toLowerCase();
                        const address = (typeof o.shipping_address === 'string' ? o.shipping_address : '').toLowerCase();
                        return o.id.toLowerCase().includes(q) || name.includes(q) || address.includes(q);
                      })
                      .map((order) => (
                        <tr key={order.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-medium text-xs font-mono">{order.id.split('-')[0]}</td>
                          <td className="p-4 text-white/80">
                            {order.profiles?.first_name ? `${order.profiles.first_name} ${order.profiles.last_name || ''}` : order.shipping_address}
                          </td>
                          <td className="p-4 text-white/60 text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                          <td className="p-4">
                            <select
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                              className={`px-3 py-1 rounded-full text-xs font-medium bg-transparent border-none focus:ring-0 cursor-pointer ${order.status === 'shipped' ? 'bg-green-500/10 text-green-400' :
                                order.status === 'confirmed' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' :
                                  order.status === 'pressing' ? 'bg-blue-500/10 text-blue-400' :
                                    order.status === 'pending' ? 'bg-purple-500/10 text-purple-400' :
                                      'bg-red-500/10 text-red-400'
                                }`}
                            >
                              <option value="pending" className="bg-[#181818] text-white">Nouveau</option>
                              <option value="confirmed" className="bg-[#181818] text-white">Confirmé</option>
                              <option value="pressing" className="bg-[#181818] text-white">En préparation</option>
                              <option value="shipped" className="bg-[#181818] text-white">Expédié</option>
                              <option value="delivered" className="bg-[#181818] text-white">Livré</option>
                              <option value="cancelled" className="bg-[#181818] text-white">Annulé</option>
                              <option value="refused" className="bg-[#181818] text-white">Refusée</option>
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
                {!ordersLoading && orders.filter(o => ['pending', 'confirmed', 'pressing'].includes(o.status)).length === 0 && (
                  <div className="p-8 text-center text-white/50">Aucune commande active.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-[#181818] rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-lg font-bold text-green-400">Historique des commandes</h2>
                <div className="flex gap-2">
                  <select
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                    className="bg-[#0F0F0F] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-[#D4AF37]"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="shipped">Expédié</option>
                    <option value="delivered">Livré</option>
                    <option value="cancelled">Annulé</option>
                    <option value="refused">Refusée</option>
                  </select>
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
                    ) : orders
                      .filter(o => ['shipped', 'delivered', 'cancelled', 'refused'].includes(o.status))
                      .filter(o => activeFilter === 'all' || o.status === activeFilter)
                      .filter(o => {
                        const q = searchQuery.toLowerCase();
                        const name = `${o.profiles?.first_name || ''} ${o.profiles?.last_name || ''}`.toLowerCase();
                        const address = (typeof o.shipping_address === 'string' ? o.shipping_address : '').toLowerCase();
                        return o.id.toLowerCase().includes(q) || name.includes(q) || address.includes(q);
                      })
                      .map((order) => (
                        <tr key={order.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-medium text-xs font-mono">{order.id.split('-')[0]}</td>
                          <td className="p-4 text-white/80">
                            {order.profiles?.first_name ? `${order.profiles.first_name} ${order.profiles.last_name || ''}` : order.shipping_address}
                          </td>
                          <td className="p-4 text-white/60 text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                          <td className="p-4">
                            <select
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                              className={`px-3 py-1 rounded-full text-xs font-medium bg-transparent border-none focus:ring-0 cursor-pointer ${order.status === 'shipped' ? 'bg-green-500/10 text-green-400' :
                                order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400' :
                                  order.status === 'confirmed' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' :
                                    order.status === 'pressing' ? 'bg-blue-500/10 text-blue-400' :
                                      order.status === 'pending' ? 'bg-purple-500/10 text-purple-400' :
                                        'bg-red-500/10 text-red-400'
                                }`}
                            >
                              <option value="pending" className="bg-[#181818] text-white">Nouveau</option>
                              <option value="confirmed" className="bg-[#181818] text-white">Confirmé</option>
                              <option value="pressing" className="bg-[#181818] text-white">En préparation</option>
                              <option value="shipped" className="bg-[#181818] text-white">Expédié</option>
                              <option value="delivered" className="bg-[#181818] text-white">Livré</option>
                              <option value="cancelled" className="bg-[#181818] text-white">Annulé</option>
                              <option value="refused" className="bg-[#181818] text-white">Refusée</option>
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
                {!ordersLoading && orders.filter(o => ['shipped', 'delivered', 'cancelled', 'refused'].includes(o.status)).length === 0 && (
                  <div className="p-8 text-center text-white/50">Aucun historique.</div>
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
                    ) : products
                      .filter(p => {
                        const q = searchQuery.toLowerCase();
                        return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
                      })
                      .map((product) => (
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
                              <button
                                onClick={() => {
                                  setEditingProduct(product);
                                  setIsProductModalOpen(true);
                                }}
                                className="p-2 text-white/40 hover:text-[#D4AF37] transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm('Voulez-vous vraiment supprimer ce produit ?')) {
                                    await deleteProduct(product.id);
                                  }
                                }}
                                className="p-2 text-white/40 hover:text-red-500 transition-colors"
                              >
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

          {activeTab === 'designs' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Exemples & Designs</h2>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setEditingDesign(null);
                    setIsDesignModalOpen(true);
                  }}
                >
                  Ajouter un Design
                </Button>
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
                    {designs
                      .filter(d => {
                        const q = searchQuery.toLowerCase();
                        return d.title.toLowerCase().includes(q) || d.category.toLowerCase().includes(q);
                      })
                      .map((design) => (
                        <tr key={design.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg bg-[#222] overflow-hidden">
                                <img src={design.image_url} alt={design.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <span className="font-medium">{design.title}</span>
                            </div>
                          </td>
                          <td className="p-4 text-white/60">{design.category}</td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => updateDesign(design.id, { is_featured: !design.is_featured })}
                              className={`p-2 rounded-full transition-colors ${design.is_featured ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                                }`}
                              title={design.is_featured ? "Retirer de l'accueil" : "Mettre à l'accueil"}
                            >
                              <Star className={`w-5 h-5 ${design.is_featured ? 'fill-current' : ''}`} />
                            </button>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingDesign(design);
                                  setIsDesignModalOpen(true);
                                }}
                                className="p-2 text-white/40 hover:text-[#D4AF37] transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm('Voulez-vous vraiment supprimer ce design ?')) {
                                    await deleteDesign(design.id);
                                  }
                                }}
                                className="p-2 text-white/40 hover:text-red-400 transition-colors"
                              >
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
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Utilisateurs</h2>
              </div>
              <div className="bg-[#181818] rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0F0F0F] text-white/60 text-xs uppercase tracking-wider">
                      <th className="p-4 font-medium">Utilisateur</th>
                      <th className="p-4 font-medium">Email</th>
                      <th className="p-4 font-medium">Téléphone</th>
                      <th className="p-4 font-medium">Date d'inscription</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {usersLoading ? (
                      <tr><td colSpan={4} className="p-8 text-center text-white/50">Loading users...</td></tr>
                    ) : users
                      .filter(u => {
                        const q = searchQuery.toLowerCase();
                        const name = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
                        return name.includes(q) || (u.email || '').toLowerCase().includes(q);
                      })
                      .map((user) => (
                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-medium">{user.first_name} {user.last_name}</td>
                          <td className="p-4 text-white/60">{user.email}</td>
                          <td className="p-4 text-white/60">{user.phone || '-'}</td>
                          <td className="p-4 text-white/40 text-sm">{new Date(user.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && <SettingsPanel />}
        </main>
      </div>

      {/* Modals */}
      {selectedOrder && (
        <OrderPreviewModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}

      <ProductModal
        isOpen={isProductModalOpen}
        product={editingProduct}
        onClose={() => setIsProductModalOpen(false)}
        onSave={async (data) => {
          if (editingProduct) {
            await updateProduct(editingProduct.id, data);
          } else {
            await addProduct(data);
          }
        }}
      />

      <DesignModal
        isOpen={isDesignModalOpen}
        design={editingDesign}
        onClose={() => setIsDesignModalOpen(false)}
        onSave={async (data) => {
          if (editingDesign) {
            await updateDesign(editingDesign.id, data);
          } else {
            await addDesign(data);
          }
        }}
      />
    </div>
  );
}

function SettingsPanel() {
  const { value: hero, update: updateHero } = useSiteSettings('hero');
  const { value: navbar, update: updateNavbar } = useSiteSettings('navbar');
  const { value: footer, update: updateFooter } = useSiteSettings('footer');

  const [heroForm, setHeroForm] = useState<any>(null);
  const [navForm, setNavForm] = useState<any>(null);
  const [footerForm, setFooterForm] = useState<any>(null);

  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => { if (hero) setHeroForm(hero); }, [hero]);
  useEffect(() => { if (navbar) setNavForm(navbar); }, [navbar]);
  useEffect(() => { if (footer) setFooterForm(footer); }, [footer]);

  const handleSave = async (key: string, data: any) => {
    setSaving(key);
    if (key === 'hero') await updateHero(data);
    if (key === 'navbar') await updateNavbar(data);
    if (key === 'footer') await updateFooter(data);
    setSaving(null);
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Settings */}
      <section className="bg-[#181818] rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#1c1c1c]">
          <h3 className="font-bold flex items-center gap-2 italic tracking-tighter text-lg">
            <span className="text-[#D4AF37]">01.</span> SECTION HERO (ACCUEIL)
          </h3>
          <Button
            disabled={saving === 'hero'}
            onClick={() => handleSave('hero', heroForm)}
            size="sm"
            className="bg-[#D4AF37] text-black"
          >
            {saving === 'hero' ? '...' : <><Save className="w-4 h-4 mr-2" /> Enregistrer</>}
          </Button>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Badge (Texte doré)</label>
              <input
                type="text"
                value={heroForm?.badge || ''}
                onChange={e => setHeroForm({ ...heroForm, badge: e.target.value })}
                className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-[#D4AF37] outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Titre Principal (H1)</label>
              <textarea
                rows={2}
                value={heroForm?.title || ''}
                onChange={e => setHeroForm({ ...heroForm, title: e.target.value })}
                className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-[#D4AF37] outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Sous-titre (Description)</label>
              <textarea
                rows={3}
                value={heroForm?.subtitle || ''}
                onChange={e => setHeroForm({ ...heroForm, subtitle: e.target.value })}
                className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-[#D4AF37] outline-none"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Texte Bouton</label>
                <input
                  type="text"
                  value={heroForm?.cta_text || ''}
                  onChange={e => setHeroForm({ ...heroForm, cta_text: e.target.value })}
                  className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-[#D4AF37] outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Lien Bouton</label>
                <input
                  type="text"
                  value={heroForm?.cta_link || ''}
                  onChange={e => setHeroForm({ ...heroForm, cta_link: e.target.value })}
                  className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-[#D4AF37] outline-none"
                />
              </div>
            </div>
            <p className="text-xs text-white/30 italic">Les paramètres du modèle 3D du Hero se gèrent directement depuis le Studio 3D via le bouton "Mettre à l''accueil".</p>
          </div>
        </div>
      </section>

      {/* Navbar Settings */}
      <section className="bg-[#181818] rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#1c1c1c]">
          <h3 className="font-bold flex items-center gap-2 italic tracking-tighter text-lg">
            <span className="text-[#D4AF37]">02.</span> NAVIGATION & LOGO
          </h3>
          <Button
            disabled={saving === 'navbar'}
            onClick={() => handleSave('navbar', navForm)}
            size="sm"
            className="bg-[#D4AF37] text-black"
          >
            {saving === 'navbar' ? '...' : <><Save className="w-4 h-4 mr-2" /> Enregistrer</>}
          </Button>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-1">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Texte du Logo</label>
            <input
              type="text"
              value={navForm?.logo_text || ''}
              onChange={e => setNavForm({ ...navForm, logo_text: e.target.value })}
              className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-[#D4AF37] outline-none font-bold tracking-tighter"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Couleur d'accent (Point)</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={navForm?.logo_color || '#D4AF37'}
                onChange={e => setNavForm({ ...navForm, logo_color: e.target.value })}
                className="h-10 w-20 bg-[#0F0F0F] border border-white/10 rounded-xl p-1 outline-none cursor-pointer"
              />
              <input
                type="text"
                value={navForm?.logo_color || ''}
                onChange={e => setNavForm({ ...navForm, logo_color: e.target.value })}
                className="flex-1 bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-[#D4AF37] outline-none font-mono"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer Settings */}
      <section className="bg-[#181818] rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#1c1c1c]">
          <h3 className="font-bold flex items-center gap-2 italic tracking-tighter text-lg">
            <span className="text-[#D4AF37]">03.</span> PIED DE PAGE (FOOTER)
          </h3>
          <Button
            disabled={saving === 'footer'}
            onClick={() => handleSave('footer', footerForm)}
            size="sm"
            className="bg-[#D4AF37] text-black"
          >
            {saving === 'footer' ? '...' : <><Save className="w-4 h-4 mr-2" /> Enregistrer</>}
          </Button>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Description Courte</label>
              <textarea
                rows={3}
                value={footerForm?.description || ''}
                onChange={e => setFooterForm({ ...footerForm, description: e.target.value })}
                className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-[#D4AF37] outline-none"
              />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Email</label>
                <input
                  type="email"
                  value={footerForm?.email || ''}
                  onChange={e => setFooterForm({ ...footerForm, email: e.target.value })}
                  className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-[#D4AF37] outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Téléphone</label>
                <div className="flex">
                  <div className="bg-[#0F0F0F] border border-r-0 border-white/10 rounded-l-xl px-4 py-2.5 text-white/40 flex items-center text-sm font-mono">
                    +212
                  </div>
                  <input
                    type="text"
                    value={footerForm?.phone?.replace('+212', '') || ''}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                      setFooterForm({ ...footerForm, phone: val ? `+212${val}` : '' });
                    }}
                    className="flex-1 bg-[#0F0F0F] border border-white/10 rounded-r-xl px-4 py-2.5 text-sm focus:border-[#D4AF37] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-1">Réseaux Sociaux (URLs)</label>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center bg-[#0F0F0F] border border-white/10 rounded-xl"><ImageIcon className="w-4 h-4 text-white/30" /></div>
                <input
                  placeholder="Instagram URL"
                  value={footerForm?.socials?.instagram || ''}
                  onChange={e => setFooterForm({ ...footerForm, socials: { ...footerForm.socials, instagram: e.target.value } })}
                  className="flex-1 bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-[#D4AF37] outline-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center bg-[#0F0F0F] border border-white/10 rounded-xl"><ImageIcon className="w-4 h-4 text-white/30" /></div>
                <input
                  placeholder="Twitter URL"
                  value={footerForm?.socials?.twitter || ''}
                  onChange={e => setFooterForm({ ...footerForm, socials: { ...footerForm.socials, twitter: e.target.value } })}
                  className="flex-1 bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-[#D4AF37] outline-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center bg-[#0F0F0F] border border-white/10 rounded-xl"><ImageIcon className="w-4 h-4 text-white/30" /></div>
                <input
                  placeholder="Facebook URL"
                  value={footerForm?.socials?.facebook || ''}
                  onChange={e => setFooterForm({ ...footerForm, socials: { ...footerForm.socials, facebook: e.target.value } })}
                  className="flex-1 bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-[#D4AF37] outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
