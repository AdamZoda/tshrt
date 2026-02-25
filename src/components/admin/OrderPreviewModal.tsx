import React, { Suspense, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Package, Ruler, Palette, FileImage } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ShirtModel, StudioLights } from '../3d/ShirtModel';

interface OrderPreviewModalProps {
    order: any;
    onClose: () => void;
}

export function OrderPreviewModal({ order, onClose }: OrderPreviewModalProps) {
    const [activeItemIndex, setActiveItemIndex] = useState(0);

    if (!order) return null;

    const items = order.order_items || [];
    const activeItem = items[activeItemIndex];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col md:flex-row overflow-hidden shadow-2xl relative"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/40 text-white/70 hover:text-white flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Left panel: Info */}
                    <div className="w-full md:w-1/3 bg-[#0F0F0F] border-r border-white/10 flex flex-col h-[40vh] md:h-full overflow-y-auto">
                        <div className="p-6 border-b border-white/10">
                            <h2 className="text-xl font-bold mb-1">Commande {order.id.split('-')[0]}</h2>
                            <p className="text-sm text-white/50">{new Date(order.created_at).toLocaleString()}</p>

                            <div className="mt-4 p-4 bg-[#181818] rounded-xl border border-white/5 space-y-2 text-sm">
                                <p><span className="text-white/50">Client:</span> {order.profiles?.first_name} {order.profiles?.last_name || order.shipping_address?.firstName}</p>
                                <p><span className="text-white/50">Email:</span> {order.profiles?.email || order.shipping_address?.email}</p>
                                <p><span className="text-white/50">Téléphone:</span> {order.profiles?.phone || order.shipping_address?.phone}</p>
                                <p><span className="text-white/50">Adresse:</span> {order.shipping_address?.address}, {order.shipping_address?.city}</p>
                            </div>
                        </div>

                        <div className="p-6 flex-1">
                            <h3 className="font-bold flex items-center gap-2 mb-4">
                                <Package className="w-4 h-4 text-[#D4AF37]" /> Articles ({items.length})
                            </h3>

                            <div className="space-y-3">
                                {items.map((item: any, idx: number) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveItemIndex(idx)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all ${activeItemIndex === idx
                                            ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                                            : 'border-white/5 bg-[#181818] hover:border-white/20'
                                            }`}
                                    >
                                        <div className="font-bold text-sm mb-2">Item #{idx + 1} • {item.quantity}x</div>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-white/70">
                                            <div className="flex items-center gap-1"><Ruler className="w-3 h-3" /> Taille: {item.size}</div>
                                            <div className="flex items-center gap-1"><Palette className="w-3 h-3" /> <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: item.color }} /> {item.color}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right panel: 3D Preview */}
                    <div className="flex-1 relative bg-gradient-to-tr from-[#0F0F0F] via-[#222] to-[#0F0F0F] h-[45vh] md:h-full">
                        {activeItem ? (
                            <>
                                <Canvas shadows camera={{ fov: 25, position: [0, 5, 20] }}>
                                    <StudioLights />
                                    <Suspense fallback={null}>
                                        <ShirtModel
                                            color={activeItem.design_data?.color || activeItem.color}
                                            decals={activeItem.design_data?.decals || []}
                                            autoRotate={false}
                                        />
                                    </Suspense>
                                    <OrbitControls target={[0, 0.4, 0]} enablePan={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 1.94} minDistance={8} maxDistance={30} />
                                </Canvas>
                                <div className="absolute top-6 left-6 right-6 pointer-events-none flex justify-between items-start">
                                    <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 pointer-events-auto">
                                        <p className="font-bold text-sm">Aperçu 3D - Item #{activeItemIndex + 1}</p>
                                        <p className="text-xs text-[#D4AF37] mt-1">{activeItem.design_data?.decals?.length || 0} decals personnalisés</p>
                                    </div>

                                    {activeItem.design_data?.decals && activeItem.design_data.decals.length > 0 && (
                                        <div className="flex flex-col gap-2 pointer-events-auto">
                                            {activeItem.design_data.decals.map((d: any, i: number) => (
                                                <div key={i} className="flex items-center gap-2 bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10 group">
                                                    <img src={d.imageBase64 || d.imageUrl} className="w-10 h-10 object-contain rounded bg-white/5" />
                                                    <a href={d.imageBase64 || d.imageUrl} download={`design_item${activeItemIndex + 1}_${i + 1}.png`} className="hidden group-hover:block px-2 text-xs font-bold text-[#D4AF37] hover:text-white truncate max-w-[80px]">DL PNG</a>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/30 font-medium">
                                Aucun article à prévisualiser.
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
