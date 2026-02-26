import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Product } from '../../hooks/useProducts';

interface ProductModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (product: Partial<Product>) => Promise<void>;
}

export function ProductModal({ product, isOpen, onClose, onSave }: ProductModalProps) {
    const [formData, setFormData] = useState<Partial<Product>>({
        name: '',
        description: '',
        category: 'tshirt',
        base_price: 150,
        image_url: '',
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        is_active: true,
        sort_order: 0,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (product) {
            setFormData(product);
        } else {
            setFormData({
                name: '',
                description: '',
                category: 'tshirt',
                base_price: 150,
                image_url: '',
                sizes: ['S', 'M', 'L', 'XL', 'XXL'],
                is_active: true,
                sort_order: 0,
            });
        }
    }, [product, isOpen]);

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

    const toggleSize = (size: string) => {
        const currentSizes = formData.sizes || [];
        if (currentSizes.includes(size)) {
            setFormData({ ...formData, sizes: currentSizes.filter(s => s !== size) });
        } else {
            setFormData({ ...formData, sizes: [...currentSizes, size] });
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
                    className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
                >
                    <div className="p-6 border-b border-white/10 flex justify-between items-center">
                        <h2 className="text-xl font-bold">{product ? 'Modifier le Produit' : 'Nouveau Produit'}</h2>
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Nom du produit</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                                    placeholder="ex: T-Shirt Oversize Premium"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Catégorie</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value as 'tshirt' | 'hoodie' })}
                                    className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                                >
                                    <option value="tshirt" className="bg-[#181818]">T-Shirt</option>
                                    <option value="hoodie" className="bg-[#181818]">Hoodie</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors resize-none"
                                placeholder="Description du produit..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Prix de base (MAD)</label>
                                <input
                                    required
                                    type="number"
                                    value={formData.base_price}
                                    onChange={e => setFormData({ ...formData, base_price: Number(e.target.value) })}
                                    className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Image URL (Base 3D)</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.image_url}
                                    onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                    className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                                    placeholder="/tshirt.png"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Tailles disponibles</label>
                            <div className="flex flex-wrap gap-2 pt-1">
                                {['S', 'M', 'L', 'XL', 'XXL', '3XL'].map(size => (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => toggleSize(size)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${formData.sizes?.includes(size)
                                                ? 'bg-[#D4AF37] border-[#D4AF37] text-black'
                                                : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                                            }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                className="w-4 h-4 rounded border-white/10 bg-[#0F0F0F] text-[#D4AF37] focus:ring-[#D4AF37]"
                            />
                            <label htmlFor="is_active" className="text-sm font-medium">Produit actif (visible sur le site)</label>
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
