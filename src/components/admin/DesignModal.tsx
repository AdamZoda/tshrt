import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import type { FeaturedDesign } from '../../hooks/useSiteSettings';

interface DesignModalProps {
    design: FeaturedDesign | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (design: Partial<FeaturedDesign>) => Promise<void>;
}

export function DesignModal({ design, isOpen, onClose, onSave }: DesignModalProps) {
    const [formData, setFormData] = useState<Partial<FeaturedDesign>>({
        title: '',
        category: '',
        image_url: '',
        is_featured: true,
        sort_order: 0,
        link_url: '/studio',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (design) {
            setFormData(design);
        } else {
            setFormData({
                title: '',
                category: '',
                image_url: '',
                is_featured: true,
                sort_order: 0,
                link_url: '/studio',
            });
        }
    }, [design, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        try {
            await onSave(formData);
            onClose();
        } catch (err: any) {
            setError(err.message || "Une erreur est survenue lors de l'enregistrement.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl"
                >
                    <div className="p-6 border-b border-white/10 flex justify-between items-center">
                        <h2 className="text-xl font-bold">{design ? 'Modifier le Design' : 'Nouveau Design'}</h2>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Titre du design</label>
                            <input
                                required
                                type="text"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                                placeholder="ex: Cyberpunk City"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Catégorie / Description courte</label>
                            <input
                                required
                                type="text"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                                placeholder="ex: T-Shirt Standard"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Image URL</label>
                            <input
                                required
                                type="text"
                                value={formData.image_url}
                                onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                                placeholder="https://images.unsplash.com/..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Ordre d'affichage</label>
                                <input
                                    type="number"
                                    value={formData.sort_order}
                                    onChange={e => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                                    className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-6">
                                <input
                                    type="checkbox"
                                    id="is_featured"
                                    checked={formData.is_featured}
                                    onChange={e => setFormData({ ...formData, is_featured: e.target.checked })}
                                    className="w-4 h-4 rounded border-white/10 bg-[#0F0F0F] text-[#D4AF37] focus:ring-[#D4AF37]"
                                />
                                <label htmlFor="is_featured" className="text-sm font-medium">Afficher sur l'accueil</label>
                            </div>
                        </div>

                        <div className="pt-6 flex gap-3">
                            <Button type="button" variant="secondary" onClick={onClose} className="flex-1" disabled={isSubmitting}>
                                Annuler
                            </Button>
                            <Button type="submit" variant="primary" className="flex-1 bg-[#D4AF37] text-black hover:bg-white" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin mx-auto" />
                                ) : (
                                    <span className="flex items-center justify-center gap-2 italic"><Save className="w-4 h-4" /> Enregistrer</span>
                                )}
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
