import React, { Suspense, useState, useEffect } from 'react';
import * as THREE from 'three';
import { motion } from 'motion/react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ShirtModel, StudioLights } from '../components/3d/ShirtModel';
import { ArrowRight, Star } from 'lucide-react';

import { useSiteSettings, useFeaturedDesigns } from '../hooks/useSiteSettings';

export function Home() {
  const { value: heroSettings, loading: heroLoading } = useSiteSettings('hero');
  const { value: featuredSettings, loading: featuredLoading } = useSiteSettings('featured_section');
  const { designs: featuredDesigns, loading: designsLoading } = useFeaturedDesigns();

  const isReady = !heroLoading && !featuredLoading && !designsLoading;
  // Decouple Canvas mounting from data loading to prevent GPU context loss
  const [readyToRender, setReadyToRender] = useState(false);

  useEffect(() => {
    // Only set ready once ALL essential data is loaded for the first time
    if (!heroLoading && !featuredLoading && !designsLoading) {
      setReadyToRender(true);
    }
  }, [heroLoading, featuredLoading, designsLoading]);

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      {/* Hero Section */}
      <section className="relative pt-4 pb-20 lg:pt-8 lg:pb-32 overflow-hidden border-b border-white/5">
        <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-[#D4AF37]/5 via-transparent to-transparent pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="max-w-2xl text-center lg:text-left mx-auto lg:mx-0">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 group cursor-default">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37] group-hover:animate-ping" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">{heroSettings?.badge || 'Nouveauté 2025'}</span>
                </div>
                <h1 className="text-5xl lg:text-8xl font-black mb-8 leading-[0.9] tracking-tighter">
                  {heroSettings?.title || 'CRÉE TON'} <br />
                  
                </h1>
                <p className="text-lg lg:text-xl text-white/50 mb-10 leading-relaxed font-light max-w-xl mx-auto lg:mx-0">
                  {heroSettings?.subtitle || 'Personnalisez vos t-shirts avec notre outil 3D ultra-fluide et recevez-les chez vous.'}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              >
                <Link to={heroSettings?.cta_link || '/studio'}>
                  <Button size="lg" className="w-full sm:w-auto px-10 py-4 text-lg bg-[#D4AF37] text-black hover:bg-white transition-colors">
                    {heroSettings?.cta_text || 'Démarrer la création'}
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* Right 3D Canvas */}
            <div className="h-[500px] lg:h-[700px] w-full relative">
              {readyToRender ? (
                <Canvas
                  shadows={{ type: THREE.PCFShadowMap }}
                  gl={{
                    preserveDrawingBuffer: true,
                    powerPreference: 'high-performance',
                    antialias: true
                  }}
                  camera={{
                    fov: heroSettings?.model_type === 'hoodie' ? 40 : 20,
                    position: [0, 4, 20],
                  }}
                >
                  <StudioLights />

                  <Suspense fallback={null}>
                    <ShirtModel
                      key={heroSettings?.model_type || 'tshirt'}
                      modelType={heroSettings?.model_type || 'tshirt'}
                      color={heroSettings?.shirt_color || '#111111'}
                      decals={heroSettings?.decals || []}
                      autoRotate
                    />
                  </Suspense>

                  <OrbitControls
                    target={[0, 0.4, 0]}
                    enableZoom={false}
                    enablePan={false}
                    autoRotate
                    autoRotateSpeed={0.5}
                  />
                </Canvas>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 border-2 border-[#D4AF37]/20 rounded-full animate-ping" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Designs Section */}
      <div className="py-32 relative z-10 border-t border-white/5 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-2 text-[#D4AF37] font-medium mb-4 uppercase tracking-widest text-sm">
                <Star className="w-4 h-4" />
                <span>{featuredSettings?.badge_text || 'Sélection Admin'}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
                {featuredSettings?.title || 'Designs à la Une'}
              </h2>
              <p className="text-white/60 mt-4 max-w-xl text-lg">
                {featuredSettings?.subtitle || 'Découvrez nos créations les plus populaires, sélectionnées spécialement pour vous.'}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Link to="/explore">
                <Button variant="secondary" className="group">
                  Voir tout le catalogue
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredDesigns.filter(d => d.is_featured).map((design, index) => (
              <motion.div
                key={design.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-[#181818] mb-6 border border-white/5 group-hover:border-[#D4AF37]/30 transition-colors duration-500">
                  <img
                    src={design.image_url || 'https://picsum.photos/seed/cyber/400/400'}
                    alt={design.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                    <Link to={`/product/${design.id}`}>
                      <Button variant="primary" className="w-full bg-white text-black hover:bg-[#D4AF37]">
                        Personnaliser ce design
                      </Button>
                    </Link>
                  </div>
                </div>
                <div>
                  <p className="text-[#D4AF37] text-sm font-medium mb-2">{design.category}</p>
                  <h3 className="text-2xl font-bold group-hover:text-[#D4AF37] transition-colors">{design.title}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

