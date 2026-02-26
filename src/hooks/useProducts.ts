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

    useEffect(() => {
        const fetch = async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);

                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('is_active', true)
                    .order('sort_order')
                    .abortSignal(controller.signal);

                clearTimeout(timeoutId);
                if (error) throw error;
                setProducts((data as Product[]) || []);
            } catch (err) {
                console.error(err);
                // If Supabase is unreachable (DNS error etc.), provide a local fallback so the UI still works
                setProducts(FALLBACK_PRODUCTS);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    return { products, loading };
}

export function useProduct(id: string | undefined) {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) { setLoading(false); return; }
        const fetch = async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);

                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', id)
                    .abortSignal(controller.signal)
                    .single();

                clearTimeout(timeoutId);
                if (error) throw error;
                setProduct(data as Product | null);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [id]);

    return { product, loading };
}
