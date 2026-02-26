import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, ChevronDown, Heart, ShoppingBag } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useProducts } from '../hooks/useProducts';

export function Explore() {
  const { products, loading } = useProducts();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || 'All';
  // Normalize category: handle 'tshirts' -> 'tshirt', and case sensitivity
  const normalizedCategory = categoryParam.toLowerCase().endsWith('s') && categoryParam !== 'All'
    ? categoryParam.slice(0, -1).toLowerCase()
    : categoryParam;

  const [activeCategory, setActiveCategory] = useState(normalizedCategory);

  const CATEGORIES = ['All', 'tshirt', 'hoodie'];

  const filteredProducts = activeCategory.toLowerCase() === 'all'
    ? products
    : products.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase());

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-8 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-4">Notre Catalogue</h1>
            <p className="text-white/60 text-lg max-w-xl">
              Parcourez notre sélection de vêtements premium, prêts à être personnalisés dans le Studio 3D.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="secondary" className="flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filtres
            </Button>
            <div className="relative">
              <select className="appearance-none bg-[#181818] border border-white/10 text-white py-3 pl-6 pr-12 rounded-xl focus:outline-none focus:border-[#D4AF37] transition-colors cursor-pointer">
                <option>Plus Récents</option>
                <option>Prix: Croissant</option>
                <option>Prix: Décroissant</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row gap-8 mb-12 pb-8 border-b border-white/10">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Catégories</h3>
            <div className="flex flex-wrap gap-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 capitalize ${activeCategory === cat
                    ? 'bg-white text-black'
                    : 'bg-[#181818] text-white/70 hover:bg-white/10 border border-white/5'
                    }`}
                >
                  {cat === 'All' ? 'Tous' : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative rounded-2xl overflow-hidden bg-[#181818] border border-white/5 flex flex-col"
            >
              <div className="aspect-[4/5] relative overflow-hidden bg-[#222]">
                <img
                  src={product.image_url || `https://picsum.photos/seed/${product.id}/600/800`}
                  alt={product.name}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />

                {/* Overlay Actions */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-4 group-hover:translate-x-0">
                  <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-[#E63946] hover:text-white transition-colors">
                    <Heart className="w-5 h-5" />
                  </button>
                  <Link to={`/product/${product.id}`}>
                    <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-[#D4AF37] hover:text-black transition-colors">
                      <ShoppingBag className="w-5 h-5" />
                    </button>
                  </Link>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center">
                  <Link to={`/product/${product.id}`} className="w-full">
                    <Button variant="primary" className="w-full translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      Voir les détails
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2 gap-4">
                  <h3 className="text-lg font-bold line-clamp-2">{product.name}</h3>
                  <span className="text-[#D4AF37] font-medium whitespace-nowrap">{product.base_price} MAD</span>
                </div>
                <p className="text-white/50 text-sm mb-4 capitalize">
                  {product.category} Base
                </p>

                <div className="mt-auto flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-white/10 text-white/80">
                    Studio 3D Compatible
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-20 text-white/50">
            Aucun produit trouvé dans cette catégorie.
          </div>
        )}
      </div>
    </div>
  );
}
