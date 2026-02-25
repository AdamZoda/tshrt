import React, { useState, useRef, Suspense, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import {
  Upload, RotateCcw, Check, Zap, Pipette, Trash2,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Crosshair,
  Plus, ShoppingBag, Heart
} from 'lucide-react';
import { ShirtModel, StudioLights } from '../components/3d/ShirtModel';
import type { DecalLayer } from '../components/3d/ShirtModel';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

// ── Constants ──────────────────────────────────────────────────────────
const MAX_DECALS = 3;
const MOVE_STEP = 0.015;
const DEFAULT_SIZE = 0.12;
const MIN_SIZE = 0.03;
const MAX_SIZE = 0.50;
const SIZE_STEP = 0.005;

const COLOR_PRESETS = [
  { name: 'Noir', value: '#111111' },
  { name: 'Blanc', value: '#EEEEEE' },
  { name: 'Rouge', value: '#E63946' },
  { name: 'Bleu Royal', value: '#1D3557' },
  { name: 'Vert Forêt', value: '#2D6A4F' },
  { name: 'Or', value: '#D4AF37' },
  { name: 'Violet', value: '#7B2D8E' },
  { name: 'Orange', value: '#F77F00' },
  { name: 'Rose', value: '#FF6B9D' },
  { name: 'Gris', value: '#6B7280' },
];

const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

// ── Helpers ────────────────────────────────────────────────────────────
let nextId = 1;
function genId() {
  return `decal-${Date.now()}-${nextId++}`;
}

const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// ── Component ──────────────────────────────────────────────────────────
export function Studio() {
  const navigate = useNavigate();
  const { products, loading: productsLoading } = useProducts();
  const { addToCart } = useCart();

  const FALLBACK_PRODUCT = {
    id: 'fallback-tshirt',
    name: 'T-Shirt Standard',
    description: 'T-shirt classique.',
    category: 'tshirt',
    base_price: 150,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    is_active: true,
  };

  const displayProducts = products.length > 0 ? products : [FALLBACK_PRODUCT];

  const [activeProduct, setActiveProduct] = useState<any>(null);
  const [activeColor, setActiveColor] = useState('#111111');
  const [activeSize, setActiveSize] = useState('L');
  const [isPressing, setIsPressing] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Multi-decal state
  const [decals, setDecals] = useState<DecalLayer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Favorites state
  const { user } = useAuth();
  const [isSavingDesign, setIsSavingDesign] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Stability state
  const [readyToRender, setReadyToRender] = useState(false);

  // 1. Initial product and design recovery
  useEffect(() => {
    if (productsLoading || displayProducts.length === 0) return;

    if (!activeProduct) {
      const designToLoadRaw = localStorage.getItem('bocharwit_load_design');
      console.log("Checking for design to load...", designToLoadRaw ? "Found" : "None");

      if (designToLoadRaw) {
        try {
          const design = JSON.parse(designToLoadRaw);
          const product = displayProducts.find(p => p.id === design.product_id) || displayProducts[0];

          setActiveProduct(product);
          setActiveColor(design.color || '#111111');

          if (design.design_data?.decals) {
            const recoveredDecals = design.design_data.decals.map((d: any) => ({
              ...d,
              imageUrl: d.imageUrl || d.imageBase64
            }));
            setDecals(recoveredDecals);
            if (recoveredDecals.length > 0) {
              setSelectedId(recoveredDecals[0].id);
            }
          }
          setTimeout(() => localStorage.removeItem('bocharwit_load_design'), 1000);
        } catch (err) {
          console.error("Error loading saved design:", err);
          setActiveProduct(displayProducts[0]);
        }
      } else {
        setActiveProduct(displayProducts[0]);
      }
    }

    const timer = setTimeout(() => setReadyToRender(true), 150);
    return () => clearTimeout(timer);
  }, [productsLoading, displayProducts, activeProduct]);

  const colorInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedDecal = decals.find((d) => d.id === selectedId) ?? null;

  // ── Handlers ───────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || decals.length >= MAX_DECALS) return;

    try {
      const base64 = await convertToBase64(file);
      const newDecal: DecalLayer = {
        id: genId(),
        imageUrl: base64,
        side: 'front',
        x: 0,
        y: 0.08,
        size: DEFAULT_SIZE,
      };
      setDecals((prev) => [...prev, newDecal]);
      setSelectedId(newDecal.id);
      setIsPressed(false);
    } catch (err) {
      console.error("Failed to convert image", err);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeDecal = (id: string) => {
    setDecals((prev) => prev.filter((d) => d.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const updateSelected = (updates: Partial<DecalLayer>) => {
    if (!selectedId) return;
    setDecals((prev) =>
      prev.map((d) => (d.id === selectedId ? { ...d, ...updates } : d))
    );
  };

  const handleHeatPress = () => {
    setIsPressing(true);
    setTimeout(() => {
      setIsPressing(false);
      setIsPressed(true);
    }, 3000);
  };

  const handleResetAll = () => {
    setDecals([]);
    setSelectedId(null);
    setIsPressed(false);
    setIsPressing(false);
  };

  const currentPrice = activeProduct
    ? activeProduct.base_price + (decals.length > 0 ? 50 * decals.length : 0)
    : 0;

  const handleAddToCart = () => {
    if (!activeProduct) return;
    addToCart({
      product_id: activeProduct.id,
      product_name: activeProduct.name + (decals.length > 0 ? ' (Personnalisé)' : ''),
      size: activeSize,
      color: activeColor,
      quantity: 1,
      unit_price: currentPrice,
      design_data: {
        color: activeColor,
        decals: decals.map(d => ({
          side: d.side,
          x: d.x,
          y: d.y,
          size: d.size,
          imageBase64: d.imageUrl
        }))
      }
    });
    navigate('/cart');
  };

  const handleSaveDesign = async () => {
    if (!user) {
      alert("Veuillez vous connecter pour sauvegarder vos designs.");
      navigate('/login');
      return;
    }
    if (!activeProduct) return;
    setIsSavingDesign(true);

    const designData = {
      color: activeColor,
      decals: decals.map(d => ({
        side: d.side,
        x: d.x,
        y: d.y,
        size: d.size,
        imageBase64: d.imageUrl
      }))
    };

    try {
      const { error } = await supabase
        .from('saved_designs')
        .insert({
          user_id: user.id,
          name: `${activeProduct.name} - Custom`,
          product_id: activeProduct.id === 'fallback-tshirt' ? null : activeProduct.id,
          color: activeColor,
          design_data: designData,
        });
      if (error) throw error;
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save design", err);
      alert("Une erreur est survenue lors de la sauvegarde.");
    } finally {
      setIsSavingDesign(false);
    }
  };

  const sizes = activeProduct?.sizes || DEFAULT_SIZES;

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] bg-[#0F0F0F] overflow-hidden">
      {/* ── Left Panel ───────────────────────────────────────────── */}
      <div className="w-full lg:w-[420px] bg-[#181818] border-r border-white/10 p-6 flex flex-col h-full overflow-y-auto custom-scrollbar">
        <h1 className="text-2xl font-bold mb-6">Studio 3D</h1>

        {/* 1. Product */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">1. Coupe de base</h3>
          <div className="grid grid-cols-1 gap-2">
            {displayProducts.map((p: any) => (
              <button
                key={p.id}
                onClick={() => setActiveProduct(p)}
                className={`py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 text-left flex justify-between items-center ${activeProduct?.id === p.id
                  ? 'bg-white text-black shadow-[0_0_20px_rgba(212,175,55,0.2)] border border-[#D4AF37]'
                  : 'bg-[#0F0F0F] text-white/70 hover:bg-white/10 border border-white/5'
                  }`}
              >
                <span>
                  {p.name}
                  {p.id === 'fallback-tshirt' && <span className="ml-2 text-[10px] text-[#D4AF37] border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-1.5 py-0.5 rounded tracking-widest uppercase">Démo</span>}
                </span>
                <span className={activeProduct?.id === p.id ? 'text-black font-bold' : 'text-[#D4AF37]'}>{p.base_price} MAD</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Color */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">2. Couleur</h3>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="relative w-12 h-12 rounded-xl border-2 border-white/20 overflow-hidden cursor-pointer hover:border-[#D4AF37] transition-colors group"
              onClick={() => colorInputRef.current?.click()}
            >
              <div className="absolute inset-0" style={{ backgroundColor: activeColor }} />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                <Pipette className="w-5 h-5 text-white" />
              </div>
              <input
                ref={colorInputRef}
                type="color"
                value={activeColor}
                onChange={(e) => setActiveColor(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-white/80 font-medium">Couleur libre</p>
              <p className="text-xs text-white/40 font-mono uppercase">{activeColor}</p>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c.name}
                onClick={() => setActiveColor(c.value)}
                className={`w-full aspect-square rounded-lg border-2 transition-all duration-300 relative group ${activeColor === c.value
                  ? 'border-[#D4AF37] scale-105 shadow-[0_0_12px_rgba(212,175,55,0.3)]'
                  : 'border-white/10 hover:border-white/30 hover:scale-105'
                  }`}
                style={{ backgroundColor: c.value }}
                title={c.name}
              >
                {activeColor === c.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                  </div>
                )}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {c.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Images */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
              3. Design & Images ({decals.length}/{MAX_DECALS})
            </h3>
            {decals.length > 0 && (
              <button
                onClick={handleResetAll}
                className="text-[10px] text-white/40 hover:text-[#E63946] transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Tout supprimer
              </button>
            )}
          </div>

          {decals.length > 0 && (
            <div className="space-y-2 mb-3">
              {decals.map((d, i) => (
                <div
                  key={d.id}
                  onClick={() => setSelectedId(selectedId === d.id ? null : d.id)}
                  className={`rounded-xl cursor-pointer transition-all duration-200 border overflow-hidden ${selectedId === d.id
                    ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                    : 'border-white/5 bg-[#0F0F0F] hover:border-white/15'
                    }`}
                >
                  <div className="flex items-center gap-3 p-2.5">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#222] shrink-0">
                      <img src={d.imageUrl} alt={`Image ${i + 1}`} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">Image {i + 1}</p>
                      <p className="text-[10px] text-white/40">
                        {d.side === 'front' ? '👕 Devant' : '🔄 Dos'} · {Math.round(d.size * 100)}%
                      </p>
                    </div>
                    {selectedId === d.id && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#D4AF37] text-black font-bold uppercase">Actif</span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeDecal(d.id); }}
                      className="p-1.5 text-white/30 hover:text-[#E63946] hover:bg-[#E63946]/10 rounded-lg transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <AnimatePresence>
                    {selectedId === d.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-white/5">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); updateSelected({ side: 'front' }); }}
                              className={`py-1.5 rounded-lg text-xs font-medium transition-all ${d.side === 'front' ? 'bg-white text-black' : 'bg-[#181818] text-white/60 hover:bg-white/10'}`}
                            >
                              👕 Devant
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); updateSelected({ side: 'back' }); }}
                              className={`py-1.5 rounded-lg text-xs font-medium transition-all ${d.side === 'back' ? 'bg-white text-black' : 'bg-[#181818] text-white/60 hover:bg-white/10'}`}
                            >
                              🔄 Dos
                            </button>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] text-white/40 uppercase tracking-wider">Taille</span>
                              <span className="text-[10px] text-white/40 font-mono">{Math.round(d.size * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min={MIN_SIZE}
                              max={MAX_SIZE}
                              step={SIZE_STEP}
                              value={d.size}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => updateSelected({ size: parseFloat(e.target.value) })}
                              className="w-full accent-[#D4AF37]"
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="grid grid-cols-3 gap-1 shrink-0">
                              <div />
                              <button onClick={(e) => { e.stopPropagation(); updateSelected({ y: Math.min(d.y + MOVE_STEP, 0.25) }); }}
                                className="w-7 h-7 rounded-md bg-[#181818] border border-white/10 flex items-center justify-center hover:border-[#D4AF37] active:bg-[#D4AF37] active:text-black transition-colors">
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <div />
                              <button onClick={(e) => { e.stopPropagation(); updateSelected({ x: Math.max(d.x - MOVE_STEP, -0.20) }); }}
                                className="w-7 h-7 rounded-md bg-[#181818] border border-white/10 flex items-center justify-center hover:border-[#D4AF37] active:bg-[#D4AF37] active:text-black transition-colors">
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); updateSelected({ x: 0, y: 0.08 }); }}
                                className="w-7 h-7 rounded-md bg-[#181818] border border-white/10 flex items-center justify-center hover:border-[#D4AF37] active:bg-[#D4AF37] active:text-black transition-colors" title="Centrer">
                                <Crosshair className="w-3 h-3" />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); updateSelected({ x: Math.min(d.x + MOVE_STEP, 0.20) }); }}
                                className="w-7 h-7 rounded-md bg-[#181818] border border-white/10 flex items-center justify-center hover:border-[#D4AF37] active:bg-[#D4AF37] active:text-black transition-colors">
                                <ArrowRight className="w-3 h-3" />
                              </button>
                              <div />
                              <button onClick={(e) => { e.stopPropagation(); updateSelected({ y: Math.max(d.y - MOVE_STEP, -0.15) }); }}
                                className="w-7 h-7 rounded-md bg-[#181818] border border-white/10 flex items-center justify-center hover:border-[#D4AF37] active:bg-[#D4AF37] active:text-black transition-colors">
                                <ArrowDown className="w-3 h-3" />
                              </button>
                              <div />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div>
                                <span className="text-[9px] text-white/30 uppercase">↔ Horizontal</span>
                                <input type="range" min="-0.20" max="0.20" step="0.005" value={d.x}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => updateSelected({ x: parseFloat(e.target.value) })}
                                  className="w-full accent-[#D4AF37]" />
                              </div>
                              <div>
                                <span className="text-[9px] text-white/30 uppercase">↕ Vertical</span>
                                <input type="range" min="-0.15" max="0.25" step="0.005" value={d.y}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => updateSelected({ y: parseFloat(e.target.value) })}
                                  className="w-full accent-[#D4AF37]" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}

          {decals.length < MAX_DECALS && (
            <label className="relative flex flex-col items-center justify-center w-full py-4 border-2 border-dashed border-white/20 rounded-2xl hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-colors cursor-pointer group">
              <div className="flex items-center gap-2 text-white/60 group-hover:text-white transition-colors">
                <Plus className="w-5 h-5" />
                <span className="text-sm font-medium">Ajouter une image</span>
              </div>
              <span className="text-xs text-white/40 mt-1">
                PNG, JPG, SVG · {MAX_DECALS - decals.length} restant{MAX_DECALS - decals.length > 1 ? 's' : ''}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/png, image/jpeg, image/svg+xml"
                onChange={handleImageUpload}
              />
            </label>
          )}
        </div>

        {/* 4. Size Selection */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">4. Taille</h3>
          <div className="grid grid-cols-5 gap-2">
            {sizes.map(size => (
              <button
                key={size}
                onClick={() => setActiveSize(size)}
                className={`py-2 rounded-lg text-sm font-bold transition-all duration-300 ${activeSize === size
                  ? 'bg-white text-black shadow-[0_0_10px_rgba(212,175,55,0.2)] border border-[#D4AF37]'
                  : 'bg-[#181818] text-white/70 hover:bg-white/10 border border-white/10'
                  }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Price & Actions */}
        <div className="mt-auto pt-6 border-t border-white/10 flex flex-col gap-3">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-white/60 text-sm mb-1">Total</p>
              <p className="text-3xl font-bold tracking-tight">{currentPrice} <span className="text-lg text-[#D4AF37]">MAD</span></p>
            </div>
            {decals.length > 0 && (
              <p className="text-xs text-white/40">+{50 * decals.length} MAD impression</p>
            )}
          </div>

          <Button
            className="w-full bg-[#D4AF37] text-black hover:bg-white border-none" size="lg"
            onClick={handleHeatPress}
            disabled={decals.length === 0 || isPressing || isPressed}
          >
            {isPressing ? (
              <span className="flex items-center justify-center gap-2 animate-pulse w-full"><Zap className="w-5 h-5" /> Presse en cours...</span>
            ) : isPressed ? (
              <span className="flex items-center justify-center gap-2 w-full"><Check className="w-5 h-5" /> Design Appliqué</span>
            ) : (
              <span className="flex items-center justify-center gap-2 w-full"><Zap className="w-5 h-5" /> Vérifier le Rendu</span>
            )}
          </Button>

          <div className="flex items-center gap-3 mt-2">
            <Button
              variant="secondary"
              className={`flex-1 ${saveSuccess ? 'bg-red-500/20 text-red-500 border-red-500/50' : 'bg-[#181818] text-white hover:bg-white/10 border-white/10'}`}
              size="lg"
              onClick={handleSaveDesign}
              disabled={isSavingDesign || saveSuccess}
            >
              <Heart className={`w-5 h-5 mr-2 ${saveSuccess ? 'fill-current' : ''}`} />
              {isSavingDesign ? '...' : saveSuccess ? 'Sauvegardé' : 'Favoris'}
            </Button>

            <Button
              variant="primary"
              className="flex-[2] bg-white text-black hover:bg-gray-200"
              size="lg"
              onClick={handleAddToCart}
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Ajouter au panier
            </Button>
          </div>
        </div>
      </div>

      {/* ── Right Panel — 3D Preview ─────────────────────────────── */}
      <div className="flex-1 relative bg-[#0a0a0a] overflow-hidden">
        <AnimatePresence>
          {isPressing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 pointer-events-none flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm"
            >
              <motion.div
                initial={{ y: -500, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -500, opacity: 0 }}
                transition={{ type: 'spring', damping: 15, duration: 1 }}
                className="w-full max-w-lg h-40 bg-[#222] border-b-8 border-[#D4AF37] rounded-t-2xl shadow-[0_20px_80px_rgba(212,175,55,0.4)] relative z-20 flex items-center justify-center"
              >
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-[#FF5722] rounded-full blur-xl mix-blend-screen opacity-50" />
                <Zap className="w-16 h-16 text-[#D4AF37] animate-pulse" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isPressed && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute top-8 left-1/2 -translate-x-1/2 z-50 bg-[#D4AF37] text-black px-6 py-2 rounded-full font-bold shadow-2xl flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> Design Appliqué !
            </motion.div>
          )}
        </AnimatePresence>

        {readyToRender ? (
          <Canvas
            shadows={{ type: THREE.PCFShadowMap }}
            gl={{ preserveDrawingBuffer: true, antialias: true, powerPreference: 'high-performance' }}
            camera={{ fov: 25, position: [0, 5, 20] }}
          >
            <StudioLights />
            <Suspense fallback={null}>
              <ShirtModel color={activeColor} decals={decals} />
            </Suspense>
            <OrbitControls
              target={[0, 0.4, 0]}
              enablePan={false}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 1.94}
              minDistance={8}
              maxDistance={30}
            />
          </Canvas>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin" />
          </div>
        )}

        <div className="absolute top-6 right-6 flex gap-2 items-center z-10">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 shadow-lg" style={{ backgroundColor: activeColor }} />
          <div className="bg-[#181818]/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-sm font-medium">
            Faites glisser pour tourner
          </div>
        </div>

        {decals.some((d) => d.side === 'back') && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-[#181818]/80 backdrop-blur-md px-4 py-2 rounded-full border border-[#D4AF37]/30 text-sm text-[#D4AF37] font-medium animate-pulse">
              🔄 Tournez le t-shirt pour voir le dos
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
