import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Product {
    id: string;
    name: string;
    description: string;
    category: 'tshirt' | 'hoodie';
    base_price: number;
    image_url: string;
    sizes: string[];
    is_active: boolean;
    sort_order: number;
}

export function useProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Local fallback products used when Supabase is unavailable
    const FALLBACK_PRODUCTS: Product[] = [
        {
            id: 'fallback-tshirt',
            name: 'T-Shirt Standard',
            description: 'T-shirt classique.',
            category: 'tshirt',
            base_price: 150,
            image_url: '/tshirt.png',
            sizes: ['S', 'M', 'L', 'XL', 'XXL'],
            is_active: true,
            sort_order: 0,
        },
        {
            id: 'fallback-hoodie',
            name: 'Hoodie Standard',
            description: 'Hoodie confortable.',
            category: 'hoodie',
            base_price: 250,
            image_url: '/hoodie.png',
            sizes: ['S', 'M', 'L', 'XL', 'XXL'],
            is_active: true,
            sort_order: 1,
        },
    ];

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('sort_order')
                .abortSignal(controller.signal);

            clearTimeout(timeoutId);
            if (error) throw error;
            setProducts((data as Product[]) || []);
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            console.warn('Falling back to local product data');
            setProducts(FALLBACK_PRODUCTS);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const addProduct = async (product: Partial<Product>) => {
        const { data, error } = await supabase
            .from('products')
            .insert([product])
            .select()
            .single();
        if (!error && data) {
            setProducts(prev => [...prev, data as Product]);
        }
        return { data, error };
    };

    const updateProduct = async (id: string, updates: Partial<Product>) => {
        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (!error && data) {
            setProducts(prev => prev.map(p => p.id === id ? (data as Product) : p));
        }
        return { data, error };
    };

    const deleteProduct = async (id: string) => {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);
        if (!error) {
            setProducts(prev => prev.filter(p => p.id !== id));
        }
        return { error };
    };

    return { products, loading, addProduct, updateProduct, deleteProduct, refresh: fetchProducts };
}

export function useProduct(id: string | undefined) {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) { setLoading(false); return; }
        const fetch = async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', id)
                    .abortSignal(controller.signal)
                    .single();

                clearTimeout(timeoutId);
                if (error) throw error;
                setProduct(data as Product | null);
            } catch (err: any) {
                if (err.name === 'AbortError') return;
                console.error('🔍 useProduct: Single Fetch Error', err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [id]);

    return { product, loading };
}
