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
                                <p><span className="text-white/50">Statut:</span>
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${order.status === 'pending' ? 'bg-purple-500/10 text-purple-400' :
                                        order.status === 'confirmed' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' :
                                            order.status === 'pressing' ? 'bg-blue-500/10 text-blue-400' :
                                                order.status === 'shipped' ? 'bg-orange-500/10 text-orange-400' :
                                                    order.status === 'delivered' ? 'bg-green-500/10 text-green-400' :
                                                        order.status === 'refused' ? 'bg-red-500/10 text-red-400' :
                                                            'bg-white/10 text-white'
                                        }`}>
                                        {order.status === 'pending' ? 'Nouveau' :
                                            order.status === 'confirmed' ? 'Confirmé' :
                                                order.status === 'pressing' ? 'En préparation' :
                                                    order.status === 'shipped' ? 'Expédié' :
                                                        order.status === 'delivered' ? 'Livré' :
                                                            order.status === 'refused' ? 'Refusée' :
                                                                order.status === 'cancelled' ? 'Annulée' : order.status}
                                    </span>
                                </p>
                                <p><span className="text-white/50">Client:</span> {order.profiles?.first_name ? `${order.profiles.first_name} ${order.profiles.last_name || ''}` : (typeof order.shipping_address === 'string' ? order.shipping_address.split(',')[0] : order.shipping_address?.firstName)}</p>
                                <p><span className="text-white/50">Email:</span> {order.profiles?.email || order.shipping_address?.email}</p>
                                <p><span className="text-white/50">Téléphone:</span> {order.phone || order.profiles?.phone || order.shipping_address?.phone}</p>
                                <p><span className="text-white/50">Adresse:</span> {typeof order.shipping_address === 'string' ? order.shipping_address : `${order.shipping_address?.address}, ${order.shipping_address?.city}`}</p>
                            </div>
                        </div>

                        {/* Status Stepper in Modal */}
                        <div className="px-6 py-6 border-b border-white/10 bg-[#111]">
                            {['cancelled', 'refused'].includes(order.status) ? (
                                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500">
                                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                        <X className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold">Commande {order.status === 'refused' ? 'Refusée' : 'Annulée'}</p>
                                        <p className="text-xs opacity-80">
                                            {order.status === 'refused'
                                                ? "Refusée par l'administration."
                                                : "Annulée par l'administration."}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-between relative px-2">
                                    <div className="absolute top-1.5 left-0 w-full h-0.5 bg-white/5 z-0" />
                                    <div
                                        className="absolute top-1.5 left-0 h-0.5 bg-[#D4AF37] z-0 transition-all duration-1000"
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
                                                <span className={`text-[9px] font-bold transition-colors ${isCurrent ? 'text-[#D4AF37]' : isCompleted ? 'text-white/60' : 'text-white/20'
                                                    }`}>
                                                    {s.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
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
